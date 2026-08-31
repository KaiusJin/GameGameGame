/* Google Chrome 窗口应用（学 ningning js/pc/google.js）：
   视图栈 首页/结果页/文章页/错误页，搜索结果是关键词命中的数据库，
   后续阶段的线索（二手帖、半个用户名……）往 SEARCH_DB 里加条目即可。 */
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
        wiki: '<svg width="14" height="14" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#f8f9fa" stroke="#dadce0"/><text x="5" y="17" fill="#202124" font-size="13" font-weight="bold" font-family="serif">W</text></svg>',
        school: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbc05" stroke-width="2"><path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5"/></svg>',
        map: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34A853" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
    };

    /* ---------------- 搜索结果库 ---------------- */
    var SEARCH_DB = [
        {
            matched: ["滑铁卢大学", "滑铁卢", "university of waterloo", "uwaterloo", "waterloo"],
            results: [
                {
                    title: "滑铁卢大学 - 维基百科，自由的百科全书",
                    displayUrl: "zh.wikipedia.xyz › wiki › 滑铁卢大学",
                    desc: "滑铁卢大学（英语：University of Waterloo）是加拿大安大略省滑铁卢市的一所公立研究型大学，创办于1957年。学校以带薪实习（co-op）项目和计算机科学、数学、工程等学科闻名……",
                    favicon: "wiki",
                    open: { type: "page", id: "wiki-uw" }
                },
                {
                    title: "University of Waterloo | 官方网站",
                    displayUrl: "uwaterloo.xyz",
                    desc: "Discover Waterloo. Home to the world's largest co-operative education program. Admissions, programs, campus life and more.",
                    favicon: "school",
                    open: { type: "error", host: "uwaterloo.xyz" }
                }
            ]
        }
    ];

    /* ---------------- 假网页 ---------------- */
    var PAGES = {
        "wiki-uw": {
            url: "zh.wikipedia.xyz/wiki/滑铁卢大学",
            tab: "滑铁卢大学 - 维基百科",
            html:
                "<h1>滑铁卢大学</h1>" +
                '<div class="p-site">维基百科，自由的百科全书</div>' +
                "<p><b>滑铁卢大学</b>（英语：University of Waterloo，简称 UW）是位于加拿大安大略省滑铁卢市的公立研究型大学，创办于 1957 年。学校以合作教育（co-op）项目著称，拥有全球规模最大的带薪实习体系，学生通常在学期与工作期之间交替进行。</p>" +
                "<p>该校的数学学院与计算机科学专业在北美享有很高声誉，毕业生广泛就职于各大科技公司。校园位于滑铁卢市西北部，冬季漫长，降雪量大，一月平均气温约零下七摄氏度。</p>" +
                '<div class="p-note">本页面为剧情虚构页面，与现实机构无关。</div>'
        }
    };

    /* ---------------- 视图栈 ---------------- */
    var stack = [];   /* 元素：{type:'home'} / {type:'results', q} / {type:'page', id} / {type:'error', host} */

    function addressOf(v) {
        if (v.type === "home") return "www.google.com";
        if (v.type === "results") return "google.com/search?q=" + v.q;
        if (v.type === "page") return PAGES[v.id].url;
        if (v.type === "error") return v.host;
        return "";
    }
    function titleOf(v) {
        if (v.type === "home") return "新标签页";
        if (v.type === "results") return v.q + " - Google 搜索";
        if (v.type === "page") return PAGES[v.id].tab;
        if (v.type === "error") return v.host;
        return "";
    }

    function render() {
        var v = stack[stack.length - 1];
        var view = $("#br-view");
        if (v.type === "home") view.innerHTML = homeHtml();
        else if (v.type === "results") view.innerHTML = resultsHtml(v.q);
        else if (v.type === "page") view.innerHTML = '<div class="br-page">' + PAGES[v.id].html + "</div>";
        else if (v.type === "error") view.innerHTML = errorHtml(v.host);
        view.scrollTop = 0;

        $("#br-address-text").textContent = addressOf(v);
        $("#browser-title").textContent = titleOf(v) + " - Google Chrome";
        $("#br-back").classList.toggle("enabled", stack.length > 1);

        var input = $("#br-input");
        if (input && v.type === "home") setTimeout(function () { input.focus(); }, 60);
    }
    function navigate(v) { stack.push(v); render(); }
    function goBack() {
        if (stack.length > 1) { stack.pop(); render(); }
    }

    /* ---------------- 各视图模板 ---------------- */
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
        return (
            '<div class="br-home">' +
            '<div class="g-logo">' + G_LOGO + "</div>" +
            searchboxHtml("") +
            '<div class="br-home-btns">' +
            '<button onclick="BROWSER.search(document.getElementById(\'br-input\').value)">Google 搜索</button>' +
            '<button onclick="BROWSER.search(document.getElementById(\'br-input\').value)">手气不错</button>' +
            "</div></div>"
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
        home: function () { navigate({ type: "home" }); }
    };

    document.addEventListener("DOMContentLoaded", function () {
        stack = [{ type: "home" }];
        render();
        $("#br-back").addEventListener("click", goBack);
        $("#br-refresh").addEventListener("click", render);
    });
})();
