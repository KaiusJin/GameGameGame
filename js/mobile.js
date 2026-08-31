/* 移动端适配层（学 ningning js/mobile.js）：不做两套页面，
   只在 <html> 上打 class，CSS 用 html.mobile-mode 覆盖。
   同时维护 --app-vh，解决 iOS 100vh 问题。 */
(function () {
    var root = document.documentElement;
    var MOBILE_MAX_WIDTH = 820;
    var NARROW_MAX_WIDTH = 560;

    function isCoarse() {
        return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    }
    function apply() {
        var w = window.innerWidth, h = window.innerHeight;
        if (!w && !isCoarse()) return;   /* 视口还没定型（后台标签/WebView 首帧），先不判 */
        var mobile = isCoarse() || w <= MOBILE_MAX_WIDTH;
        root.classList.toggle("mobile-mode", mobile);
        root.classList.toggle("mm-narrow", mobile && w <= NARROW_MAX_WIDTH);
        root.classList.toggle("mm-landscape", mobile && w > h);
        root.style.setProperty("--app-vh", h + "px");
        window.XY_IS_MOBILE = mobile;
    }
    var timer = null;
    window.addEventListener("resize", function () {
        clearTimeout(timer);
        timer = setTimeout(apply, 150);
    });
    window.addEventListener("orientationchange", function () {
        setTimeout(apply, 200);
    });
    apply();
    /* 有些 WebView 在 <head> 求值时视口还没定型（宽度为 0 或极小），
       会把桌面误判成移动端 —— 布局完成后再补算 */
    document.addEventListener("DOMContentLoaded", apply);
    window.addEventListener("load", apply);
})();
