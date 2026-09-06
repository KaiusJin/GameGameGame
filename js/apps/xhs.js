/* =====================================================================
   小红书（她的电脑上才有）：个人主页 + 瀑布流笔记 + 笔记详情（含评论）。
   形态学 ningning js/pc/xhs.js（瀑布流 + 弹层详情），数据 = DEVICES[source].xhs。
   她的笔记就是时间线：正常生活 → 分享课件站（源头）→ "最近有点累" → 停更。
   评论 comments:[{whoRef, textRef, dateRef, if}]：许青的追问，以及之后那条留言。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var openPost = null;

    function data() { return (DB.DEVICES[STATE.source()] || {}).xhs || null; }
    function comments(p) { return (p.comments || []).filter(function (c) { return STATE.cond(c.if); }); }

    function render() {
        var host = $("#xhs-root");
        if (!host) return;
        var d = data();
        if (!d) { host.innerHTML = '<div class="xh-empty">' + esc(T("chat.own.empty")) + "</div>"; return; }
        var posts = d.posts;
        var html =
            '<div class="xh-head">' +
            '<img class="xh-ava" src="' + d.avatar + '" alt="">' +
            '<div class="xh-meta"><div class="xh-name">' + esc(T(d.nameRef)) + "</div>" +
            '<div class="xh-id">' + esc(T(d.idRef)) + "</div>" +
            '<div class="xh-stats">' + esc(T(d.statsRef)) + "</div></div></div>" +
            '<div class="xh-tabs"><span class="on">' + esc(T("xhs.tab.notes")) + "</span></div>" +
            '<div class="xh-gap">' + esc(T("xhs.gap")) + "</div>" +
            '<div class="xh-grid">' +
            posts.map(function (p) {
                var n = comments(p).length;
                return (
                    '<div class="xh-card" data-post="' + p.id + '" data-hint="xhs:' + p.id + '">' +
                    '<img src="' + p.cover + '" alt="">' +
                    '<div class="xh-title">' + esc(T(p.titleRef)) + "</div>" +
                    '<div class="xh-foot"><span>' + esc(T(p.dateRef)) + "</span><span>♡ " + p.likes + (n ? " · " + esc(T("xhs.cmt")) + " " + n : "") + "</span></div></div>"
                );
            }).join("") +
            "</div>";
        if (openPost) {
            var p = posts.filter(function (x) { return x.id === openPost; })[0];
            if (p) {
                var cs = comments(p);
                html +=
                    '<div class="xh-modal" id="xh-modal">' +
                    '<div class="xh-detail">' +
                    '<div class="xh-d-img"><img src="' + p.cover + '" alt=""></div>' +
                    '<div class="xh-d-body">' +
                    '<div class="xh-d-author"><img src="' + d.avatar + '" alt=""><span>' + esc(T(d.nameRef)) + "</span></div>" +
                    '<h3>' + esc(T(p.titleRef)) + "</h3>" +
                    '<pre>' + esc(T(p.bodyRef)) + "</pre>" +
                    '<div class="xh-d-date">' + esc(T(p.dateRef)) + " · ♡ " + p.likes + " " + esc(T("xhs.detail.likes")) + "</div>" +
                    '<div class="xh-cmts"><h4>' + esc(T("xhs.cmt.title").replace("{n}", cs.length)) + "</h4>" +
                    (cs.length ? cs.map(function (c) {
                        return '<div class="xh-c' + (c.hl ? " hl" : "") + '"><b>' + esc(T(c.whoRef)) + "</b><p>" + esc(T(c.textRef)) + "</p><em>" + esc(T(c.dateRef)) + "</em></div>";
                    }).join("") : '<div class="xh-c-empty">' + esc(T("xhs.cmt.empty")) + "</div>") +
                    "</div></div>" +
                    '<button class="xh-close" id="xh-close">✕</button>' +
                    "</div></div>";
            }
        }
        host.innerHTML = html;
        host.querySelectorAll("[data-post]").forEach(function (el) {
            el.addEventListener("click", function () {
                openPost = el.dataset.post;
                render();
                var p = posts.filter(function (x) { return x.id === openPost; })[0];
                if (p && p.sets) STATE.set(p.sets);
                STATE.emit("xhs-open:" + openPost);
            });
        });
        var close = $("#xh-close");
        if (close) close.addEventListener("click", function () { openPost = null; render(); });
        var modal = $("#xh-modal");
        if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) { openPost = null; render(); } });
        NOTIFY.hints();
    }

    document.addEventListener("DOMContentLoaded", render);
    STATE.on(render);
    document.addEventListener("source-change", function () { openPost = null; render(); });
})();
