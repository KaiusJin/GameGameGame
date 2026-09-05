/* =====================================================================
   开机序列：二手电脑冷启动（BIOS 行 → 上任机主的用户名登录 → 桌面）。
   首次完整播放；此后加载只闪一下黑屏。boot-done 事件交给触发器接管。
   ===================================================================== */
(function () {
    document.addEventListener("DOMContentLoaded", function () {
        var ov = document.getElementById("boot-overlay");
        var linesEl = document.getElementById("boot-lines");

        function finish() {
            ov.classList.add("off");
            setTimeout(function () { ov.remove(); }, 900);
            STATE.set("booted");
            STATE.emit("boot-done");
        }

        if (STATE.get("booted")) {
            setTimeout(function () {
                ov.classList.add("off");
                setTimeout(function () { ov.remove(); }, 500);
                STATE.emit("boot-done");   /* 触发器一次性，重进不会重复弹 */
            }, 350);
            return;
        }

        /* 警示页：首次进入必看，点一下才开机（顺带解锁浏览器的音频自动播放） */
        var warn = document.createElement("div");
        warn.id = "boot-warn";
        /* 长得像 Windows 自带的消息框（复用 .sys-dialog 样式），黑屏上只有它 */
        warn.innerHTML =
            '<div class="sys-dialog bw-dialog">' +
            '<div class="d-title">' + T("warn.title") + "</div>" +
            '<div class="d-body"><div class="bw-ico">!</div><div>' + T("warn.body").split("\n").join("<br>") + "</div></div>" +
            '<div class="d-footer"><button class="primary" id="bw-go">' + T("warn.btn") + "</button></div></div>";
        ov.appendChild(warn);
        document.getElementById("bw-go").addEventListener("click", function () {
            warn.remove();
            startLines();
        });

        var lines = ["boot.l1", "boot.l2", "boot.l3", "boot.l4"];
        var i = 0;
        function startLines() { next(); }
        function next() {
            if (i >= lines.length) { setTimeout(finish, 1100); return; }
            var div = document.createElement("div");
            div.textContent = T(lines[i]);
            if (i === lines.length - 1) div.className = "boot-login";
            linesEl.appendChild(div);
            i++;
            setTimeout(next, i === lines.length ? 1300 : 650);
        }
    });
})();
