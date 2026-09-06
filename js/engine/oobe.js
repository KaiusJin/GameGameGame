/* =====================================================================
   Windows 10 首次设置（OOBE）。开机后、进桌面前的那一串蓝白页面。
   画面顺序照 Windows 10（1903–22H2）脱机流程：
   区域 → 键盘布局 → 第二种键盘布局 → 连接网络（我没有 Internet 连接 → 继续执行有限设置）
   → 许可协议 → 谁将会使用这台电脑 → 创建密码 →（确认密码 → 三个安全问题）
   → 活动历史记录 → Cortana → 隐私设置 → "嗨 / 这可能需要几分钟 / 正在为你准备一切"
   玩家在"谁将会使用这台电脑"里输入的名字存进 flags.player_name，
   之后求助单 #003、设备流转记录、结局都用它。
   所有文字走 DB.TEXT（oobe.*）与 DB.OOBE（列表数据）。
   ===================================================================== */
(function () {
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    var root = null, done = null;
    var st = { name: "", pwd: "", qi: 0, region: -1, kb: 0 };

    function D() { return (window.DB && DB.OOBE) || {}; }

    /* 通用页面骨架：标题 / 副标题 / 内容 / 底部按钮 */
    function page(o) {
        root.className = "oobe-light" + (o.cls ? " " + o.cls : "");
        root.innerHTML =
            '<div class="ob-wrap">' +
            '<h1 class="ob-title">' + esc(o.title) + "</h1>" +
            (o.sub ? '<p class="ob-sub">' + esc(o.sub) + "</p>" : "") +
            '<div class="ob-content">' + (o.content || "") + "</div>" +
            "</div>" +
            '<div class="ob-foot">' +
            '<div class="ob-foot-l">' +
            '<span class="ob-ico" title="' + esc(T("oobe.ease")) + '"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="4.5" r="2"/><path d="M4 9.5c3 .8 5.5 1.2 8 1.2s5-.4 8-1.2M12 10.7v4.3M12 15l-3.2 6M12 15l3.2 6"/></svg></span>' +
            '<span class="ob-ico" title="' + esc(T("oobe.volume")) + '"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg></span>' +
            (o.link ? '<a class="ob-link" id="ob-link">' + esc(o.link) + "</a>" : "") +
            "</div>" +
            '<div class="ob-foot-r">' +
            (o.secondary ? '<button class="ob-btn sec" id="ob-sec">' + esc(o.secondary) + "</button>" : "") +
            (o.primary ? '<button class="ob-btn" id="ob-pri"' + (o.disabled ? " disabled" : "") + ">" + esc(o.primary) + "</button>" : "") +
            '<span class="ob-ico pw" title="' + esc(T("oobe.power")) + '"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/></svg></span>' +
            "</div></div>";
        var p = root.querySelector("#ob-pri"), s = root.querySelector("#ob-sec"), l = root.querySelector("#ob-link");
        if (p && o.onPrimary) p.addEventListener("click", o.onPrimary);
        if (s && o.onSecondary) s.addEventListener("click", o.onSecondary);
        if (l && o.onLink) l.addEventListener("click", o.onLink);
        root.scrollTop = 0;
    }
    function listHtml(items, sel) {
        return '<div class="ob-list">' + items.map(function (it, i) {
            return '<div class="ob-item' + (i === sel ? " on" : "") + '" data-i="' + i + '">' + esc(it) + "</div>";
        }).join("") + "</div>";
    }
    function bindList(onPick) {
        root.querySelectorAll(".ob-item").forEach(function (el) {
            el.addEventListener("click", function () {
                root.querySelectorAll(".ob-item").forEach(function (x) { x.classList.remove("on"); });
                el.classList.add("on");
                onPick(+el.dataset.i);
            });
        });
    }
    function setPrimary(enabled) { var p = root.querySelector("#ob-pri"); if (p) p.disabled = !enabled; }

    /* ---------------- 各页面 ---------------- */
    var steps = {
        region: function () {
            var items = D().regions || [];
            if (st.region < 0) st.region = D().regionDefault || 0;
            page({
                title: T("oobe.region.title"), content: listHtml(items, st.region), primary: T("oobe.yes"),
                onPrimary: function () { go("keyboard"); }
            });
            bindList(function (i) { st.region = i; });
            var on = root.querySelector(".ob-item.on"); if (on) on.scrollIntoView({ block: "center" });
        },
        keyboard: function () {
            var items = D().keyboards || [];
            page({
                title: T("oobe.kb.title"), sub: T("oobe.kb.sub"), content: listHtml(items, st.kb), primary: T("oobe.yes"),
                onPrimary: function () { go("keyboard2"); }
            });
            bindList(function (i) { st.kb = i; });
        },
        keyboard2: function () {
            page({
                title: T("oobe.kb2.title"), primary: T("oobe.kb2.add"), secondary: T("oobe.skip"),
                onPrimary: function () { go("network"); }, onSecondary: function () { go("network"); }
            });
        },
        network: function () {
            var wifi = D().wifi || [];
            var html = '<div class="ob-wifi">' + wifi.map(function (w, i) {
                return '<div class="ob-wf" data-i="' + i + '">' +
                    '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 20.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z"/><path d="M8.5 15.2a5 5 0 0 1 7 0l-1.3 1.3a3.2 3.2 0 0 0-4.4 0z" opacity="' + (w.bars > 1 ? 1 : .3) + '"/><path d="M5.6 12.3a9 9 0 0 1 12.8 0l-1.3 1.3a7.2 7.2 0 0 0-10.2 0z" opacity="' + (w.bars > 2 ? 1 : .3) + '"/><path d="M2.8 9.4a13 13 0 0 1 18.4 0l-1.3 1.3a11.2 11.2 0 0 0-15.8 0z" opacity="' + (w.bars > 3 ? 1 : .3) + '"/></svg>' +
                    '<div><div class="ob-wf-name">' + esc(w.ssid) + '</div><div class="ob-wf-sub">' + esc(T(w.secured ? "oobe.net.secured" : "oobe.net.open")) + "</div></div>" +
                    '<div class="ob-wf-form" hidden><input type="password" placeholder="' + esc(T("oobe.net.key")) + '" autocomplete="off"><button class="ob-btn small">' + esc(T("oobe.net.connect")) + '</button><div class="ob-wf-err"></div></div>' +
                    "</div>";
            }).join("") + "</div>";
            page({
                title: T("oobe.net.title"), sub: T("oobe.net.sub"), content: html, primary: T("oobe.next"), disabled: true,
                link: T("oobe.net.none"), onLink: function () { go("limited"); }
            });
            root.querySelectorAll(".ob-wf").forEach(function (el) {
                el.addEventListener("click", function (e) {
                    if (e.target.closest(".ob-wf-form")) return;
                    root.querySelectorAll(".ob-wf").forEach(function (x) { x.classList.remove("on"); x.querySelector(".ob-wf-form").hidden = true; });
                    el.classList.add("on");
                    var f = el.querySelector(".ob-wf-form");
                    f.hidden = false;
                    f.querySelector("input").focus();
                });
                var f = el.querySelector(".ob-wf-form");
                function tryConnect() {
                    var err = f.querySelector(".ob-wf-err");
                    err.textContent = T("oobe.net.connecting");
                    setTimeout(function () { err.textContent = T("oobe.net.fail"); }, 1600 + Math.random() * 900);
                }
                f.querySelector("button").addEventListener("click", tryConnect);
                f.querySelector("input").addEventListener("keydown", function (e) { if (e.key === "Enter") tryConnect(); });
            });
        },
        limited: function () {
            page({
                title: T("oobe.limited.title"), sub: T("oobe.limited.sub"),
                content: '<ul class="ob-bullets">' + ["oobe.limited.b1", "oobe.limited.b2", "oobe.limited.b3"].map(function (r) { return "<li>" + esc(T(r)) + "</li>"; }).join("") + "</ul>",
                primary: T("oobe.limited.go"), secondary: T("oobe.back"),
                onPrimary: function () { go("eula"); }, onSecondary: function () { go("network"); }
            });
        },
        eula: function () {
            page({
                title: T("oobe.eula.title"),
                content: '<div class="ob-eula">' + esc(T("oobe.eula.body")).split("\n").map(function (p) { return "<p>" + p + "</p>"; }).join("") + "</div>" +
                    '<p class="ob-note">' + esc(T("oobe.eula.note")) + "</p>",
                primary: T("oobe.accept"), onPrimary: function () { go("name"); }
            });
        },
        name: function () {
            page({
                title: T("oobe.name.title"), sub: T("oobe.name.sub"),
                content: '<div class="ob-field"><input id="ob-in" type="text" maxlength="20" placeholder="' + esc(T("oobe.name.ph")) + '" autocomplete="off" spellcheck="false" value="' + esc(st.name) + '"></div>',
                primary: T("oobe.next"), disabled: !st.name.trim(),
                onPrimary: function () { st.name = root.querySelector("#ob-in").value.trim(); go("password"); }
            });
            var inp = root.querySelector("#ob-in");
            inp.addEventListener("input", function () { setPrimary(!!inp.value.trim()); });
            inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && inp.value.trim()) { st.name = inp.value.trim(); go("password"); } });
            setTimeout(function () { inp.focus(); }, 60);
        },
        password: function () {
            page({
                title: T("oobe.pwd.title"), sub: T("oobe.pwd.sub"),
                content: '<div class="ob-field"><input id="ob-in" type="password" placeholder="' + esc(T("oobe.pwd.ph")) + '" autocomplete="off"></div>',
                primary: T("oobe.next"),
                onPrimary: function () { st.pwd = root.querySelector("#ob-in").value; go(st.pwd ? "confirm" : "activity"); }
            });
            var inp = root.querySelector("#ob-in");
            inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { st.pwd = inp.value; go(st.pwd ? "confirm" : "activity"); } });
            setTimeout(function () { inp.focus(); }, 60);
        },
        confirm: function () {
            page({
                title: T("oobe.pwd2.title"), sub: T("oobe.pwd2.sub"),
                content: '<div class="ob-field"><input id="ob-in" type="password" placeholder="' + esc(T("oobe.pwd2.ph")) + '" autocomplete="off"><div class="ob-err" id="ob-err"></div></div>',
                primary: T("oobe.next"),
                onPrimary: check
            });
            var inp = root.querySelector("#ob-in");
            function check() {
                if (inp.value === st.pwd) { st.qi = 0; go("question"); }
                else { root.querySelector("#ob-err").textContent = T("oobe.pwd2.mismatch"); inp.value = ""; inp.focus(); }
            }
            inp.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
            setTimeout(function () { inp.focus(); }, 60);
        },
        question: function () {
            var qs = D().questions || [];
            var opts = qs.map(function (q, i) { return '<option value="' + i + '"' + (i === st.qi ? " selected" : "") + ">" + esc(q) + "</option>"; }).join("");
            page({
                title: T("oobe.q.title"), sub: T("oobe.q.sub"),
                content: '<div class="ob-field"><label class="ob-label">' + esc(T("oobe.q.label").replace("{n}", st.qi + 1)) + "</label>" +
                    '<select id="ob-sel">' + opts + "</select>" +
                    '<input id="ob-in" type="text" placeholder="' + esc(T("oobe.q.ph")) + '" autocomplete="off"></div>',
                primary: T("oobe.next"), disabled: true,
                onPrimary: nextQ
            });
            var inp = root.querySelector("#ob-in");
            function nextQ() {
                if (!inp.value.trim()) return;
                st.qi++;
                if (st.qi >= 3) go("activity"); else go("question");
            }
            inp.addEventListener("input", function () { setPrimary(!!inp.value.trim()); });
            inp.addEventListener("keydown", function (e) { if (e.key === "Enter") nextQ(); });
            setTimeout(function () { inp.focus(); }, 60);
        },
        activity: function () {
            page({
                title: T("oobe.act.title"), sub: T("oobe.act.sub"),
                content: '<div class="ob-art"><svg viewBox="0 0 120 80" width="220" height="146"><rect x="4" y="10" width="70" height="46" rx="4" fill="#fff" stroke="#9db8d6"/><rect x="82" y="26" width="24" height="44" rx="4" fill="#fff" stroke="#9db8d6"/><rect x="12" y="20" width="54" height="6" rx="2" fill="#cfe3f7"/><rect x="12" y="32" width="40" height="6" rx="2" fill="#cfe3f7"/><rect x="88" y="34" width="12" height="6" rx="2" fill="#cfe3f7"/><path d="M76 40h6" stroke="#0078d7" stroke-width="2"/></svg></div>',
                primary: T("oobe.yes"), secondary: T("oobe.no"),
                onPrimary: function () { go("cortana"); }, onSecondary: function () { go("cortana"); }
            });
        },
        cortana: function () {
            page({
                title: T("oobe.cortana.title"), sub: T("oobe.cortana.sub"),
                content: '<div class="ob-art"><div class="ob-cortana"></div></div><p class="ob-note">' + esc(T("oobe.cortana.note")) + "</p>",
                primary: T("oobe.accept"), secondary: T("oobe.cortana.later"),
                onPrimary: function () { go("privacy"); }, onSecondary: function () { go("privacy"); }
            });
        },
        privacy: function () {
            var items = D().privacy || [];
            var html = '<div class="ob-priv">' + items.map(function (p, i) {
                return '<div class="ob-pv"><div class="ob-pv-t">' + esc(p.title) + '</div><div class="ob-pv-d">' + esc(p.desc) + "</div>" +
                    '<label class="ob-toggle"><input type="checkbox" checked data-i="' + i + '"><span class="ob-tg"></span><em>' + esc(T("oobe.on")) + "</em></label></div>";
            }).join("") + "</div>" +
                '<p class="ob-note">' + esc(T("oobe.priv.note")) + ' <a class="ob-a">' + esc(T("oobe.priv.more")) + "</a></p>";
            page({
                title: T("oobe.priv.title"), sub: T("oobe.priv.sub"), content: html, cls: "wide",
                primary: T("oobe.accept"), onPrimary: function () { go("finish"); }
            });
            root.querySelectorAll(".ob-toggle input").forEach(function (cb) {
                cb.addEventListener("change", function () { cb.parentNode.querySelector("em").textContent = T(cb.checked ? "oobe.on" : "oobe.off"); });
            });
        },
        finish: function () {
            /* 深蓝等待页：嗨 → 这可能需要几分钟 → 不要关闭电脑 → 正在为你准备一切 → 一切即将就绪 */
            root.className = "oobe-dark";
            root.innerHTML = '<div class="ob-blobs"><i></i><i></i><i></i></div><div class="ob-big" id="ob-big"></div>';
            var lines = [["oobe.fin.hi", 2200], ["oobe.fin.wait", 2600], ["oobe.fin.noff", 2600], ["oobe.fin.prep", 3200], ["oobe.fin.ready", 2200]];
            var i = 0, big = root.querySelector("#ob-big");
            (function next() {
                if (i >= lines.length) { STATE.set("player_name", st.name || T("player.default")); finishAll(); return; }
                big.classList.remove("show");
                setTimeout(function () {
                    big.textContent = T(lines[i][0]);
                    big.classList.add("show");
                    setTimeout(next, lines[i][1]);
                    i++;
                }, 500);
            })();
        }
    };
    function go(id) { steps[id](); }
    function finishAll() {
        root.classList.add("off");
        setTimeout(function () { root.remove(); root = null; if (done) done(); }, 900);
    }

    window.OOBE = {
        run: function (cb) {
            done = cb;
            root = document.createElement("div");
            root.id = "oobe";
            document.body.appendChild(root);
            go("region");
        }
    };
})();
