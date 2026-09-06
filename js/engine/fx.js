/* =====================================================================
   特效层：音效 / 屏幕故障 / 黑入过场 / 蓝屏。
   音效播放学 ningning：new Audio().play().catch() 静默失败。
   借用的音频登记在 BORROWED_ASSETS.txt。所有文字走 T()。
   ===================================================================== */
(function () {
    function sound(name, vol) {
        try {
            var a = new Audio("audio/" + name);
            if (vol != null) a.volume = vol;
            a.play().catch(function () { });
            return a;
        } catch (e) { return null; }
    }

    /* ---------------- Web Audio：把现成的 Windows 音效"如法炮制"成恐怖变体 ----------------
       scare(name, {rate, drive, gain, reverse, at})：变速（rate<1 变低变慢）+ 波形失真 + 增益过载 + 倒放。
       同一条 mp3 能出好几种声音，不用新素材。AudioContext 在玩家点过"是"之后才创建，不会被自动播放策略拦。 */
    var actx = null, bufCache = {};
    function ctx() {
        if (!actx) {
            try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
        }
        if (actx.state === "suspended") actx.resume().catch(function () { });
        return actx;
    }
    document.addEventListener("mousedown", function () { ctx(); }, { once: true });
    function loadBuf(name, cb) {
        if (bufCache[name]) { cb(bufCache[name]); return; }
        var c = ctx();
        if (!c) return;
        fetch("audio/" + name).then(function (r) { return r.arrayBuffer(); })
            .then(function (ab) { return c.decodeAudioData(ab); })
            .then(function (b) { bufCache[name] = b; cb(b); })
            .catch(function () { });
    }
    function curve(k) {
        var n = 1024, arr = new Float32Array(n);
        for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; arr[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
        return arr;
    }
    function scare(name, o) {
        o = o || {};
        var c = ctx();
        if (!c) { sound(name, o.gain); return; }
        loadBuf(name, function (buf) {
            if (o.reverse) {
                var rb = c.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
                for (var ch = 0; ch < buf.numberOfChannels; ch++) {
                    rb.getChannelData(ch).set(Array.prototype.slice.call(buf.getChannelData(ch)).reverse());
                }
                buf = rb;
            }
            var src = c.createBufferSource();
            src.buffer = buf;
            src.playbackRate.value = o.rate || 1;
            var shaper = c.createWaveShaper();
            shaper.curve = curve(o.drive != null ? o.drive : 8);
            var g = c.createGain();
            g.gain.value = o.gain != null ? o.gain : 1;
            src.connect(shaper); shaper.connect(g); g.connect(c.destination);
            src.start(c.currentTime + (o.at || 0));
        });
    }

    /* 接入别人电脑期间的底噪：棕噪声 + 电流哼声 + 随机爆点，全部实时合成 */
    var amb = null;
    var ambient = {
        start: function () {
            if (amb) return;
            var c = ctx();
            if (!c) return;
            var len = c.sampleRate * 4, nb = c.createBuffer(1, len, c.sampleRate), d = nb.getChannelData(0), last = 0;
            for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
            var noise = c.createBufferSource(); noise.buffer = nb; noise.loop = true;
            var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
            var ng = c.createGain(); ng.gain.value = 0.10;
            noise.connect(lp); lp.connect(ng); ng.connect(c.destination); noise.start();
            var hum = c.createOscillator(); hum.type = "sawtooth"; hum.frequency.value = 50;
            var hg = c.createGain(); hg.gain.value = 0.018;
            hum.connect(hg); hg.connect(c.destination); hum.start();
            var crack = setInterval(function () {
                if (Math.random() < 0.35) scare("windowsError.mp3", { rate: 0.25 + Math.random() * 0.3, drive: 25, gain: 0.12 });
            }, 2600);
            amb = { stop: function () { noise.stop(); hum.stop(); clearInterval(crack); } };
        },
        stop: function () { if (amb) { amb.stop(); amb = null; } }
    };

    var GLITCH_CHARS = ["▒▒▒▒", "█▓▒░", "☒☒☒", "¿¿¿¿¿", "␀␀␀", "ERR", "0x0", "▚▞▚▞", "§§§§", "……"];
    function scrambleLabels(ms) {
        var labels = Array.prototype.slice.call(document.querySelectorAll(".desktop-icon .label, .task-item span"));
        var orig = labels.map(function (el) { return el.textContent; });
        var iv = setInterval(function () {
            labels.forEach(function (el) {
                if (Math.random() < 0.5) el.textContent = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
            });
        }, 70);
        setTimeout(function () {
            clearInterval(iv);
            labels.forEach(function (el, i) { el.textContent = orig[i]; });
        }, ms);
    }

    /* 全屏故障闪烁 + 文字乱码 */
    function glitch(ms) {
        ms = ms || 900;
        var ov = document.createElement("div");
        ov.id = "fx-glitch";
        document.body.appendChild(ov);
        scrambleLabels(ms);
        setTimeout(function () { ov.remove(); }, ms);
    }

    /* ---------------- 黑入过场（约 3.6 秒）----------------
       巨响 + 红闪 + 老电视条纹 + 疯狂弹窗 → 白闪 → 黑 → cb（登录界面） */
    function hackIn(cb) {
        var ov = document.createElement("div");
        ov.id = "hack-overlay";
        ov.innerHTML = '<div class="hk-stripes"></div><div class="hk-red"></div><div class="hk-wins"></div><div class="hk-white"></div>';
        document.body.appendChild(ov);
        /* 三层：原版爆音 + 蓝屏音慢放失真 + 通知音倒放 */
        sound("windows-10-foreground-earrape.mp3", 1);
        scare("windows-10-bsod-sound.mp3", { rate: 0.55, drive: 14, gain: 1.4, at: 0.3 });
        scare("windows-10-notify-system-sound.mp3", { rate: 0.35, drive: 20, gain: 1.2, reverse: true, at: 1.4 });
        scrambleLabels(2800);

        var wins = ov.querySelector(".hk-wins");
        var lines = ["hack.l1", "hack.l2", "hack.l3", "hack.l4", "hack.l5", "hack.l6"];
        var n = 0;
        var spawn = setInterval(function () {
            if (n++ > 30) { clearInterval(spawn); return; }
            var w = document.createElement("div");
            w.className = "hk-win";
            var W = 220 + Math.random() * 300, H = 90 + Math.random() * 160;
            w.style.width = W + "px"; w.style.height = H + "px";
            w.style.left = Math.random() * (window.innerWidth - W) + "px";
            w.style.top = Math.random() * (window.innerHeight - H) + "px";
            var body = "";
            for (var i = 0; i < 4; i++) {
                body += "<div>" + T(lines[(n + i) % lines.length]) + "  " +
                    Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase() + "</div>";
            }
            w.innerHTML = '<div class="hk-title">C:\\WINDOWS\\system32\\cmd.exe</div><div class="hk-body">' + body + "</div>";
            wins.appendChild(w);
        }, 85);

        setTimeout(function () { ov.classList.add("flash"); }, 2900);
        setTimeout(function () { ov.classList.add("black"); wins.innerHTML = ""; }, 3050);
        setTimeout(function () { if (cb) cb(); }, 3600);
        setTimeout(function () { ov.remove(); }, 4200);
    }

    /* 断开（约 1 秒） */
    function hackOut(cb) {
        var ov = document.createElement("div");
        ov.id = "hack-overlay";
        ov.className = "out";
        ov.innerHTML = '<div class="hk-stripes"></div><div class="hk-black"></div>';
        document.body.appendChild(ov);
        scare("message.mp3", { rate: 0.45, drive: 12, gain: 0.9, reverse: true });
        scrambleLabels(900);
        setTimeout(function () { if (cb) cb(); }, 900);
        setTimeout(function () { ov.remove(); }, 1400);
    }

    /* ---------------- 蓝屏 ----------------
       故障 2.5s → 蓝屏计数 → 黑 → 开机快进 → cb */
    function bsod(cb) {
        glitch(2500);
        /* 错误音叠三层、越来越慢，像机器在挣扎 */
        scare("windowsError.mp3", { rate: 0.8, drive: 10, gain: 1.2 });
        scare("windowsError.mp3", { rate: 0.5, drive: 18, gain: 1.3, at: 0.7 });
        scare("windowsError.mp3", { rate: 0.28, drive: 30, gain: 1.5, at: 1.5 });
        setTimeout(function () {
            var ov = document.createElement("div");
            ov.id = "bsod";
            ov.innerHTML =
                '<div class="bs-face">' + T("bsod.face") + "</div>" +
                '<div class="bs-body">' + T("bsod.body") + "</div>" +
                '<div class="bs-pct"><span id="bs-pct">0</span>% ' + T("bsod.pct") + "</div>" +
                '<div class="bs-code">' + T("bsod.code") + "</div>";
            document.body.appendChild(ov);
            sound("windows-10-bsod-sound.mp3", 0.9);
            var pct = 0;
            var iv = setInterval(function () {
                pct = Math.min(100, pct + Math.floor(Math.random() * 15) + 5);
                document.getElementById("bs-pct").textContent = pct;
                if (pct >= 100) {
                    clearInterval(iv);
                    setTimeout(function () {
                        ov.className = "off";
                        ov.innerHTML = "";
                        setTimeout(function () {
                            ov.innerHTML = '<div class="bs-boot">' +
                                ["boot.l1", "boot.l2", "boot.l3", "boot.l4"].map(function (r) { return "<div>" + T(r) + "</div>"; }).join("") +
                                "</div>";
                            setTimeout(function () {
                                ov.remove();
                                if (cb) cb();
                            }, 1500);
                        }, 1200);
                    }, 800);
                }
            }, 450);
        }, 2500);
    }

    /* ---------------- 短暂黑屏（求助单弹出前、第三案开场） ---------------- */
    function blackout(ms, cb) {
        var ov = document.createElement("div");
        ov.id = "fx-black";
        document.body.appendChild(ov);
        scare("windows-10-bsod-sound.mp3", { rate: 0.4, drive: 6, gain: 0.5 });
        setTimeout(function () { ov.remove(); if (cb) cb(); }, ms || 1000);
    }

    /* ---------------- 微信来电铃声（实时合成，无素材） ---------------- */
    var ringTimer = null;
    function ringOnce() {
        var c = ctx();
        if (!c) { sound("message.mp3", 0.8); return; }
        var notes = [[880, 0], [1108, 0.16], [1318, 0.32], [1108, 0.62], [880, 0.78], [1318, 0.94]];
        notes.forEach(function (n) {
            var o = c.createOscillator(), g = c.createGain();
            o.type = "sine"; o.frequency.value = n[0];
            var t = c.currentTime + n[1];
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
            o.connect(g); g.connect(c.destination);
            o.start(t); o.stop(t + 0.3);
        });
    }
    function ringStart() {
        if (ringTimer) return;
        ringOnce();
        ringTimer = setInterval(ringOnce, 2400);
    }
    function ringStop() { if (ringTimer) { clearInterval(ringTimer); ringTimer = null; } }

    window.FX = { sound: sound, scare: scare, ambient: ambient, glitch: glitch, hackIn: hackIn, hackOut: hackOut, bsod: bsod, blackout: blackout, ringStart: ringStart, ringStop: ringStop };
})();
