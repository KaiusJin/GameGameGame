/* =====================================================================
   病毒软件（黑绿终端风）：任务派发器 + 看别人设备的唯一入口。
   - 求助单列表 / 目标档案 / 接入目标设备（= 给其余 app 切数据源）
   - 一个永远失败的"卸载"按钮（规则 2：来历只有三个互相矛盾的来源）
   - 关于页 = 矛盾来源①
   功能夸张、好莱坞式，不出现任何真实黑客工具名与真实手法（规则 5）。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    var tab = "tasks";           /* tasks | about | uninstall */
    var openTask = null;         /* 展开中的求助单 id */
    var uninstalling = false;

    function tasks() {
        return DB.TASKS.filter(function (t) { return STATE.cond(t.visible); });
    }

    function navHtml() {
        function item(id, ref, hint) {
            return (
                '<div class="vx-nav-item' + (tab === id ? " on" : "") + '" data-tab="' + id + '"' +
                (hint ? ' data-hint="' + hint + '"' : "") + ">" +
                "&gt; " + esc(T(ref)) + "</div>"
            );
        }
        return (
            '<div class="vx-nav">' +
            item("tasks", "virus.nav.tasks") +
            item("about", "virus.nav.about") +
            item("uninstall", "virus.nav.uninstall", "virus:uninstall") +
            "</div>"
        );
    }

    function tasksHtml() {
        var list = tasks();
        if (!list.length) return '<div class="vx-empty">' + esc(T("virus.tasks.empty")) + "</div>";
        return list.map(function (t) {
            var open = openTask === t.id;
            var html =
                '<div class="vx-task' + (open ? " open" : "") + '" data-task="' + t.id + '" data-hint="virus:enter">' +
                '<div class="vx-task-head">' +
                '<span class="vx-blink">▌</span>' + esc(T(t.titleRef)) +
                "</div>";
            if (open) {
                var steps = t.steps.map(function (s) {
                    var done = STATE.cond(s.done);
                    var locked = s.locked && !STATE.cond(s.locked);
                    return (
                        '<div class="vx-step' + (done ? " done" : "") + (locked ? " locked" : "") + '">' +
                        "[" + (done ? "✓" : "&nbsp;") + "] " + esc(T(s.ref)) +
                        (locked ? " " + esc(T("virus.step.locked")) : "") +
                        "</div>"
                    );
                }).join("");
                var doneAll = STATE.cond(t.complete);
                var submitted = STATE.get(t.doneFlag);
                html +=
                    '<div class="vx-task-body">' +
                    '<div class="vx-profile">' +
                    '<img src="' + t.avatar + '" alt="">' +
                    '<div><div class="vx-target">' + esc(T(t.targetRef)) + "</div>" +
                    '<pre class="vx-brief">' + esc(T(t.briefRef)) + "</pre></div></div>" +
                    '<div class="vx-steps">' + steps + "</div>" +
                    (submitted
                        ? ""
                        : doneAll
                            ? '<button class="vx-btn primary" data-submit="' + t.id + '" data-hint="virus:submit">' + esc(T("virus.submit.btn")) + "</button>"
                            : '<button class="vx-btn" data-enter="' + t.target + '">' + esc(T("virus.enter.btn")) + "</button>") +
                    "</div>";
            }
            html += "</div>";
            return html;
        }).join("");
    }

    function aboutHtml() {
        return '<pre class="vx-about">' + esc(T("virus.about.body")) + "</pre>";
    }
    function uninstallHtml() {
        return (
            '<div class="vx-uninstall">' +
            (uninstalling
                ? '<div class="vx-progress"><div class="vx-progress-fill"></div></div><div class="vx-doing">' + esc(T("virus.uninstall.doing")) + "</div>"
                : '<button class="vx-btn danger" id="vx-del" data-hint="virus:uninstall">' + esc(T("virus.uninstall.btn")) + "</button>") +
            "</div>"
        );
    }

    function render() {
        var host = $("#vx-root");
        if (!host) return;
        host.innerHTML =
            '<div class="vx-header">' + esc(T("virus.header")) + "</div>" +
            '<div class="vx-body">' + navHtml() +
            '<div class="vx-main">' +
            (tab === "tasks" ? tasksHtml() : tab === "about" ? aboutHtml() : uninstallHtml()) +
            "</div></div>";

        host.querySelectorAll("[data-tab]").forEach(function (el) {
            el.addEventListener("click", function () {
                tab = el.dataset.tab;
                render();
            });
        });
        host.querySelectorAll("[data-task]").forEach(function (el) {
            el.querySelector(".vx-task-head").addEventListener("click", function () {
                openTask = openTask === el.dataset.task ? null : el.dataset.task;
                render();
                STATE.emit("task-open:" + el.dataset.task);
            });
        });
        host.querySelectorAll("[data-enter]").forEach(function (el) {
            el.addEventListener("click", function () {
                STATE.setSource(el.dataset.enter);
                STATE.emit("enter-device:" + el.dataset.enter);
            });
        });
        host.querySelectorAll("[data-submit]").forEach(function (el) {
            el.addEventListener("click", function () {
                STATE.emit("task-submit:" + el.dataset.submit);
            });
        });
        var del = $("#vx-del");
        if (del) del.addEventListener("click", function () {
            uninstalling = true;
            render();
            setTimeout(function () {
                uninstalling = false;
                render();
                FX.sound("windowsError.mp3");
                sysDialog(T("virus.uninstall.fail.title"), T("virus.uninstall.fail.body"),
                    [{ label: T("ui.ok"), primary: true }]);
                STATE.emit("virus-delete-failed");
            }, 2600);
        });
        NOTIFY.hints();
    }

    /* 求助单一出现自动展开（派单就是教程） */
    STATE.on(function () {
        if (!openTask) {
            var list = tasks();
            if (list.length) openTask = list[0].id;
        }
        render();
    });
    document.addEventListener("DOMContentLoaded", render);

    /* 监控条：断开按钮 */
    document.addEventListener("DOMContentLoaded", function () {
        $("#monitor-exit").addEventListener("click", function () {
            STATE.setSource("own");
        });
    });
    function syncMonitor() {
        var on = STATE.source() !== "own";
        document.body.classList.toggle("monitoring", on);
        $("#monitor-bar").hidden = !on;
    }
    document.addEventListener("source-change", syncMonitor);
    document.addEventListener("DOMContentLoaded", syncMonitor);
})();
