/* 窗口管理器（学 ningning js/pc/main.js：窗口预置在 HTML、display 切换、
   z-index 递增计数器、#task-<app> 任务栏项、makeDraggable 标题栏拖拽） */
(function () {
    function $(s) { return document.querySelector(s); }

    /* 守卫：没走完开场的送回去（同步，localStorage 可靠）。
       移动端禁入（剧情：手机连不了远程）推迟到视口定型后再判 ——
       部分 WebView 在脚本求值时宽度未定，会把桌面误判成移动端。 */
    if (localStorage.getItem("xy_stage") !== "desktop") {
        location.replace("index.html");
        return;
    }
    window.addEventListener("load", function () {
        (function decide() {
            var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
            if (!window.innerWidth && !coarse) {   /* 视口未定型，等非 0 再判 */
                setTimeout(decide, 300);
                return;
            }
            if (coarse || window.innerWidth <= 820) location.replace("index.html");
        })();
    });

    var APP_INFO = {
        mypc: { title: "此电脑" },
        recycle: { title: "回收站" },
        browser: { title: "Google Chrome" },
        wechat: { title: "微信" },
        files: { title: "下载" },
        viewer: { title: "文件查看" }
    };
    var windowsState = {};   /* appId -> {isOpen, isMinimized} */
    var zCounter = 100;

    Object.keys(APP_INFO).forEach(function (id) {
        windowsState[id] = { isOpen: false, isMinimized: false };
    });

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
        item.innerHTML = (icon ? icon.outerHTML : "") + "<span>" + APP_INFO[appId].title + "</span>";
        item.onclick = function () {
            var st = windowsState[appId];
            var win = document.getElementById("win-" + appId);
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
            /* 居中（略微级联防止完全重叠） */
            var w = win.offsetWidth, h = win.offsetHeight;
            win.style.left = Math.max(0, (window.innerWidth - w) / 2 + (zCounter % 3) * 16) + "px";
            win.style.top = Math.max(0, (window.innerHeight - 44 - h) / 2) + "px";
            createTaskItem(appId);
        } else if (st.isMinimized) {
            st.isMinimized = false;
            win.style.display = "flex";
        }
        bringToFront(appId);
        document.dispatchEvent(new CustomEvent("app-open", { detail: appId }));
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

    /* 标题栏拖拽 */
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
    }
    window.sysDialog = sysDialog;
    window.openApp = openApp;

    /* ---------------- 初始化 ---------------- */
    document.addEventListener("DOMContentLoaded", function () {

        /* 图标：双击打开，单击选中 */
        document.querySelectorAll(".desktop-icon").forEach(function (icon) {
            var app = icon.dataset.app;
            icon.addEventListener("click", function () {
                document.querySelectorAll(".desktop-icon").forEach(function (i) { i.classList.remove("selected"); });
                icon.classList.add("selected");
            });
            icon.addEventListener("dblclick", function () { openApp(app); });
        });
        document.getElementById("desktop").addEventListener("click", function (e) {
            if (e.target === e.currentTarget) {
                document.querySelectorAll(".desktop-icon").forEach(function (i) { i.classList.remove("selected"); });
            }
        });

        /* 窗口：控制按钮 + 拖拽 + 点击置顶 */
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
        $("#sm-quit").addEventListener("click", function () {
            startMenu.classList.remove("open");
            if (window.REMOTE) window.REMOTE.quit();
        });
        $("#sm-restart").addEventListener("click", function () {
            startMenu.classList.remove("open");
            sysDialog("系统", "确定要清除全部进度、重新开始吗？", [
                { label: "取消" },
                {
                    label: "确定", primary: true,
                    fn: function () { location.href = "index.html?reset"; }
                }
            ]);
        });
    });
})();
