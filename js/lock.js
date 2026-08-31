/* 开机流程：OOBE(首次) → 开机动画 → 锁屏 → 登录 → pc.html */
(function () {
    function $(s) { return document.querySelector(s); }

    /* index.html?reset 一键清档 */
    if (location.search.indexOf("reset") >= 0) {
        Object.keys(localStorage).forEach(function (k) {
            if (k.indexOf("xy_") === 0) localStorage.removeItem(k);
        });
        location.replace(location.pathname);
        return;
    }

    var firstBoot = localStorage.getItem("xy_first_boot_done") !== "true";
    var name = localStorage.getItem("xy_name") || "用户";

    /* 锁屏时钟 */
    var WEEK = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    function tick() {
        var d = new Date();
        $("#lock-time").textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
        $("#lock-date").textContent = (d.getMonth() + 1) + "月" + d.getDate() + "日，" + WEEK[d.getDay()];
    }

    function removeFirstBootStyle() {
        var s = document.getElementById("first-boot-style");
        if (s) s.remove();
    }
    function showBootThenLock(bootMs) {
        var boot = $("#boot-screen");
        boot.style.display = "flex";
        setTimeout(function () {
            boot.style.opacity = "0";
            setTimeout(function () { boot.style.display = "none"; }, 800);
        }, bootMs);
    }

    document.addEventListener("DOMContentLoaded", function () {
        tick();
        setInterval(tick, 15000);

        /* 登录界面 */
        $("#login-name").textContent = name;
        $("#login-avatar").textContent = name.trim().charAt(0).toUpperCase();

        $("#lockscreen").addEventListener("click", function () {
            $("#lockscreen").classList.add("slide-up");
        });
        $("#login-btn").addEventListener("click", function () {
            location.href = "pc.html";
        });

        if (firstBoot) {
            /* OOBE：输入名字才能点接受 */
            var input = $("#oobe-input");
            var btn = $("#oobe-accept");
            input.addEventListener("input", function () {
                btn.disabled = !input.value.trim();
            });
            input.addEventListener("keydown", function (e) {
                if (e.key === "Enter" && input.value.trim()) btn.click();
            });
            btn.addEventListener("click", function () {
                var v = input.value.trim();
                if (!v) return;
                localStorage.setItem("xy_name", v);
                localStorage.setItem("xy_first_boot_done", "true");
                name = v;
                $("#login-name").textContent = v;
                $("#login-avatar").textContent = v.charAt(0).toUpperCase();
                removeFirstBootStyle();
                $("#oobe").style.display = "none";
                showBootThenLock(2800);
            });
        } else {
            /* 回访：直接开机动画 → 锁屏 */
            removeFirstBootStyle();
            showBootThenLock(2000);
        }
    });
})();
