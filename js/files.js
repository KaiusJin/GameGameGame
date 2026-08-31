/* 下载文件夹 + 文件查看器。
   文件列表在 DB.FILES，文书内容在 DB.DOCS（红头样式在 css/apps.css .doc-*）。
   打开假文书 = 发现线索（doc id 与 CLUES id 一致，未知 id 由 CLUE 忽略）。 */
(function () {
    function $(s) { return document.querySelector(s); }
    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    var ICONS = { pdf: "image/file.png", doc: "image/file.png", img: "image/file.png", exe: "image/exe.png" };

    /* ---------------- 查看器 ---------------- */
    function officialHtml(d) {
        var html = '<div class="doc-page">';
        if (d.org) html += '<div class="doc-org">' + esc(d.org) + "</div>" + '<div class="doc-rule"></div>';
        html += '<div class="doc-serial">' + esc(d.serial) + "</div>";
        html += '<div class="doc-title">' + esc(d.title) + "</div>";
        html += '<div class="doc-body">' + d.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>";
        if (d.sign) html += '<div class="doc-sign">' + esc(d.sign) + "</div>";
        if (d.date) html += '<div class="doc-date">' + esc(d.date) + "</div>";
        if (d.stampText) html += '<div class="doc-stamp"><span>' + esc(d.stampText) + "</span></div>";
        html += "</div>";
        return html;
    }

    window.VIEWER = {
        open: function (docId) {
            var d = DB.DOCS[docId];
            if (!d) return;
            $("#viewer-title").textContent = d.tab;
            var body = $("#viewer-body");
            if (d.kind === "official") body.innerHTML = officialHtml(d);
            else body.innerHTML = '<img class="viewer-img" src="' + d.img + '" alt="">';
            window.openApp("viewer");
            body.scrollTop = 0;
            CLUE.found(docId);
        }
    };

    /* ---------------- 下载文件夹 ---------------- */
    document.addEventListener("DOMContentLoaded", function () {
        var list = $("#fx-list");
        list.innerHTML = DB.FILES.map(function (f, i) {
            return (
                '<div class="fx-row" data-i="' + i + '">' +
                '<span class="c-name"><img src="' + (ICONS[f.icon] || "image/file.png") + '" alt=""><span>' + esc(f.name) + "</span></span>" +
                '<span class="c-date">' + esc(f.time) + "</span>" +
                '<span class="c-size">' + esc(f.size) + "</span></div>"
            );
        }).join("");
        list.querySelectorAll(".fx-row").forEach(function (row) {
            row.addEventListener("dblclick", function () { openFile(+row.dataset.i); });
            row.addEventListener("click", function () {
                list.querySelectorAll(".fx-row").forEach(function (r) { r.style.background = ""; });
            });
        });
        function openFile(i) {
            var f = DB.FILES[i];
            if (f.dialog) {
                window.sysDialog("系统", esc(f.dialog), [{ label: "确定", primary: true }]);
                return;
            }
            if (f.doc) window.VIEWER.open(f.doc);
        }
    });
})();
