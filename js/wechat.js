/* 微信窗口（她还登录着）：会话列表 / 聊天记录 / 通话记录（★锚点线索）
   数据全部来自 DB.WECHAT，本文件只渲染。 */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    var W = DB.WECHAT;
    var meAva = DB.BILIBLIL.user.avatar;
    var listEl, headEl, bodyEl, footEl;
    var current = null;
    var readSet = {};        /* 本次会话里点开过的（未读角标就地消掉） */

    var ICONS = {
        pdf: "image/file.png", doc: "image/file.png", img: "image/file.png",
        exe: "image/exe.png"
    };

    /* ---------------- 会话列表 ---------------- */
    function renderList() {
        var html =
            '<div class="wc-search">' +
            '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>' +
            "搜索</div>";
        W.chats.forEach(function (c) {
            var unread = !readSet[c.id] && c.unread ? c.unread : 0;
            html +=
                '<div class="wc-item' + (current === c.id ? " on" : "") + '" data-chat="' + c.id + '">' +
                '<div class="i-ava"><img src="' + c.avatar + '" alt=""></div>' +
                (unread ? '<span class="i-badge">' + (unread > 99 ? "99+" : unread) + "</span>" : "") +
                '<div class="i-main">' +
                '<div class="i-name"><span>' + esc(c.name) + "</span></div>" +
                '<div class="i-prev">' +
                (c.muted ? '<svg class="i-muted" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 5L8 9H4v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg>' : "") +
                esc(c.preview) + "</div></div></div>";
        });
        listEl.innerHTML = html;
        listEl.querySelectorAll(".wc-item").forEach(function (item) {
            item.addEventListener("click", function () { select(item.dataset.chat); });
        });
    }

    /* ---------------- 聊天面板 ---------------- */
    function msgHtml(c, m) {
        if (m.sys) return '<div class="wc-sys">' + esc(m.sys) + "</div>";
        var side = m.from === "me" ? "me" : "them";
        var ava = side === "me" ? meAva : c.avatar;
        var inner;
        if (m.file) {
            inner =
                '<div class="wcm-file" data-doc="' + (m.file.doc || "") + '" data-fname="' + esc(m.file.name) + '">' +
                '<div class="f-top"><img src="' + (ICONS[(m.file.name.split(".").pop() || "").toLowerCase()] || "image/file.png") + '" alt="">' +
                '<div><div class="f-name">' + esc(m.file.name) + "</div>" +
                '<div class="f-size">' + esc(m.file.size) + "</div></div></div>" +
                '<div class="f-foot">微信电脑版</div></div>';
        } else if (m.img) {
            inner = '<div class="wcm-img">' + esc(m.img) + "</div>";
        } else if (m.call) {
            inner =
                '<div class="wcm-call' + (m.call.missed ? " missed" : "") + '">' +
                '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>' +
                esc(m.call.label || "") + "</div>";
        } else {
            inner = '<div class="wcm-bubble">' + esc(m.text) + "</div>";
        }
        return (
            (m.day ? '<div class="wc-day">' + esc(m.day) + "</div>" : "") +
            '<div class="wcm-row ' + side + '">' +
            '<div class="wcm-ava"><img src="' + ava + '" alt=""></div>' +
            '<div class="wcm-col">' +
            (m.who ? '<span class="wcm-who">' + esc(m.who) + "</span>" : "") +
            inner + "</div></div>"
        );
    }

    function select(id) {
        current = id;
        readSet[id] = true;
        var c = null;
        W.chats.forEach(function (x) { if (x.id === id) c = x; });
        if (!c) return;
        setNav("chat");
        headEl.textContent = c.name;
        var html = "";
        c.messages.forEach(function (m) {
            /* day 单独渲染 */
            if (m.day && m.sys) {
                html += '<div class="wc-day">' + esc(m.day) + "</div>" + '<div class="wc-sys">' + esc(m.sys) + "</div>";
            } else {
                html += msgHtml(c, m);
            }
        });
        bodyEl.innerHTML = html;
        footEl.hidden = false;
        bodyEl.scrollTop = bodyEl.scrollHeight;
        renderList();

        /* 文件点击 → 查看器 / exe 弹窗 */
        bodyEl.querySelectorAll(".wcm-file").forEach(function (f) {
            f.addEventListener("click", function () {
                var doc = f.dataset.doc;
                if (doc) window.VIEWER.open(doc);
                else window.sysDialog("系统", "无法在远程会话中运行安装程序。", [{ label: "确定", primary: true }]);
            });
        });

        if (id === "cop") CLUE.found("cop-chat");
    }

    /* ---------------- 通话记录（★锚点） ---------------- */
    function pad(n) { return ("0" + n).slice(-2); }
    function durStr(mins, salt) {
        var s = (salt * 17) % 60;
        var h = Math.floor(mins / 60);
        var m = mins % 60;
        return (h ? h + ":" + pad(m) : String(m)) + ":" + pad(s);
    }
    function buildCalls() {
        var rows = [];
        /* 8/29 凌晨：她打给王警官（在 17 个未接之后） */
        rows.push({
            name: DB.WECHAT.callsExtra[1].name, out: true,
            sub: "8月29日 03:14 · 呼出 · 语音通话", dur: DB.WECHAT.callsExtra[1].dur
        });
        /* 妈妈的 17 个未接（倒序） */
        var times = [
            ["8月29日", "03:12"], ["8月29日", "02:58"], ["8月29日", "02:43"], ["8月29日", "02:25"],
            ["8月29日", "02:07"], ["8月29日", "01:48"], ["8月29日", "01:29"], ["8月29日", "01:10"],
            ["8月29日", "00:52"], ["8月29日", "00:34"], ["8月29日", "00:16"], ["8月28日", "23:58"],
            ["8月28日", "23:41"], ["8月28日", "23:20"], ["8月28日", "23:05"], ["8月28日", "22:47"],
            ["8月28日", "22:31"]
        ];
        times.forEach(function (t) {
            rows.push({ name: "妈妈", missed: true, sub: t[0] + " " + t[1] + " · 未接语音通话", dur: "" });
        });
        /* 每晚 20:00 的"汇报"视频通话（7/21–8/27，时长逐周变长），倒序 */
        var d = DB.WECHAT.callsDaily;
        var days = [];
        for (var day = 21; day <= 31; day++) days.push("7月" + day + "日");
        for (day = 1; day <= 27; day++) days.push("8月" + day + "日");
        var n = days.length;
        for (var i = n - 1; i >= 0; i--) {
            var mins = Math.round(d.durFrom + (d.durTo - d.durFrom) * (i / (n - 1)));
            rows.push({
                name: d.name, video: true,
                sub: days[i] + " " + d.hour + " · 视频通话", dur: durStr(mins, i)
            });
        }
        return rows;
    }
    function renderCalls() {
        current = null;
        setNav("calls");
        headEl.textContent = "通话记录";
        var html = '<div class="wc-calls">';
        buildCalls().forEach(function (r) {
            html +=
                '<div class="wc-call-row' + (r.missed ? " missed" : "") + '">' +
                (r.video
                    ? '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l7-4v12l-7-4z"/></svg>'
                    : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>') +
                '<div class="cr-main"><div class="cr-name">' +
                (r.out ? "↗ " : "") + esc(r.name) + "</div>" +
                '<div class="cr-sub">' + esc(r.sub) + "</div></div>" +
                '<span class="cr-dur">' + esc(r.dur) + "</span></div>";
        });
        html += "</div>";
        bodyEl.innerHTML = html;
        footEl.hidden = true;
        bodyEl.scrollTop = 0;
        renderList();
        CLUE.found("call-log");
    }

    function setNav(mode) {
        $("#wc-nav-chat").classList.toggle("active", mode === "chat");
        $("#wc-nav-calls").classList.toggle("active", mode === "calls");
    }

    /* ---------------- 初始化 ---------------- */
    document.addEventListener("DOMContentLoaded", function () {
        listEl = $("#wc-list");
        headEl = $("#wc-panel-head");
        bodyEl = $("#wc-panel-body");
        footEl = $("#wc-panel-foot");
        $("#wc-my-ava").innerHTML = '<img src="' + meAva + '" alt="">';
        renderList();
        $("#wc-nav-chat").addEventListener("click", function () {
            if (current) select(current);
            else {
                setNav("chat");
                headEl.textContent = "微信";
                bodyEl.innerHTML =
                    '<div class="wc-blank"><svg viewBox="0 0 48 48" width="72" height="72" opacity=".14"><rect x="3" y="3" width="42" height="42" rx="10" fill="#8a8a8a"/></svg></div>';
                footEl.hidden = true;
            }
        });
        $("#wc-nav-calls").addEventListener("click", renderCalls);
    });
})();
