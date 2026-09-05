/* =====================================================================
   文件管理器：读当前电脑的虚拟文件树（DEVICES[source].files）。
   - desktop 文件夹的文件同时渲染成桌面图标（跟随当前电脑）
   - 灰态可见：locked 未满足的文件显示但发灰，双击弹"无法打开"
   - txt/img/pdf 交给查看器，exe 弹属性对话框
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var ICONS = { txt: "image/file.png", pdf: "image/file.png", img: "image/file.png", exe: "image/exe.png" };

    function allFiles() { return (DB.DEVICES[STATE.source()] || { files: [] }).files; }
    function deviceFiles() { return allFiles().filter(function (f) { return STATE.cond(f.visible); }); }
    function isLocked(f) { return f.locked && !STATE.cond(f.locked); }
    function byId(id) { return allFiles().filter(function (x) { return x.id === id; })[0]; }

    function openFile(f) {
        if (!f) return;
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
    window.FILES = { open: openFile, openById: function (id) { openFile(byId(id)); } };

    /* 桌面文件图标 */
    function renderDesktop() {
        var host = $("#desktop-files");
        if (!host) return;
        var files = deviceFiles().filter(function (f) { return f.folder === "desktop"; });
        host.innerHTML = files.map(function (f) {
            return (
                '<div class="desktop-icon file-icon' + (isLocked(f) ? " locked" : "") + '" data-file="' + f.id + '" data-hint="file:' + f.id + '">' +
                '<img class="ic" src="' + ICONS[f.type] + '" alt="">' +
                '<div class="label">' + esc(T(f.nameRef)) + "</div></div>"
            );
        }).join("");
        host.querySelectorAll("[data-file]").forEach(function (el) {
            el.addEventListener("click", function () {
                document.querySelectorAll(".desktop-icon").forEach(function (i) { i.classList.remove("selected"); });
                el.classList.add("selected");
            });
            el.addEventListener("dblclick", function () { openFile(byId(el.dataset.file)); });
        });
        NOTIFY.hints();
    }

    /* 文件窗口 */
    function renderWindow() {
        var host = $("#fx-list");
        if (!host) return;
        var files = deviceFiles();
        var folders = [];
        files.forEach(function (f) { if (folders.indexOf(f.folder) < 0) folders.push(f.folder); });
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
            el.addEventListener("dblclick", function () { openFile(byId(el.dataset.file)); });
            el.addEventListener("click", function () {
                host.querySelectorAll(".fx-row").forEach(function (r) { r.classList.remove("selected"); });
                el.classList.add("selected");
            });
        });
        NOTIFY.hints();
    }

    function rerender() { renderDesktop(); renderWindow(); }
    document.addEventListener("DOMContentLoaded", rerender);
    STATE.on(rerender);
    document.addEventListener("source-change", rerender);
})();
