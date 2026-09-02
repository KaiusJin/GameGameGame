/* =====================================================================
   通知系统：右下角 toast / 任务栏闪烁 / 图标红点 / 亮点（hotspot）
   通知就是路标 —— 玩家该去哪，永远由 toast+红点+唯一亮点共同指出。
   规则 4：每屏只有一个亮点。亮点由 DB.HINTS 声明式给出（首个命中生效），
   app 渲染完自己的 DOM 后调用 NOTIFY.hints() 重算。
   ===================================================================== */
(function () {

    /* ---------------- toast ---------------- */
    var wrap = null;
    function ensureWrap() {
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.id = "toast-wrap";
            document.body.appendChild(wrap);
        }
        return wrap;
    }
    function toast(ref, app) {
        var el = document.createElement("div");
        el.className = "toast";
        el.innerHTML =
            '<div class="toast-bar"></div>' +
            '<div class="toast-body">' +
            '<div class="toast-title">' + T("ui.toast.title") + "</div>" +
            '<div class="toast-text">' + T(ref) + "</div>" +
            "</div>";
        el.addEventListener("click", function () {
            el.remove();
            if (app && window.openApp) openApp(app);
        });
        ensureWrap().appendChild(el);
        requestAnimationFrame(function () { el.classList.add("show"); });
        setTimeout(function () {
            el.classList.remove("show");
            setTimeout(function () { el.remove(); }, 400);
        }, 6500);
    }

    /* ---------------- 红点 / 闪烁 ---------------- */
    function badge(app, n) {
        var icon = document.getElementById("icon-" + app);
        if (!icon) return;
        var b = icon.querySelector(".ic-badge");
        if (!n) { if (b) b.remove(); return; }
        if (!b) {
            b = document.createElement("i");
            b.className = "ic-badge";
            icon.appendChild(b);
        }
        b.textContent = n > 9 ? "9+" : n;
    }
    function flash(app) {
        var t = document.getElementById("task-" + app);
        if (t) {
            t.classList.add("flashing");
            setTimeout(function () { t.classList.remove("flashing"); }, 6000);
        }
    }

    /* ---------------- 亮点 ----------------
       DB.HINTS: [ { if:<cond>, target:"<data-hint 值>" } ]，首个命中者发光。 */
    function hints() {
        var list = (window.DB && DB.HINTS) || [];
        var target = null;
        for (var i = 0; i < list.length; i++) {
            if (STATE.cond(list[i].if)) { target = list[i].target; break; }
        }
        document.querySelectorAll(".hotspot").forEach(function (el) {
            if (el.getAttribute("data-hint") !== target) el.classList.remove("hotspot");
        });
        if (target) {
            document.querySelectorAll('[data-hint="' + target + '"]').forEach(function (el) {
                el.classList.add("hotspot");
            });
        }
    }

    /* ---------------- 任务栏时钟（游戏内时间） ---------------- */
    function renderClock() {
        var d = STATE.clockDate();
        var t = document.getElementById("clock-time");
        var dt = document.getElementById("clock-date");
        if (!t) return;
        t.textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
        dt.textContent = d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
    }
    document.addEventListener("clock-tick", renderClock);
    document.addEventListener("DOMContentLoaded", renderClock);

    window.NOTIFY = { toast: toast, badge: badge, flash: flash, hints: hints };
    STATE.on(function () { hints(); renderClock(); });
})();
