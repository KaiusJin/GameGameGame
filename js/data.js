/* =====================================================================
   内容数据层（唯一的剧情源）。换剧情 = 换这个文件，不改代码。
   本版全部为纵切片占位文案：〔占位〕标记 = 待正式文案替换。

   结构（见 DESIGN.md 数据模型）：
   TEXT     文案表（所有 *ref 都指向这里；缺失时页面显示〔ref〕占位符）
   CONFIG   全局配置（游戏内起始时间等）
   TRIGGERS 触发器：条件 → 动作（解锁 / 弹窗 / 推进时间全在这）
   HINTS    亮点表：首个命中的条件决定当前唯一发光元素（规则 4）
   DEVICES  设备数据源：own = 玩家的二手电脑；t1 = 第一案目标的设备
   PAGES    假浏览器页面；NEWS 新闻站条目（独立数据源，死亡只在这里揭晓）
   TASKS    病毒软件的求助单；OWNERS 前任机主链（注释性数据）
   ===================================================================== */
window.DB = (function () {

    /* 占位图生成器：灰渐变 + 素材编号（正式美术后替换） */
    function ph(label, sub, hue, ratio, dark) {
        var w = 390, h = Math.round(w * (ratio || 1));
        var l1 = "hsl(" + hue + ",14%," + (dark ? 20 : 86) + "%)";
        var l2 = "hsl(" + ((hue + 45) % 360) + ",18%," + (dark ? 12 : 76) + "%)";
        var fg = dark ? "rgba(255,255,255,.72)" : "rgba(0,0,0,.42)";
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="' + l1 + '"/><stop offset="1" stop-color="' + l2 + '"/>' +
            "</linearGradient></defs>" +
            '<rect width="100%" height="100%" fill="url(#g)"/>' +
            '<text x="50%" y="46%" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="bold" fill="' + fg + '">' + label + "</text>" +
            (sub ? '<text x="50%" y="58%" text-anchor="middle" font-family="sans-serif" font-size="14" fill="' + fg + '">' + sub + "</text>" : "") +
            "</svg>";
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }

    var CONFIG = {
        startDate: { y: 2024, mo: 10, d: 3, h: 21, mi: 17 }
    };

    /* ================= 文案表 ================= */
    var TEXT = {
        /* --- 系统 UI（正式版也从这里换）--- */
        "ui.ok": "确定",
        "ui.cancel": "取消",
        "ui.toast.title": "系统通知",
        "ui.dlg.reset.title": "系统",
        "ui.dlg.reset.body": "确定要清除全部进度、重新开始吗？",
        "ui.dlg.locked.title": "无法打开",
        "ui.dlg.locked.body": "文件已损坏或被占用。〔占位：灰态文件的提示语〕",
        "ui.locked.tag": "无法访问",
        "ui.col.name": "名称",
        "ui.sm.restart": "重新开始（清除进度）",
        "folder.desktop": "桌面",
        "folder.downloads": "下载",
        "browser.snapshot": "〔占位：页面快照〕",

        /* --- 开机（阶段 0）--- */
        "boot.l1": "AMIBIOS (C) 2011  ...  Memory Test: 4096MB OK",
        "boot.l2": "Detecting IDE drives ... WDC WD5000AAKX",
        "boot.l3": "Boot from Hard Disk ...",
        "boot.l4": "〔占位：上一任机主的用户名〕 正在登录…",
        "tip.boot": "〔占位〕这台二手电脑没重装过系统。桌面上有前任机主留下的东西。",

        /* --- 应用名 --- */
        "app.mypc.title": "此电脑",
        "app.recycle.title": "回收站",
        "app.browser.title": "Google Chrome",
        "app.chat.title": "微信",
        "app.files.title": "文件",
        "app.viewer.title": "查看器",
        "app.virus.title": "ARGUS_9",

        /* --- 前任机主的 txt 链（占位，正式文案按 OWNERS 链重写）--- */
        "file.note1.name": "给下一位机主.txt",
        "file.note1.body": "〔占位·机主③〕\n你好。这台电脑是我卖掉的，硬盘我没舍得全格。\n有些东西你早晚会看到，我先说清楚：不是我装的。\n\n桌面上还有一个我写到一半的说明，你先看完那个再说。",
        "file.note2.name": "它删不掉.txt",
        "file.note2.body": "〔占位·机主③〕\n我试过所有办法：安全模式、格式化工具、拆硬盘。\n那个绿色窗口的软件会自己回来。\n\n卖电脑之前我最后试了一次。你现在看到这行字，说明它还在。\n\n（还有一封信，是上一任留给我的。我原样留给你。）",
        "file.note3.name": "如果你也开始收到任务.txt",
        "file.note3.body": "〔占位·机主②〕\n致捡到这台机器的人：\n它会给你派'求助单'。单子上的人是真的，事也是真的。\n我救过一个。我劝你别碰。\n\n为什么别碰——我不写了，你会自己明白。\n\n（软件在桌面上。你现在应该能看见它了。）",
        "tip.virus.found": "〔占位〕桌面上多了一个图标？不，它一直都在。",

        /* --- 前任机主的其他遗留物（氛围 + 查看器示例）--- */
        "file.photo.name": "IMG_2047.jpg",
        "file.photo.metaTitle": "详细信息",
        "file.photo.meta1": "拍摄设备：〔占位〕",
        "file.photo.meta2": "拍摄时间：2019/6/2 14:31〔占位：早于任何机主接手时间〕",
        "file.photo.meta3": "位置信息：已移除",
        "file.installer.name": "argus_setup.exe",
        "file.installer.dlg.title": "属性",
        "file.installer.dlg.body": "〔占位·来历②：文件属性〕<br>创建时间：2009-11-30 04:44<br>公司：〔占位：与关于页自称的来历矛盾〕<br>签名：无效",

        /* --- 病毒软件（黑绿终端）--- */
        "virus.header": "ARGUS_9 // remote-caretaker build 0.9.7〔占位〕",
        "virus.nav.tasks": "求助单",
        "virus.nav.about": "关于",
        "virus.nav.uninstall": "卸载",
        "virus.tasks.empty": "暂无求助单。保持在线。",
        "virus.tasks.hint": "〔占位〕它派的第一张单子。",
        "virus.about.body": "〔占位·来历①：关于页〕\n本程序由〔某国际人道组织〕开发，用于紧急联络失联人员。\n版本 0.9.7。已连续在线 4,096 天。\n\n（正式版：这里的自述必须与文件属性、前任 txt 互相矛盾，永不给标准答案。）",
        "virus.uninstall.btn": "卸载 ARGUS_9",
        "virus.uninstall.doing": "正在移除组件…",
        "virus.uninstall.fail.title": "卸载失败",
        "virus.uninstall.fail.body": "错误 0x00000709：句柄被外部进程持有。〔占位：删除永远失败的报错文案〕",
        "virus.enter.btn": "接入目标设备",
        "virus.exit.btn": "断开",
        "virus.monitor.bar": "已接入目标设备 · 只读",
        "virus.submit.btn": "回报：情况已核实",
        "virus.step.locked": "（先完成上一步）",

        /* --- 第一单（留学生虚拟绑架案，占位）--- */
        "task1.title": "求助单 #001",
        "task1.target": "〔占位〕林某，22 岁，留学生",
        "task1.brief": "〔占位·求助单〕她母亲收到勒索视频：女儿被绑，索要赎金。\n但视频里有些地方不对。\n核实她的处境。",
        "task1.step1": "查看她的聊天记录",
        "task1.step2": "查看她的浏览记录",
        "task1.step3": "查看她下载的文件",
        "tip.task1.new": "〔占位〕收到第一张求助单。",
        "tip.monitor": "〔占位〕你现在看到的是她的设备。只读。",
        "tip.hist": "〔占位〕聊天里提到她查过什么。去看她的浏览记录。",
        "tip.doc": "〔占位〕她下载过一份文件。去她的下载文件夹。",
        "tip.task1.ready": "〔占位〕三样都看过了。回软件回报。",
        "task1.done.title": "任务完成",
        "task1.done.body": "〔占位〕研判已回报：虚拟绑架，人是安全的。她的家人收到了提醒。<br><br>——你救了她。",
        "tip.days": "〔占位〕几天过去了。",
        "tip.news": "〔占位〕浏览器推送了一条本地新闻。",

        /* --- 目标 t1 的设备内容（全占位，正式版沿用反诈研究）--- */
        "t1.chat.scam.name": "王警官〔占位·骗子〕",
        "t1.chat.scam.preview": "明早九点，视频汇报。",
        "t1.chat.scam.m1": "〔占位〕你的案子进入保密阶段，不得对任何人提起。",
        "t1.chat.scam.m2": "〔占位〕好的王警官，我记住了。",
        "t1.chat.scam.m3": "〔占位〕手机今晚起交由我们'监管'，家人问就按教你的说。",
        "t1.chat.scam.m4": "〔占位〕我昨天查了一个词……不查了，我相信你们。",
        "t1.chat.scam.m5": "〔占位〕明早九点，视频汇报。",
        "t1.chat.mom.name": "妈妈",
        "t1.chat.mom.preview": "〔占位〕怎么不回消息",
        "t1.chat.mom.m1": "〔占位〕闺女，视频吗？",
        "t1.chat.mom.m2": "〔占位〕在忙。",
        "t1.hist.e1.title": "〔占位〕她搜过的关键词 / 看了一半的反诈视频",
        "t1.hist.e1.when": "3 天前",
        "t1.hist.e2.title": "〔占位〕普通浏览记录（正常生活）",
        "t1.hist.e2.when": "5 天前",
        "t1.hist.e3.title": "〔占位〕普通浏览记录（正常生活）",
        "t1.hist.e3.when": "上周",
        "t1.doc.name": "〔占位〕刑事拘留通知书.pdf",
        "t1.doc.org": "〔占位〕××市公安局",
        "t1.doc.serial": "〔占位〕文号（正式版：格式故意错误）",
        "t1.doc.title": "刑事拘留通知书",
        "t1.doc.p1": "〔占位〕假文书正文。正式版沿用反诈研究：真文书不发给本人、不存在'逮捕令'、'安全账户'话术。",
        "t1.doc.date": "〔占位〕日期",
        "t1.file2.name": "课程表.png",

        /* --- 浏览器 / 新闻站 --- */
        "browser.start.title": "起始页",
        "browser.address.hint": "输入网址",
        "browser.error.title": "无法访问此网站",
        "browser.error.body": "的响应时间过长。请检查网络连接，或稍后重试。",
        "browser.hist.title": "历史记录",
        "browser.hist.empty": "没有浏览记录。",
        "news.site": "晨间线报〔占位·新闻站名〕",
        "news.n0.head": "〔占位〕本地新闻：与剧情无关的日常报道",
        "news.n0.date": "10月2日",
        "news.n0.body": "〔占位〕填充用日常新闻正文。",
        "news.n1.head": "〔占位〕一名留学生意外身亡，警方称无他杀嫌疑",
        "news.n1.date": "10月6日",
        "news.n1.body": "〔占位·死亡只在新闻里揭晓〕死者林某，22 岁……细节与求助单档案吻合，但没有任何一个字提到你、提到软件。\n（正式版：写成完全普通的社会新闻，恐怖感来自玩家自己认出她。）",
        "news.n2.head": "〔占位〕本地新闻：天气 / 交通",
        "news.n2.date": "10月1日",
        "news.n2.body": "〔占位〕填充用日常新闻正文。",
        "tip.slice.end.title": "纵切片终点",
        "tip.slice.end.body": "〔占位〕她死了。软件已经在准备下一张求助单。<br><br>—— 第一周纵切片到此为止 ——",

        /* --- 聊天（own 设备）--- */
        "chat.own.empty": "〔占位〕你自己的微信。暂无会话。",
        "chat.monitor.input": "监控模式 · 只读",
        "chat.input": "",

        /* --- 此电脑 / 回收站 --- */
        "mypc.drives": "设备和驱动器 (2)",
        "recycle.empty": "回收站是空的〔占位：格式化失败的残留可以放这里〕"
    };

    /* ================= 触发器（结构级剧本）================= */
    var TRIGGERS = [
        { id: "tg-boot", on: "event:boot-done", do: [["phase", "p0"], ["toast", "tip.boot"]] },

        /* txt 链读完 → 病毒图标"出现" */
        {
            id: "tg-virus-found", on: "change",
            if: { all: [{ flag: "read_note3" }, { not: "virus_found" }] },
            do: [["set", "virus_found"], ["toast", "tip.virus.found"], ["badge", "virus", 1]]
        },
        { id: "tg-virus-open", on: "event:open-app:virus", if: { flag: "virus_found" }, do: [["set", "virus_opened"]] },

        /* 删除失败 → 第一张求助单 */
        {
            id: "tg-task1", on: "event:virus-delete-failed",
            do: [["set", "delete_attempted"],
            ["delay", 1400, [["set", "task1_active"], ["phase", "p1"],
            ["toast", "tip.task1.new", "virus"], ["badge", "virus", 1], ["flash", "virus"]]]]
        },

        /* 接入目标设备 */
        {
            id: "tg-enter", on: "event:enter-device:t1",
            do: [["set", "entered_t1"], ["toast", "tip.monitor"], ["open", "chat"]]
        },

        /* 解锁级联的路标：聊天 → 浏览记录 → 下载文件 */
        {
            id: "tg-to-hist", on: "change",
            if: { all: [{ flag: "t1_chat_read" }, { not: "t1_hist_read" }] },
            do: [["toast", "tip.hist", "browser"], ["badge", "browser", 1]]
        },
        {
            id: "tg-to-doc", on: "change",
            if: { all: [{ flag: "t1_hist_read" }, { not: "t1_doc_read" }] },
            do: [["toast", "tip.doc", "files"], ["badge", "files", 1]]
        },
        {
            id: "tg-ready", on: "change",
            if: { all: [{ flag: "t1_chat_read" }, { flag: "t1_hist_read" }, { flag: "t1_doc_read" }, { not: "task1_ready" }] },
            do: [["set", "task1_ready"], ["toast", "tip.task1.ready", "virus"], ["badge", "virus", 1], ["flash", "virus"]]
        },

        /* 回报 → 任务完成 → 推进时间 → 新闻出现（死亡只在新闻里）*/
        {
            id: "tg-submit", on: "event:task-submit:task1",
            do: [["set", "task1_done"], ["source", "own"],
            ["dialog", "task1.done.title", "task1.done.body"],
            ["delay", 1000, [["advance", 3], ["set", "time_advanced"], ["phase", "p1_5"], ["toast", "tip.days"]]],
            ["delay", 4500, [["set", "news1_out"], ["toast", "tip.news", "browser"], ["badge", "browser", 1], ["flash", "browser"]]]]
        },
        {
            id: "tg-news-read", on: "event:read-news:n1",
            do: [["set", "news1_read"],
            ["delay", 900, [["dialog", "tip.slice.end.title", "tip.slice.end.body"], ["set", "slice_end"]]]]
        }
    ];

    /* ================= 亮点表（首个命中生效；规则 4）================= */
    var HINTS = [
        { if: { not: "read_note1" }, target: "file:note1" },
        { if: { not: "read_note2" }, target: "file:note2" },
        { if: { not: "read_note3" }, target: "file:note3" },
        { if: { not: "virus_opened" }, target: "icon:virus" },
        { if: { not: "delete_attempted" }, target: "virus:uninstall" },
        { if: { all: [{ flag: "task1_active" }, { not: "entered_t1" }] }, target: "virus:enter" },
        { if: { all: [{ flag: "entered_t1" }, { not: "t1_chat_read" }] }, target: "chat:c_scam" },
        { if: { all: [{ flag: "t1_chat_read" }, { not: "t1_hist_read" }] }, target: "hist:e1" },
        { if: { all: [{ flag: "t1_hist_read" }, { not: "t1_doc_read" }] }, target: "file:t1_doc" },
        { if: { all: [{ flag: "task1_ready" }, { not: "task1_done" }] }, target: "virus:submit" },
        { if: { all: [{ flag: "news1_out" }, { not: "news1_read" }] }, target: "news:n1" }
    ];

    /* ================= 设备数据源 =================
       文件：{ id, folder:desktop|downloads, nameRef, type:txt|img|pdf|exe,
               bodyRef|img|metaRefs, visible:<cond>, locked:<cond 满足才解锁>,
               sets:<读后置起的 flag> }
       灰态规则：locked 未满足 → 显示但发灰，双击弹 ui.dlg.locked。 */
    var DEVICES = {
        own: {
            files: [
                { id: "note1", folder: "desktop", nameRef: "file.note1.name", type: "txt", bodyRef: "file.note1.body", sets: "read_note1" },
                { id: "note2", folder: "desktop", nameRef: "file.note2.name", type: "txt", bodyRef: "file.note2.body", locked: { flag: "read_note1" }, sets: "read_note2" },
                { id: "note3", folder: "desktop", nameRef: "file.note3.name", type: "txt", bodyRef: "file.note3.body", locked: { flag: "read_note2" }, sets: "read_note3" },
                {
                    id: "photo", folder: "downloads", nameRef: "file.photo.name", type: "img",
                    img: ph("素材 P1", "前任机主的遗留照片", 210, 0.66, true),
                    metaRefs: ["file.photo.meta1", "file.photo.meta2", "file.photo.meta3"]
                },
                { id: "installer", folder: "downloads", nameRef: "file.installer.name", type: "exe", dlgTitleRef: "file.installer.dlg.title", dlgBodyRef: "file.installer.dlg.body" }
            ],
            chats: [],
            history: []
        },
        t1: {
            files: [
                {
                    id: "t1_doc", folder: "downloads", nameRef: "t1.doc.name", type: "pdf",
                    doc: { orgRef: "t1.doc.org", serialRef: "t1.doc.serial", titleRef: "t1.doc.title", bodyRefs: ["t1.doc.p1"], dateRef: "t1.doc.date" },
                    locked: { flag: "t1_hist_read" }, sets: "t1_doc_read"
                },
                { id: "t1_file2", folder: "downloads", nameRef: "t1.file2.name", type: "img", img: ph("素材 T2", "目标·无关文件", 120, 0.8) }
            ],
            chats: [
                {
                    id: "c_scam", mode: "monitor", nameRef: "t1.chat.scam.name", previewRef: "t1.chat.scam.preview",
                    avatar: ph("素材 C1", "骗子头像", 220, 1, true), unread: 2, sets: "t1_chat_read",
                    messages: [
                        { from: "them", ref: "t1.chat.scam.m1" },
                        { from: "me", ref: "t1.chat.scam.m2" },
                        { from: "them", ref: "t1.chat.scam.m3" },
                        { from: "me", ref: "t1.chat.scam.m4" },
                        { from: "them", ref: "t1.chat.scam.m5" }
                    ]
                },
                {
                    id: "c_mom", mode: "monitor", nameRef: "t1.chat.mom.name", previewRef: "t1.chat.mom.preview",
                    avatar: ph("素材 C2", "母亲头像", 90, 1), unread: 0,
                    messages: [
                        { from: "them", ref: "t1.chat.mom.m1" },
                        { from: "me", ref: "t1.chat.mom.m2" }
                    ]
                }
            ],
            history: [
                { id: "e1", titleRef: "t1.hist.e1.title", url: "video.example/av1024", whenRef: "t1.hist.e1.when", locked: { flag: "t1_chat_read" }, sets: "t1_hist_read" },
                { id: "e2", titleRef: "t1.hist.e2.title", url: "shop.example/cart", whenRef: "t1.hist.e2.when" },
                { id: "e3", titleRef: "t1.hist.e3.title", url: "mail.example/inbox", whenRef: "t1.hist.e3.when" }
            ]
        }
    };

    /* ================= 浏览器页面 / 新闻 =================
       新闻是独立数据源：死亡只通过这里被玩家刷到（规则 3）。 */
    var PAGES = [
        { id: "pg_news", url: "www.morningwire.example", kind: "news", titleRef: "news.site" }
    ];
    var NEWS = [
        { id: "n1", headRef: "news.n1.head", dateRef: "news.n1.date", bodyRef: "news.n1.body", appears: { flag: "news1_out" } },
        { id: "n0", headRef: "news.n0.head", dateRef: "news.n0.date", bodyRef: "news.n0.body" },
        { id: "n2", headRef: "news.n2.head", dateRef: "news.n2.date", bodyRef: "news.n2.body" }
    ];

    /* ================= 求助单 ================= */
    var TASKS = [
        {
            id: "task1", target: "t1", visible: { flag: "task1_active" },
            titleRef: "task1.title", targetRef: "task1.target", briefRef: "task1.brief",
            avatar: ph("素材 T1", "目标·档案照", 0, 1, true),
            steps: [
                { ref: "task1.step1", done: { flag: "t1_chat_read" } },
                { ref: "task1.step2", done: { flag: "t1_hist_read" }, locked: { flag: "t1_chat_read" } },
                { ref: "task1.step3", done: { flag: "t1_doc_read" }, locked: { flag: "t1_hist_read" } }
            ],
            complete: { flag: "task1_ready" },
            doneFlag: "task1_done"
        }
    ];

    /* ================= 前任机主链（注释性数据，第二三案的钩子）================= */
    var OWNERS = [
        { id: "o3", order: 3, notes: ["note1", "note2"] },
        { id: "o2", order: 2, notes: ["note3"] },
        { id: "o1", order: 1, notes: [] }   /* 机主① 未留只言片语 —— 结局素材 */
    ];

    return {
        ph: ph, TEXT: TEXT, CONFIG: CONFIG,
        TRIGGERS: TRIGGERS, HINTS: HINTS,
        DEVICES: DEVICES, PAGES: PAGES, NEWS: NEWS,
        TASKS: TASKS, OWNERS: OWNERS
    };
})();
