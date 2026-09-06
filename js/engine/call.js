/* =====================================================================
   微信语音来电（电脑版微信的来电弹窗）。
   DB.CALLS[id] = { chat, nameRef, avatar, ringMs?, lines:[
       { who:"them"|"me", ref, wait? }            一句话，wait 毫秒后出现
       { choices:[ { id, ref, sets?, emit?, then?:[lines] } ] }   等玩家选一句
   ] }
   响铃 → 接听：通话面板里逐句出现"转写"，玩家用候选句回话 → 结束。
   事件：call-accept:<id> / call-decline:<id> / call-missed:<id> / call-end:<id>
   ===================================================================== */
(function () {
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var ov = null, cur = null, ringTimer = null, lineTimer = null, tick = null, startAt = 0;

    function teardown() {
        clearTimeout(ringTimer); clearTimeout(lineTimer); clearInterval(tick);
        if (window.FX) FX.ringStop();
        if (ov) { ov.remove(); ov = null; }
        cur = null;
    }
    function fmt(sec) { return ("0" + Math.floor(sec / 60)).slice(-2) + ":" + ("0" + (sec % 60)).slice(-2); }

    function incoming(id) {
        var def = DB.CALLS && DB.CALLS[id];
        if (!def || ov) return;
        cur = { id: id, def: def };
        ov = document.createElement("div");
        ov.id = "call-overlay";
        ov.innerHTML =
            '<div class="cl-card ringing">' +
            '<img class="cl-ava" src="' + def.avatar + '" alt="">' +
            '<div class="cl-name">' + esc(T(def.nameRef)) + "</div>" +
            '<div class="cl-sub">' + esc(T("call.invite")) + "</div>" +
            '<div class="cl-btns">' +
            '<button class="cl-btn red" id="cl-decline"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg><span>' + esc(T("call.decline")) + "</span></button>" +
            '<button class="cl-btn green" id="cl-accept"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg><span>' + esc(T("call.accept")) + "</span></button>" +
            "</div></div>";
        document.body.appendChild(ov);
        if (window.FX) FX.ringStart();
        ov.querySelector("#cl-decline").addEventListener("click", function () {
            var cid = cur.id; teardown(); STATE.emit("call-decline:" + cid);
        });
        ov.querySelector("#cl-accept").addEventListener("click", accept);
        ringTimer = setTimeout(function () {
            var cid = cur.id; teardown(); STATE.emit("call-missed:" + cid);
        }, def.ringMs || 32000);
        STATE.emit("call-ring:" + id);
    }

    function accept() {
        clearTimeout(ringTimer);
        if (window.FX) FX.ringStop();
        var def = cur.def;
        var card = ov.querySelector(".cl-card");
        card.className = "cl-card connected";
        card.innerHTML =
            '<div class="cl-head"><img class="cl-ava sm" src="' + def.avatar + '" alt=""><div><div class="cl-name">' + esc(T(def.nameRef)) + '</div><div class="cl-timer" id="cl-timer">00:00</div></div></div>' +
            '<div class="cl-lines" id="cl-lines"></div>' +
            '<div class="cl-choices" id="cl-choices"></div>' +
            '<div class="cl-foot"><button class="cl-btn red" id="cl-hang"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg></button></div>';
        startAt = Date.now();
        tick = setInterval(function () {
            var t = ov && ov.querySelector("#cl-timer");
            if (t) t.textContent = fmt(Math.floor((Date.now() - startAt) / 1000));
        }, 1000);
        ov.querySelector("#cl-hang").addEventListener("click", end);
        STATE.emit("call-accept:" + cur.id);
        runLines(def.lines || [], 0);
    }
    function appendLine(who, text) {
        var box = ov.querySelector("#cl-lines");
        var div = document.createElement("div");
        div.className = "cl-line " + (who === "me" ? "me" : "them");
        div.textContent = text;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }
    function runLines(lines, i) {
        if (!ov) return;
        if (i >= lines.length) { lineTimer = setTimeout(end, 2200); return; }
        var L = lines[i];
        if (L.choices) {
            var box = ov.querySelector("#cl-choices");
            box.innerHTML = L.choices.map(function (c, k) {
                return '<button class="cl-choice" data-k="' + k + '">' + esc(T(c.ref)) + "</button>";
            }).join("");
            box.querySelectorAll(".cl-choice").forEach(function (b) {
                b.addEventListener("click", function () {
                    var c = L.choices[+b.dataset.k];
                    box.innerHTML = "";
                    appendLine("me", T(c.ref));
                    if (c.sets) STATE.set(c.sets);
                    if (c.emit) STATE.emit(c.emit);
                    runLines((c.then || []).concat(lines.slice(i + 1)), 0);
                });
            });
            return;
        }
        lineTimer = setTimeout(function () {
            if (!ov) return;
            appendLine(L.who, T(L.ref));
            if (L.sets) STATE.set(L.sets);
            runLines(lines, i + 1);
        }, L.wait != null ? L.wait : 1800);
    }
    function end() {
        if (!cur) return;
        var cid = cur.id;
        var dur = Math.floor((Date.now() - startAt) / 1000);
        STATE.set("call_dur_" + cid, fmt(dur));
        teardown();
        if (window.FX) FX.sound("message.mp3", 0.5);
        STATE.emit("call-end:" + cid);
    }

    window.CALL = { incoming: incoming, active: function () { return !!ov; } };
})();
