/* =====================================================================
   文件管理器：读当前电脑的虚拟文件树（DEVICES[source].files）。
   - desktop 文件夹的文件同时渲染成桌面图标；recycle 文件夹渲染进回收站窗口
   - 灰态可见：locked 未满足的文件显示但发灰，双击弹"无法打开"
   - txt/img/pdf/eml/audio 交给查看器，exe 弹属性对话框，zip 弹密码框
   - deletable: flag —— 右键"彻底删除"（第三案销毁证据）
   文件夹顺序与路径见 DB.FOLDERS。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var ICONS = { txt: "image/file.png", pdf: "image/file.png", img: "image/file.png", exe: "image/exe.png", zip: "image/zipfolder.png", audio: "image/file.png", eml: "image/file.png" };

    function allFiles() { return (DB.DEVICES[STATE.source()] || { files: [] }).files || []; }
    function deviceFiles() { return allFiles().filter(function (f) { return STATE.cond(f.visible); }); }
    function isLocked(f) { return f.locked && !STATE.cond(f.locked); }
    function byId(id) { return allFiles().filter(function (x) { return x.id === id; })[0]; }
    function icon(f) { return f.icon || ICONS[f.type] || "image/file.png"; }

    function openFile(f) {
        if (!f) return;
        if (isLocked(f)) {
            FX.sound("windowsError.mp3");
            sysDialog(T("ui.dlg.locked.title"), T("ui.dlg.locked.body"), [{ label: T("ui.ok"), primary: true }]);
            STATE.emit("locked-file:" + f.id);
            return;
        }
        if (f.type === "exe") {
            sysDialog(T(f.dlgTitleRef), T(f.dlgBodyRef), [{ label: T("ui.ok"), primary: true }]);
        } else if (f.type === "zip") {
            openZip(f);
            return;
        } else {
            VIEWER.open(f);
        }
        if (f.sets) STATE.set(f.sets);
        STATE.emit("read-file:" + f.id);
    }
    function openZip(f) {
        var z = f.zip || {};
        if (STATE.get(z.unlocks)) {
            sysDialog(T("zip.title"), T("zip.already"), [{ label: T("ui.ok"), primary: true }]);
            openApp("files");
            return;
        }
        var body = "<b>" + esc(T(f.nameRef)) + "</b><br>" + esc(T("zip.body")) + (z.hintRef ? "<br><span class='zip-hint'>" + esc(T("zip.hint.label")) + esc(T(z.hintRef)) + "</span>" : "");
        sysPrompt(T("zip.title"), body, T("zip.ph"), function (v) {
            if (v == null) return;
            if (v.trim() === T(z.passwordRef)) {
                STATE.set(z.unlocks);
                FX.sound("windows-10-notify-system-sound.mp3", 0.5);
                sysDialog(T("zip.title"), T("zip.ok"), [{ label: T("ui.ok"), primary: true, fn: function () { openApp("files"); } }]);
                if (f.sets) STATE.set(f.sets);
                STATE.emit("zip-open:" + f.id);
            } else {
                FX.sound("windowsError.mp3");
                sysDialog(T("zip.title"), T("zip.wrong"), [{ label: T("ui.ok"), primary: true }]);
                STATE.emit("zip-wrong:" + f.id);
            }
        });
    }
    function contextMenu(id, x, y) {
        var f = byId(id);
        if (!f) return;
        var items = [{ ref: "ctx.open", fn: function () { openFile(f); } }];
        if (f.deletable && !STATE.get(f.deletable) && !isLocked(f)) {
            items.push({
                ref: "ctx.destroy", danger: true, fn: function () {
                    sysDialog(T("ui.dlg.destroy.title"), T("ui.dlg.destroy.body").replace("{file}", esc(T(f.nameRef))), [
                        { label: T("ui.cancel") },
                        { label: T("ui.dlg.destroy.ok"), primary: true, fn: function () { STATE.set(f.deletable); FX.scare("message.mp3", { rate: 0.6, drive: 4, gain: 0.5 }); STATE.emit("destroyed:" + f.id); } }
                    ]);
                }
            });
        }
        showCtx(x, y, items);
    }
    window.FILES = { open: openFile, openById: function (id) { openFile(byId(id)); }, byId: byId, contextMenu: contextMenu };

    function bindRows(host) {
        host.querySelectorAll("[data-file]").forEach(function (el) {
            el.addEventListener("click", function () {
                host.querySelectorAll(".fx-row, .desktop-icon").forEach(function (r) { r.classList.remove("selected"); });
                el.classList.add("selected");
            });
            el.addEventListener("dblclick", function () { openFile(byId(el.dataset.file)); });
            el.addEventListener("contextmenu", function (e) { e.preventDefault(); e.stopPropagation(); contextMenu(el.dataset.file, e.clientX, e.clientY); });
        });
    }

    /* 桌面文件图标 */
    function renderDesktop() {
        var host = $("#desktop-files");
        if (!host) return;
        var files = deviceFiles().filter(function (f) { return f.folder === "desktop"; });
        host.innerHTML = files.map(function (f) {
            return (
                '<div class="desktop-icon file-icon' + (isLocked(f) ? " locked" : "") + '" data-file="' + f.id + '" data-hint="file:' + f.id + '">' +
                '<img class="ic" src="' + icon(f) + '" alt="">' +
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
    }
    function rowHtml(f) {
        return '<div class="fx-row' + (isLocked(f) ? " locked" : "") + '" data-file="' + f.id + '" data-hint="file:' + f.id + '">' +
            '<span class="c-name"><img src="' + icon(f) + '" alt=""><span>' + esc(T(f.nameRef)) + "</span>" +
            (isLocked(f) ? ' <i class="fx-lock">' + esc(T("ui.locked.tag")) + "</i>" : "") + "</span>" +
            '<span class="c-date">' + esc(f.dateRef ? T(f.dateRef) : "") + '</span><span class="c-size">' + esc(f.sizeRef ? T(f.sizeRef) : "") + "</span></div>";
    }
    /* 文件窗口：按 DB.FOLDERS 顺序分组 */
    function renderWindow() {
        var host = $("#fx-list");
        if (!host) return;
        var files = deviceFiles().filter(function (f) { return f.folder !== "recycle"; });
        var html = "";
        (DB.FOLDERS || []).forEach(function (fo) {
            if (fo.id === "recycle") return;
            var list = files.filter(function (f) { return f.folder === fo.id; });
            if (!list.length) return;
            var home = T(((DB.DEVICES[STATE.source()] || DB.DEVICES.own).desktop || {}).homeRef || "own.home");
            html += '<div class="fx-group"><span>' + esc(T(fo.labelRef)) + "</span><i>" + esc(T(fo.pathRef).replace("{home}", home)) + "</i></div>";
            html += list.map(rowHtml).join("");
        });
        host.innerHTML = html;
        bindRows(host);
    }
    /* 回收站窗口 */
    function renderRecycle() {
        var host = $("#rc-list");
        if (!host) return;
        var list = deviceFiles().filter(function (f) { return f.folder === "recycle"; });
        host.innerHTML = list.length ? list.map(rowHtml).join("") : '<div class="empty-pane">' + esc(T("recycle.empty")) + "</div>";
        bindRows(host);
    }

    function rerender() { renderDesktop(); renderWindow(); renderRecycle(); NOTIFY.hints(); }
    document.addEventListener("DOMContentLoaded", rerender);
    STATE.on(rerender);
    document.addEventListener("source-change", rerender);
})();
