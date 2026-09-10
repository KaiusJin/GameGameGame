/* =====================================================================
   查看器：txt（记事本白底）/ 图片（假元数据面板）/ pdf（红头文书 .doc-*）
   / eml（邮件）/ audio（录音播放器 + 逐句转写）
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var audioTimer = null;

    /* 记事本（照 ningning）：菜单栏 + 可编辑 textarea + 状态栏；改动按文件存进 flags.edit_<id> */
    function txtHtml(f) {
        var edited = STATE.get("edit_" + f.id);
        var text = edited != null ? edited : T(f.bodyRef);
        return '<div class="np-menu">' + ["np.m1", "np.m2", "np.m3", "np.m4", "np.m5"].map(function (r) { return "<span>" + esc(T(r)) + "</span>"; }).join("") + "</div>" +
            '<textarea class="np-input" id="np-input" spellcheck="false">' + esc(text) + "</textarea>" +
            '<div class="np-status"><span class="np-l"></span><span class="np-r"><i>' + esc(T("np.status.pos")) + "</i><i>" + esc(T("np.status.zoom")) + "</i><i>" + esc(T("np.status.eol")) + "</i><i>" + esc(T("np.status.enc")) + "</i></span></div>";
    }
    function bindNotepad(f) {
        var ta = $("#np-input");
        if (!ta) return;
        var timer = null;
        ta.addEventListener("input", function () {
            clearTimeout(timer);
            var v = ta.value;
            timer = setTimeout(function () { STATE.set("edit_" + f.id, v); }, 300);
        });
    }
    function imgHtml(src, metaRefs) {
        var meta = (metaRefs || []).map(function (r) { return "<li>" + esc(T(r)) + "</li>"; }).join("");
        return (
            '<div class="viewer-split">' +
            '<div class="viewer-stage"><img class="viewer-img" src="' + src + '" alt=""></div>' +
            (meta ? '<div class="viewer-meta"><h4>' + esc(T("file.photo.metaTitle")) + "</h4><ul>" + meta + "</ul></div>" : "") +
            "</div>"
        );
    }
    function docHtml(f) {
        var d = f.doc;
        var html = '<div class="doc-page">';
        if (d.orgRef) html += '<div class="doc-org">' + esc(T(d.orgRef)) + '</div><div class="doc-rule"></div>';
        if (d.serialRef) html += '<div class="doc-serial">' + esc(T(d.serialRef)) + "</div>";
        html += '<div class="doc-title">' + esc(T(d.titleRef)) + "</div>";
        html += '<div class="doc-body">' + d.bodyRefs.map(function (r) { return "<p>" + esc(T(r)) + "</p>"; }).join("") + "</div>";
        if (d.dateRef) html += '<div class="doc-date">' + esc(T(d.dateRef)) + "</div>";
        if (d.stamp && d.orgRef) html += '<div class="doc-stamp"><span>' + esc(T(d.orgRef)) + "</span></div>";
        if (d.noteRef) html += '<div class="doc-note">' + esc(T(d.noteRef)) + "</div>";
        html += "</div>";
        return html;
    }
    function mailHtml(f) {
        var m = f.mail;
        return '<div class="viewer-mail">' +
            '<div class="vm-subj">' + esc(T(m.subjRef)) + "</div>" +
            '<div class="vm-head"><div><b>' + esc(T("mail.from")) + "</b>" + esc(T(m.fromRef)) + "</div>" +
            '<div><b>' + esc(T("mail.to")) + "</b>" + esc(T(m.toRef)) + "</div>" +
            '<div><b>' + esc(T("mail.date")) + "</b>" + esc(T(m.dateRef)) + "</div></div>" +
            '<pre class="vm-body">' + esc(T(m.bodyRef)) + "</pre>" +
            (m.sigRef ? '<pre class="vm-sig">' + esc(T(m.sigRef)) + "</pre>" : "") +
            "</div>";
    }
    function audioHtml(f) {
        var a = f.audio;
        return '<div class="viewer-audio">' +
            '<div class="au-player"><button class="au-play" id="au-play">▶</button><div class="au-bar"><i id="au-fill"></i></div><span class="au-time" id="au-time">00:00 / ' + esc(fmt(a.dur)) + "</span></div>" +
            '<div class="au-name">' + esc(T(f.nameRef)) + "</div>" +
            '<h4>' + esc(T("audio.transcript")) + "</h4>" +
            '<div class="au-lines" id="au-lines">' + a.lines.map(function (l, i) {
                return '<div class="au-line" data-at="' + l.at + '">' + (l.pause ? '<em>' + esc(T(l.ref)) + "</em>" : esc(T(l.ref))) + "</div>";
            }).join("") + "</div></div>";
    }
    /* 视频：Windows"电影和电视"式的播放失败页 + 右侧属性面板（时长 / 创建时间 / 设备 / 原始文件名是线索） */
    function videoHtml(f) {
        var meta = (f.metaRefs || []).map(function (r) { return "<li>" + esc(T(r)) + "</li>"; }).join("");
        return '<div class="viewer-split">' +
            '<div class="viewer-stage vv"><div class="vv-err"><div class="vv-ico">!</div><b>' + esc(T("video.err.title")) + "</b><p>" + esc(T("video.err.body")) + "</p><small>" + esc(T("video.err.code")) + "</small></div></div>" +
            (meta ? '<div class="viewer-meta"><h4>' + esc(T("file.photo.metaTitle")) + "</h4><ul>" + meta + "</ul></div>" : "") +
            "</div>";
    }
    function fmt(s) { s = Math.floor(s); return ("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + (s % 60)).slice(-2); }
    /* 录音播放：有 a.src（正式配音文件，放 audio/ 下）就走真实音频，进度跟 currentTime；
       没有就按 a.dur 走秒表（占位）。转写逐句按 at 秒显示，两种模式一致。 */
    var audioEl = null;
    function runAudio(f) {
        var a = f.audio, t = 0, playing = true;
        var fill = $("#au-fill"), time = $("#au-time"), btn = $("#au-play"), lines = $("#au-lines");
        clearInterval(audioTimer);
        if (audioEl) { try { audioEl.pause(); } catch (e) { } audioEl = null; }
        if (a.src) {
            var el = new Audio(a.src);
            audioEl = el;
            el.addEventListener("loadedmetadata", function () { if (isFinite(el.duration) && el.duration > 0) a.dur = Math.round(el.duration); paint(); });
            el.addEventListener("timeupdate", function () { t = el.currentTime; paint(); });
            el.addEventListener("ended", function () {
                playing = false; t = a.dur; paint();
                if (a.doneFlag) STATE.set(a.doneFlag);
                STATE.emit("audio-end:" + f.id);
            });
            el.addEventListener("error", function () { audioEl = null; a.src = null; runAudio(f); });
            el.play().catch(function () { playing = false; paint(); });
            paint();
            btn.addEventListener("click", function () { playing = !playing; if (playing) el.play().catch(function () { }); else el.pause(); paint(); });
            return;
        }
        function paint() {
            fill.style.width = Math.min(100, t / a.dur * 100) + "%";
            time.textContent = fmt(Math.min(t, a.dur)) + " / " + fmt(a.dur);
            lines.querySelectorAll(".au-line").forEach(function (el) { if (+el.dataset.at <= t) el.classList.add("show"); });
            btn.textContent = playing ? "❚❚" : "▶";
        }
        paint();
        audioTimer = setInterval(function () {
            if (!playing) return;
            t += 1;
            paint();
            if (t >= a.dur) {
                clearInterval(audioTimer); playing = false; paint();
                if (a.doneFlag) STATE.set(a.doneFlag);
                STATE.emit("audio-end:" + f.id);
            }
        }, 1000);
        btn.addEventListener("click", function () { playing = !playing; paint(); });
        if (window.FX) FX.scare("message.mp3", { rate: 0.3, drive: 3, gain: 0.25 });
    }

    window.VIEWER = {
        open: function (f) {
            $("#viewer-title").textContent = T(f.nameRef) + (f.type === "txt" ? T("app.notepad.suffix") : "");
            var body = $("#viewer-body");
            clearInterval(audioTimer);
            if (audioEl) { try { audioEl.pause(); } catch (e) { } audioEl = null; }
            body.className = "viewer-body" + (f.type === "img" || f.type === "video" ? "" : " vb-light") + (f.type === "txt" ? " vb-txt" : "") + (f.type === "eml" ? " vb-mail" : "");
            if (f.type === "txt") body.innerHTML = txtHtml(f);
            else if (f.type === "img") body.innerHTML = imgHtml(f.img, f.metaRefs);
            else if (f.type === "pdf" && f.doc) body.innerHTML = docHtml(f);
            else if (f.type === "eml") body.innerHTML = mailHtml(f);
            else if (f.type === "audio") body.innerHTML = audioHtml(f);
            else if (f.type === "video") body.innerHTML = videoHtml(f);
            else body.innerHTML = '<pre class="viewer-txt">' + esc(T(f.bodyRef)) + "</pre>";
            openApp("viewer");
            body.scrollTop = 0;
            if (f.type === "audio") runAudio(f);
            if (f.type === "txt") bindNotepad(f);
        },
        openImg: function (src, title, metaRefs) {
            $("#viewer-title").textContent = title || "";
            var body = $("#viewer-body");
            clearInterval(audioTimer);
            body.className = "viewer-body";
            body.innerHTML = imgHtml(src, metaRefs);
            openApp("viewer");
        }
    };
})();
