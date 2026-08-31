/* 首帧检查（在 <head> 里同步执行）：
   - index.html?reset 清档
   - 已经连上桌面的 PC 玩家直接去 pc.html（不重播开场）
   注意：移动端判定不能在解析期定死 —— 部分 WebView 首帧视口未定型，
   宽度可疑时推迟到 load 之后再决定（index 本来就先渲染聊天，不闪屏）。 */
(function () {
    try {
        if (location.search.indexOf("reset") >= 0) {
            Object.keys(localStorage).forEach(function (k) {
                if (k.indexOf("xy_") === 0) localStorage.removeItem(k);
            });
            history.replaceState(null, "", location.pathname);
        }
        if (localStorage.getItem("xy_stage") !== "desktop") return;

        function isMobileNow() {
            return (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
                window.innerWidth <= 820;
        }
        if (window.innerWidth > 820) {
            location.replace("pc.html");     /* 视口已定型且明确是桌面 */
        } else {
            window.addEventListener("load", function () {
                setTimeout(function () {
                    if (!isMobileNow()) location.replace("pc.html");
                }, 250);
            });
        }
    } catch (e) {}
})();
