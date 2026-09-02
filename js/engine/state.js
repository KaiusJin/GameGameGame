/* =====================================================================
   状态机引擎：flags + phase + triggers + 游戏内时钟 + 存档 + 数据源切换
   一切解锁、弹窗、时间推进都由它驱动；app 只发事件、读状态、渲染数据。

   ―――― 设计规则（全项目最高约束，改代码前先读）――――
   1. 黑客解释必须始终成立：任何异常都要能用"有人在操作"解释，不引入超自然。
   2. 病毒软件的来历只以三个互相矛盾的来源出现（关于页 / 文件属性 / 前任txt），
      永不给标准答案。
   3. 死亡不演：被救者的死只通过假浏览器的新闻页被玩家自己刷到。
   4. 前十分钟一条直线；每屏只有一个亮点（见 DB.HINTS）；软件派单就是教程。
   5. 不出现真实黑客工具名和真实手法；界面可以黑绿到底，内容保持好莱坞式。
   6. 页面不写死任何文字（按钮和错误提示也不行），全部走 DB.TEXT / T(ref)。
   ===================================================================== */
(function () {

    /* ---------------- 存档接口（可整体替换为云端实现） ---------------- */
    var SAVE_KEY = "g2_save";
    var STORE = {
        get: function () {
            try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); }
            catch (e) { return null; }
        },
        set: function (d) {
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e) { }
        },
        clear: function () {
            try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
        }
    };

    var saved = STORE.get() || {};
    var flags = saved.flags || {};
    var fired = saved.fired || {};          /* 已触发过的 trigger id（默认一次性） */
    var phase = saved.phase || null;
    var clockMin = (saved.clockMin != null) ? saved.clockMin : 0;   /* 游戏内分钟数 */
    var source = saved.source || "own";     /* 当前数据源：own | 目标设备 id */
    var subs = [];
    var evaluating = false;

    function persist() {
        STORE.set({ flags: flags, fired: fired, phase: phase, clockMin: clockMin, source: source });
    }
    function broadcast() {
        for (var i = 0; i < subs.length; i++) {
            try { subs[i](); } catch (e) { }
        }
    }

    /* ---------------- 条件表达式 ----------------
       null/undefined = 恒真
       {flag:"x"} {not:"x"} {phase:"p1"} {all:[...]} {any:[...]} */
    function cond(c) {
        if (c == null) return true;
        if (c.flag !== undefined) return !!flags[c.flag];
        if (c.not !== undefined) return !flags[c.not];
        if (c.phase !== undefined) return phase === c.phase;
        if (c.all) return c.all.every(cond);
        if (c.any) return c.any.some(cond);
        return true;
    }

    /* ---------------- 动作执行 ----------------
       ["set", key, value]        置 flag
       ["phase", id]              切阶段
       ["advance", days]          推进游戏内时间
       ["toast", ref, app?]       右下角通知（点击可打开 app）
       ["badge", app, n]          图标红点（n=0 清除）
       ["flash", app]             任务栏闪烁
       ["open", app]              打开窗口
       ["dialog", tRef, bRef]     系统弹窗
       ["source", id]             切换数据源（own = 退出监控）
       ["delay", ms, [actions]]   延迟执行一串动作 */
    function run(actions) {
        (actions || []).forEach(function (a) {
            var op = a[0];
            if (op === "set") { flags[a[1]] = (a.length > 2 ? a[2] : true); }
            else if (op === "phase") { phase = a[1]; }
            else if (op === "advance") { clockMin += a[1] * 1440; }
            else if (op === "toast") { if (window.NOTIFY) NOTIFY.toast(a[1], a[2]); }
            else if (op === "badge") { if (window.NOTIFY) NOTIFY.badge(a[1], a[2]); }
            else if (op === "flash") { if (window.NOTIFY) NOTIFY.flash(a[1]); }
            else if (op === "open") { if (window.openApp) openApp(a[1]); }
            else if (op === "dialog") { if (window.sysDialog) sysDialog(T(a[1]), T(a[2]), [{ label: T("ui.ok"), primary: true }]); }
            else if (op === "source") { source = a[1]; document.dispatchEvent(new CustomEvent("source-change")); }
            else if (op === "delay") {
                (function (ms, acts) {
                    setTimeout(function () { run(acts); settle(); }, ms);
                })(a[1], a[2]);
            }
        });
    }

    /* ---------------- 触发器 ----------------
       DB.TRIGGERS: { id, on:"event:<名>"|"change", if:<cond>, do:[actions] }
       全部一次性。change 触发器在每次状态变化后评估（支持级联，防死循环）。 */
    function evalTriggers(eventName) {
        var list = (window.DB && DB.TRIGGERS) || [];
        var any = false;
        for (var i = 0; i < list.length; i++) {
            var t = list[i];
            if (fired[t.id]) continue;
            var hit = eventName ? (t.on === "event:" + eventName) : (t.on === "change");
            if (!hit || !cond(t.if)) continue;
            fired[t.id] = 1;
            run(t.do);
            any = true;
        }
        return any;
    }
    function settle() {
        if (evaluating) return;
        evaluating = true;
        for (var i = 0; i < 20 && evalTriggers(null); i++) { }
        evaluating = false;
        persist();
        broadcast();
    }

    /* ---------------- 游戏内时钟 ----------------
       clockMin 从 DB.CONFIG.startDate 起算，剧情用 ["advance", days] 推进；
       现实每分钟走 1 游戏分钟只为任务栏"活着"，不承担剧情职责。 */
    function clockDate() {
        var base = (window.DB && DB.CONFIG.startDate) || { y: 2024, mo: 10, d: 3, h: 21, mi: 17 };
        return new Date(base.y, base.mo - 1, base.d, base.h, base.mi + clockMin);
    }
    setInterval(function () {
        clockMin += 1;
        persist();
        document.dispatchEvent(new CustomEvent("clock-tick"));
    }, 60000);

    /* ---------------- 对外 ---------------- */
    window.T = function (ref) {
        var t = (window.DB && DB.TEXT) || {};
        return (t[ref] !== undefined) ? t[ref] : "〔" + ref + "〕";   /* 文案缺失显示占位符，不报错 */
    };
    window.STATE = {
        get: function (k) { return flags[k]; },
        set: function (k, v) { flags[k] = (v === undefined ? true : v); settle(); },
        cond: cond,
        phase: function () { return phase; },
        source: function () { return source; },
        setSource: function (id) {
            source = id;
            document.dispatchEvent(new CustomEvent("source-change"));
            settle();
        },
        emit: function (eventName) {           /* app 上报事件："read-file:own/note1" 等 */
            evalTriggers(eventName);
            settle();
        },
        clockDate: clockDate,
        on: function (fn) { subs.push(fn); },  /* 状态变化订阅（app 借此重渲染） */
        reset: function () { STORE.clear(); location.reload(); },
        _store: STORE                          /* 存档接口出口（云端替换点） */
    };
})();
