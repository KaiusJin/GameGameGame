/* 开场脚本引擎：按 DB.INTRO 顺序播放，全部脚本化、无自由输入。
   进度存 localStorage（刷新续播，不重打字）：
   xy_ip_main / xy_ip_tail  已完成的步数
   xy_choices               {"main:6": 选项下标}
   xy_stage                 "" | "mobile-wait" | "desktop"
   点远程卡片：PC → 连接动画 → pc.html；移动端 → INTRO_MOBILE 尾段 */
(function () {
    function $(s) { return document.querySelector(s); }

    var msgs = $("#wx-msgs"), replybar = $("#wx-replybar"), titleEl = $("#wx-title");
    var momAva = DB.WECHAT.chats[0].avatar;
    var myAva = DB.ph("素材 A0", "玩家头像", 0, 1, true);
    var momName = DB.CONFIG.mom.wx;

    var choices = {};
    try { choices = JSON.parse(localStorage.getItem("xy_choices") || "{}"); } catch (e) {}
    function saveChoice(key, idx) {
        choices[key] = idx;
        localStorage.setItem("xy_choices", JSON.stringify(choices));
    }
    function ptr(k) { return parseInt(localStorage.getItem(k) || "0", 10) || 0; }
    function setPtr(k, v) { localStorage.setItem(k, String(v)); }

    /* ---------------- 渲染 ---------------- */
    function scroll() { msgs.scrollTop = msgs.scrollHeight; }
    function el(html) {
        var d = document.createElement("div");
        d.innerHTML = html;
        return d.firstChild;
    }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function addSys(text) {
        msgs.appendChild(el('<div class="wx-sys">' + esc(text) + "</div>"));
        scroll();
    }
    function addRow(side, inner, isShot) {
        var ava = side === "me" ? myAva : momAva;
        var row = el(
            '<div class="wx-row ' + side + '">' +
            '<div class="wx-ava"><img src="' + ava + '" alt=""></div>' +
            '<div class="wx-bubble' + (isShot ? " is-shot" : "") + '">' + inner + "</div></div>"
        );
        msgs.appendChild(row);
        scroll();
        return row;
    }
    var typingRow = null;
    function showTyping() {
        if (typingRow) return;
        titleEl.textContent = "对方正在输入…";
        titleEl.classList.add("typing");
        typingRow = addRow("them", '<span class="wx-typing-bubble"><i></i><i></i><i></i></span>');
    }
    function hideTyping() {
        if (typingRow) { typingRow.remove(); typingRow = null; }
        titleEl.textContent = momName;
        titleEl.classList.remove("typing");
    }

    function friendCardHtml(done) {
        return (
            '<div class="wx-card" id="friend-card">' +
            '<div class="c-ava"><img src="' + momAva + '" alt=""></div>' +
            '<div class="c-name">' + esc(momName) + "</div>" +
            '<div class="c-msg">请求添加你为朋友：<br>我是陈雨的妈妈 有急事求帮忙</div>' +
            "<button" + (done ? " disabled>已添加" : ">通过验证") + "</button></div>"
        );
    }
    function remoteCardHtml(done) {
        return (
            '<div class="td-card">' +
            '<div class="t-head"><span class="td-logo">T</span><div>' +
            '<div class="t-title">远程协助邀请</div>' +
            '<div class="t-sub"><span class="t-dot"></span>' + esc(DB.CONFIG.daughter.device) + " · 在线</div>" +
            "</div></div>" +
            "<button" + (done ? " disabled>已连接" : ">接受并连接") + "</button>" +
            '<div class="t-brand">' + esc(DB.CONFIG.remoteBrand) + " 远程协助 · 端到端加密</div></div>"
        );
    }

    /* ---------------- 播放器 ---------------- */
    var PHASES = { main: DB.INTRO, tail: DB.INTRO_MOBILE };

    function play(phase, i, fast) {
        var seq = PHASES[phase];
        var ptrKey = phase === "main" ? "xy_ip_main" : "xy_ip_tail";
        if (i >= seq.length) { afterPhase(phase, fast); return; }
        var b = seq[i];
        var done = function (delay) {
            setPtr(ptrKey, i + 1);
            setTimeout(function () { play(phase, i + 1, fast); }, fast ? 0 : (delay || 350));
        };

        if (b.friend) {
            var already = ptr(ptrKey) > i;
            var card = el('<div class="wx-sys" style="background:none;padding:0;"></div>');
            card.innerHTML = friendCardHtml(fast || already);
            msgs.appendChild(card);
            scroll();
            if (fast || already) { done(0); return; }
            card.querySelector("button").onclick = function () {
                this.disabled = true;
                this.textContent = "已添加";
                done(300);
            };
            return;
        }
        if (b.sys) { addSys(b.sys); done(500); return; }
        if (b.m) {
            if (fast) { addRow("them", esc(b.m)); done(0); return; }
            showTyping();
            var t = Math.min(2400, 500 + b.m.length * 65);
            setTimeout(function () {
                hideTyping();
                addRow("them", esc(b.m));
                done(420);
            }, t);
            return;
        }
        if (b.shot) {
            var render = function () {
                addRow("them", window.renderShotHTML(b.shot), true);
                if (b.clue) CLUE.found(b.clue);
                done(650);
            };
            if (fast) { render(); return; }
            showTyping();
            setTimeout(function () { hideTyping(); render(); }, 900);
            return;
        }
        if (b.r) {
            var key = phase + ":" + i;
            if (fast || choices[key] != null) {
                addRow("me", esc(b.r[choices[key] || 0]));
                done(0);
                return;
            }
            replybar.innerHTML = "";
            b.r.forEach(function (text, idx) {
                var btn = document.createElement("button");
                btn.textContent = text;
                btn.onclick = function () {
                    replybar.innerHTML = "";
                    saveChoice(key, idx);
                    addRow("me", esc(text));
                    done(400);
                };
                replybar.appendChild(btn);
            });
            scroll();
            return;
        }
        if (b.card === "remote") {
            var connected = localStorage.getItem("xy_stage") === "mobile-wait" && window.XY_IS_MOBILE;
            var row = addRow("them", remoteCardHtml(false), true);
            var btn = row.querySelector("button");
            if (connected) { btn.disabled = true; btn.textContent = "等待电脑端连接"; }
            btn.onclick = function () { acceptRemote(btn); };
            setPtr(ptrKey, i + 1);   /* 卡片算已送达；点不点由玩家决定 */
            return;
        }
        done(0);
    }

    function afterPhase(phase, fast) {
        /* main 播完停在远程卡片；tail 播完就停（等玩家换设备） */
    }

    function acceptRemote(btn) {
        if (window.XY_IS_MOBILE) {
            btn.disabled = true;
            btn.textContent = "连接失败";
            localStorage.setItem("xy_stage", "mobile-wait");
            setTimeout(function () { play("tail", ptr("xy_ip_tail"), false); }, 500);
        } else {
            btn.disabled = true;
            btn.textContent = "正在连接…";
            connectAnim();
        }
    }

    function connectAnim() {
        var overlay = $("#connect-overlay"), steps = $("#co-steps");
        overlay.hidden = false;
        var lines = [
            "正在建立加密通道…",
            "验证设备指纹 " + DB.CONFIG.daughter.device + "…",
            "已连接：" + DB.CONFIG.daughter.name + "的电脑"
        ];
        steps.innerHTML = lines.map(function (l) { return "<div><i></i>" + esc(l) + "</div>"; }).join("");
        var items = steps.children;
        var k = 0;
        var timer = setInterval(function () {
            if (k > 0) items[k - 1].classList.add("ok");
            if (k >= items.length) {
                clearInterval(timer);
                localStorage.setItem("xy_stage", "desktop");
                setTimeout(function () { location.href = "pc.html"; }, 700);
                return;
            }
            items[k].classList.add("on");
            k++;
        }, 850);
    }

    /* ---------------- 启动 ---------------- */
    document.addEventListener("DOMContentLoaded", function () {
        titleEl.textContent = "微信";
        var savedMain = ptr("xy_ip_main");
        if (savedMain > 0) {
            /* 快进已看过的部分 */
            var fastUpto = function (phase, count, thenLive) {
                var seq = PHASES[phase];
                var orig = play;
                /* 直接同步重放 */
                for (var i = 0; i < Math.min(count, seq.length); i++) {
                    var b = seq[i];
                    if (b.sys) addSys(b.sys);
                    else if (b.m) addRow("them", esc(b.m));
                    else if (b.shot) { addRow("them", window.renderShotHTML(b.shot), true); if (b.clue) CLUE.found(b.clue); }
                    else if (b.r) addRow("me", esc(b.r[choices[phase + ":" + i] || 0]));
                    else if (b.friend) {
                        var card = el('<div class="wx-sys" style="background:none;padding:0;"></div>');
                        card.innerHTML = friendCardHtml(true);
                        msgs.appendChild(card);
                    }
                    else if (b.card === "remote") {
                        var row = addRow("them", remoteCardHtml(false), true);
                        var btn = row.querySelector("button");
                        if (window.XY_IS_MOBILE && localStorage.getItem("xy_stage") === "mobile-wait") {
                            btn.disabled = true;
                            btn.textContent = "等待电脑端连接";
                        }
                        btn.onclick = function () { acceptRemote(this); };
                    }
                }
                if (thenLive && count < seq.length) play(phase, count, false);
            };
            titleEl.textContent = momName;
            fastUpto("main", savedMain, true);
            var savedTail = ptr("xy_ip_tail");
            if (savedTail > 0) {
                /* 尾段看过多少快进多少；只在移动端继续往下播 */
                fastUpto("tail", savedTail, !!window.XY_IS_MOBILE);
            } else if (localStorage.getItem("xy_stage") === "mobile-wait" && window.XY_IS_MOBILE) {
                /* 点了接受但尾段还没开始就刷新了 */
                setTimeout(function () { play("tail", 0, false); }, 600);
            }
            scroll();
        } else {
            setTimeout(function () {
                titleEl.textContent = momName;
                play("main", 0, false);
            }, 600);
        }
    });
})();
