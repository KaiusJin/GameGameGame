/* =====================================================================
   浏览器：假站点由 JSON 页面描述（DB.PAGES）；新闻页是独立数据源（DB.NEWS，
   死亡只在这里揭晓）；地址栏可输入，命中列表内才有页面，否则错误页；
   历史记录视图跟随当前数据源（监控目标时 = 她的浏览记录）。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    /* 视图栈：{type:'start'} {type:'news'} {type:'article',title,body}
               {type:'hist'} {type:'error',host} */
    var stack = [{ type: "start" }];

    function top() { return stack[stack.length - 1]; }
    function addressOf(v) {
        if (v.type === "start") return "";
        if (v.type === "news") return pageById("pg_news").url;
        if (v.type === "article") return v.url || "";
        if (v.type === "hist") return "browser://history";
        if (v.type === "error") return v.host;
        return "";
    }
    function pageById(id) {
        return DB.PAGES.filter(function (p) { return p.id === id; })[0];
    }
    function history() {
        var dev = DB.DEVICES[STATE.source()] || { history: [] };
        return dev.history || [];
    }
    function newsItems() {
        return DB.NEWS.filter(function (n) { return STATE.cond(n.appears); });
    }

    /* ---------------- 各视图 ---------------- */
    function startHtml() {
        var newsBadge = STATE.get("news1_out") && !STATE.get("news1_read");
        return (
            '<div class="br-home">' +
            '<div class="br-start-title">' + esc(T("browser.start.title")) + "</div>" +
            '<div class="br-tiles">' +
            '<div class="br-tile' + (newsBadge ? " dot" : "") + '" data-hint="news:n1" onclick="BROWSER.go(\'news\')">' +
            '<i class="bm-ico">' + esc(T("news.site").charAt(0)) + "</i>" +
            "<span>" + esc(T("news.site")) + "</span></div>" +
            "</div></div>"
        );
    }
    function newsHtml() {
        var rows = newsItems().map(function (n) {
            return (
                '<div class="nw-row" data-news="' + n.id + '" data-hint="news:' + n.id + '">' +
                '<span class="nw-date">' + esc(T(n.dateRef)) + "</span>" +
                '<span class="nw-head">' + esc(T(n.headRef)) + "</span></div>"
            );
        }).join("");
        return (
            '<div class="nw-root">' +
            '<div class="nw-site">' + esc(T("news.site")) + "</div>" +
            (rows || '<div class="nw-empty">…</div>') +
            "</div>"
        );
    }
    function articleHtml(v) {
        return (
            '<div class="br-page"><h1>' + esc(v.title) + "</h1>" +
            '<div class="p-site">' + esc(v.site || "") + "</div>" +
            String(v.body).split("\n").map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
            "</div>"
        );
    }
    function histHtml() {
        var rows = history().map(function (h) {
            var locked = h.locked && !STATE.cond(h.locked);
            return (
                '<div class="hs-row' + (locked ? " locked" : "") + '" data-hist="' + h.id + '" data-hint="hist:' + h.id + '">' +
                '<span class="hs-title">' + esc(T(h.titleRef)) +
                (locked ? ' <i class="fx-lock">' + esc(T("ui.locked.tag")) + "</i>" : "") + "</span>" +
                '<span class="hs-url">' + esc(h.url) + "</span>" +
                '<span class="hs-when">' + esc(T(h.whenRef)) + "</span></div>"
            );
        }).join("");
        return (
            '<div class="hs-root"><h3>' + esc(T("browser.hist.title")) + "</h3>" +
            (rows || '<div class="nw-empty">' + esc(T("browser.hist.empty")) + "</div>") +
            "</div>"
        );
    }
    function errorHtml(host) {
        return (
            '<div class="br-error"><div class="e-icon">⚠</div>' +
            "<h2>" + esc(T("browser.error.title")) + "</h2>" +
            "<p><b>" + esc(host) + "</b> " + esc(T("browser.error.body")) + "</p>" +
            '<div class="e-code">ERR_CONNECTION_TIMED_OUT</div></div>'
        );
    }

    function render() {
        var v = top();
        var view = $("#br-view");
        if (!view) return;
        if (v.type === "start") view.innerHTML = startHtml();
        else if (v.type === "news") view.innerHTML = newsHtml();
        else if (v.type === "article") view.innerHTML = articleHtml(v);
        else if (v.type === "hist") view.innerHTML = histHtml();
        else if (v.type === "error") view.innerHTML = errorHtml(v.host);
        view.scrollTop = 0;

        $("#br-address input").value = addressOf(v);
        $("#browser-title").textContent =
            (v.type === "news" ? T("news.site") : v.type === "article" ? v.title : T("browser.start.title")) +
            " - " + T("app.browser.title");
        $("#br-back").classList.toggle("enabled", stack.length > 1);

        /* 行点击绑定 */
        view.querySelectorAll("[data-news]").forEach(function (el) {
            el.addEventListener("click", function () {
                var n = DB.NEWS.filter(function (x) { return x.id === el.dataset.news; })[0];
                navigate({ type: "article", title: T(n.headRef), site: T("news.site") + " · " + T(n.dateRef), body: T(n.bodyRef), url: pageById("pg_news").url + "/" + n.id });
                STATE.emit("read-news:" + n.id);
            });
        });
        view.querySelectorAll("[data-hist]").forEach(function (el) {
            el.addEventListener("click", function () {
                var h = history().filter(function (x) { return x.id === el.dataset.hist; })[0];
                if (h.locked && !STATE.cond(h.locked)) {
                    sysDialog(T("ui.dlg.locked.title"), T("ui.dlg.locked.body"), [{ label: T("ui.ok"), primary: true }]);
                    return;
                }
                navigate({ type: "article", title: T(h.titleRef), site: h.url, body: T("browser.snapshot"), url: h.url });
                if (h.sets) STATE.set(h.sets);
                STATE.emit("view-hist:" + h.id);
            });
        });
        NOTIFY.hints();
    }

    function navigate(v) { stack.push(v); render(); }
    function goBack() { if (stack.length > 1) { stack.pop(); render(); } }

    window.BROWSER = {
        go: function (what) {
            if (what === "news") navigate({ type: "news" });
            else if (what === "hist") navigate({ type: "hist" });
            else navigate({ type: "start" });
        },
        address: function (input) {
            var q = (input || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
            if (!q) return;
            var hit = DB.PAGES.filter(function (p) { return p.url === q; })[0];
            if (hit && hit.kind === "news") navigate({ type: "news" });
            else navigate({ type: "error", host: q });
        }
    };

    document.addEventListener("DOMContentLoaded", function () {
        render();
        $("#br-back").addEventListener("click", goBack);
        $("#br-refresh").addEventListener("click", render);
        $("#bm-news").addEventListener("click", function () { BROWSER.go("news"); });
        $("#bm-hist").addEventListener("click", function () { BROWSER.go("hist"); });
        $("#br-address input").addEventListener("keydown", function (e) {
            if (e.key === "Enter") BROWSER.address(e.target.value);
        });
    });
    STATE.on(render);
    document.addEventListener("source-change", function () {
        stack = [STATE.source() === "own" ? { type: "start" } : { type: "hist" }];
        render();
    });
})();
