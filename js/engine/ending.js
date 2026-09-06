/* =====================================================================
   结局序列：全屏黑，一句一句浮现，最后落标题 + "重新开始"。
   DB.ENDINGS[id] = { tagRef, titleRef, lines:[
       { ref, hold? }                                  一句话（hold 毫秒）
       { typewrite:[ [ref, deleteAfter], ... ] }       记事本里打字/删字（循环结局写信）
   ] }
   结局 id 存进 flags.ending；重进页面直接重放，不再开机。
   ===================================================================== */
(function () {
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var ov = null;

    function play(id) {
        var e = DB.ENDINGS && DB.ENDINGS[id];
        if (!e || ov) return;
        if (STATE.get("ending") !== id) STATE.set("ending", id);
        if (window.FX) { FX.ambient.stop(); FX.ringStop(); }
        if (window.WM) WM.closeAll();
        document.querySelectorAll(".sys-mask, #call-overlay, #vx-popup").forEach(function (m) { m.remove(); });
        ov = document.createElement("div");
        ov.id = "end-overlay";
        ov.innerHTML = '<div class="eo-stage" id="eo-stage"></div>';
        document.body.appendChild(ov);
        requestAnimationFrame(function () { ov.classList.add("show"); });
        var stage = ov.querySelector("#eo-stage");
        var lines = e.lines || [];
        var i = 0;
        setTimeout(next, 2400);

        function next() {
            if (i >= lines.length) { finale(); return; }
            var L = lines[i++];
            if (L.typewrite) { typewrite(L.typewrite, next); return; }
            var div = document.createElement("div");
            div.className = "eo-line";
            div.innerHTML = esc(T(L.ref)).split("\n").join("<br>");
            stage.innerHTML = "";
            stage.appendChild(div);
            requestAnimationFrame(function () { div.classList.add("show"); });
            var hold = L.hold != null ? L.hold : Math.max(2600, 900 + T(L.ref).length * 110);
            setTimeout(function () {
                div.classList.remove("show");
                setTimeout(next, 900);
            }, hold);
        }
        function typewrite(parts, cb) {
            stage.innerHTML = '<div class="eo-notepad"><div class="eo-np-bar">' + esc(T("end.notepad.title")) + '</div><pre class="eo-np-body" id="eo-np"></pre></div>';
            var pre = stage.querySelector("#eo-np");
            var wrap = stage.querySelector(".eo-notepad");
            requestAnimationFrame(function () { wrap.classList.add("show"); });
            var kept = "";
            var p = 0;
            function part() {
                if (p >= parts.length) { setTimeout(function () { wrap.classList.remove("show"); setTimeout(cb, 900); }, 2600); return; }
                var text = T(parts[p][0]), del = parts[p][1];
                var k = 0;
                (function typeChar() {
                    if (k < text.length) {
                        k++;
                        pre.textContent = kept + text.slice(0, k);
                        setTimeout(typeChar, 70 + Math.random() * 60);
                        return;
                    }
                    if (!del) { kept += text; p++; setTimeout(part, 700); return; }
                    setTimeout(function delChar() {
                        if (k > 0) { k--; pre.textContent = kept + text.slice(0, k); setTimeout(delChar, 38); return; }
                        p++; setTimeout(part, 600);
                    }, 1400);
                })();
            }
            setTimeout(part, 900);
        }
        function finale() {
            stage.innerHTML =
                '<div class="eo-final">' +
                '<div class="eo-tag">' + esc(T(e.tagRef)) + "</div>" +
                '<div class="eo-title">' + esc(T(e.titleRef)) + "</div>" +
                '<div class="eo-btns"><button id="eo-restart">' + esc(T("end.restart")) + "</button></div>" +
                "</div>";
            var f = stage.querySelector(".eo-final");
            requestAnimationFrame(function () { f.classList.add("show"); });
            stage.querySelector("#eo-restart").addEventListener("click", function () { STATE.reset(); });
        }
    }

    window.ENDING = { play: play, active: function () { return !!ov; }, reset: function () { if (ov) { ov.remove(); ov = null; } } };
})();
