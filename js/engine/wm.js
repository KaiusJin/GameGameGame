/* =====================================================================
   窗口系统（沿用 ningning 式做法：窗口预置在 HTML、display 切换、
   z-index 递增、#task-<app> 任务栏项、标题栏拖拽）。
   额外职责：
   - 双桌面：WM.setDevice(id) 切壁纸 / 图标集 / 关闭全部窗口 / 切数据源
   - 第三案"被接入"：flags.own_watched 时自己的桌面也套上绿框和监控条，断不开
   - [data-show-flag] 元素按 flag 显隐（病毒图标"被发现"后才出现；开始菜单"关机"）
   - [data-t] 静态文字全部来自文案表（规则 6）
   - 右键菜单（病毒图标：卸载 / 删除 → 蓝屏；证据文件：彻底删除）
   - 系统弹窗 sysDialog / 带输入框的 sysPrompt（压缩包密码）
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    var windowsState = {};
    var zCounter = 100;

    function appTitle(appId) { return T("app." + appId + ".title"); }

    function bringToFront(appId) {
        var win = document.getElementById("win-" + appId);
        if (!win) return;
        zCounter++;
        win.style.zIndex = zCounter;
        document.querySelectorAll(".task-item").forEach(function (i) { i.classList.remove("active"); });
        var t = document.getElementById("task-" + appId);
        if (t) t.classList.add("active");
    }

    function createTaskItem(appId) {
        if (document.getElementById("task-" + appId)) return;
        var icon = document.querySelector("#icon-" + appId + " .ic");
        var item = document.createElement("div");
        item.className = "task-item";
        item.id = "task-" + appId;
        item.innerHTML = (icon ? icon.outerHTML : "") + "<span>" + appTitle(appId) + "</span>";
        item.onclick = function () {
            var st = windowsState[appId];
            var win = document.getElementById("win-" + appId);
            item.classList.remove("flashing");
            if (st.isMinimized) {
                st.isMinimized = false;
                win.style.display = "flex";
                bringToFront(appId);
            } else if (+win.style.zIndex === zCounter) {
                minimizeApp(appId);
            } else {
                bringToFront(appId);
            }
        };
        $("#task-items").appendChild(item);
    }

    function openApp(appId) {
        var win = document.getElementById("win-" + appId);
        var st = windowsState[appId];
        if (!st || !win) return;
        if (!st.isOpen) {
            st.isOpen = true;
            st.isMinimized = false;
            win.style.display = "flex";
            var w = win.offsetWidth, h = win.offsetHeight;
            win.style.left = Math.max(0, (window.innerWidth - w) / 2 + (zCounter % 3) * 16) + "px";
            win.style.top = Math.max(0, (window.innerHeight - 44 - h) / 2) + "px";
            createTaskItem(appId);
        } else if (st.isMinimized) {
            st.isMinimized = false;
            win.style.display = "flex";
        }
        bringToFront(appId);
        NOTIFY.badge(appId, 0);
        document.dispatchEvent(new CustomEvent("app-open", { detail: appId }));
        STATE.emit("open-app:" + appId);
    }
    function minimizeApp(appId) {
        var st = windowsState[appId];
        if (!st.isOpen) return;
        st.isMinimized = true;
        document.getElementById("win-" + appId).style.display = "none";
        var t = document.getElementById("task-" + appId);
        if (t) t.classList.remove("active");
    }
    function closeApp(appId, silent) {
        var st = windowsState[appId];
        if (!st) return;
        var wasOpen = st.isOpen;
        st.isOpen = false;
        st.isMinimized = false;
        var win = document.getElementById("win-" + appId);
        win.style.display = "none";
        win.classList.remove("maximized");
        var t = document.getElementById("task-" + appId);
        if (t) t.remove();
        if (wasOpen && !silent) STATE.emit("close-app:" + appId);
    }
    function closeAll() { Object.keys(windowsState).forEach(function (id) { closeApp(id, true); }); }
    function toggleMax(appId) {
        document.getElementById("win-" + appId).classList.toggle("maximized");
        bringToFront(appId);
    }
    function isOpen(appId) { var st = windowsState[appId]; return !!(st && st.isOpen && !st.isMinimized); }

    function makeDraggable(win, handle) {
        handle.addEventListener("mousedown", function (e) {
            if (win.classList.contains("maximized")) return;
            if (e.target.closest("button")) return;
            e.preventDefault();
            var startX = e.clientX, startY = e.clientY;
            var origX = win.offsetLeft, origY = win.offsetTop;
            function move(ev) {
                var x = origX + ev.clientX - startX;
                var y = origY + ev.clientY - startY;
                x = Math.min(Math.max(x, -win.offsetWidth + 80), window.innerWidth - 40);
                y = Math.min(Math.max(y, 0), window.innerHeight - 80);
                win.style.left = x + "px";
                win.style.top = y + "px";
            }
            function up() {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
            }
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
    }

    /* 系统弹窗 */
    function sysDialog(title, bodyHtml, buttons) {
        var mask = document.createElement("div");
        mask.className = "sys-mask";
        mask.innerHTML =
            '<div class="sys-dialog">' +
            '<div class="d-title">' + title + "</div>" +
            '<div class="d-body">' + bodyHtml + "</div>" +
            '<div class="d-footer">' +
            buttons.map(function (b, i) {
                return '<button class="' + (b.primary ? "primary" : "") + '" data-i="' + i + '">' + b.label + "</button>";
            }).join("") +
            "</div></div>";
        mask.addEventListener("click", function (e) {
            var btn = e.target.closest("button");
            if (!btn) return;
            mask.remove();
            var fn = buttons[+btn.dataset.i].fn;
            if (fn) fn();
        });
        document.body.appendChild(mask);
        return mask;
    }
    /* 带输入框的弹窗（压缩包密码）：cb(值) / 取消 cb(null) */
    function sysPrompt(title, bodyHtml, placeholder, cb) {
        var mask = document.createElement("div");
        mask.className = "sys-mask";
        mask.innerHTML =
            '<div class="sys-dialog">' +
            '<div class="d-title">' + title + "</div>" +
            '<div class="d-body">' + bodyHtml + '<div class="d-input"><input type="password" autocomplete="off" placeholder="' + esc(placeholder) + '"></div></div>' +
            '<div class="d-footer"><button data-act="cancel">' + T("ui.cancel") + '</button><button class="primary" data-act="ok">' + T("ui.ok") + "</button></div></div>";
        var input = mask.querySelector("input");
        function finish(v) { mask.remove(); if (cb) cb(v); }
        mask.addEventListener("click", function (e) {
            var btn = e.target.closest("button");
            if (!btn) return;
            finish(btn.dataset.act === "ok" ? input.value : null);
        });
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") finish(input.value); if (e.key === "Escape") finish(null); });
        document.body.appendChild(mask);
        setTimeout(function () { input.focus(); }, 40);
        return mask;
    }
    window.sysDialog = sysDialog;
    window.sysPrompt = sysPrompt;
    window.openApp = openApp;
    window.closeApp = closeApp;

    /* ---------------- 双桌面 ---------------- */
    function applyVisibility() {
        var dev = DB.DEVICES[STATE.source()] || DB.DEVICES.own;
        var icons = dev.desktop.icons || [];
        document.querySelectorAll(".desktop-icon[data-app]").forEach(function (el) {
            var ok = icons.indexOf(el.dataset.app) >= 0;
            var f = el.getAttribute("data-show-flag");
            if (f && !STATE.get(f)) ok = false;
            el.style.display = ok ? "" : "none";
        });
        document.querySelectorAll("[data-show-flag]:not(.desktop-icon)").forEach(function (el) {
            el.style.display = STATE.get(el.getAttribute("data-show-flag")) ? "" : "none";
        });
    }
    function applyWatched() {
        var id = STATE.source();
        var on = id !== "own";
        var watched = !on && !!STATE.get("own_watched");
        document.body.classList.toggle("watched", watched);
        $("#monitor-bar").hidden = !(on || watched);
        var dev = DB.DEVICES[id] || DB.DEVICES.own;
        $("#monitor-bar b").textContent = on ? T(dev.desktop.barRef || "virus.monitor.bar") : T("virus.monitor.bar.own");
        $("#monitor-exit").textContent = T(on ? "virus.exit.btn" : "virus.exit.btn.own");
    }
    function applyDevice() {
        var id = STATE.source();
        var dev = DB.DEVICES[id] || DB.DEVICES.own;
        document.body.setAttribute("data-device", id);
        document.body.style.backgroundImage = "url(" + dev.desktop.wallpaper + ")";
        var on = id !== "own";
        document.body.classList.toggle("monitoring", on);
        if (window.FX) { if (on) FX.ambient.start(); else FX.ambient.stop(); }
        applyVisibility();
        applyWatched();
    }
    function setDevice(id) {
        closeAll();
        STATE.setSource(id);      /* 触发 source-change，各 app 重渲染 */
        applyDevice();
    }
    window.WM = { setDevice: setDevice, closeAll: closeAll, applyDevice: applyDevice, isOpen: isOpen };

    /* ---------------- 右键菜单 ---------------- */
    function hideCtx() { var m = $("#ctx-menu"); if (m) m.hidden = true; }
    function showCtx(x, y, items) {
        var m = $("#ctx-menu");
        m.innerHTML = items.map(function (it, i) {
            return '<div class="ctx-item' + (it.danger ? " danger" : "") + '" data-i="' + i + '">' + T(it.ref) + "</div>";
        }).join("");
        m.hidden = false;
        m.style.left = Math.min(x, window.innerWidth - 170) + "px";
        m.style.top = Math.min(y, window.innerHeight - 44 - items.length * 30) + "px";
        m.onclick = function (e) {
            var it = e.target.closest(".ctx-item");
            if (!it) return;
            hideCtx();
            items[+it.dataset.i].fn();
        };
    }
    window.showCtx = showCtx;

    function applyText() {
        document.querySelectorAll("[data-t]").forEach(function (el) {
            el.textContent = T(el.getAttribute("data-t"));
        });
    }

    /* ---------------- 初始化 ---------------- */
    document.addEventListener("DOMContentLoaded", function () {
        applyText();
        document.querySelectorAll(".window").forEach(function (win) {
            windowsState[win.dataset.app] = { isOpen: false, isMinimized: false };
        });

        document.querySelectorAll(".desktop-icon[data-app]").forEach(function (icon) {
            var app = icon.dataset.app;
            icon.addEventListener("click", function () {
                document.querySelectorAll(".desktop-icon").forEach(function (i) { i.classList.remove("selected"); });
                icon.classList.add("selected");
            });
            icon.addEventListener("dblclick", function () { openApp(app); });
        });
        var desktop = $("#desktop");
        desktop.addEventListener("click", function (e) {
            if (e.target === e.currentTarget) {
                document.querySelectorAll(".desktop-icon").forEach(function (i) { i.classList.remove("selected"); });
            }
        });
        desktop.addEventListener("contextmenu", function (e) {
            var icon = e.target.closest(".desktop-icon");
            e.preventDefault();
            if (!icon) { hideCtx(); return; }
            var app = icon.dataset.app, file = icon.dataset.file;
            var items = [];
            if (app) {
                items.push({ ref: "ctx.open", fn: function () { openApp(app); } });
                if (app === "virus") {
                    var nuke = function () {
                        STATE.emit("virus-uninstall");
                        FX.bsod(function () { STATE.emit("bsod-done"); });
                    };
                    items.push({ ref: "ctx.uninstall", fn: nuke, danger: true });
                    items.push({ ref: "ctx.delete", fn: nuke, danger: true });
                }
                showCtx(e.clientX, e.clientY, items);
            } else if (file) {
                FILES.contextMenu(file, e.clientX, e.clientY);
            }
        });
        document.addEventListener("mousedown", function (e) {
            if (e.button === 0 && !e.target.closest("#ctx-menu")) hideCtx();
        });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideCtx(); });

        document.querySelectorAll(".window").forEach(function (win) {
            var app = win.dataset.app;
            makeDraggable(win, win.querySelector(".title-bar"));
            win.addEventListener("mousedown", function () { bringToFront(app); });
            win.querySelector(".btn-min").onclick = function () { minimizeApp(app); };
            win.querySelector(".btn-max").onclick = function () { toggleMax(app); };
            win.querySelector(".btn-close").onclick = function () { closeApp(app); };
            win.querySelector(".title-bar").addEventListener("dblclick", function (e) {
                if (!e.target.closest("button")) toggleMax(app);
            });
        });

        var startMenu = $("#start-menu");
        $("#start-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            startMenu.classList.toggle("open");
        });
        document.addEventListener("click", function (e) {
            if (!e.target.closest("#start-menu")) startMenu.classList.remove("open");
        });
        startMenu.querySelectorAll("[data-open]").forEach(function (item) {
            item.addEventListener("click", function () {
                startMenu.classList.remove("open");
                openApp(item.dataset.open);
            });
        });
        $("#sm-restart").addEventListener("click", function () {
            startMenu.classList.remove("open");
            sysDialog(T("ui.dlg.reset.title"), T("ui.dlg.reset.body"), [
                { label: T("ui.cancel") },
                { label: T("ui.ok"), primary: true, fn: function () { STATE.reset(); } }
            ]);
        });
        var sd = $("#sm-shutdown");
        if (sd) sd.addEventListener("click", function () {
            startMenu.classList.remove("open");
            STATE.emit("shutdown");
        });

        $("#monitor-exit").addEventListener("click", function () {
            if (STATE.source() !== "own") { HACK.disconnect(); return; }
            /* 第三案：自己的电脑被接入，断不开 */
            FX.sound("windowsError.mp3", 0.6);
            sysDialog(T("virus.exit.fail.title"), T("virus.exit.fail.body"), [{ label: T("ui.ok"), primary: true }]);
            STATE.emit("exit-fail");
        });

        applyDevice();
        STATE.on(function () { applyVisibility(); applyWatched(); });
    });
})();
