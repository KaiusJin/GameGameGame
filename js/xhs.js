/* 小红书窗口应用：数据全部来自 data.js（window.DB），
   壳在 pc.html 的 #win-xhs 里，这里负责渲染信息流 / 详情弹层 / 主页覆盖层。
   存档：localStorage xy_state（点赞/关注/收藏/我的评论），用户名 xy_name。 */
(function () {
    var DB = window.DB;
    var USERS = DB.USERS, POSTS = DB.POSTS;
    var root = null;

    /* ---------------- 工具 ---------------- */
    function $(sel, r) { return (r || document).querySelector(sel); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function fmtNum(n) {
        if (typeof n === "string") return n;
        return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "万" : String(n);
    }
    function hashHue(str) {
        var h = 0;
        for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
        return h;
    }
    function avatarHtml(uid, name, clickable) {
        var u = uid ? USERS[uid] : null;
        var display = u ? u.name : name;
        var onclick = clickable === false ? "" :
            (u ? ' onclick="event.stopPropagation();XHS.openProfile(\'' + uid + '\')"'
               : ' onclick="event.stopPropagation();XHS.ghost()"');
        if (u && u.avatar) {
            return '<span class="xhs-avatar"' + onclick + '><img src="' + u.avatar + '" alt=""></span>';
        }
        var ch = display ? display.trim().charAt(0).toUpperCase() : "?";
        return '<span class="xhs-avatar" style="background:hsl(' + hashHue(display || "?") + ',32%,62%)"' + onclick + ">" + esc(ch) + "</span>";
    }

    var ICONS = {
        heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21S4.5 16.3 2.2 12A5.8 5.8 0 0 1 12 6a5.8 5.8 0 0 1 9.8 6C19.5 16.3 12 21 12 21z"/></svg>',
        heartS: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21S4.5 16.3 2.2 12A5.8 5.8 0 0 1 12 6a5.8 5.8 0 0 1 9.8 6C19.5 16.3 12 21 12 21z"/></svg>',
        star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.2L12 17.1 6.6 20l1-6.2L3.2 9.5l6.1-.9z"/></svg>',
        share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-7-7-4z"/></svg>',
        back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
    };

    /* ---------------- 存档 ---------------- */
    var nickname = localStorage.getItem("xy_name") || "用户";
    var state = { likes: {}, collects: {}, follows: {}, myComments: {} };
    try {
        var saved = JSON.parse(localStorage.getItem("xy_state") || "{}");
        Object.keys(saved).forEach(function (k) { state[k] = saved[k]; });
    } catch (e) {}
    function save() { localStorage.setItem("xy_state", JSON.stringify(state)); }

    /* ---------------- 覆盖层栈 ---------------- */
    var stack = [];
    function pushView(cls, html) {
        var el = document.createElement("div");
        el.className = cls;
        el.innerHTML = html;
        el.style.zIndex = 60 + stack.length;   /* 后开的覆盖层永远在上面 */
        root.appendChild(el);
        stack.push(el);
        return el;
    }
    function back() {
        var el = stack.pop();
        if (el) el.remove();
    }

    var toastTimer = null;
    function toast(msg) {
        var old = $(".xhs-toast", root);
        if (old) old.remove();
        var t = document.createElement("div");
        t.className = "xhs-toast";
        t.textContent = msg;
        root.appendChild(t);
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.remove(); }, 1800);
    }
    function dialog(title, rows) {
        var mask = document.createElement("div");
        mask.className = "xhs-mask";
        mask.innerHTML =
            '<div class="xhs-dialog">' +
            (title ? '<div class="dg-title">' + title + "</div>" : "") +
            rows.map(function (r, i) { return '<div class="dg-row" data-i="' + i + '">' + r.label + "</div>"; }).join("") +
            '<div class="dg-row dg-cancel">取消</div></div>';
        mask.onclick = function (e) {
            if (e.target === mask || e.target.classList.contains("dg-cancel")) { mask.remove(); return; }
            var row = e.target.closest(".dg-row");
            if (row && row.dataset.i != null) { mask.remove(); rows[+row.dataset.i].fn(); }
        };
        root.appendChild(mask);
    }

    /* ---------------- 信息流 ---------------- */
    var curTab = "discover";
    function feedIds(tab) {
        if (tab === "discover") return DB.FEED_DISCOVER;
        if (tab === "school") return DB.FEED_SCHOOL;
        var ids = [];
        Object.keys(POSTS).forEach(function (pid) {
            if (state.follows[POSTS[pid].uid]) ids.push(pid);
        });
        ids.sort(function (a, b) { return POSTS[a].time < POSTS[b].time ? 1 : -1; });
        return ids;
    }
    function cardHtml(pid) {
        var p = POSTS[pid], u = USERS[p.uid];
        var likes = (typeof p.likes === "number" ? p.likes : 0) + (state.likes[pid] ? 1 : 0);
        return (
            '<div class="xhs-card" onclick="XHS.openPost(\'' + pid + "')\">" +
            '<img class="cover" src="' + p.cover + '" alt="" loading="lazy">' +
            '<div class="cbody">' +
            '<div class="ctitle">' + (p.school ? '<span class="badge-school">同校</span>' : "") + (p.title ? esc(p.title) : "") + "</div>" +
            '<div class="cmeta">' +
            avatarHtml(p.uid, u.name, false) +
            '<span class="cauthor">' + esc(u.name) + "</span>" +
            '<span class="clikes">' + ICONS.heartS + fmtNum(likes) + "</span>" +
            "</div></div></div>"
        );
    }
    /* 顺序按列轮流分配：保证寻人帖必须刷一会儿才出现 */
    function gridHtml(ids, cols) {
        var colArr = [];
        for (var i = 0; i < cols; i++) colArr.push([]);
        ids.forEach(function (id, i) { colArr[i % cols].push(cardHtml(id)); });
        return '<div class="xhs-grid">' +
            colArr.map(function (c) { return '<div class="xhs-col">' + c.join("") + "</div>"; }).join("") +
            "</div>";
    }
    function feedCols() {
        if (document.documentElement.classList.contains("mm-narrow")) return 2;
        if (window.XY_IS_MOBILE) return 3;
        return 4;
    }
    function renderFeed() {
        var ids = feedIds(curTab);
        var wrap = $("#xhs-feed-wrap");
        if (!ids.length) {
            wrap.innerHTML =
                '<div class="xhs-empty">' +
                (Object.keys(state.follows).length ? "关注的人最近没有更新" : "你还没有关注任何人<br>去发现页逛逛吧") +
                "</div>";
            return;
        }
        wrap.innerHTML = gridHtml(ids, feedCols());
    }
    function switchTab(tab) {
        curTab = tab;
        document.querySelectorAll(".xhs-tab").forEach(function (t) {
            t.classList.toggle("active", t.dataset.tab === tab);
        });
        renderFeed();
        $("#xhs-feed-wrap").scrollTop = 0;
    }

    /* ---------------- 评论 ---------------- */
    function commentHtml(c, postUid, isReply) {
        var uid = c.u || null;
        var name = uid ? USERS[uid].name : c.name;
        var authorTag = uid === postUid ? ' <span class="tag-author">作者</span>' : "";
        var replies = (c.replies || []).map(function (r) { return commentHtml(r, postUid, true); }).join("");
        return (
            '<div class="cmt-item">' +
            avatarHtml(uid, name) +
            '<div class="cmt-main">' +
            '<div class="cmt-user">' + esc(name) + authorTag + "</div>" +
            '<div class="cmt-text">' + esc(c.text) + "</div>" +
            '<div class="cmt-time">' + esc(c.time || "") + "</div>" +
            (replies ? '<div class="cmt-replies">' + replies + "</div>" : "") +
            "</div>" +
            '<div class="cmt-like" onclick="XHS.likeCmt(this)">' + ICONS.heart +
            "<span>" + (c.likes ? fmtNum(c.likes) : "") + "</span></div>" +
            "</div>"
        );
    }
    function countComments(list) {
        var n = 0;
        (list || []).forEach(function (c) { n += 1 + (c.replies ? c.replies.length : 0); });
        return n;
    }
    function commentsSectionHtml(pid) {
        var p = POSTS[pid];
        if (p.commentsClosed) {
            return '<div class="xm-cmts"><div class="cmt-closed">作者已关闭评论区</div></div>';
        }
        var mine = (state.myComments[pid] || []).map(function (c) {
            return commentHtml({ name: nickname, text: c.text, time: c.time, likes: 0 }, p.uid);
        }).join("");
        var total = countComments(p.comments) + (state.myComments[pid] || []).length;
        return (
            '<div class="xm-cmts">' +
            '<div class="cmt-count">共 ' + total + " 条评论</div>" +
            (p.comments || []).map(function (c) { return commentHtml(c, p.uid); }).join("") +
            mine +
            "</div>"
        );
    }

    /* ---------------- 帖子详情 ---------------- */
    function openPost(pid) {
        var p = POSTS[pid], u = USERS[p.uid];
        var liked = !!state.likes[pid], collected = !!state.collects[pid];
        var likes = (typeof p.likes === "number" ? p.likes : 0) + (liked ? 1 : 0);
        var followed = !!state.follows[p.uid];

        var special = "";
        if (pid === "m1") {
            special =
                '<div class="reco-banner blue">系统推荐：TA 寻找的人和你来自同一所学校 · 滑铁卢大学</div>' +
                '<div class="reco-banner share-banner" onclick="XHS.share(\'m1\')"><span><b>' + esc(nickname) + "</b>，你也可以帮忙转发</span><span>→</span></div>";
        }

        var el = pushView("xhs-modal",
            '<div class="xhs-modal-inner">' +
            '<div class="xm-left"><img src="' + p.cover + '" alt=""></div>' +
            '<div class="xm-right">' +
            '<div class="xm-authorbar">' +
            avatarHtml(p.uid, u.name) +
            '<div class="a-name" onclick="XHS.openProfile(\'' + p.uid + '\')">' + esc(u.name) +
            "<small>" + fmtNum(p.views || "0") + "次浏览</small></div>" +
            '<button class="btn-follow' + (followed ? " on" : "") + '" data-uid="' + p.uid + '" onclick="XHS.follow(\'' + p.uid + "',this)\">" + (followed ? "已关注" : "关注") + "</button>" +
            '<div class="xm-close" onclick="XHS.back()">✕</div>' +
            "</div>" +
            '<div class="xm-scroll">' +
            (p.title ? '<div class="xm-title">' + esc(p.title) + "</div>" : "") +
            (p.body ? '<div class="xm-body">' + esc(p.body) + "</div>" : "") +
            special +
            '<div class="xm-meta">' + esc(p.time) + (p.ip ? " · IP属地" + esc(p.ip) : "") + "</div>" +
            '<div id="cmt-holder">' + commentsSectionHtml(pid) + "</div>" +
            "</div>" +
            '<div class="xm-actionbar">' +
            '<input class="cmt-input" placeholder="说点什么…" onkeydown="XHS.cmtKey(event,\'' + pid + "')\">" +
            '<div class="act' + (liked ? " on" : "") + '" onclick="XHS.like(\'' + pid + "',this)\">" + ICONS.heart + '<span>' + fmtNum(likes) + "</span></div>" +
            '<div class="act' + (collected ? " on-star" : "") + '" onclick="XHS.collect(\'' + pid + "',this)\">" + ICONS.star + "<span>" + fmtNum(p.collects || 0) + "</span></div>" +
            '<div class="act" onclick="XHS.share(\'' + pid + "')\">" + ICONS.share + "</div>" +
            "</div>" +
            "</div></div>"
        );
        /* 点弹层外部关闭 */
        el.addEventListener("click", function (e) { if (e.target === el) back(); });
    }

    /* ---------------- 个人主页 ---------------- */
    function openProfile(uid) {
        var u = USERS[uid];
        var followed = !!state.follows[uid];
        var posts = (u.posts || []).length ? gridHtml(u.posts, Math.max(feedCols() - 1, 2)) : "";
        pushView("xhs-view",
            '<div class="pf-head">' +
            '<div class="pf-topline"><div class="btn-back" onclick="XHS.back()">' + ICONS.back + "</div></div>" +
            '<div class="pf-main">' +
            avatarHtml(uid, u.name, false) +
            "<div>" +
            '<div class="pf-name">' + esc(u.name) + "</div>" +
            '<div class="pf-uid">' + esc(u.uid) + "</div>" +
            "</div></div>" +
            (u.bio ? '<div class="pf-bio">' + esc(u.bio) + "</div>" : "") +
            (u.extra ? '<div class="pf-extra">' + esc(u.extra) + "</div>" : "") +
            '<div class="pf-stats">' +
            '<div class="pf-stat" onclick="XHS.openFollowList(\'' + uid + '\')"><b>' + (u.following || []).length + "</b><span>关注</span></div>" +
            '<div class="pf-stat"><b>' + fmtNum(u.followers || 0) + "</b><span>粉丝</span></div>" +
            '<div class="pf-stat"><b>' + fmtNum(u.likes || 0) + "</b><span>获赞与收藏</span></div>" +
            '<button class="btn-follow' + (followed ? " on" : "") + '" data-uid="' + uid + '" onclick="XHS.follow(\'' + uid + "',this)\">" + (followed ? "已关注" : "+ 关注") + "</button>" +
            "</div>" +
            "</div>" +
            '<div class="pf-tabs"><span class="on">笔记 ' + (u.posts || []).length + "</span><span>收藏</span><span>赞过</span></div>" +
            '<div class="pf-feed">' +
            (posts || '<div class="pf-empty">TA 还没有发布任何内容</div>') +
            "</div>"
        );
    }
    function openFollowList(uid) {
        var u = USERS[uid];
        var rows = (u.following || []).map(function (fid) {
            var f = USERS[fid];
            return (
                '<div class="uitem" onclick="XHS.openProfile(\'' + fid + "')\">" +
                avatarHtml(fid, f.name, false) +
                "<div><div class='uitem-name'>" + esc(f.name) + "</div>" +
                "<div class='uitem-sub'>" + esc((f.bio || "").split("\n")[0]) + "</div></div>" +
                "</div>"
            );
        }).join("");
        pushView("xhs-view",
            '<div class="plain-topbar">' +
            '<div class="btn-back" onclick="XHS.back()">' + ICONS.back + "</div>" +
            '<div class="plain-title">' + esc(u.name) + " 关注的人（" + (u.following || []).length + "）</div>" +
            "</div>" +
            '<div class="ulist">' + (rows || '<div class="pf-empty">没有关注任何人</div>') + "</div>"
        );
    }

    /* ---------------- 交互 ---------------- */
    var XHS = {
        back: back,
        openPost: openPost,
        openProfile: openProfile,
        openFollowList: openFollowList,

        ghost: function () { toast("TA 还没有发布任何内容"); },
        todo: function () { toast("该功能暂未开放"); },

        like: function (pid, el) {
            state.likes[pid] = !state.likes[pid];
            save();
            el.classList.toggle("on", !!state.likes[pid]);
            var base = typeof POSTS[pid].likes === "number" ? POSTS[pid].likes : 0;
            el.querySelector("span").textContent = fmtNum(base + (state.likes[pid] ? 1 : 0));
        },
        collect: function (pid, el) {
            state.collects[pid] = !state.collects[pid];
            save();
            el.classList.toggle("on-star", !!state.collects[pid]);
            toast(state.collects[pid] ? "已收藏" : "已取消收藏");
        },
        likeCmt: function (el) { el.classList.toggle("on"); },
        follow: function (uid, el) {
            state.follows[uid] = !state.follows[uid];
            save();
            var on = !!state.follows[uid];
            document.querySelectorAll('.btn-follow[data-uid="' + uid + '"]').forEach(function (b) {
                b.classList.toggle("on", on);
                b.textContent = on ? "已关注" : "关注";
            });
            if (on) toast("关注成功");
            if (curTab === "follow") renderFeed();
        },
        cmtKey: function (e, pid) {
            if (e.key !== "Enter") return;
            var input = e.target;
            var text = input.value.trim();
            if (!text) return;
            if (POSTS[pid].commentsClosed) { toast("作者已关闭评论区"); input.value = ""; return; }
            (state.myComments[pid] = state.myComments[pid] || []).push({ text: text, time: "刚刚" });
            save();
            input.value = "";
            var holder = $("#cmt-holder", stack[stack.length - 1]);
            if (holder) holder.innerHTML = commentsSectionHtml(pid);
            toast("评论成功");
        },
        share: function (pid) {
            var isM1 = pid === "m1";
            dialog(
                isM1 ? esc(nickname) + "，转发可以让更多人看到" : "分享到",
                [
                    { label: "转发到我的动态", fn: function () { toast(isM1 ? "已转发 · 感谢你的帮助" : "已转发到你的动态"); } },
                    { label: "转发给朋友", fn: function () { toast("已发送"); } },
                    { label: "复制链接", fn: function () { toast("链接已复制"); } }
                ]
            );
        }
    };
    window.XHS = XHS;

    /* ---------------- 初始化 ---------------- */
    document.addEventListener("DOMContentLoaded", function () {
        root = $("#xhs-root");

        $("#xhs-me").innerHTML = avatarHtml(null, nickname, false) + "<span>" + esc(nickname) + "</span>";
        $("#xhs-search").addEventListener("click", XHS.todo);
        document.querySelectorAll(".xhs-tab").forEach(function (t) {
            t.addEventListener("click", function () { switchTab(t.dataset.tab); });
        });

        renderFeed();
        window.addEventListener("resize", function () {
            clearTimeout(window.__xhsRl);
            window.__xhsRl = setTimeout(renderFeed, 200);
        });
    });
})();
