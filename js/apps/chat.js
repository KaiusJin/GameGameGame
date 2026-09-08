/* =====================================================================
   聊天（微信电脑版壳，形态照 ningning js/pc/main.js 的 renderWeChat）：
   - 会话列表顺序固定（按数据顺序，不因未读重排），未读 = 头像右上角小红点；
     右侧时间照微信：今天 HH:mm / 昨天 / 星期X / yy/m/d；有草稿显示红色 [草稿]
   - 消息区：时间分隔按微信规则自动生成（首条或与上一条间隔 ≥ 5 分钟才显示：
     今天 HH:mm · 昨天 HH:mm · 星期X HH:mm · M月D日 HH:mm · 跨年带年份）；
     白色·绿色气泡 / 居中灰色系统行（"你已添加了X" / "X" 撤回了一条消息）；
     语音消息 = 带喇叭图标的气泡 + 下方"转文字"框；
     通话记录 = 带听筒图标的气泡："通话时长 mm:ss" / 红字 "对方已取消" "已取消" "对方无应答" "已拒绝" "对方已拒绝"
   - 输入区：可打字的 textarea + "发送"按钮（Enter 发送）。候选句以小按钮出现在输入框上方，
     点一下填进输入框，再按发送 → 触发对应选项；自由输入的话原样发出去（没人回）
   - 只读会话（对方设备）：输入框禁用；她没发出去的草稿就留在输入框里
   - 预填（第三案妈妈会话）：那句话直接出现在输入框里，按发送 = 选了"发送这句话"
   - 新消息：提示音 + 右下角微信样式弹窗（头像 / 名字 / 内容，点开直达会话）

   数据 = DEVICES[source].chats：
     { id, mode:"own"|"monitor", nameRef, avatar, visible?, sets?, unread?, callId?,
       typing?:<cond>, draft?:{ref, if}, prefill?:{ref, if},
       messages:[ { at?:"YYYY-MM-DD HH:MM", from:"me"|"them"|"sys", ref, if?,
                    type?:"img"|"file"|"voice"|"call", img?, file?, voice:{dur}, kind:"done"|"cancel"|"noanswer"|"declined", dur } ],
       choices:[ { id, ref, if?, sets?, emit?, matchPrefill? } ] }
   时间：历史消息写 at；带 if 的动态消息第一次出现时记录游戏内分钟和出现顺序（flags.mt_<chat>）；
   没写 at 的静态消息跟着上一条走。callId 会话把 flags.callres_<callId>（call.js 记录）按时间插进来。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var current = null, lastCounts = null, pickedChoice = null, inputDirty = false;
    var stampCache = {};
    var profileView = null;   /* 正在看的联系人资料（搜微信号搜到的） */

    function dev() { return DB.DEVICES[STATE.source()] || DB.DEVICES.own; }
    function chats() { return (dev().chats || []).filter(function (c) { return STATE.cond(c.visible); }); }
    function byId(id) { return (dev().chats || []).filter(function (c) { return c.id === id; })[0] || null; }
    function visibleMsgs(c) { return (c.messages || []).filter(function (m) { return STATE.cond(m.if); }); }
    function sentMsgs(c) { return STATE.get("sent_" + c.id) || []; }
    function stampsOf(c) {
        if (!stampCache[c.id]) stampCache[c.id] = Object.assign({}, STATE.get("mt_" + c.id) || {});
        return stampCache[c.id];
    }
    function unreadOf(c) {
        var n = visibleMsgs(c).length;
        var read = STATE.get("read_" + c.id);
        if (read == null) return Math.min(c.unread || 0, n);
        return Math.max(0, n - read);
    }
    function meAvatar() {
        var d = dev();
        return STATE.source() === "own" ? (DB.CONFIG.meAvatar || "") : (d.desktop.avatar || "");
    }
    function choicesOf(c) { return (c.choices || []).filter(function (x) { return STATE.cond(x.if); }); }
    function prefillOf(c) { return (c.prefill && STATE.cond(c.prefill.if)) ? T(c.prefill.ref) : null; }
    function draftOf(c) { return (c.draft && STATE.cond(c.draft.if)) ? T(c.draft.ref) : null; }
    function sysText(c, ref) { return T(ref).replace(/\{n\}/g, T(c.nameRef)); }

    /* ---------------- 时间 ---------------- */
    function pad(n) { return ("0" + n).slice(-2); }
    function minToDate(min) {
        var b = DB.CONFIG.startDate;
        return new Date(b.y, b.mo - 1, b.d, b.h, b.mi + min);
    }
    function parseAt(s) {
        var m = /(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})/.exec(s);
        return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : minToDate(0);
    }
    function dayDiff(d, now) {
        var a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        var b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return Math.round((b - a) / 86400000);
    }
    function hm(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
    function fmtFull(d) {
        var now = STATE.clockDate(), dd = dayDiff(d, now);
        if (dd <= 0) return hm(d);
        if (dd === 1) return T("time.yesterday") + " " + hm(d);
        if (dd < 7) return T("time.week." + d.getDay()) + " " + hm(d);
        var f = d.getFullYear() === now.getFullYear() ? T("time.fmt.md") : T("time.fmt.ymd");
        return f.replace("{y}", d.getFullYear()).replace("{m}", d.getMonth() + 1).replace("{d}", d.getDate()).replace("{hm}", hm(d));
    }
    function fmtList(d) {
        var now = STATE.clockDate(), dd = dayDiff(d, now);
        if (dd <= 0) return hm(d);
        if (dd === 1) return T("time.yesterday");
        if (dd < 7) return T("time.week." + d.getDay());
        return T("time.fmt.list").replace("{yy}", String(d.getFullYear()).slice(-2)).replace("{m}", d.getMonth() + 1).replace("{d}", d.getDate());
    }
    function voiceDur(sec) { return sec >= 60 ? Math.floor(sec / 60) + "'" + pad(sec % 60) + '"' : sec + '"'; }

    /* 会话里的全部条目（消息 + 自由输入 + 通话记录），按时间排好 */
    function items(c) {
        var st = stampsOf(c), out = [], prev = null;
        (c.messages || []).forEach(function (m, i) {
            if (!STATE.cond(m.if)) return;
            var stamp = st[i], t;
            if (m.at) t = parseAt(m.at);
            else if (stamp != null) t = minToDate(stamp.min);
            else if (m.if) t = STATE.clockDate();
            else t = prev ? new Date(prev.getTime() + 60000) : minToDate(0);
            if (prev && t < prev) t = prev;
            out.push({ kind: "msg", m: m, t: t, o: stamp ? stamp.order : 0, k: out.length });
            prev = t;
        });
        sentMsgs(c).forEach(function (s) {
            var t = s.min != null ? minToDate(s.min) : (out[Math.min(out.length, s.after || 0) - 1] || {}).t || STATE.clockDate();
            out.push({ kind: "msg", m: { from: "me", text: s.text != null ? s.text : s.t }, t: t, k: out.length });
        });
        if (c.callId) {
            (STATE.get("callres_" + c.callId) || []).forEach(function (r) {
                out.push({ kind: "msg", m: { from: "them", type: "call", kind: r.k === "done" ? "done" : r.k === "declined" ? "declined" : "cancel", dur: r.dur }, t: minToDate(r.t), k: out.length });
            });
        }
        out.sort(function (a, b) { return (a.t - b.t) || (a.o - b.o) || (a.k - b.k); });
        return out;
    }
    function lastTime(c) { var it = items(c); return it.length ? it[it.length - 1].t : null; }

    /* ---------------- 文字 ---------------- */
    function callText(m) {
        var me = m.from === "me";
        if (m.kind === "done") return T("chat.call.done").replace("{dur}", m.dur || "");
        if (m.kind === "noanswer") return T("chat.call.noanswer");
        if (m.kind === "declined") return T(me ? "chat.call.declined.them" : "chat.call.declined.me");
        return T(me ? "chat.call.cancel.me" : "chat.call.cancel.them");
    }
    function textOf(c, m) {
        if (m.text != null) return m.text;
        if (m.from === "sys" || m.sys) return sysText(c, m.ref);
        if (m.type === "img") return T("chat.prev.img");
        if (m.type === "file") return T("chat.prev.file");
        if (m.type === "call") return T("chat.prev.call");
        if (m.type === "voice") return T("chat.prev.voice");
        return T(m.ref);
    }
    function previewOf(c) {
        var draft = c.mode === "monitor" ? draftOf(c) : null;
        if (draft) return '<span class="i-draft">' + esc(T("chat.prev.draft")) + "</span>" + esc(draft);
        var it = items(c), last = it[it.length - 1];
        if (c.previewRef) return esc(T(c.previewRef));
        return last ? esc(textOf(c, last.m)) : "";
    }

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
            var lt = lastTime(c);
            return (
                '<div class="wc-item' + (current === c.id ? " on" : "") + '" data-chat="' + c.id + '" data-hint="chat:' + c.id + '">' +
                '<div class="i-ava"><img src="' + c.avatar + '" alt="">' + (unreadOf(c) ? '<i class="i-dot"></i>' : "") + "</div>" +
                '<div class="i-main"><div class="i-top"><div class="i-name">' + esc(T(c.nameRef)) + '</div><div class="i-time">' + (lt ? esc(fmtList(lt)) : "") + "</div></div>" +
                '<div class="i-prev">' + previewOf(c) + "</div></div></div>"
            );
        }).join("");
        listEl.querySelectorAll(".wc-item").forEach(function (item) {
            item.addEventListener("click", function () { openChat(item.dataset.chat); });
        });
    }

    /* ---------------- 搜微信号 → 资料页 → 添加到通讯录（照 ningning） ---------------- */
    var SEARCH_ICO = '<svg viewBox="0 0 1024 1024" width="22" height="22" fill="#fff"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.6-87.9-212.1C567.5 143.3 492.2 112 412 112c-80.2 0-155.6 31.3-212.1 87.9C143.3 256.4 112 331.8 112 412c0 80.2 31.3 155.6 87.9 212.1C256.4 680.7 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a40.2 40.2 0 0 0 56.8-56.8zM412 640c-125.7 0-228-102.3-228-228s102.3-228 228-228 228 102.3 228 228-102.3 228-228 228z"/></svg>';
    function findContact(q) {
        q = (q || "").trim().toLowerCase();
        if (!q || STATE.source() !== "own") return null;
        return (DB.CONTACTS || []).filter(function (c) { return (c.ids || []).some(function (i) { return i.toLowerCase() === q; }); })[0] || null;
    }
    function renderSearch(val) {
        var dd = $("#wc-search-dd");
        if (!dd) return;
        val = (val || "").trim();
        if (!val) { dd.hidden = true; return; }
        var hit = findContact(val);
        dd.hidden = false;
        if (hit) {
            dd.innerHTML = '<div class="wc-dd-title">' + esc(T("chat.search.net")) + '</div>' +
                '<div class="wc-dd-item" id="wc-dd-hit"><i>' + SEARCH_ICO + "</i><span>" + esc(T("chat.search.go")) + "<b>" + esc(val) + "</b></span></div>";
            dd.querySelector("#wc-dd-hit").addEventListener("click", function () {
                profileView = hit;
                $("#wc-search-input").value = "";
                dd.hidden = true;
                renderPanel();
            });
        } else {
            dd.innerHTML = '<div class="wc-dd-none">' + esc(T("chat.search.none")) + "</div>";
        }
    }
    function profileHtml(p) {
        var added = !!STATE.get(p.flag);
        return '<div class="wc-profile"><div class="wc-pf-card">' +
            '<div class="wc-pf-top"><div class="wc-pf-rows"><div class="wc-pf-name">' + esc(T(p.nameRef)) + "</div>" +
            '<div class="wc-pf-row"><span>' + esc(T("chat.profile.nick")) + "</span><b>" + esc(T(p.nameRef)) + "</b></div>" +
            '<div class="wc-pf-row"><span>' + esc(T("chat.profile.id")) + "</span><b>" + esc(T(p.wxidRef)) + "</b></div>" +
            '<div class="wc-pf-row"><span>' + esc(T("chat.profile.region")) + "</span><b>" + esc(T(p.regionRef)) + "</b></div></div>" +
            '<img src="' + p.avatar + '" alt=""></div>' +
            '<div class="wc-pf-mid"><div class="wc-pf-row"><span>' + esc(T("chat.profile.sign")) + "</span><b>" + esc(T(p.signRef)) + "</b></div>" +
            '<div class="wc-pf-row"><span>' + esc(T("chat.profile.src")) + "</span><b>" + esc(T("chat.profile.srcval")) + "</b></div></div>" +
            '<div class="wc-pf-foot"><button id="wc-pf-btn">' + esc(T(added ? "chat.profile.msg" : "chat.profile.add")) + "</button></div>" +
            "</div></div>";
    }
    function bindProfile(p) {
        var btn = $("#wc-pf-btn");
        if (!btn) return;
        btn.addEventListener("click", function () {
            if (!STATE.get(p.flag)) {
                btn.textContent = T("chat.profile.added");
                STATE.set(p.flag);
                STATE.emit("add-contact:" + p.chat);
                if (window.FX) FX.sound("windows-10-notify-system-sound.mp3", 0.35);
                setTimeout(function () { profileView = null; openChat(p.chat); }, 500);
            } else {
                profileView = null;
                openChat(p.chat);
            }
        });
    }

    /* ---------------- 消息面板 ---------------- */
    var PHONE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>';
    var SPEAKER = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M9 9v6M13 7v10M17 5v14"/></svg>';
    function bubbleHtml(c, m) {
        var me = m.from === "me";
        var inner;
        if (m.type === "img") {
            inner = '<div class="wcm-pic" data-img="' + m.img + '" data-cap="' + esc(T(m.ref || "chat.prev.img")) + '"><img src="' + m.img + '" alt=""></div>';
        } else if (m.type === "file") {
            inner = '<div class="wcm-file" data-file="' + (m.file || "") + '"><div class="f-top"><img src="image/file.png" alt=""><div><div class="f-name">' + esc(T(m.ref)) + '</div><div class="f-size">' + esc(m.sizeRef ? T(m.sizeRef) : "") + '</div></div></div><div class="f-foot">' + esc(T("chat.file.foot")) + "</div></div>";
        } else if (m.type === "call") {
            inner = '<div class="wcm-call">' + PHONE + esc(callText(m)) + "</div>";
        } else if (m.type === "voice") {
            var dur = (m.voice && m.voice.dur) || 3;
            inner = '<div class="wcm-voice" style="width:' + Math.min(230, 62 + dur * 2) + 'px">' + SPEAKER + "<span>" + esc(voiceDur(dur)) + "</span></div>" +
                (m.ref ? '<div class="wcm-trans">' + esc(T(m.ref)) + "</div>" : "");
        } else {
            inner = '<div class="wcm-bubble">' + esc(m.text != null ? m.text : T(m.ref)) + "</div>";
        }
        return '<div class="wcm-row' + (me ? " me" : "") + '">' +
            '<img class="wcm-ava" src="' + (me ? meAvatar() : c.avatar) + '" alt="">' +
            '<div class="wcm-col">' + inner + "</div></div>";
    }
    function bodyHtml(c) {
        var html = "", prev = null;
        items(c).forEach(function (it) {
            if (!prev || it.t - prev >= 5 * 60000) html += '<div class="wc-day">' + esc(fmtFull(it.t)) + "</div>";
            prev = it.t;
            var m = it.m;
            if (m.from === "sys" || m.sys) html += '<div class="wc-sys">' + esc(sysText(c, m.ref)) + "</div>";
            else html += bubbleHtml(c, m);
        });
        return html;
    }
    function renderPanel() {
        var head = $("#wc-panel-head"), body = $("#wc-panel-body"), foot = $("#wc-panel-foot");
        var c = current && byId(current);
        if (profileView) {
            head.innerHTML = "";
            body.innerHTML = profileHtml(profileView);
            foot.hidden = true;
            bindProfile(profileView);
            return;
        }
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
        var input = $("#wc-input"), chips = $("#wc-chips"), send = $("#wc-send");
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
            sent.push({ text: text, min: STATE.clockMin() });
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
        profileView = null;
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

    /* ---------------- 新消息：盖时间戳 + 声音 + 微信弹窗 + 红点 ---------------- */
    var toastTimer = null;
    function wxToast(c, text) {
        var t = document.getElementById("wx-toast");
        if (!t) {
            t = document.createElement("div");
            t.id = "wx-toast";
            document.body.appendChild(t);
        }
        t.innerHTML = '<div class="wxt-head"><img src="image/wechat.png" alt=""><span>' + esc(T("app.chat.title")) + "</span></div>" +
            '<div class="wxt-body"><img src="' + c.avatar + '" alt=""><div><div class="wxt-name">' + esc(T(c.nameRef)) + '</div><div class="wxt-text">' + esc(text) + "</div></div></div>";
        t.onclick = function () { t.classList.remove("show"); openApp("chat"); openChat(c.id); };
        requestAnimationFrame(function () { t.classList.add("show"); });
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove("show"); }, 4500);
    }
    function stampNew() {
        var pending = [];
        (dev().chats || []).forEach(function (c) {
            var st = stampsOf(c), changed = false;
            var nextOrder = Object.keys(st).reduce(function (max, key) {
                return Math.max(max, +(st[key] && st[key].order) || 0);
            }, 0);
            (c.messages || []).forEach(function (m, i) {
                if (m.if && !m.at && st[i] == null && STATE.cond(m.if)) {
                    st[i] = { min: STATE.clockMin(), order: ++nextOrder };
                    changed = true;
                }
            });
            if (changed) pending.push(c.id);
        });
        if (pending.length) setTimeout(function () {
            var obj = {};
            pending.forEach(function (id) { obj["mt_" + id] = Object.assign({}, stampCache[id]); });
            STATE.setMany(obj);
        }, 0);
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
            if (!visibleNow(f.c.id)) { wxToast(f.c, textOf(f.c, f.m)); NOTIFY.flash("chat"); }
        }
        var total = 0;
        chats().forEach(function (c) { total += unreadOf(c); });
        NOTIFY.badge("chat", total);
    }

    function rerender() {
        stampNew();
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
        var search = $("#wc-search-input");
        if (search) {
            search.addEventListener("input", function () { renderSearch(search.value); });
            search.addEventListener("keydown", function (e) { if (e.key === "Escape") { search.value = ""; renderSearch(""); } });
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
    document.addEventListener("clock-tick", function () { renderList(); });
    document.addEventListener("app-open", function (e) { if (e.detail === "chat") rerender(); });
    document.addEventListener("source-change", function () { current = null; profileView = null; lastCounts = null; inputDirty = false; stampCache = {}; rerender(); });
})();
