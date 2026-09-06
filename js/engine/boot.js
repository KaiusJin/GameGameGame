/* =====================================================================
   开机序列：游玩须知 → BIOS 行 → Windows 登录界面（输入你的用户名，见 signin.js）
   → "欢迎" → 桌面。系统没重装，桌面上全是前任机主留下的东西。
   首次完整播放；此后加载只闪一下黑屏。boot-done 事件交给触发器接管。
   ===================================================================== */
(function () {
    document.addEventListener("DOMContentLoaded", function () {
        var ov = document.getElementById("boot-overlay");
        var linesEl = document.getElementById("boot-lines");

        /* 已经打出结局：不开机，直接重放结局画面 */
        if (STATE.get("ending") && window.ENDING) {
            ov.remove();
            ENDING.play(STATE.get("ending"));
            return;
        }

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

        var bios = ["boot.l1", "boot.l2", "boot.l3"];
        var i = 0;
        function startLines() { next(); }
        function next() {
            if (i >= bios.length) { setTimeout(afterBios, 900); return; }
            var div = document.createElement("div");
            div.textContent = T(bios[i]);
            linesEl.appendChild(div);
            i++;
            setTimeout(next, 650);
        }
        function afterBios() {
            if (STATE.get("player_name") || !window.SIGNIN) { finish(); return; }
            linesEl.innerHTML = "";
            SIGNIN.show(finish);
        }
    });
})();
