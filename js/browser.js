/* Chrome 窗口（学 ningning js/pc/google.js）：视图栈。
   视图：google 首页（带"最近的搜索"= search-history 线索）/ 结果页 / 假网页 / 错误页
         biliblil 首页 / 历史记录（video-last 线索）/ 播放页
   搜索库与假网页在 DB.SEARCH_DB / DB.PAGES，这里只渲染。 */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    var G_LOGO =
        '<i class="g-blue">G</i><i class="g-red">o</i><i class="g-yellow">o</i>' +
        '<i class="g-blue">g</i><i class="g-green">l</i><i class="g-red">e</i>';

    var FAVICON = {
        shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z"/></svg>',
        news: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f29900" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>',
        gov: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d0121b" stroke-width="2"><path d="M12 3L3 8h18L12 3zM5 8v9M9.5 8v9M14.5 8v9M19 8v9M3 20h18"/></svg>'
    };

    var SEARCH_DB = DB.SEARCH_DB;
    var PAGES = DB.PAGES;
    var BLB = DB.BILIBLIL;

    /* ---------------- 视图栈 ---------------- */
    var stack = [];
    /* 视图：{type:'home'} {type:'results',q} {type:'page',id} {type:'error',host}
             {type:'blb', view:'home'|'hist'} {type:'blbv', item} */

    function addressOf(v) {
        if (v.type === "home") return "www.google.com";
        if (v.type === "results") return "google.com/search?q=" + v.q;
        if (v.type === "page") return PAGES[v.id].url;
        if (v.type === "error") return v.host;
        if (v.type === "blb") return v.view === "hist" ? "www.biliblil.com/history" : "www.biliblil.com";
        if (v.type === "blbv") return "www.biliblil.com/video/BV1xy" + (100 + (v.item.title.length * 7) % 900);
        return "";
    }
    function titleOf(v) {
        if (v.type === "home") return "新标签页";
        if (v.type === "results") return v.q + " - Google 搜索";
        if (v.type === "page") return PAGES[v.id].tab;
        if (v.type === "error") return v.host;
        if (v.type === "blb") return v.view === "hist" ? "历史记录 - biliblil" : "biliblil (゜-゜)つロ";
        if (v.type === "blbv") return v.item.title + " - biliblil";
        return "";
    }

    /* 线索只在窗口真正打开着的时候算数（页面加载时的预渲染不算） */
    var winOpened = false;
    function markClues(v) {
        if (!winOpened) return;
        if (v.type === "home") CLUE.found("search-history");
        if (v.type === "blb" && v.view === "hist") CLUE.found("video-last");
    }

    function render() {
        var v = stack[stack.length - 1];
        var view = $("#br-view");
        if (v.type === "home") view.innerHTML = homeHtml();
        else if (v.type === "results") view.innerHTML = resultsHtml(v.q);
        else if (v.type === "page") view.innerHTML = '<div class="br-page">' + PAGES[v.id].html + "</div>";
        else if (v.type === "error") view.innerHTML = errorHtml(v.host);
        else if (v.type === "blb") view.innerHTML = blbHtml(v.view);
        else if (v.type === "blbv") view.innerHTML = blbVideoHtml(v.item);
        markClues(v);
        view.scrollTop = 0;

        $("#br-address-text").textContent = addressOf(v);
        $("#browser-title").textContent = titleOf(v) + " - Google Chrome";
        $("#br-back").classList.toggle("enabled", stack.length > 1);
    }
    function navigate(v) { stack.push(v); render(); }
    function goBack() {
        if (stack.length > 1) { stack.pop(); render(); }
    }

    /* ---------------- Google 视图 ---------------- */
    function searchboxHtml(val) {
        return (
            '<div class="br-searchbox" onclick="document.getElementById(\'br-input\').focus()">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
            '<input id="br-input" autocomplete="off" spellcheck="false" value="' + esc(val || "") + '" ' +
            'onkeydown="if(event.key===\'Enter\')BROWSER.search(this.value)">' +
            "</div>"
        );
    }
    function homeHtml() {
        var recent = DB.RECENT_SEARCHES.map(function (r, i) {
            return (
                '<div class="br-recent-row" onclick="BROWSER.search(\'' + esc(r.q) + '\')">' +
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>' +
                "<span>" + esc(r.q) + "</span><em>" + esc(r.when) + "</em></div>"
            );
        }).join("");
        return (
            '<div class="br-home">' +
            '<div class="g-logo">' + G_LOGO + "</div>" +
            searchboxHtml("") +
            '<div class="br-home-btns">' +
            '<button onclick="BROWSER.search(document.getElementById(\'br-input\').value)">Google 搜索</button>' +
            '<button onclick="BROWSER.search(document.getElementById(\'br-input\').value)">手气不错</button>' +
            "</div>" +
            '<div class="br-recent"><h4>最近的搜索</h4>' + recent + "</div>" +
            "</div>"
        );
    }
    function findResults(q) {
        var ql = q.toLowerCase();
        for (var i = 0; i < SEARCH_DB.length; i++) {
            var entry = SEARCH_DB[i];
            for (var j = 0; j < entry.matched.length; j++) {
                var m = entry.matched[j].toLowerCase();
                if (ql === m || ql.indexOf(m) >= 0) return entry.results;
            }
        }
        return null;
    }
    function resultsHtml(q) {
        var results = findResults(q);
        var body;
        if (results) {
            body = '<div class="br-stat">找到约 ' + (results.length * 1370) + " 条结果 （用时 0.4" + (q.length % 10) + " 秒）</div>" +
                results.map(function (r, i) {
                    return (
                        '<div class="br-result">' +
                        '<div class="r-url">' + (FAVICON[r.favicon] || "") + esc(r.displayUrl) + "</div>" +
                        '<div class="r-title" onclick="BROWSER.openResult(\'' + esc(q) + "'," + i + ')">' + esc(r.title) + "</div>" +
                        '<div class="r-desc">' + esc(r.desc) + "</div>" +
                        "</div>"
                    );
                }).join("");
        } else {
            body =
                '<div class="br-noresult">' +
                "<p>找不到和您的搜索字词 <b>" + esc(q) + "</b> 相符的内容或信息。</p>" +
                "<p>建议：</p>" +
                "<ul><li>请检查输入字词有无错别字</li><li>请尝试其他查询词</li><li>请改用较常见的字词</li></ul>" +
                "</div>";
        }
        return (
            '<div class="br-results">' +
            '<div class="br-results-top">' +
            '<div class="g-logo" onclick="BROWSER.home()">' + G_LOGO + "</div>" +
            searchboxHtml(q) +
            "</div>" +
            '<div class="br-results-tabs"><span class="on">全部</span><span>图片</span><span>视频</span><span>新闻</span><span>地图</span></div>' +
            body +
            "</div>"
        );
    }
    function errorHtml(host) {
        return (
            '<div class="br-error">' +
            '<div class="e-icon">⚠</div>' +
            "<h2>无法访问此网站</h2>" +
            "<p><b>" + esc(host) + "</b> 的响应时间过长。</p>" +
            "<p>请检查网络连接，或稍后重试。</p>" +
            '<div class="e-code">ERR_CONNECTION_TIMED_OUT</div>' +
            "</div>"
        );
    }

    /* ---------------- biliblil 视图 ---------------- */
    function blbBarHtml(tab) {
        return (
            '<div class="blb-bar">' +
            '<span class="blb-logo" onclick="BROWSER.blb(\'home\')">biliblil</span>' +
            '<div class="blb-search">搜索视频、番剧、UP主</div>' +
            '<div class="blb-user"><img src="' + BLB.user.avatar + '" alt=""><span>' + esc(BLB.user.name) + " · 已登录</span></div>" +
            "</div>" +
            '<div class="blb-tabs">' +
            '<span class="' + (tab === "home" ? "on" : "") + '" onclick="BROWSER.blb(\'home\')">首页</span>' +
            '<span class="' + (tab === "hist" ? "on" : "") + '" onclick="BROWSER.blb(\'hist\')">历史记录</span>' +
            "</div>"
        );
    }
    function blbHtml(view) {
        var body;
        if (view === "hist") {
            body = '<div class="blb-hist">' + BLB.history.map(function (h, i) {
                var pct = h.progress === "看完" ? 100 : (h.half ? 44 : 30 + (i * 13) % 40);
                return (
                    '<div class="blb-hist-row" onclick="BROWSER.blbVideo(\'hist\',' + i + ')">' +
                    '<div class="h-cover"><img src="' + h.cover + '" alt=""><div class="h-prog"><i style="width:' + pct + '%"></i></div></div>' +
                    '<div class="h-main">' +
                    '<div class="h-title">' + esc(h.title) + "</div>" +
                    '<div class="h-meta">UP：' + esc(h.up) + " · " + esc(h.progress) + "</div>" +
                    '<div class="h-when">' + esc(h.when) + "</div>" +
                    "</div></div>"
                );
            }).join("") + "</div>";
        } else {
            body = '<div class="blb-feed">' + BLB.feed.map(function (f, i) {
                return (
                    '<div class="blb-card" onclick="BROWSER.blbVideo(\'feed\',' + i + ')">' +
                    '<div class="v-cover"><img src="' + f.cover + '" alt=""></div>' +
                    '<div class="v-title">' + esc(f.title) + "</div>" +
                    '<div class="v-meta">' + esc(f.up) + " · " + esc(f.views) + "播放 · " + esc(f.time) + "</div>" +
                    "</div>"
                );
            }).join("") + "</div>";
        }
        return '<div class="blb-root">' + blbBarHtml(view) + body + "</div>";
    }
    function blbVideoHtml(item) {
        return (
            '<div class="blb-root">' + blbBarHtml("") +
            '<div class="blb-player">' +
            '<div class="p-stage"><img src="' + item.cover + '" alt="">' +
            '<div class="p-notice">远程会话带宽不足<br>视频画面已暂停传输</div></div>' +
            '<div class="p-title">' + esc(item.title) + "</div>" +
            '<div class="p-meta">UP：' + esc(item.up) +
            (item.progress ? " · 上次" + esc(item.progress) : "") +
            (item.when ? " · " + esc(item.when) : "") + "</div>" +
            "</div></div>"
        );
    }

    /* ---------------- 对外接口 ---------------- */
    window.BROWSER = {
        search: function (q) {
            q = (q || "").trim();
            if (!q) return;
            navigate({ type: "results", q: q });
        },
        openResult: function (q, i) {
            var r = findResults(q)[i];
            if (!r || !r.open) return;
            if (r.open.type === "page") navigate({ type: "page", id: r.open.id });
            else navigate({ type: "error", host: r.open.host });
        },
        home: function () { navigate({ type: "home" }); },
        blb: function (view) { navigate({ type: "blb", view: view }); },
        blbVideo: function (src, i) {
            var item = src === "hist" ? BLB.history[i] : BLB.feed[i];
            navigate({ type: "blbv", item: item });
        }
    };

    document.addEventListener("DOMContentLoaded", function () {
        stack = [{ type: "home" }];
        render();
        $("#br-back").addEventListener("click", goBack);
        $("#br-refresh").addEventListener("click", render);
        $("#bm-blb").addEventListener("click", function () { BROWSER.blb("home"); });
    });
    document.addEventListener("app-open", function (e) {
        if (e.detail !== "browser") return;
        winOpened = true;
        markClues(stack[stack.length - 1]);
    });
})();
