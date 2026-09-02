/* =====================================================================
   文件管理器：读当前数据源的虚拟文件树（DEVICES[source].files）。
   - own 设备的 desktop 文件同时渲染成桌面图标
   - 灰态可见：locked 条件未满足的文件显示但发灰，双击弹"无法打开"
   - txt/img/pdf 交给查看器（viewer.js），exe 弹属性对话框
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    var ICONS = { txt: "image/file.png", pdf: "image/file.png", img: "image/file.png", exe: "image/exe.png" };

    function deviceFiles() {
        var dev = DB.DEVICES[STATE.source()] || { files: [] };
        return dev.files.filter(function (f) { return STATE.cond(f.visible); });
    }
    function isLocked(f) { return f.locked && !STATE.cond(f.locked); }

    function openFile(f) {
        if (isLocked(f)) {
            FX.sound("windowsError.mp3");
            sysDialog(T("ui.dlg.locked.title"), T("ui.dlg.locked.body"), [{ label: T("ui.ok"), primary: true }]);
            return;
        }
        if (f.type === "exe") {
            sysDialog(T(f.dlgTitleRef), T(f.dlgBodyRef), [{ label: T("ui.ok"), primary: true }]);
        } else {
            VIEWER.open(f);
        }
        if (f.sets) STATE.set(f.sets);
        STATE.emit("read-file:" + f.id);
    }
    window.FILES = { open: openFile };

    /* ---------------- 桌面文件图标（永远是 own 的桌面）---------------- */
    function renderDesktop() {
        var host = $("#desktop-files");
        if (!host) return;
        var files = DB.DEVICES.own.files.filter(function (f) {
            return f.folder === "desktop" && STATE.cond(f.visible);
        });
        host.innerHTML = files.map(function (f) {
            return (
                '<div class="desktop-icon file-icon' + (isLocked(f) ? " locked" : "") + '" data-file="' + f.id + '" data-hint="file:' + f.id + '">' +
                '<img class="ic" src="' + ICONS[f.type] + '" alt="">' +
                '<div class="label">' + esc(T(f.nameRef)) + "</div></div>"
            );
        }).join("");
        host.querySelectorAll("[data-file]").forEach(function (el) {
            var f = DB.DEVICES.own.files.filter(function (x) { return x.id === el.dataset.file; })[0];
            el.addEventListener("click", function () {
                document.querySelectorAll(".desktop-icon").forEach(function (i) { i.classList.remove("selected"); });
                el.classList.add("selected");
            });
            el.addEventListener("dblclick", function () { openFile(f); });
        });
        NOTIFY.hints();
    }

    /* ---------------- 文件窗口 ---------------- */
    function renderWindow() {
        var host = $("#fx-list");
        if (!host) return;
        var files = deviceFiles();
        var folders = [];
        files.forEach(function (f) {
            if (folders.indexOf(f.folder) < 0) folders.push(f.folder);
        });
        var html = "";
        folders.forEach(function (fo) {
            html += '<div class="fx-group">' + esc(T("folder." + fo)) + "</div>";
            files.filter(function (f) { return f.folder === fo; }).forEach(function (f) {
                html +=
                    '<div class="fx-row' + (isLocked(f) ? " locked" : "") + '" data-file="' + f.id + '" data-hint="file:' + f.id + '">' +
                    '<span class="c-name"><img src="' + ICONS[f.type] + '" alt="">' + esc(T(f.nameRef)) +
                    (isLocked(f) ? ' <i class="fx-lock">' + esc(T("ui.locked.tag")) + "</i>" : "") + "</span>" +
                    '<span class="c-date"></span><span class="c-size"></span></div>';
            });
        });
        host.innerHTML = html;
        host.querySelectorAll("[data-file]").forEach(function (el) {
            var f = files.filter(function (x) { return x.id === el.dataset.file; })[0];
            el.addEventListener("dblclick", function () { openFile(f); });
            el.addEventListener("click", function () {
                host.querySelectorAll(".fx-row").forEach(function (r) { r.classList.remove("selected"); });
                el.classList.add("selected");
            });
        });
        NOTIFY.hints();
    }

    document.addEventListener("DOMContentLoaded", function () {
        renderDesktop();
        renderWindow();
    });
    STATE.on(function () { renderDesktop(); renderWindow(); });
    document.addEventListener("source-change", renderWindow);
})();
