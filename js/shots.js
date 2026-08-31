/* 手机截图渲染器（开场 + 协助聊天坞共用）。
   数据在 DB.SHOTS，样式在 css/shot.css（两个页面都要引入）。 */
(function () {
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function callsHtml(d) {
        return d.rows.map(function (r) {
            return (
                '<div class="sr">' +
                '<div class="sr-main"><b class="' + (r.missed ? "missed" : "") + '">' +
                (r.out ? '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M7 17L17 7M9 7h8v8"/></svg>' : "") +
                esc(r.name) + "</b><span>" + esc(r.sub || "") + "</span></div>" +
                '<span class="sr-time">' + esc(r.time || "") + "</span></div>"
            );
        }).join("");
    }
    function chatHtml(d) {
        return d.rows.map(function (r) {
            return (
                '<div class="sb ' + (r.from === "me" ? "me" : "them") + '">' +
                (r.time ? '<i class="sb-time">' + esc(r.time) + "</i>" : "") +
                "<span>" + esc(r.text) + "</span></div>"
            );
        }).join("");
    }

    window.renderShotHTML = function (key) {
        var d = window.DB && DB.SHOTS && DB.SHOTS[key];
        if (!d) return "";
        return (
            '<div class="shot">' +
            '<div class="shot-head">' +
            '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 18l-6-6 6-6"/></svg>' +
            "<span>" + esc(d.title) + "</span></div>" +
            '<div class="shot-body ' + d.type + '">' +
            (d.type === "calls" ? callsHtml(d) : chatHtml(d)) +
            "</div>" +
            '<div class="shot-foot">来自手机的屏幕截图</div>' +
            "</div>"
        );
    };
})();
