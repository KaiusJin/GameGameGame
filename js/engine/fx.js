/* =====================================================================
   特效层：音效 + 屏幕故障（glitch）。
   音效播放方式学 ningning（js/pc/main.js）：new Audio().play().catch()，
   播放失败（浏览器自动播放策略）静默忽略。
   glitch 的"图标文字乱码"思路也来自 ningning 的 glitchChars，字符表自写。
   借用的音频文件一律登记在 BORROWED_ASSETS.txt，正式版统一替换。
   ===================================================================== */
(function () {

    function sound(name, vol) {
        try {
            var a = new Audio("audio/" + name);
            if (vol != null) a.volume = vol;
            a.play().catch(function () { });
        } catch (e) { }
    }

    var GLITCH_CHARS = ["▒▒▒▒", "█▓▒░", "☒☒☒", "¿¿¿¿¿", "␀␀␀", "ERR", "0x0", "▚▞▚▞", "§§§§", "……"];

    /* 全屏故障闪烁 + 桌面图标文字乱码，ms 毫秒后恢复 */
    function glitch(ms) {
        ms = ms || 900;
        var ov = document.createElement("div");
        ov.id = "fx-glitch";
        document.body.appendChild(ov);

        var labels = Array.prototype.slice.call(document.querySelectorAll(".desktop-icon .label"));
        var orig = labels.map(function (el) { return el.textContent; });
        var iv = setInterval(function () {
            labels.forEach(function (el) {
                if (Math.random() < 0.5) {
                    el.textContent = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
                }
            });
        }, 70);

        setTimeout(function () {
            clearInterval(iv);
            labels.forEach(function (el, i) { el.textContent = orig[i]; });
            ov.remove();
        }, ms);
    }

    window.FX = { sound: sound, glitch: glitch };
})();
