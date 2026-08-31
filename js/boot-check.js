/* 首帧决定显示哪个屏幕（学 ningning js/lock/boot-check.js 的 document.write 技巧：
   在首次绘制前就决定 OOBE / 开机动画，避免闪屏）。样式标签稍后由 lock.js 移除。 */
(function () {
    var done = false;
    try { done = localStorage.getItem("xy_first_boot_done") === "true"; } catch (e) {}
    if (!done) {
        document.write('<style id="first-boot-style">#lockscreen,#login-screen{display:none!important}#oobe{display:flex!important}</style>');
    } else {
        document.write('<style id="first-boot-style">#boot-screen{display:flex!important}</style>');
    }
})();
