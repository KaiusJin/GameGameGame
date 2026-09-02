/* =====================================================================
   聊天：自己的会话（own）+ 监控模式（病毒软件接入目标设备后只读查看）。
   UI 复用微信 PC 壳（css/apps.css .wc-*）。数据 = DEVICES[source].chats。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    var current = null;      /* 当前打开的会话 id */
    var readSet = {};

    function chats() {
        var dev = DB.DEVICES[STATE.source()] || { chats: [] };
        return (dev.chats || []).filter(function (c) { return STATE.cond(c.visible); });
    }
    function byId(id) {
        return chats().filter(function (c) { return c.id === id; })[0] || null;
    }

    function renderList() {
        var listEl = $("#wc-list");
        if (!listEl) return;
        var cs = chats();
        if (!cs.length) {
            listEl.innerHTML = '<div class="wc-empty">' + esc(T("chat.own.empty")) + "</div>";
            return;
        }
        listEl.innerHTML = cs.map(function (c) {
            var unread = !readSet[c.id] && c.unread ? c.unread : 0;
            return (
                '<div class="wc-item' + (current === c.id ? " on" : "") + '" data-chat="' + c.id + '" data-hint="chat:' + c.id + '">' +
                '<div class="i-ava"><img src="' + c.avatar + '" alt=""></div>' +
                (unread ? '<span class="i-badge">' + unread + "</span>" : "") +
                '<div class="i-main">' +
                '<div class="i-name"><span>' + esc(T(c.nameRef)) + "</span></div>" +
                '<div class="i-prev">' + esc(T(c.previewRef)) + "</div></div></div>"
            );
        }).join("");
        listEl.querySelectorAll(".wc-item").forEach(function (item) {
            item.addEventListener("click", function () { openChat(item.dataset.chat); });
        });
        NOTIFY.hints();
    }

    function renderPanel() {
        var head = $("#wc-panel-head"), body = $("#wc-panel-body"), foot = $("#wc-panel-foot");
        var c = current && byId(current);
        if (!c) {
            head.textContent = T("app.chat.title");
            body.innerHTML =
                '<div class="wc-blank"><svg viewBox="0 0 48 48" width="72" height="72" opacity=".14"><rect x="3" y="3" width="42" height="42" rx="10" fill="#8a8a8a"/></svg></div>';
            foot.hidden = true;
            return;
        }
        head.textContent = T(c.nameRef);
        body.innerHTML = c.messages.map(function (m) {
            var me = m.from === "me";
            return (
                '<div class="wcm-row' + (me ? " me" : "") + '">' +
                '<div class="wcm-ava">' + (me ? "" : '<img src="' + c.avatar + '" alt="">') + "</div>" +
                '<div class="wcm-col"><div class="wcm-bubble">' + esc(T(m.ref)) + "</div></div></div>"
            );
        }).join("");
        var inputText = c.mode === "monitor" ? T("chat.monitor.input") : T("chat.input");
        foot.hidden = false;
        $("#wc-input").textContent = inputText;
        body.scrollTop = body.scrollHeight;
    }

    function openChat(id) {
        current = id;
        readSet[id] = 1;
        renderList();
        renderPanel();
        var c = byId(id);
        if (c) {
            if (c.sets) STATE.set(c.sets);
            STATE.emit("open-chat:" + id);
        }
    }

    function rerender() { renderList(); renderPanel(); }

    document.addEventListener("DOMContentLoaded", rerender);
    STATE.on(rerender);
    document.addEventListener("source-change", function () {
        current = null;
        readSet = {};
        rerender();
    });
})();
