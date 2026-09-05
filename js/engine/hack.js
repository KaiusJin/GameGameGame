/* =====================================================================
   黑进目标电脑的流程：过场（FX.hackIn）→ 目标的 Windows 登录界面
   （密码由求助单提前给出，玩家自己记住并输入）→ 切到目标桌面（WM.setDevice）。
   断开：FX.hackOut → 回自己的桌面。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }

    var LOGIN = {
        show: function (target, cb) {
            var dev = DB.DEVICES[target];
            var scr = $("#login-screen");
            scr.style.backgroundImage = "url(" + dev.desktop.wallpaper + ")";
            $("#login-ava").src = dev.desktop.avatar;
            $("#login-name").textContent = T(dev.desktop.userRef);
            $("#login-hint").textContent = T("login.hint");
            $("#login-msg").textContent = "";
            var input = $("#login-pwd");
            input.value = "";
            input.placeholder = T("login.placeholder");
            scr.hidden = false;
            scr.classList.remove("off");
            setTimeout(function () { input.focus(); }, 50);

            function submit() {
                var ok = input.value.trim() === T(dev.desktop.passwordRef);
                if (!ok) {
                    FX.sound("windowsError.mp3", 0.6);
                    $("#login-msg").textContent = T("login.wrong");
                    scr.classList.remove("shake");
                    void scr.offsetWidth;
                    scr.classList.add("shake");
                    input.value = "";
                    input.focus();
                    return;
                }
                input.onkeydown = null;
                $("#login-go").onclick = null;
                scr.classList.add("off");
                setTimeout(function () { scr.hidden = true; if (cb) cb(); }, 700);
            }
            input.onkeydown = function (e) { if (e.key === "Enter") submit(); };
            $("#login-go").onclick = submit;
        }
    };

    /* 在别人电脑上时，Esc 随时断开（登录界面/输入框里不抢键） */
    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        if (STATE.source() === "own") return;
        if (document.getElementById("hack-overlay")) return;
        HACK.disconnect();
    });

    window.HACK = {
        connect: function (target) {
            FX.hackIn(function () {
                LOGIN.show(target, function () {
                    WM.setDevice(target);
                    STATE.emit("connected:" + target);
                });
            });
        },
        disconnect: function () {
            FX.hackOut(function () {
                WM.setDevice("own");
                STATE.emit("connected:own");
            });
        }
    };
})();
