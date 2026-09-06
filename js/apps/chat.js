/* =====================================================================
   聊天（微信电脑版壳，形态照 ningning js/pc/main.js 的 renderWeChat）：
   - 会话列表顺序固定（按数据顺序，不因未读重排），未读 = 头像右上角小红点
   - 消息区：居中的日期分隔 / 白色·绿色气泡 / 居中灰色系统行；渲染后滚到底
   - 输入区：可打字的 textarea + "发送"按钮（Enter 发送）。候选句以小按钮出现在输入框上方，
     点一下填进输入框，再按发送 → 触发对应选项；自由输入的话原样发出去（没人回）
   - 只读会话（对方设备）：输入框禁用；她没发出去的草稿就留在输入框里
   - 预填（第三案妈妈会话）：那句话直接出现在输入框里，按发送 = 选了"发送这句话"
   - 新消息：提示音 + 右下角微信样式弹窗（头像 / 名字 / 内容，点开直达会话）

   数据 = DEVICES[source].chats：
     { id, mode:"own"|"monitor", nameRef, avatar, visible?, sets?, unread?,
       typing?:<cond>, draft?:{ref, if}, prefill?:{ref, if},
       messages:[ { day?, from:"me"|"them"|"sys", ref, if?, type?:"img"|"file"|"call", img?, file?, missed? } ],
       choices:[ { id, ref, if?, sets?, emit?, matchPrefill? } ] }
   消息用 if 控制出现时机：触发器延时置 flag = "对方回复了"。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var current = null, lastCounts = null, pickedChoice = null, inputDirty = false;

    function dev() { return DB.DEVICES[STATE.source()] || DB.DEVICES.own; }
    function chats() { return (dev().chats || []).filter(function (c) { return STATE.cond(c.visible); }); }
    function byId(id) { return (dev().chats || []).filter(function (c) { return c.id === id; })[0] || null; }
    function visibleMsgs(c) { return (c.messages || []).filter(function (m) { return STATE.cond(m.if); }); }
    function sentMsgs(c) { return STATE.get("sent_" + c.id) || []; }
    function unreadOf(c) {
        var n = visibleMsgs(c).length;
        var read = STATE.get("read_" + c.id);
        if (read == null) return Math.min(c.unread || 0, n);
        return Math.max(0, n - read);
    }
    function textOf(m) {
        if (m.type === "img") return T("chat.prev.img");
        if (m.type === "file") return T("chat.prev.file");
        if (m.type === "call") return T("chat.prev.call");
        return T(m.ref);
    }
    function previewOf(c) {
        var ms = visibleMsgs(c), sent = sentMsgs(c);
        var last = ms[ms.length - 1];
        var lastSent = sent[sent.length - 1];
        if (lastSent && (!last || lastSent.after >= ms.length)) return lastSent.t;
        if (c.previewRef) return T(c.previewRef);
        return last ? textOf(last) : "";
    }
    function lastDay(c) {
        var ms = visibleMsgs(c);
        for (var i = ms.length - 1; i >= 0; i--) if (ms[i].day) return ms[i].day;
        return "";
    }
    function meAvatar() {
        var d = dev();
        return STATE.source() === "own" ? (DB.CONFIG.meAvatar || "") : (d.desktop.avatar || "");
    }
    function choicesOf(c) { return (c.choices || []).filter(function (x) { return STATE.cond(x.if); }); }
    function prefillOf(c) { return (c.prefill && STATE.cond(c.prefill.if)) ? T(c.prefill.ref) : null; }
    function draftOf(c) { return (c.draft && STATE.cond(c.draft.if)) ? T(c.draft.ref) : null; }

    /* ---------------- 会话列表 ---------------- */
    function renderList() {
        var listEl = $("#wc-list");
        if (!listEl) return;
        var ava = $("#wc-my-ava");
        if (ava) ava.innerHTML = '<img src="' + meAvatar() + '" alt="">';
        var s = $("#wc-search-input");
        if (s) s.placeholder = T("chat.search");
        var cs = chats();
        if (!cs.length) { listEl.innerHTML = '<div class="wc-empty">' + esc(T("chat.own.empty")) + "</div>"; return; }
        listEl.innerHTML = cs.map(function (c) {
            return (
                '<div class="wc-item' + (current === c.id ? " on" : "") + '" data-chat="' + c.id + '" data-hint="chat:' + c.id + '">' +
                '<div class="i-ava"><img src="' + c.avatar + '" alt="">' + (unreadOf(c) ? '<i class="i-dot"></i>' : "") + "</div>" +
                '<div class="i-main"><div class="i-top"><div class="i-name">' + esc(T(c.nameRef)) + '</div><div class="i-time">' + esc(lastDay(c)) + "</div></div>" +
                '<div class="i-prev">' + esc(previewOf(c)) + "</div></div></div>"
            );
        }).join("");
        listEl.querySelectorAll(".wc-item").forEach(function (item) {
            item.addEventListener("click", function () { openChat(item.dataset.chat); });
        });
    }

    /* ---------------- 消息面板 ---------------- */
    function bubbleHtml(c, m) {
        var me = m.from === "me";
        var inner;
        if (m.type === "img") {
            inner = '<div class="wcm-pic" data-img="' + m.img + '" data-cap="' + esc(T(m.ref || "chat.prev.img")) + '"><img src="' + m.img + '" alt=""></div>';
        } else if (m.type === "file") {
            inner = '<div class="wcm-file" data-file="' + (m.file || "") + '"><div class="f-top"><img src="image/file.png" alt=""><div><div class="f-name">' + esc(T(m.ref)) + '</div><div class="f-size">' + esc(m.sizeRef ? T(m.sizeRef) : "") + '</div></div></div><div class="f-foot">' + esc(T("chat.file.foot")) + "</div></div>";
        } else if (m.type === "call") {
            inner = '<div class="wcm-call' + (m.missed ? " missed" : "") + '"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>' + esc(T(m.ref)) + "</div>";
        } else {
            inner = '<div class="wcm-bubble">' + esc(m.text != null ? m.text : T(m.ref)) + "</div>";
        }
        return '<div class="wcm-row' + (me ? " me" : "") + '">' +
            '<img class="wcm-ava" src="' + (me ? meAvatar() : c.avatar) + '" alt="">' +
            '<div class="wcm-col">' + inner + "</div></div>";
    }
    function bodyHtml(c) {
        var ms = visibleMsgs(c), sent = sentMsgs(c);
        var html = "";
        function sentAt(i) { sent.forEach(function (s) { if (s.after === i) html += bubbleHtml(c, { from: "me", text: s.t }); }); }
        sentAt(0);
        ms.forEach(function (m, i) {
            if (m.day) html += '<div class="wc-day">' + esc(m.day) + "</div>";
            if (m.from === "sys" || m.sys) html += '<div class="wc-sys">' + esc(T(m.ref)) + "</div>";
            else html += bubbleHtml(c, m);
            sentAt(i + 1);
        });
        return html;
    }
    function renderPanel() {
        var head = $("#wc-panel-head"), body = $("#wc-panel-body"), foot = $("#wc-panel-foot");
        var c = current && byId(current);
        if (!c || !STATE.cond(c.visible)) {
            head.innerHTML = "";
            body.innerHTML = '<div class="wc-blank"><svg viewBox="0 0 48 48" width="72" height="72" opacity=".14"><rect x="3" y="3" width="42" height="42" rx="10" fill="#8a8a8a"/></svg></div>';
            foot.hidden = true;
            return;
        }
        var typing = c.typing && STATE.cond(c.typing);
        head.innerHTML = esc(T(c.nameRef)) + (typing ? '<span class="wc-typing">' + esc(T("chat.typing")) + "</span>" : "");
        body.innerHTML = bodyHtml(c);
        foot.hidden = false;
        renderFoot(c);
        body.scrollTop = body.scrollHeight;

        body.querySelectorAll(".wcm-pic").forEach(function (el) {
            el.addEventListener("click", function () { if (window.VIEWER) VIEWER.openImg(el.dataset.img, el.dataset.cap); });
        });
        body.querySelectorAll(".wcm-file").forEach(function (el) {
            el.addEventListener("click", function () { if (el.dataset.file && window.FILES) FILES.openById(el.dataset.file); });
        });
    }

    /* ---------------- 输入区 ---------------- */
    function renderFoot(c) {
        var input = $("#wc-input"), chips = $("#wc-chips"), send = $("#wc-send"), tag = $("#wc-draft-tag");
        var monitor = c.mode === "monitor";
        var draft = monitor ? draftOf(c) : null;
        var prefill = monitor ? null : prefillOf(c);
        var list = monitor ? [] : choicesOf(c).filter(function (x) { return !x.matchPrefill; });

        chips.innerHTML = list.map(function (x) {
            return '<button class="wc-chip" data-choice="' + x.id + '" data-hint="choice:' + x.id + '">' + esc(T(x.ref)) + "</button>";
        }).join("");
        chips.hidden = !list.length;
        chips.querySelectorAll(".wc-chip").forEach(function (b) {
            b.addEventListener("click", function () {
                var x = list.filter(function (y) { return y.id === b.dataset.choice; })[0];
                if (!x) return;
                input.value = T(x.ref);
                pickedChoice = x.id;
                inputDirty = true;
                input.focus();
                autoGrow();
            });
        });

        input.disabled = monitor;
        send.disabled = monitor;
        tag.hidden = !draft;
        if (monitor) {
            input.value = draft || "";
            input.placeholder = draft ? "" : T("chat.monitor.input");
        } else {
            input.placeholder = T("chat.input");
            if (!inputDirty) { input.value = prefill || ""; pickedChoice = null; }
        }
        autoGrow();
    }
    function autoGrow() { var input = $("#wc-input"); if (!input) return; input.style.height = "auto"; input.style.height = Math.min(120, Math.max(40, input.scrollHeight)) + "px"; }

    function sendNow() {
        var c = current && byId(current);
        var input = $("#wc-input");
        if (!c || !input || c.mode === "monitor") return;
        var text = input.value.trim();
        if (!text) return;
        var list = choicesOf(c);
        var hit = null;
        list.forEach(function (x) { if (!hit && (x.id === pickedChoice || T(x.ref).trim() === text)) hit = x; });
        if (!hit) {
            var pf = prefillOf(c);
            if (pf && pf.trim() === text) list.forEach(function (x) { if (!hit && x.matchPrefill) hit = x; });
        }
        input.value = ""; inputDirty = false; pickedChoice = null; autoGrow();
        if (hit) {
            if (hit.sets !== null) STATE.set(hit.sets || hit.id);
            if (hit.emit) STATE.emit(hit.emit);
            STATE.emit("choice:" + hit.id);
        } else {
            var sent = sentMsgs(c).slice();
            sent.push({ t: text, after: visibleMsgs(c).length });
            STATE.set("sent_" + c.id, sent);
            STATE.emit("free-text:" + c.id);
        }
        if (window.FX) FX.sound("message.mp3", 0.35);
    }

    /* ---------------- 打开会话 / 已读 ---------------- */
    function markRead(c) {
        var n = visibleMsgs(c).length;
        if (STATE.get("read_" + c.id) !== n) setTimeout(function () { STATE.set("read_" + c.id, n); }, 0);
    }
    function openChat(id) {
        if (current !== id) { inputDirty = false; pickedChoice = null; }
        current = id;
        var c = byId(id);
        renderList(); renderPanel();
        if (c) {
            markRead(c);
            if (c.sets) STATE.set(c.sets);
            STATE.emit("open-chat:" + id);
        }
    }
    function visibleNow(id) { return current === id && WM.isOpen("chat"); }

    /* ---------------- 新消息：声音 + 微信弹窗 + 红点 ---------------- */
    var toastTimer = null;
    function wxToast(c, text) {
        var t = document.getElementById("wx-toast");
        if (!t) {
            t = document.createElement("div");
            t.id = "wx-toast";
            document.body.appendChild(t);
        }
        t.innerHTML = '<div class="wxt-head"><svg viewBox="0 0 48 48" width="16" height="16"><rect x="3" y="3" width="42" height="42" rx="10" fill="#07c160"/><ellipse cx="19" cy="21" rx="11" ry="9" fill="#fff"/><ellipse cx="31" cy="28" rx="9" ry="7.5" fill="#fff" opacity=".92"/></svg><span>' + esc(T("app.chat.title")) + "</span></div>" +
            '<div class="wxt-body"><img src="' + c.avatar + '" alt=""><div><div class="wxt-name">' + esc(T(c.nameRef)) + '</div><div class="wxt-text">' + esc(text) + "</div></div></div>";
        t.onclick = function () { t.classList.remove("show"); openApp("chat"); openChat(c.id); };
        requestAnimationFrame(function () { t.classList.add("show"); });
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove("show"); }, 4500);
    }
    function watchNew() {
        var all = (dev().chats || []);
        var counts = {}, fresh = [];
        all.forEach(function (c) {
            var ms = visibleMsgs(c);
            counts[c.id] = ms.length;
            if (lastCounts && lastCounts[c.id] != null && ms.length > lastCounts[c.id]) {
                var last = ms[ms.length - 1];
                if (last && last.from !== "me" && last.from !== "sys" && STATE.cond(c.visible)) fresh.push({ c: c, m: last });
            }
        });
        lastCounts = counts;
        if (fresh.length && STATE.get("booted")) {
            if (window.FX) FX.sound("message.mp3", 0.55);
            var f = fresh[fresh.length - 1];
            if (!visibleNow(f.c.id)) { wxToast(f.c, textOf(f.m)); NOTIFY.flash("chat"); }
        }
        var total = 0;
        chats().forEach(function (c) { total += unreadOf(c); });
        NOTIFY.badge("chat", total);
    }

    function rerender() {
        watchNew();
        renderList(); renderPanel();
        if (current) { var c = byId(current); if (c && visibleNow(c.id)) markRead(c); }
        NOTIFY.hints();
    }
    document.addEventListener("DOMContentLoaded", function () {
        var input = $("#wc-input"), send = $("#wc-send");
        if (send) send.addEventListener("click", sendNow);
        if (input) {
            input.addEventListener("input", function () { inputDirty = true; pickedChoice = null; autoGrow(); });
            input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendNow(); } });
        }
        var tool = $("#wc-call-tool");
        if (tool) tool.addEventListener("click", function () {
            var c = current && byId(current);
            if (!c) return;
            sysDialog(T("app.chat.title"), T(c.mode === "monitor" ? "chat.monitor.input" : "chat.call.unavail"), [{ label: T("ui.ok"), primary: true }]);
        });
        rerender();
    });
    STATE.on(rerender);
    document.addEventListener("app-open", function (e) { if (e.detail === "chat") rerender(); });
    document.addEventListener("source-change", function () { current = null; lastCounts = null; inputDirty = false; rerender(); });
})();
