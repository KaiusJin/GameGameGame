/* =====================================================================
   聊天（微信电脑版壳）：自己的会话（own，可用候选句回话）+ 目标电脑上的微信（只读）。
   数据 = DEVICES[source].chats：
     { id, mode:"own"|"monitor", nameRef, avatar, visible?, sets?, unread?,
       typing?:<cond>                       面板标题显示"对方正在输入…"
       draft?:{ ref, if }                   （只读会话）输入框里留着的草稿
       prefill?:{ ref, if }                 （自己的会话）输入框里被预先写好的话
       messages:[ { day?, from:"me"|"them"|"sys", ref, if?, type?:"img"|"file"|"call", img?, file?, missed? } ]
       choices:[ { id, ref, if?, sets?, emit? } ]   候选回复；点了置 flag（默认 = id），发事件 choice:<id>
     }
   消息用 if 控制出现时机：触发器延时置 flag = "对方回复了"。未读数 = 可见消息数 − 上次打开时的数量。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var current = null, lastCounts = null;

    function dev() { return DB.DEVICES[STATE.source()] || DB.DEVICES.own; }
    function chats() {
        var list = (dev().chats || []).filter(function (c) { return STATE.cond(c.visible); });
        /* 有未读的浮到上面（稳定排序） */
        return list.map(function (c, i) { return { c: c, i: i, u: unreadOf(c) }; })
            .sort(function (a, b) { return (b.u ? 1 : 0) - (a.u ? 1 : 0) || a.i - b.i; })
            .map(function (x) { return x.c; });
    }
    function byId(id) { return (dev().chats || []).filter(function (c) { return c.id === id; })[0] || null; }
    function visibleMsgs(c) { return (c.messages || []).filter(function (m) { return STATE.cond(m.if); }); }
    function unreadOf(c) {
        var n = visibleMsgs(c).length;
        var read = STATE.get("read_" + c.id);
        if (read == null) return Math.min(c.unread || 0, n);
        return Math.max(0, n - read);
    }
    function previewOf(c) {
        var ms = visibleMsgs(c), last = ms[ms.length - 1];
        if (c.previewRef) return T(c.previewRef);
        if (!last) return "";
        if (last.type === "img") return T("chat.prev.img");
        if (last.type === "file") return T("chat.prev.file");
        if (last.type === "call") return T("chat.prev.call");
        return T(last.ref);
    }
    function meAvatar() {
        var d = dev();
        return STATE.source() === "own" ? (DB.CONFIG.meAvatar || "") : (d.desktop.avatar || "");
    }

    /* ---------------- 会话列表 ---------------- */
    function renderList() {
        var listEl = $("#wc-list");
        if (!listEl) return;
        var cs = chats();
        if (!cs.length) { listEl.innerHTML = '<div class="wc-empty">' + esc(T("chat.own.empty")) + "</div>"; return; }
        listEl.innerHTML = cs.map(function (c) {
            var unread = unreadOf(c);
            return (
                '<div class="wc-item' + (current === c.id ? " on" : "") + '" data-chat="' + c.id + '" data-hint="chat:' + c.id + '">' +
                '<div class="i-ava"><img src="' + c.avatar + '" alt=""></div>' +
                (unread ? '<span class="i-badge">' + (unread > 99 ? "99+" : unread) + "</span>" : "") +
                '<div class="i-main"><div class="i-name"><span>' + esc(T(c.nameRef)) + "</span>" + (c.tagRef ? "<em>" + esc(T(c.tagRef)) + "</em>" : "") + "</div>" +
                '<div class="i-prev">' + esc(previewOf(c)) + "</div></div></div>"
            );
        }).join("");
        listEl.querySelectorAll(".wc-item").forEach(function (item) {
            item.addEventListener("click", function () { openChat(item.dataset.chat); });
        });
    }

    /* ---------------- 消息面板 ---------------- */
    function msgHtml(c, m) {
        var html = m.day ? '<div class="wc-day">' + esc(m.day) + "</div>" : "";
        if (m.from === "sys" || m.sys) return html + '<div class="wc-sys">' + esc(T(m.ref)) + "</div>";
        var me = m.from === "me";
        var inner;
        if (m.type === "img") {
            inner = '<div class="wcm-pic" data-img="' + m.img + '" data-cap="' + esc(T(m.ref || "chat.prev.img")) + '"><img src="' + m.img + '" alt=""></div>';
        } else if (m.type === "file") {
            inner = '<div class="wcm-file" data-file="' + (m.file || "") + '"><div class="f-top"><img src="image/file.png" alt=""><div><div class="f-name">' + esc(T(m.ref)) + '</div><div class="f-size">' + esc(m.sizeRef ? T(m.sizeRef) : "") + '</div></div></div><div class="f-foot">' + esc(T("chat.file.foot")) + "</div></div>";
        } else if (m.type === "call") {
            inner = '<div class="wcm-call' + (m.missed ? " missed" : "") + '"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>' + esc(T(m.ref)) + "</div>";
        } else {
            inner = '<div class="wcm-bubble">' + esc(T(m.ref)) + "</div>";
        }
        return html +
            '<div class="wcm-row' + (me ? " me" : "") + '">' +
            '<div class="wcm-ava"><img src="' + (me ? meAvatar() : c.avatar) + '" alt=""></div>' +
            '<div class="wcm-col">' + inner + "</div></div>";
    }
    function footHtml(c) {
        var html = "";
        if (c.mode === "monitor") {
            if (c.draft && STATE.cond(c.draft.if)) {
                html += '<div class="wc-draft"><span>' + esc(T("chat.draft.tag")) + "</span>" + esc(T(c.draft.ref)) + "</div>";
            }
            html += '<div class="wc-input">' + esc(T("chat.monitor.input")) + "</div>";
            return html;
        }
        var choices = (c.choices || []).filter(function (x) { return STATE.cond(x.if); });
        if (c.prefill && STATE.cond(c.prefill.if)) {
            html += '<div class="wc-prefill">' + esc(T(c.prefill.ref)) + "</div>";
        } else {
            html += '<div class="wc-input own">' + esc(T("chat.input")) + "</div>";
        }
        if (choices.length) {
            html += '<div class="wc-choices">' + choices.map(function (x) {
                return '<button class="wc-choice' + (x.danger ? " danger" : "") + '" data-choice="' + x.id + '" data-hint="choice:' + x.id + '">' + esc(T(x.ref)) + "</button>";
            }).join("") + "</div>";
        }
        return html;
    }
    function renderPanel() {
        var head = $("#wc-panel-head"), body = $("#wc-panel-body"), foot = $("#wc-panel-foot");
        var c = current && byId(current);
        if (!c || !STATE.cond(c.visible)) {
            head.textContent = T("app.chat.title");
            body.innerHTML = '<div class="wc-blank"><svg viewBox="0 0 48 48" width="72" height="72" opacity=".14"><rect x="3" y="3" width="42" height="42" rx="10" fill="#8a8a8a"/></svg></div>';
            foot.hidden = true;
            return;
        }
        var typing = c.typing && STATE.cond(c.typing);
        head.innerHTML = esc(T(c.nameRef)) + (typing ? '<span class="wc-typing">' + esc(T("chat.typing")) + "</span>" : "");
        body.innerHTML = visibleMsgs(c).map(function (m) { return msgHtml(c, m); }).join("");
        foot.hidden = false;
        foot.innerHTML = footHtml(c);
        body.scrollTop = body.scrollHeight;

        body.querySelectorAll(".wcm-pic").forEach(function (el) {
            el.addEventListener("click", function () { if (window.VIEWER) VIEWER.openImg(el.dataset.img, el.dataset.cap); });
        });
        body.querySelectorAll(".wcm-file").forEach(function (el) {
            el.addEventListener("click", function () { if (el.dataset.file && window.FILES) FILES.openById(el.dataset.file); });
        });
        foot.querySelectorAll(".wc-choice").forEach(function (b) {
            b.addEventListener("click", function () {
                var x = (c.choices || []).filter(function (y) { return y.id === b.dataset.choice; })[0];
                if (!x) return;
                foot.querySelectorAll(".wc-choice").forEach(function (z) { z.disabled = true; });
                if (x.sets !== null) STATE.set(x.sets || x.id);
                if (x.emit) STATE.emit(x.emit);
                STATE.emit("choice:" + x.id);
            });
        });
    }

    function markRead(c) {
        var n = visibleMsgs(c).length;
        if (STATE.get("read_" + c.id) !== n) setTimeout(function () { STATE.set("read_" + c.id, n); }, 0);
    }
    function openChat(id) {
        current = id;
        var c = byId(id);
        renderList(); renderPanel();
        if (c) {
            markRead(c);
            if (c.sets) STATE.set(c.sets);
            STATE.emit("open-chat:" + id);
        }
    }

    /* 新消息：声音 + 任务栏闪 + 图标红点 */
    function watchNew() {
        var all = (dev().chats || []);
        var counts = {}, newFrom = null;
        all.forEach(function (c) {
            var ms = visibleMsgs(c);
            counts[c.id] = ms.length;
            if (lastCounts && lastCounts[c.id] != null && ms.length > lastCounts[c.id]) {
                var last = ms[ms.length - 1];
                if (last && last.from !== "me" && STATE.cond(c.visible)) newFrom = c;
            }
        });
        lastCounts = counts;
        if (newFrom && STATE.get("booted")) {
            if (window.FX) FX.sound("message.mp3", 0.55);
            NOTIFY.flash("chat");
        }
        var total = 0;
        chats().forEach(function (c) { total += unreadOf(c); });
        NOTIFY.badge("chat", total);
    }

    function rerender() {
        watchNew();
        renderList(); renderPanel();
        if (current) { var c = byId(current); if (c && WM.isOpen("chat")) markRead(c); }
        NOTIFY.hints();
    }
    document.addEventListener("DOMContentLoaded", rerender);
    STATE.on(rerender);
    document.addEventListener("app-open", function (e) { if (e.detail === "chat") rerender(); });
    document.addEventListener("source-change", function () { current = null; lastCounts = null; rerender(); });
})();
