/* =====================================================================
   自己这台电脑的 Windows 登录界面（开机后、进桌面前）。
   照 Windows 10 锁屏后的"其他用户"登录：模糊壁纸、圆形用户图标、用户名 / 密码两个输入框、
   右下角网络 / 轻松使用 / 电源图标。玩家输入的用户名存进 flags.player_name，
   之后求助单 003、设备流转记录、结局都用它。密码可以留空（卖家没设）。
   登录成功 → "欢迎" 转圈 → 桌面。所有文字走 DB.TEXT（signin.*）。
   ===================================================================== */
(function () {
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    window.SIGNIN = {
        show: function (cb) {
            var wall = ((DB.DEVICES.own || {}).desktop || {}).wallpaper || "image/wallpaper.jpg";
            var scr = document.createElement("div");
            scr.id = "signin-screen";
            scr.style.backgroundImage = "url(" + wall + ")";
            scr.innerHTML =
                '<div class="si-card">' +
                '<div class="si-ava"><svg viewBox="0 0 24 24" width="92" height="92" fill="none" stroke="#fff" stroke-width="1.2"><circle cx="12" cy="8.2" r="4.2"/><path d="M3.8 21c.6-4.2 4-6.6 8.2-6.6s7.6 2.4 8.2 6.6"/></svg></div>' +
                '<div class="si-title">' + esc(T("signin.other")) + "</div>" +
                '<div class="si-fields">' +
                '<input id="si-user" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="' + esc(T("signin.user.ph")) + '">' +
                '<div class="si-row"><input id="si-pwd" type="password" autocomplete="off" placeholder="' + esc(T("signin.pwd.ph")) + '"><button id="si-go">→</button></div>' +
                "</div>" +
                '<div class="si-msg" id="si-msg"></div>' +
                '<div class="si-to">' + esc(T("signin.to")) + "</div>" +
                "</div>" +
                '<div class="si-users"><div class="si-user on"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="1.4"><circle cx="12" cy="8.2" r="4.2"/><path d="M3.8 21c.6-4.2 4-6.6 8.2-6.6s7.6 2.4 8.2 6.6"/></svg><span>' + esc(T("signin.other")) + "</span></div></div>" +
                '<div class="si-tray">' +
                '<span title="' + esc(T("signin.net")) + '"><svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M2 8.5a13 13 0 0 1 20 0l-1.6 1.6a10.7 10.7 0 0 0-16.8 0z"/><path d="M5.2 11.7a8.5 8.5 0 0 1 13.6 0l-1.6 1.6a6.2 6.2 0 0 0-10.4 0z"/><path d="M8.4 14.9a4 4 0 0 1 7.2 0L12 19z"/></svg></span>' +
                '<span title="' + esc(T("signin.ease")) + '"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8"><circle cx="12" cy="4.5" r="2"/><path d="M4 9.5c3 .8 5.5 1.2 8 1.2s5-.4 8-1.2M12 10.7v4.3M12 15l-3.2 6M12 15l3.2 6"/></svg></span>' +
                '<span title="' + esc(T("signin.power")) + '"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.9"><path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/></svg></span>' +
                "</div>" +
                '<div class="si-welcome" id="si-welcome" hidden><div class="si-spin"></div><div id="si-welcome-text"></div></div>';
            document.body.appendChild(scr);
            var user = scr.querySelector("#si-user"), pwd = scr.querySelector("#si-pwd"), msg = scr.querySelector("#si-msg");
            setTimeout(function () { user.focus(); }, 80);

            function submit() {
                var name = user.value.trim();
                if (!name) {
                    msg.textContent = T("signin.empty");
                    scr.classList.remove("shake"); void scr.offsetWidth; scr.classList.add("shake");
                    user.focus();
                    return;
                }
                user.onkeydown = pwd.onkeydown = null;
                STATE.set("player_name", name);
                var w = scr.querySelector("#si-welcome");
                scr.querySelector("#si-welcome-text").textContent = T("signin.welcome");
                scr.classList.add("busy");
                w.hidden = false;
                if (window.FX) FX.sound("windows-10-notify-system-sound.mp3", 0.35);
                setTimeout(function () {
                    scr.classList.add("off");
                    setTimeout(function () { scr.remove(); if (cb) cb(); }, 800);
                }, 2200);
            }
            user.onkeydown = function (e) { if (e.key === "Enter") { pwd.focus(); } };
            pwd.onkeydown = function (e) { if (e.key === "Enter") submit(); };
            scr.querySelector("#si-go").addEventListener("click", submit);
        }
    };
})();
