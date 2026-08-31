/* 远程协助壳：
   - 顶栏（已连接设备名 / 倒计时接口 / 断开）
   - 任务栏时钟 = 玩家设备时间 + CONFIG.tzOffsetHours（她所在时区）
   - 母亲的协助聊天坞（事件驱动：connect / clue:<id> / idle / ending）
   - 第一章结束判定（DB.ENDING_GATE）与黑屏
   进度：xy_assist_log 触发过的事件顺序；xy_choices 复用开场的选项存储 */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    var C = DB.CONFIG;

    /* ---------------- 顶栏 ---------------- */
    document.addEventListener("DOMContentLoaded", function () {
        $("#rb-device").textContent = "已连接：" + C.daughter.name + "的电脑";
        $("#rb-sub").textContent = C.remoteBrand + " 远程协助 · 端到端加密 · 延迟 " + (140 + Math.floor(Math.random() * 90)) + "ms";
        $("#rb-quit").addEventListener("click", function () { REMOTE.quit(); });
    });

    /* ---------------- 时钟（她的时区） ---------------- */
    function tick() {
        var d = new Date(Date.now() + C.tzOffsetHours * 3600000);
        var t = $("#clock-time"), dt = $("#clock-date");
        if (!t) return;
        t.textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
        dt.textContent = d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + " · " + C.tzLabel;
    }

    /* ---------------- 倒计时接口（第一章不启用，后续接骗子的期限） ---------------- */
    var countdownTarget = null;
    function tickCountdown() {
        var el = $("#rb-countdown");
        if (!el) return;
        if (!countdownTarget) { el.hidden = true; return; }
        var left = countdownTarget - Date.now();
        if (left < 0) left = 0;
        var h = Math.floor(left / 3600000);
        var m = Math.floor(left % 3600000 / 60000);
        var s = Math.floor(left % 60000 / 1000);
        el.hidden = false;
        el.textContent = "剩余 " + ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2);
    }
    setInterval(function () { tick(); tickCountdown(); }, 1000);
    document.addEventListener("DOMContentLoaded", tick);

    /* ---------------- 协助聊天坞 ---------------- */
    var dock, msgs, replybar, badge;
    var queue = [];          /* {key, i} 待播节拍 */
    var playing = false;
    var doneKeys = {};       /* 触发过的事件 */
    var logOrder = [];
    var choices = {};
    try { choices = JSON.parse(localStorage.getItem("xy_choices") || "{}"); } catch (e) {}
    try { logOrder = JSON.parse(localStorage.getItem("xy_assist_log") || "[]"); } catch (e) {}
    logOrder.forEach(function (k) { doneKeys[k] = true; });

    function saveLog() { localStorage.setItem("xy_assist_log", JSON.stringify(logOrder)); }
    function saveChoice(key, idx) {
        choices[key] = idx;
        localStorage.setItem("xy_choices", JSON.stringify(choices));
    }

    function scroll() { msgs.scrollTop = msgs.scrollHeight; }
    function el(html) {
        var d = document.createElement("div");
        d.innerHTML = html;
        return d.firstChild;
    }
    function bump() {
        if (dock.classList.contains("collapsed")) {
            badge.hidden = false;
            badge.textContent = String(+badge.textContent + 1);
        }
    }
    function addThem(text) {
        msgs.appendChild(el('<div class="ad-msg them">' + esc(text) + "</div>"));
        scroll(); bump();
    }
    function addMe(text) {
        msgs.appendChild(el('<div class="ad-msg me">' + esc(text) + "</div>"));
        scroll();
    }
    function addShot(key) {
        msgs.appendChild(el('<div class="ad-msg them is-shot">' + window.renderShotHTML(key) + "</div>"));
        scroll(); bump();
    }
    var typingEl = null;
    function showTyping() {
        if (typingEl) return;
        typingEl = el('<div class="ad-msg them"><span class="ad-typing"><i></i><i></i><i></i></span></div>');
        msgs.appendChild(typingEl);
        scroll();
    }
    function hideTyping() {
        if (typingEl) { typingEl.remove(); typingEl = null; }
    }

    /* 播放队列：一次一拍；r 节拍等玩家点选 */
    function step() {
        if (playing) return;
        var item = queue.shift();
        if (!item) { checkEnding(); return; }
        playing = true;
        var seq = DB.ASSIST[item.key] || [];
        var b = seq[item.i];
        var done = function (delay) {
            playing = false;
            setTimeout(step, item.fast ? 0 : (delay || 300));
        };
        if (!b) { playing = false; step(); return; }

        if (b.m) {
            if (item.fast) { addThem(b.m); done(0); return; }
            showTyping();
            setTimeout(function () {
                hideTyping();
                addThem(b.m);
                done(380);
            }, Math.min(2200, 420 + b.m.length * 60));
            return;
        }
        if (b.shot) {
            if (item.fast) { addShot(b.shot); done(0); return; }
            showTyping();
            setTimeout(function () { hideTyping(); addShot(b.shot); done(600); }, 900);
            return;
        }
        if (b.r) {
            var ckey = "assist:" + item.key + ":" + item.i;
            if (choices[ckey] != null) {
                addMe(b.r[choices[ckey]]);
                done(0);
                return;
            }
            replybar.innerHTML = "";
            b.r.forEach(function (text, idx) {
                var btn = document.createElement("button");
                btn.textContent = text;
                btn.onclick = function () {
                    replybar.innerHTML = "";
                    saveChoice(ckey, idx);
                    addMe(text);
                    done(360);
                };
                replybar.appendChild(btn);
            });
            dock.classList.remove("collapsed");
            scroll();
            return;
        }
        done(0);
    }

    function trigger(key, fast) {
        if (!DB.ASSIST[key]) return;
        if (doneKeys[key]) return;
        doneKeys[key] = true;
        logOrder.push(key);
        saveLog();
        var seq = DB.ASSIST[key];
        for (var i = 0; i < seq.length; i++) queue.push({ key: key, i: i, fast: !!fast });
        step();
    }
    /* 重载时按原顺序快放已触发过的事件 */
    function replay(key) {
        var seq = DB.ASSIST[key] || [];
        for (var i = 0; i < seq.length; i++) {
            var b = seq[i];
            if (b.m) addThem(b.m);
            else if (b.shot) addShot(b.shot);
            else if (b.r) {
                var ckey = "assist:" + key + ":" + i;
                if (choices[ckey] != null) addMe(b.r[choices[ckey]]);
                else {
                    /* 停在没答完的选项上，从这里转活播 */
                    for (var j = i; j < seq.length; j++) queue.push({ key: key, i: j });
                    return;
                }
            }
        }
    }

    /* ---------------- 结束判定 ---------------- */
    function gateMet() {
        var g = DB.ENDING_GATE;
        for (var i = 0; i < g.need.length; i++) if (!CLUE.has(g.need[i])) return false;
        for (var j = 0; j < g.any.length; j++) if (CLUE.has(g.any[j])) return true;
        return false;
    }
    var endingQueued = false;
    function checkEnding() {
        if (endingQueued || doneKeys.ending) return;
        if (!gateMet()) return;
        endingQueued = true;
        setTimeout(function () {
            trigger("ending");
            /* ending 的最后一拍是 r；玩家点完后 queue 播空再进 checkEnding，
               此时 doneKeys.ending 已置位 → 落黑屏 */
            waitOverlay();
        }, 2600);
    }
    function waitOverlay() {
        var t = setInterval(function () {
            if (queue.length === 0 && !playing && replybar.children.length === 0) {
                clearInterval(t);
                setTimeout(showOverlay, 1800);
            }
        }, 400);
    }
    function showOverlay() {
        localStorage.setItem("xy_ended", "1");
        var ov = $("#ending-overlay");
        $("#eo-text").textContent = DB.ENDING.overlay;
        $("#eo-sub").textContent = DB.ENDING.sub;
        $("#eo-note").textContent = DB.ENDING.note;
        ov.hidden = false;
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { ov.classList.add("show"); });
        });
    }

    /* ---------------- 对外 ---------------- */
    window.REMOTE = {
        setCountdown: function (ts) { countdownTarget = ts || null; tickCountdown(); },
        quit: function () {
            sysDialog("ToDask 远程协助", "断开后将结束本次协助。<br>阿姨还在电话那头等着。", [
                { label: "取消" },
                {
                    label: "仍要断开", primary: true,
                    fn: function () {
                        localStorage.setItem("xy_stage", "");
                        location.href = "index.html";
                    }
                }
            ]);
        }
    };

    /* ---------------- 启动 ---------------- */
    document.addEventListener("DOMContentLoaded", function () {
        dock = $("#assist-dock");
        msgs = $("#ad-msgs");
        replybar = $("#ad-replybar");
        badge = $("#ad-badge");
        $("#ad-ava").src = DB.WECHAT.chats[0].avatar;
        $("#ad-name").textContent = C.mom.wx;
        $("#ad-head").addEventListener("click", function () {
            dock.classList.toggle("collapsed");
            if (!dock.classList.contains("collapsed")) {
                badge.hidden = true;
                badge.textContent = "0";
                scroll();
            }
        });

        /* 重载：快放触发过的事件（最后一个可能转活播） */
        if (logOrder.length) {
            var replayList = logOrder.slice();
            doneKeys = {};
            replayList.forEach(function (k) { doneKeys[k] = true; });
            replayList.forEach(replay);
            step();
        } else {
            setTimeout(function () { trigger("connect"); }, 1400);
        }

        /* 线索 → 事件 */
        CLUE.onFound(function (id) {
            clearTimeout(idleTimer);
            trigger("clue:" + id);
            checkEnding();
        });

        /* 60 秒没动静提示一次 */
        var idleTimer = setTimeout(function () {
            if (CLUE.count() <= 2) trigger("idle");   /* 开场自带 2 条线索 */
        }, 60000);

        /* 结束态重载：直接落黑屏（可返回桌面） */
        if (localStorage.getItem("xy_ended") === "1") {
            setTimeout(showOverlay, 800);
        }
        $("#eo-back").addEventListener("click", function () {
            var ov = $("#ending-overlay");
            ov.classList.remove("show");
            setTimeout(function () { ov.hidden = true; }, 300);
        });
        $("#eo-restart").addEventListener("click", function () {
            location.href = "index.html?reset";
        });
    });
})();
