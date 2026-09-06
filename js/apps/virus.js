/* =====================================================================
   病毒软件 ARGUS_9（黑绿终端）：求助单派发器 + 黑进别人电脑的唯一入口。
   页签：求助单 / 档案（第二案后出现）/ 关于（矛盾来历①）
   求助单 DB.TASKS[]：
     { id, target?, visible, titleRef, targetRef, briefRef, credRef?, avatar,
       status:[{ref, if}]                    头部状态标签（首个命中）
       steps:[{ref, done, locked}]
       log:[{ref, if}]                       软件说的话（"> " 开头的行）
       files:[{ref, file, if}]               附件（点开走文件查看器）
       enter:{ if }                          "接入目标设备"按钮
       form:{ if, doneFlag, titleRef, fields:[{labelRef, options:[ref]}], submitRef, emit }
       actions:[{id, ref, if, primary, danger, sets, emit}] }
   求助单弹窗 VIRUS.popup(id)：屏幕中央，黑屏之后出现（序章 4.3）。
   没有卸载入口：它不承认自己能被卸载（桌面图标右键 → 蓝屏，见 wm.js）。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var tab = "tasks", openTask = null, seenCount = 0;

    function tasks() { return DB.TASKS.filter(function (t) { return STATE.cond(t.visible); }); }
    function archiveOn() { return STATE.cond(DB.ARCHIVE_IF); }

    function navHtml() {
        function item(id, ref) {
            return '<div class="vx-nav-item' + (tab === id ? " on" : "") + '" data-tab="' + id + '" data-hint="virus:tab:' + id + '">&gt; ' + esc(T(ref)) + "</div>";
        }
        return '<div class="vx-nav">' + item("tasks", "virus.nav.tasks") + (archiveOn() ? item("archive", "virus.nav.archive") : "") + item("about", "virus.nav.about") + "</div>";
    }
    function tickerHtml() {
        var items = (DB.VIRUS_TICKER || []).map(function (r) { return "<span>" + esc(T(r)) + "</span>"; }).join("");
        return items ? '<div class="vx-ticker"><div class="vx-ticker-in">' + items + items + "</div></div>" : "";
    }
    function logHtml() {
        var lines = (DB.VIRUS_LOG || []).filter(function (l) { return STATE.cond(l.if); });
        if (!lines.length) return "";
        return '<div class="vx-log">' + lines.map(function (l) { return "<div>" + esc(T(l.ref)) + "</div>"; }).join("") + "</div>";
    }
    function taskHtml(t) {
        var open = openTask === t.id;
        var status = (t.status || []).filter(function (s) { return STATE.cond(s.if); })[0];
        var html = '<div class="vx-task' + (open ? " open" : "") + '" data-task="' + t.id + '">' +
            '<div class="vx-task-head"><span class="vx-blink">▌</span>' + esc(T(t.titleRef)) +
            (status ? '<span class="vx-status' + (status.cls ? " " + status.cls : "") + '">' + esc(T(status.ref)) + "</span>" : "") + "</div>";
        if (!open) return html + "</div>";

        var steps = (t.steps || []).map(function (s) {
            var done = STATE.cond(s.done), locked = s.locked && !STATE.cond(s.locked);
            return '<div class="vx-step' + (done ? " done" : "") + (locked ? " locked" : "") + '">[' + (done ? "✓" : "&nbsp;") + "] " + esc(T(s.ref)) + (locked ? " " + esc(T("virus.step.locked")) : "") + "</div>";
        }).join("");
        var log = (t.log || []).filter(function (l) { return STATE.cond(l.if); }).map(function (l) {
            return '<div class="vx-line' + (l.cls ? " " + l.cls : "") + '">&gt; ' + esc(T(l.ref)) + "</div>";
        }).join("");
        var files = (t.files || []).filter(function (f) { return STATE.cond(f.if); }).map(function (f) {
            return '<button class="vx-attach" data-file="' + f.file + '" data-hint="virus:attach:' + f.file + '">[' + esc(T("virus.attach")) + "] " + esc(T(f.ref)) + "</button>";
        }).join("");
        var form = "";
        if (t.form && STATE.cond(t.form.if) && !STATE.get(t.form.doneFlag)) {
            form = '<div class="vx-form" data-hint="virus:form:' + t.id + '"><div class="vx-form-title">' + esc(T(t.form.titleRef)) + "</div>" +
                t.form.fields.map(function (f, i) {
                    return '<label class="vx-field"><span>' + esc(T(f.labelRef)) + '</span><select data-f="' + i + '">' +
                        f.options.map(function (o) { return "<option>" + esc(T(o)) + "</option>"; }).join("") + "</select></label>";
                }).join("") +
                '<button class="vx-btn danger" data-form="' + t.id + '">' + esc(T(t.form.submitRef)) + "</button></div>";
        }
        var actions = (t.actions || []).filter(function (a) { return STATE.cond(a.if); }).map(function (a) {
            return '<button class="vx-btn' + (a.primary ? " primary" : "") + (a.danger ? " danger" : "") + '" data-action="' + a.id + '" data-hint="virus:action:' + a.id + '">' + esc(T(a.ref)) + "</button>";
        }).join("");
        var enter = "";
        if (t.enter && STATE.cond(t.enter.if)) {
            var entered = STATE.get("entered_" + t.target);
            enter = '<button class="vx-btn" data-enter="' + t.target + '" data-hint="virus:enter">' + esc(T(entered ? "virus.reenter.btn" : "virus.enter.btn")) + "</button>";
        }
        html += '<div class="vx-task-body">' +
            '<div class="vx-profile"><img src="' + t.avatar + '" alt=""><div><div class="vx-target">' + esc(T(t.targetRef)) + '</div><pre class="vx-brief">' + esc(T(t.briefRef)) + "</pre></div></div>" +
            (t.credRef ? '<div class="vx-cred"><span>' + esc(T("virus.cred.label")) + "</span>" + esc(T(t.credRef)) + "</div>" : "") +
            (steps ? '<div class="vx-steps">' + steps + "</div>" : "") +
            (log ? '<div class="vx-lines">' + log + "</div>" : "") +
            (files ? '<div class="vx-attachs">' + files + "</div>" : "") +
            form +
            '<div class="vx-actions">' + enter + actions + "</div>" +
            "</div>";
        return html + "</div>";
    }
    function tasksHtml() {
        var list = tasks();
        var head = tickerHtml() + logHtml();
        if (!list.length) return head + '<div class="vx-empty">' + esc(T("virus.tasks.empty")) + "</div>";
        return head + list.slice().reverse().map(taskHtml).join("");
    }
    function archiveHtml() {
        var rows = (DB.ARCHIVE || []).filter(function (a) { return STATE.cond(a.if); });
        return '<div class="vx-archive">' + rows.map(function (a) {
            if (a.kind === "h") return '<div class="vx-arc-h">' + esc(T(a.ref)) + "</div>";
            if (a.kind === "c") return '<div class="vx-arc-clip">' + esc(T(a.ref)) + "</div>";
            if (a.kind === "f") return '<button class="vx-attach" data-file="' + a.file + '" data-hint="virus:attach:' + a.file + '">[' + esc(T("virus.attach")) + "] " + esc(T(a.ref)) + "</button>";
            return '<div class="vx-line' + (a.cls ? " " + a.cls : "") + '">' + esc(T(a.ref)) + "</div>";
        }).join("") + "</div>";
    }
    function aboutHtml() { return '<pre class="vx-about">' + esc(T("virus.about.body")) + "</pre>"; }

    function render() {
        var host = $("#vx-root");
        if (!host) return;
        if (tab === "archive" && !archiveOn()) tab = "tasks";
        host.innerHTML = '<div class="vx-header">' + esc(T("virus.header")) + '<span class="vx-hstat">' + esc(T("virus.header.stat")) + '</span></div><div class="vx-body">' + navHtml() +
            '<div class="vx-main">' + (tab === "tasks" ? tasksHtml() : tab === "archive" ? archiveHtml() : aboutHtml()) + "</div></div>";
        host.querySelectorAll("[data-tab]").forEach(function (el) {
            el.addEventListener("click", function () { tab = el.dataset.tab; render(); STATE.emit("virus-tab:" + tab); });
        });
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
        host.querySelectorAll("[data-action]").forEach(function (el) {
            el.addEventListener("click", function () {
                var t = DB.TASKS.filter(function (x) { return x.id === openTask; })[0];
                var a = t && (t.actions || []).filter(function (x) { return x.id === el.dataset.action; })[0];
                if (!a) return;
                if (a.sets) STATE.set(a.sets);
                if (a.emit) STATE.emit(a.emit);
                STATE.emit("virus-action:" + a.id);
            });
        });
        host.querySelectorAll("[data-form]").forEach(function (el) {
            el.addEventListener("click", function () {
                var t = DB.TASKS.filter(function (x) { return x.id === el.dataset.form; })[0];
                if (!t || !t.form) return;
                var picks = [];
                host.querySelectorAll(".vx-field select").forEach(function (s) { picks.push(s.value); });
                STATE.set("form_" + t.id, picks.join(" / "));
                STATE.set(t.form.doneFlag);
                if (t.form.emit) STATE.emit(t.form.emit);
            });
        });
        host.querySelectorAll("[data-file]").forEach(function (el) {
            el.addEventListener("click", function () { FILES.openById(el.dataset.file); STATE.emit("virus-attach:" + el.dataset.file); });
        });
        NOTIFY.hints();
    }

    /* ---------------- 求助单弹窗（屏幕中央） ---------------- */
    function popup(id) {
        var t = DB.TASKS.filter(function (x) { return x.id === id; })[0];
        if (!t) return;
        var old = document.getElementById("vx-popup");
        if (old) old.remove();
        var ov = document.createElement("div");
        ov.id = "vx-popup";
        ov.innerHTML =
            '<div class="vxp-card">' +
            '<div class="vxp-head">' + esc(T("virus.popup.head")) + '<span class="vx-blink">▌</span></div>' +
            '<div class="vxp-title">' + esc(T(t.titleRef)) + "</div>" +
            '<div class="vxp-body"><img src="' + t.avatar + '" alt=""><div><div class="vx-target">' + esc(T(t.targetRef)) + '</div><pre class="vx-brief">' + esc(T(t.briefRef)) + "</pre>" +
            (t.credRef ? '<div class="vx-cred"><span>' + esc(T("virus.cred.label")) + "</span>" + esc(T(t.credRef)) + "</div>" : "") + "</div></div>" +
            '<div class="vxp-foot"><button class="vx-btn primary" id="vxp-open" data-hint="virus:popup">' + esc(T("virus.popup.open")) + "</button></div>" +
            "</div>";
        document.body.appendChild(ov);
        if (window.FX) FX.scare("windows-10-notify-system-sound.mp3", { rate: 0.5, drive: 12, gain: 0.9, reverse: true });
        ov.querySelector("#vxp-open").addEventListener("click", function () {
            ov.remove();
            openTask = id; tab = "tasks";
            openApp("virus");
            render();
            STATE.emit("ticket-open:" + id);
        });
        NOTIFY.hints();
        STATE.emit("ticket-shown:" + id);
    }

    STATE.on(function () {
        var list = tasks();
        if (list.length > seenCount || !openTask) { if (list.length) openTask = list[list.length - 1].id; }
        seenCount = list.length;
        render();
    });
    document.addEventListener("DOMContentLoaded", render);
    window.VIRUS = { popup: popup, render: render, show: function (id) { openTask = id; tab = "tasks"; render(); } };
})();
