/* =====================================================================
   窗口系统（沿用 ningning 式做法：窗口预置在 HTML、display 切换、
   z-index 递增、#task-<app> 任务栏项、标题栏拖拽）。
   额外职责：
   - [data-show-flag] 元素按 flag 显隐（如病毒图标"被发现"后才出现）
   - app-open 事件广播（app 借此上报 STATE.emit）
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }

    var windowsState = {};
    var zCounter = 100;

    function appTitle(appId) {
        return T("app." + appId + ".title");
    }

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

    function closeApp(appId) {
        var st = windowsState[appId];
        st.isOpen = false;
        st.isMinimized = false;
        var win = document.getElementById("win-" + appId);
        win.style.display = "none";
        win.classList.remove("maximized");
        var t = document.getElementById("task-" + appId);
        if (t) t.remove();
    }

    function toggleMax(appId) {
        document.getElementById("win-" + appId).classList.toggle("maximized");
        bringToFront(appId);
    }

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
    window.sysDialog = sysDialog;
    window.openApp = openApp;

    /* [data-show-flag]：flag 为真才显示 */
    function applyVisibility() {
        document.querySelectorAll("[data-show-flag]").forEach(function (el) {
            el.style.display = STATE.get(el.getAttribute("data-show-flag")) ? "" : "none";
        });
    }

    /* [data-t]：静态 HTML 上的文字全部来自文案表（规则 6） */
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
        $("#desktop").addEventListener("click", function (e) {
            if (e.target === e.currentTarget) {
                document.querySelectorAll(".desktop-icon").forEach(function (i) { i.classList.remove("selected"); });
            }
        });

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

        /* 开始菜单 */
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

        applyVisibility();
        STATE.on(applyVisibility);
    });
})();
