/* =====================================================================
   病毒软件（黑绿终端）：任务派发器 + 黑进别人电脑的唯一入口。
   - 求助单：目标档案 + 凭据（登录密码，玩家自己记）+ 接入按钮 + 步骤 + 回报
   - 关于页 = 矛盾来历①
   - 没有卸载入口：它不承认自己能被卸载（桌面图标右键 → 蓝屏，见 wm.js）
   好莱坞式，不出现真实工具名与手法（规则 5）。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var tab = "tasks", openTask = null;

    function tasks() { return DB.TASKS.filter(function (t) { return STATE.cond(t.visible); }); }

    function navHtml() {
        function item(id, ref) {
            return '<div class="vx-nav-item' + (tab === id ? " on" : "") + '" data-tab="' + id + '">&gt; ' + esc(T(ref)) + "</div>";
        }
        return '<div class="vx-nav">' + item("tasks", "virus.nav.tasks") + item("about", "virus.nav.about") + "</div>";
    }
    function logHtml() {
        var lines = (DB.VIRUS_LOG || []).filter(function (l) { return STATE.cond(l.if); });
        if (!lines.length) return "";
        return '<div class="vx-log">' + lines.map(function (l) { return "<div>" + esc(T(l.ref)) + "</div>"; }).join("") + "</div>";
    }
    function tasksHtml() {
        var list = tasks();
        if (!list.length) return logHtml() + '<div class="vx-empty">' + esc(T("virus.tasks.empty")) + "</div>";
        return logHtml() + list.map(function (t) {
            var open = openTask === t.id;
            var html = '<div class="vx-task' + (open ? " open" : "") + '" data-task="' + t.id + '">' +
                '<div class="vx-task-head"><span class="vx-blink">▌</span>' + esc(T(t.titleRef)) + "</div>";
            if (open) {
                var steps = t.steps.map(function (s) {
                    var done = STATE.cond(s.done), locked = s.locked && !STATE.cond(s.locked);
                    return '<div class="vx-step' + (done ? " done" : "") + (locked ? " locked" : "") + '">[' + (done ? "✓" : "&nbsp;") + "] " + esc(T(s.ref)) + (locked ? " " + esc(T("virus.step.locked")) : "") + "</div>";
                }).join("");
                var doneAll = STATE.cond(t.complete), submitted = STATE.get(t.doneFlag);
                var entered = STATE.get("entered_" + t.target);
                var btn = "";
                if (submitted) btn = "";
                else if (doneAll) btn = '<button class="vx-btn primary" data-submit="' + t.id + '" data-hint="virus:submit">' + esc(T("virus.submit.btn")) + "</button>";
                else btn = '<button class="vx-btn" data-enter="' + t.target + '" data-hint="virus:enter">' + esc(T(entered ? "virus.reenter.btn" : "virus.enter.btn")) + "</button>";
                html += '<div class="vx-task-body">' +
                    '<div class="vx-profile"><img src="' + t.avatar + '" alt=""><div><div class="vx-target">' + esc(T(t.targetRef)) + '</div><pre class="vx-brief">' + esc(T(t.briefRef)) + "</pre></div></div>" +
                    (t.credRef ? '<div class="vx-cred"><span>' + esc(T("virus.cred.label")) + "</span>" + esc(T(t.credRef)) + "</div>" : "") +
                    '<div class="vx-steps">' + steps + "</div>" + btn + "</div>";
            }
            return html + "</div>";
        }).join("");
    }
    function aboutHtml() { return '<pre class="vx-about">' + esc(T("virus.about.body")) + "</pre>"; }

    function render() {
        var host = $("#vx-root");
        if (!host) return;
        host.innerHTML = '<div class="vx-header">' + esc(T("virus.header")) + '</div><div class="vx-body">' + navHtml() +
            '<div class="vx-main">' + (tab === "tasks" ? tasksHtml() : aboutHtml()) + "</div></div>";
        host.querySelectorAll("[data-tab]").forEach(function (el) { el.addEventListener("click", function () { tab = el.dataset.tab; render(); }); });
        host.querySelectorAll("[data-task]").forEach(function (el) {
            el.querySelector(".vx-task-head").addEventListener("click", function () {
                openTask = openTask === el.dataset.task ? null : el.dataset.task;
                render();
                STATE.emit("task-open:" + el.dataset.task);
            });
        });
        host.querySelectorAll("[data-enter]").forEach(function (el) {
            el.addEventListener("click", function () { HACK.connect(el.dataset.enter); });
        });
        host.querySelectorAll("[data-submit]").forEach(function (el) {
            el.addEventListener("click", function () { STATE.emit("task-submit:" + el.dataset.submit); });
        });
        NOTIFY.hints();
    }

    STATE.on(function () {
        if (!openTask) { var list = tasks(); if (list.length) openTask = list[0].id; }
        render();
    });
    document.addEventListener("DOMContentLoaded", render);
})();
