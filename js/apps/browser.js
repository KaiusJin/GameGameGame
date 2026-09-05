/* =====================================================================
   浏览器：假站点由 DB.PAGES 描述（kind: news | site | bili）；
   书签与历史记录跟随当前电脑；地址栏可输入，命中列表内才有页面，否则错误页。
   新闻站是独立数据源（死亡只在这里揭晓）。
   B 站做法学 ningning：页面完整、播放器故意加载失败 + 错误音，信息在评论区。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    /* 视图：{type:'start'} {type:'news'} {type:'article',...} {type:'hist'} {type:'error',host}
             {type:'site'} {type:'bili', view:'home'|'hist'|'video', video} */
    var stack = [{ type: "start" }];
    function top() { return stack[stack.length - 1]; }
    function pageById(id) { return DB.PAGES.filter(function (p) { return p.id === id; })[0]; }
    function dev() { return DB.DEVICES[STATE.source()] || DB.DEVICES.own; }
    function history() { return dev().history || []; }
    function newsItems() { return DB.NEWS.filter(function (n) { return STATE.cond(n.appears); }); }

    function addressOf(v) {
        if (v.type === "news") return pageById("pg_news").url;
        if (v.type === "site") return pageById("pg_site").url;
        if (v.type === "bili") return pageById("pg_bili").url + (v.view === "video" ? "/video/BV1xy4y1a7Qk" : v.view === "hist" ? "/history" : "");
        if (v.type === "article") return v.url || "";
        if (v.type === "hist") return "browser://history";
        if (v.type === "error") return v.host;
        return "";
    }
    function titleOf(v) {
        if (v.type === "news") return T("news.site");
        if (v.type === "site") return T("site.name");
        if (v.type === "bili") return v.view === "video" ? T(DB.BILI.videos[v.video].titleRef) : T("bili.name");
        if (v.type === "article") return v.title;
        if (v.type === "hist") return T("browser.hist.title");
        if (v.type === "error") return v.host;
        return T("browser.start.title");
    }

    /* ---------------- 视图 ---------------- */
    function startHtml() {
        var tiles = dev().bookmarks.map(function (b) {
            var dot = b.page === "pg_news" && STATE.get("news1_out") && !STATE.get("news1_read");
            return '<div class="br-tile' + (dot ? " dot" : "") + '" data-page="' + b.page + '" data-hint="bm:' + b.page + '">' +
                '<i class="bm-ico">' + esc(T(b.labelRef).charAt(0)) + "</i><span>" + esc(T(b.labelRef)) + "</span></div>";
        }).join("");
        return '<div class="br-home"><div class="br-start-title">' + esc(T("browser.start.title")) + '</div><div class="br-tiles">' + tiles + "</div></div>";
    }
    function newsHtml() {
        var rows = newsItems().map(function (n) {
            return '<div class="nw-row" data-news="' + n.id + '" data-hint="news:' + n.id + '"><span class="nw-date">' + esc(T(n.dateRef)) + '</span><span class="nw-head">' + esc(T(n.headRef)) + "</span></div>";
        }).join("");
        return '<div class="nw-root"><div class="nw-site">' + esc(T("news.site")) + "</div>" + rows + "</div>";
    }
    function articleHtml(v) {
        return '<div class="br-page"><h1>' + esc(v.title) + '</h1><div class="p-site">' + esc(v.site || "") + "</div>" +
            String(v.body).split("\n").map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>";
    }
    function histHtml() {
        var rows = history().map(function (h) {
            var locked = h.locked && !STATE.cond(h.locked);
            return '<div class="hs-row' + (locked ? " locked" : "") + '" data-hist="' + h.id + '" data-hint="hist:' + h.id + '">' +
                '<span class="hs-title">' + esc(T(h.titleRef)) + (locked ? ' <i class="fx-lock">' + esc(T("ui.locked.tag")) + "</i>" : "") + "</span>" +
                '<span class="hs-url">' + esc(h.url) + '</span><span class="hs-when">' + esc(T(h.whenRef)) + "</span></div>";
        }).join("");
        return '<div class="hs-root"><h3>' + esc(T("browser.hist.title")) + "</h3>" + (rows || '<div class="nw-empty">' + esc(T("browser.hist.empty")) + "</div>") + "</div>";
    }
    function errorHtml(host) {
        return '<div class="br-error"><div class="e-icon">⚠</div><h2>' + esc(T("browser.error.title")) + "</h2><p><b>" + esc(host) + "</b> " + esc(T("browser.error.body")) + '</p><div class="e-code">ERR_CONNECTION_TIMED_OUT</div></div>';
    }
    /* 假课件站：源头 */
    function siteHtml() {
        var fields = ["site.f1", "site.f2", "site.f3", "site.f4", "site.f5", "site.f6"].map(function (r) { return "<li>" + esc(T(r)) + "</li>"; }).join("");
        return (
            '<div class="st-root">' +
            '<div class="st-nav"><b>' + esc(T("site.name")) + "</b><span>" + esc(T("site.tag")) + "</span></div>" +
            '<div class="st-hero"><h1>' + esc(T("site.hero")) + "</h1><p>" + esc(T("site.sub")) + "</p></div>" +
            '<div class="st-card"><h3>' + esc(T("site.form.title")) + "</h3><ul>" + fields + "</ul>" +
            '<button class="st-dl" id="st-dl">' + esc(T("site.dl")) + "</button></div>" +
            '<div class="st-foot">' + esc(T("site.foot")) + "</div></div>"
        );
    }
    /* 假 B 站 */
    function biliBar(tab) {
        return '<div class="bl-bar"><span class="bl-logo" data-bili="home">' + esc(T("bili.name")) + '</span><span class="bl-me">' + esc(T("bili.me")) + "</span></div>" +
            '<div class="bl-tabs"><span class="' + (tab === "home" ? "on" : "") + '" data-bili="home">' + esc(T("bili.tab.home")) + '</span><span class="' + (tab === "hist" ? "on" : "") + '" data-bili="hist">' + esc(T("bili.tab.hist")) + "</span></div>";
    }
    function biliHtml(v) {
        var B = DB.BILI;
        if (v.view === "video") {
            var vd = B.videos[v.video];
            return '<div class="bl-root">' + biliBar("") +
                '<div class="bl-player"><img src="' + vd.cover + '" alt=""><div class="bl-err">' + esc(T("bili.err")) + "</div></div>" +
                '<div class="bl-title">' + esc(T(vd.titleRef)) + '</div><div class="bl-meta">UP：' + esc(T(vd.upRef)) + " · " + esc(T(vd.metaRef)) + "</div>" +
                '<div class="bl-comments"><h4>' + esc(T("bili.comments")) + "</h4>" +
                vd.comments.map(function (c) {
                    return '<div class="bl-c' + (c.me ? " me" : "") + '"><b>' + esc(T(c.whoRef)) + "</b><p>" + esc(T(c.textRef)) + "</p>" + (c.timeRef ? "<em>" + esc(T(c.timeRef)) + "</em>" : "") + "</div>";
                }).join("") + "</div></div>";
        }
        var list = B.history.map(function (h, i) {
            return '<div class="bl-row" data-bili-video="' + (h.video || "") + '"><img src="' + h.cover + '" alt=""><div><div class="bl-r-title">' + esc(T(h.titleRef)) + "</div>" +
                '<div class="bl-r-meta">UP：' + esc(T(h.upRef)) + (h.progRef ? " · " + esc(T(h.progRef)) : "") + " · " + esc(T(h.whenRef)) + "</div></div></div>";
        }).join("");
        return '<div class="bl-root">' + biliBar(v.view) + '<div class="bl-list">' + list + "</div></div>";
    }

    function renderBookmarks() {
        var bar = $("#br-bookmarks");
        bar.innerHTML = dev().bookmarks.map(function (b) {
            return '<span class="bm" data-page="' + b.page + '" data-hint="bm:' + b.page + '"><i class="bm-ico">' + esc(T(b.labelRef).charAt(0)) + "</i>" + esc(T(b.labelRef)) + "</span>";
        }).join("") + '<span class="bm" data-go="hist"><i class="bm-ico g">⟲</i>' + esc(T("browser.hist.title")) + "</span>";
        bar.querySelectorAll("[data-page]").forEach(function (el) { el.addEventListener("click", function () { openPage(el.dataset.page); }); });
        bar.querySelector("[data-go]").addEventListener("click", function () { navigate({ type: "hist" }); });
    }

    function render() {
        var v = top();
        var view = $("#br-view");
        if (!view) return;
        renderBookmarks();
        if (v.type === "start") view.innerHTML = startHtml();
        else if (v.type === "news") view.innerHTML = newsHtml();
        else if (v.type === "article") view.innerHTML = articleHtml(v);
        else if (v.type === "hist") view.innerHTML = histHtml();
        else if (v.type === "error") view.innerHTML = errorHtml(v.host);
        else if (v.type === "site") view.innerHTML = siteHtml();
        else if (v.type === "bili") view.innerHTML = biliHtml(v);
        view.scrollTop = 0;
        $("#br-address input").value = addressOf(v);
        $("#browser-title").textContent = titleOf(v) + " - " + T("app.browser.title");
        $("#br-back").classList.toggle("enabled", stack.length > 1);

        view.querySelectorAll("[data-page]").forEach(function (el) { el.addEventListener("click", function () { openPage(el.dataset.page); }); });
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
                    FX.sound("windowsError.mp3");
                    sysDialog(T("ui.dlg.locked.title"), T("ui.dlg.locked.body"), [{ label: T("ui.ok"), primary: true }]);
                    return;
                }
                if (h.open && h.open.page) openPage(h.open.page);
                else if (h.open && h.open.bili) openVideo(h.open.bili);
                else navigate({ type: "article", title: T(h.titleRef), site: h.url, body: T("browser.snapshot"), url: h.url });
                if (h.sets) STATE.set(h.sets);
                STATE.emit("view-hist:" + h.id);
            });
        });
        view.querySelectorAll("[data-bili]").forEach(function (el) { el.addEventListener("click", function () { navigate({ type: "bili", view: el.dataset.bili }); }); });
        view.querySelectorAll("[data-bili-video]").forEach(function (el) {
            el.addEventListener("click", function () { if (el.dataset.biliVideo) openVideo(el.dataset.biliVideo); });
        });
        var dl = $("#st-dl");
        if (dl) dl.addEventListener("click", function () { sysDialog(T("site.dl.dlg.title"), T("site.dl.dlg.body"), [{ label: T("ui.ok"), primary: true }]); });
        NOTIFY.hints();
    }

    function navigate(v) { stack.push(v); render(); }
    function goBack() { if (stack.length > 1) { stack.pop(); render(); } }
    function openPage(id) {
        var pg = pageById(id);
        if (!pg) return;
        if (pg.kind === "news") navigate({ type: "news" });
        else if (pg.kind === "site") navigate({ type: "site" });
        else if (pg.kind === "bili") navigate({ type: "bili", view: "home" });
        if (pg.sets) STATE.set(pg.sets);
        STATE.emit("open-page:" + id);
    }
    function openVideo(id) {
        navigate({ type: "bili", view: "video", video: id });
        FX.sound("zilizili-error.mp3", 0.5);
        STATE.emit("bili-video:" + id);
    }

    window.BROWSER = {
        openPage: openPage,
        address: function (input) {
            var q = (input || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
            if (!q) return;
            var hit = DB.PAGES.filter(function (p) { return p.url === q; })[0];
            if (hit) openPage(hit.id); else navigate({ type: "error", host: q });
        }
    };

    document.addEventListener("DOMContentLoaded", function () {
        render();
        $("#br-back").addEventListener("click", goBack);
        $("#br-refresh").addEventListener("click", render);
        $("#br-address input").addEventListener("keydown", function (e) { if (e.key === "Enter") BROWSER.address(e.target.value); });
    });
    STATE.on(render);
    document.addEventListener("source-change", function () { stack = [{ type: "start" }]; render(); });
})();
