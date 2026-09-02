/* =====================================================================
   查看器：txt 纯文本 / 图片（带假元数据面板）/ pdf（红头文书样式复用 .doc-*）
   由文件管理器调用，无桌面图标。
   ===================================================================== */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function txtHtml(f) {
        return '<pre class="viewer-txt">' + esc(T(f.bodyRef)) + "</pre>";
    }
    function imgHtml(f) {
        var meta = (f.metaRefs || []).map(function (r) {
            return "<li>" + esc(T(r)) + "</li>";
        }).join("");
        return (
            '<div class="viewer-split">' +
            '<div class="viewer-stage"><img class="viewer-img" src="' + f.img + '" alt=""></div>' +
            (meta
                ? '<div class="viewer-meta"><h4>' + esc(T("file.photo.metaTitle")) + "</h4><ul>" + meta + "</ul></div>"
                : "") +
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
        html += "</div>";
        return html;
    }

    window.VIEWER = {
        open: function (f) {
            $("#viewer-title").textContent = T(f.nameRef);
            var body = $("#viewer-body");
            /* txt 走记事本式白底；图片/文书保持深色 PDF 阅读器底 */
            body.classList.toggle("vb-txt", f.type === "txt");
            if (f.type === "txt") body.innerHTML = txtHtml(f);
            else if (f.type === "img") body.innerHTML = imgHtml(f);
            else if (f.type === "pdf" && f.doc) body.innerHTML = docHtml(f);
            else body.innerHTML = '<pre class="viewer-txt">' + esc(T(f.bodyRef)) + "</pre>";
            openApp("viewer");
            body.scrollTop = 0;
        }
    };
})();
