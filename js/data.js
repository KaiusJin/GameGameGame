/* =====================================================================
   剧情内容数据层（唯一的剧情源，界面代码不写死任何剧情文本）
   换剧情 = 换这个文件，不改代码。设定见 DESIGN.md。

   命名：
   - 陈雨（女儿，小名小雨，多伦多）  妈妈（微信名"平安是福"）
   - 王警官（骗子，"临江市公安局"，虚构城市）
   - 玩家 = 陈雨的网友，无名
   所有头像/封面是灰色占位图（ph 生成器），图上印素材编号，对应 ASSETS.md
   ===================================================================== */
window.DB = (function () {

    /* 占位图生成器：灰渐变 + 素材编号 */
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

    /* ---------------- 全局配置 ---------------- */
    var CONFIG = {
        tzOffsetHours: -12,                    /* 任务栏时钟 = 玩家设备时间 - 12h（多伦多） */
        tzLabel: "多伦多",
        daughter: { name: "陈雨", nick: "小雨", device: "XIAOYU-T480", wx: "雨在多伦多", wxId: "rain_yu0416" },
        mom: { wx: "平安是福", remark: "妈妈" },
        cop: { wx: "临江市公安局-王警官" },
        remoteBrand: "ToDask",                 /* 远程软件（仿 ToDesk 变体） */
        videoSite: "biliblil"                  /* 假视频站（仿 B 站变体） */
    };

    /* 骗子教的"统一回复"。同一句话出现三次：
       ①保密承诺书条款 → ②她 8/28 发给妈妈的最后消息 → ③结尾"她回我了"的新消息。
       读过承诺书的玩家会在结尾认出原文。改动请三处同步。 */
    var S_REPLY = "我最近有点事在忙，不要担心，也不要跟别人说，过几天就好了";

    /* =====================================================================
       线索表（页面只读这份数据；tracking 引擎见 js/remote.js）
       每条：id / where 出现位置 / name / tragic 悲剧读法 / real 真实读法 /
             unlock 解锁条件（null = 一开始就算数；{clue:"x"} = 需先发现 x）
       ===================================================================== */
    var CLUES = [
        {
            id: "intro-call", where: "开场·母亲手机截图", name: "国外前缀的未接来电",
            tragic: "半夜打来的加拿大号码，是她借别人手机最后的求救",
            real: "境外改号来电试探家属，是骗局收网的前兆",
            unlock: null
        },
        {
            id: "last-msg", where: "开场·母亲转发截图", name: "她最后的消息",
            tragic: "“别问别说”——她惹了事，在躲",
            real: "“不要报警、不要跟别人说”是骗子教的原话",
            unlock: null
        },
        {
            id: "cop-chat", where: "女儿微信·王警官聊天", name: "微信里的“警官”",
            tragic: "警察都找上门了，她真的涉案",
            real: "公检法不会通过微信办案",
            unlock: null
        },
        {
            id: "doc-arrest", where: "下载文件夹·刑事拘留通知书", name: "假文书",
            tragic: "白纸黑字，她是嫌疑人",
            real: "真文书不会发给本人；文号格式错误；中国没有“逮捕令”这种文书",
            unlock: null
        },
        {
            id: "doc-secrecy", where: "下载文件夹·保密承诺书", name: "保密承诺书",
            tragic: "案件要保密，所以她谁也不能说",
            real: "要求切断一切联系＝制造失联的工具",
            unlock: { clue: "doc-arrest" }
        },
        {
            id: "call-log", where: "女儿微信·通话记录", name: "通话记录 ★锚点",
            tragic: "8月28日深夜妈妈打来17个电话，她一个都不敢接",
            real: "与“王警官”每天固定两小时通话＝日程化洗脑",
            unlock: null
        },
        {
            id: "search-history", where: "浏览器·最近搜索", name: "她搜过的词",
            tragic: "她搜“被调查 会遣返吗”，做贼心虚",
            real: "她搜“安全账户是什么”——她差一点就识破了",
            unlock: null
        },
        {
            id: "video-last", where: "biliblil·历史记录", name: "最后看的视频",
            tragic: "失联前夜凌晨3:40她还醒着",
            real: "最后看的是《留学生亲历“公检法”诈骗》，只看了一半",
            unlock: null
        }
    ];

    /* 第一章结束条件：三条集齐 */
    var ENDING_GATE = { need: ["doc-arrest", "call-log"], any: ["cop-chat", "search-history"] };

    /* =====================================================================
       开场脚本（index.html，玩家自己的微信视角）
       步骤类型：
       {sys:"..."}            居中灰条系统提示
       {friend:true}          好友申请卡片（接受后继续）
       {m:"..."}              妈妈的消息（自动带打字延迟）
       {r:["...", "..."]}     玩家可选回复（点了才继续，多选项走同一条线）
       {shot:"key", clue:id}  手机截图气泡（绘制样式见 SHOTS）
       {card:"remote"}        远程协助邀请卡片（点击后按设备分流）
       ===================================================================== */
    var INTRO = [
        { friend: true },
        { sys: "你已添加“平安是福”，现在可以开始聊天了。" },
        { m: "你好" },
        { m: "是小雨的朋友吧" },
        { m: "我是她妈妈" },
        { m: "冒昧加你 她以前跟我提过你 说你懂电脑" },
        { r: ["阿姨你好，我是。出什么事了吗？"] },
        { m: "小雨三天没有回我消息了" },
        { m: "电话打不通 一直是关机" },
        { m: "以前她最多一天就回 她怕我担心" },
        { r: ["会不会在忙期末或者兼职？", "别急，慢慢说。"] },
        { m: "不是的" },
        { m: "上个月开始她就不对" },
        { m: "说话躲躲闪闪 问她什么都说没事" },
        { m: "有一次视频 她眼睛是肿的 问她 她就说困" },
        { m: "昨天半夜还有个电话打给我 我睡着了没接到" },
        { shot: "momcalls", clue: "intro-call" },
        { m: "加拿大的号吧 这个加号" },
        { m: "是不是她用别人的手机打的" },
        { r: ["有可能。你回拨过吗？"] },
        { m: "打不通" },
        { m: "她最后就给我发了这个 你看" },
        { shot: "lastmsg", clue: "last-msg" },
        { m: "这不像她说话" },
        { m: "她从来不这样跟我说话" },
        { m: "我怕她出事 又怕她是做了什么傻事" },
        { r: ["阿姨，报警了吗？"] },
        { m: "打了国内110 说她是成年人 在国外 管不到" },
        { m: "大使馆的电话 一直占线" },
        { m: "我一个人 我不知道还能找谁了" },
        { m: "她大一的时候给我手机装了个远程的软件" },
        { m: "说我电脑坏了她可以帮我修 里面也有她的电脑" },
        { m: "我点开全是英文的 我不会弄" },
        { m: "你帮我看一眼行不行 就看一眼" },
        { m: "求你了" },
        { r: ["阿姨别急，把那个软件的邀请发我，我来连。"] },
        { m: "好 好 我找找" },
        { m: "是这个吧" },
        { card: "remote" }
    ];

    /* 移动端分支：点了远程卡片但在手机上 */
    var INTRO_MOBILE = [
        { sys: "手机端无法发起远程协助" },
        { m: "怎么了 是不是连不上" },
        { r: ["手机上连不了远程，我找台电脑。"] },
        { m: "好 好 那你快去" },
        { m: "我先把我这边能看到的发给你" },
        { shot: "momchat-cold" },
        { m: "你看 七月开始 她回我的话就这么短了" },
        { m: "以前她什么都跟我说的" },
        { m: "我就在这里等你 你连上了跟我说" },
        { sys: "请在电脑上打开本页继续 · 进度已保存" }
    ];

    /* 手机截图（绘制数据，样式在 css/chat.css .shot-*） */
    var SHOTS = {
        /* 母亲手机的通话记录：+1 未接来电 */
        momcalls: {
            type: "calls",
            title: "通话记录",
            rows: [
                { name: "+1 (437) 555-0139", sub: "加拿大安大略省", time: "昨天 03:12", missed: true },
                { name: "小雨", sub: "呼出 · 未接通", time: "昨天 21:40", missed: false, out: true },
                { name: "小雨", sub: "呼出 · 已关机", time: "昨天 19:02", missed: false, out: true },
                { name: "小雨", sub: "呼出 · 已关机", time: "前天 22:15", missed: false, out: true }
            ]
        },
        /* 母亲与小雨的聊天：8/28 最后消息（= 承诺书统一回复的变体） */
        lastmsg: {
            type: "chat",
            title: "小雨",
            rows: [
                { from: "them", text: "妈 " + S_REPLY, time: "8月28日 23:47" },
                { from: "me", text: "怎么了 出什么事了" },
                { from: "me", text: "雨雨？" },
                { from: "me", text: "你给妈妈回个电话" },
                { from: "me", text: "妈妈不问了 你回个话就行" }
            ]
        },
        /* 七月起回复变冷 */
        "momchat-cold": {
            type: "chat",
            title: "小雨",
            rows: [
                { from: "me", text: "周末视频吗 给你看你种的辣椒", time: "7月19日" },
                { from: "them", text: "这周不行 在忙" },
                { from: "me", text: "钱够不够用 妈给你转点", time: "8月2日" },
                { from: "them", text: "够" },
                { from: "me", text: "国庆回来吗 妈妈给你腌了笋", time: "8月20日" },
                { from: "them", text: "嗯 再说" }
            ]
        },
        /* 结尾：她"回消息"了（= 承诺书原文，一字不差） */
        ending: {
            type: "chat",
            title: "小雨",
            rows: [
                { from: "me", text: "雨雨 妈妈求你 回个话" },
                { from: "them", text: S_REPLY, time: "刚刚" }
            ]
        }
    };

    /* =====================================================================
       远程协助期间：母亲聊天坞脚本（pc.html 右下角）
       键 = 触发事件："connect" 连接成功 / "clue:<id>" 线索被发现 /
                       "idle" 60秒没动静（只触发一次）/ "ending" 结束
       ===================================================================== */
    var ASSIST = {
        connect: [
            { m: "连上了吗" },
            { m: "我看到屏幕在动 是你吧" },
            { r: ["是我。我先看看她电脑里有什么。"] },
            { m: "好 你慢慢看" },
            { m: "桌面这个壁纸 是前年她回国 我们去玉带桥拍的" },
            { m: "别乱动她东西行吗 她爱干净" }
        ],
        idle: [
            { m: "怎么样 有什么吗" },
            { m: "你看看她微信 她什么都用微信" }
        ],
        "clue:cop-chat": [
            { m: "警官？？" },
            { m: "警察为什么加她微信" },
            { m: "她是不是真的犯了什么事" },
            { r: ["先别急，我把记录看完。", "不对劲。警察不这样办案。"] },
            { m: "你仔细看 帮我看清楚" }
        ],
        "clue:doc-arrest": [
            { m: "拘留通知书……" },
            { m: "上面写的逮捕是什么意思" },
            { m: "这种文件是真的吗 你见过吗" },
            { r: ["格式不太对。先别慌。", "我也说不好。我继续找。"] },
            { m: "我的心脏受不了了" },
            { m: "她一个女孩子 她能犯什么事啊" }
        ],
        "clue:doc-secrecy": [
            { m: "不许跟父母说……" },
            { m: "所以她才不理我？" },
            { m: "她是不是在保护我们" },
            { m: "还是在保护她自己" }
        ],
        "clue:call-log": [
            { m: "她每天晚上都跟那个人打电话？" },
            { m: "一打就是两个钟头？" },
            { m: "八月二十八号那天晚上 我打了十七个" },
            { m: "她就在电脑跟前 她不接" },
            { m: "凌晨三点 她还打给了那个王警官" },
            { m: "她宁可找他 也不接我电话" },
            { r: ["阿姨，这恰恰说明有问题。", "……我不知道该怎么跟你说。"] },
            { m: "为什么啊" }
        ],
        "clue:search-history": [
            { m: "安全账户是什么" },
            { m: "她是不是把钱转给什么人了" },
            { m: "她卡里是她爸走之前留下的钱啊" }
        ],
        "clue:video-last": [
            { m: "凌晨三点四十" },
            { m: "她还没睡" }
        ],
        ending: [
            { m: "等等" },
            { m: "等等！！" },
            { m: "她回我消息了！！！" },
            { shot: "ending" },
            { m: "你看 她说她没事" },
            { m: "没事就好 没事就好 吓死我了" },
            { m: "……" },
            { m: "是没事 对吧？" },
            { r: ["……阿姨，这句话，你再仔细读一遍。"] }
        ]
    };

    var ENDING = {
        overlay: "她说她没事。",
        sub: "第 一 章 完",
        note: "未完待续"
    };

    /* =====================================================================
       女儿电脑 · 微信窗口（PC 版微信）
       chats：会话列表（自上而下）。消息类型：
       {from:"me"|"them", text}                     文本（me = 陈雨）
       {sys:"..."}                                  灰条
       {from, file:{name,size,doc}}                 文件（doc = 打开的文书 id）
       {from, img:"素材说明"}                        图片占位
       {from, call:{video,dur}|{video,missed}}      通话记录气泡
       day:"7月10日" 出现在该条消息前作日期分隔
       ===================================================================== */
    var WECHAT = {
        me: { name: CONFIG.daughter.wx, id: CONFIG.daughter.wxId },
        chats: [
            {
                id: "mom", name: "妈妈", wx: CONFIG.mom.wx, unread: 43, pinned: true,
                avatar: ph("素材 A1", "妈妈头像·栀子花", 90, 1),
                preview: "妈妈不问了 你回个话就行",
                messages: [
                    { day: "7月19日", from: "them", text: "周末视频吗 给你看你种的辣椒" },
                    { from: "me", text: "这周不行 在忙" },
                    { day: "8月2日", from: "them", text: "钱够不够用 妈给你转点" },
                    { from: "me", text: "够" },
                    { day: "8月20日", from: "them", text: "国庆回来吗 妈妈给你腌了笋" },
                    { from: "me", text: "嗯 再说" },
                    { day: "8月28日", from: "me", text: "妈 " + S_REPLY },
                    { from: "them", text: "怎么了 出什么事了" },
                    { from: "them", text: "雨雨？" },
                    { from: "them", text: "你给妈妈回个电话" },
                    { from: "them", call: { video: false, missed: true, count: 17, label: "未接语音通话（17）" } },
                    { day: "8月29日", from: "them", text: "妈妈不问了 你回个话就行" }
                ]
            },
            {
                id: "cop", name: CONFIG.cop.wx, wx: "wjg_058136", unread: 0,
                avatar: ph("素材 A2", "头像·国徽风格", 220, 1, true),
                preview: "很好。等通知。",
                messages: [
                    { day: "7月10日", sys: "你已添加“临江市公安局-王警官”，现在可以开始聊天了。" },
                    { from: "them", text: "陈雨，你好。我是临江市公安局经济犯罪侦查支队王志明，警号058136。刚才电话里的情况，现在跟你正式核实。" },
                    { from: "them", img: "素材 D1 · 假警官证照片（制服照+钢印，做旧）" },
                    { from: "them", text: "经查，你名下工商银行卡（尾号3387）涉嫌一起特大洗钱案，涉案金额268万元，上游为贩毒集团资金。现依法对你立案调查。" },
                    { from: "me", text: "警官 是不是搞错了 我人在加拿大 那张卡我一直没用" },
                    { from: "them", text: "是否错误，以调查结论为准。你现在有两个选择：第一，立即回国配合调查，我们将对你实施刑事拘留；第二，配合我局远程调查，争取从宽处理。" },
                    { from: "me", text: "我配合 我肯定配合" },
                    { day: "7月14日", from: "them", text: "这是你的《刑事拘留通知书》，你自己看。案件进入保密阶段，文书暂不邮寄。" },
                    { from: "them", file: { name: "刑事拘留通知书_陈雨.pdf", size: "412 KB", doc: "doc-arrest" } },
                    { from: "me", text: "我真的没有做过 求求你们查清楚" },
                    { from: "them", text: "情绪没有用。为便于监管，下载安装以下软件，配合我局对你的电子设备实施监督。" },
                    { from: "them", file: { name: "ToDask_setup_5.3.2.exe", size: "88.4 MB", doc: null } },
                    { day: "7月21日", from: "them", text: "《保密承诺书》，打印签字后拍照回传。注意第4条、第5条，违反者按泄密处理，直接影响你的定性。" },
                    { from: "them", file: { name: "保密承诺书（陈雨）.docx", size: "38 KB", doc: "doc-secrecy" } },
                    { from: "me", img: "素材 D2 · 签好字的承诺书照片（手按在纸上）" },
                    { from: "them", text: "收到。自今日起，每晚20:00视频汇报行踪。不得缺席。" },
                    { day: "8月16日", from: "them", text: "案件有新进展，需要对你的资金做清查比对。把你全部银行卡余额截图发我。" },
                    { from: "me", img: "素材 D3 · 银行卡余额截图（数额打码）" },
                    { from: "them", text: "学费卡里的钱暂时冻结，不许动。等待通知，会给你安排“资金核查专用账户”。" },
                    { day: "8月27日", from: "them", text: "你母亲近期频繁联系你，已经影响侦查。按规定，你需要暂时中断与所有亲友的联系。" },
                    { from: "them", text: "把下面这句话原样发给她，然后手机关机：\n“" + S_REPLY + "”" },
                    { from: "me", text: "关机的话 她会报警的" },
                    { from: "them", text: "她敢报警，就是妨碍公务，你的从宽处理立即取消。你想让你母亲看着你戴手铐吗？" },
                    { day: "8月28日", from: "me", text: "发了 手机也关了" },
                    { from: "them", text: "很好。收拾随身物品和护照，近期你需要到指定地点配合隔离审查。具体等通知。" },
                    { from: "me", call: { video: false, dur: "2:41", label: "语音通话 2:41" } },
                    { from: "them", text: "很好。等通知。" }
                ]
            },
            {
                id: "group", name: "CS2026冲(47)", wx: "", unread: 99, muted: true,
                avatar: ph("素材 A3", "群头像·九宫格", 40, 1),
                preview: "[有人@你] 陈雨？看到回一下",
                messages: [
                    { day: "8月25日", sys: "以下是新消息" },
                    { from: "them", who: "Kevin", text: "组队的表 陈雨还没填 @雨在多伦多" },
                    { from: "them", who: "Kevin", text: "陈雨？看到回一下" },
                    { day: "8月30日", from: "them", who: "linda", text: "有人这两天见过陈雨吗 她 pre 没来" },
                    { from: "them", who: "Kevin", text: "微信电话都没人接 有点担心" }
                ]
            }
        ],

        /* 通话记录页（★锚点线索的主体，两种读法都在这一屏里）：
           7/21 起每晚 20:00 与"王警官"的视频通话由脚本生成（时长逐周变长），
           下面 extra 是 8/28 深夜的关键段。 */
        callsDaily: {
            name: CONFIG.cop.wx, from: "7月21日", to: "8月27日",
            hour: "20:00", durFrom: 22, durTo: 118   /* 分钟，线性变长 */
        },
        callsExtra: [
            { name: "妈妈", when: "8月28日 22:31", missed: true, in_: true, count: 17, till: "8月29日 03:12" },
            { name: CONFIG.cop.wx, when: "8月29日 03:14", out: true, dur: "2:41" }
        ]
    };

    /* =====================================================================
       下载文件夹 + 文书内容
       ===================================================================== */
    var FILES = [
        { name: "刑事拘留通知书_陈雨.pdf", time: "2026/7/14 09:23", size: "412 KB", icon: "pdf", doc: "doc-arrest" },
        { name: "保密承诺书（陈雨）.docx", time: "2026/7/21 20:44", size: "38 KB", icon: "doc", doc: "doc-secrecy" },
        { name: "ToDask_setup_5.3.2.exe", time: "2026/7/14 10:01", size: "88.4 MB", icon: "exe", doc: null,
          dialog: "无法在远程会话中运行安装程序。" },
        /* 暗钩（第二章用）：妈妈说远程软件是"大一装的"，这里的安装包却是 7/14 下载的 */
        { name: "护照信息页.jpg", time: "2026/8/26 21:37", size: "2.1 MB", icon: "img", doc: "doc-passport" },
        { name: "CSC369_final_notes.pdf", time: "2026/4/18 15:02", size: "6.8 MB", icon: "pdf", doc: "doc-notes" }
    ];

    /* 文书渲染数据（红头文件由 css/pc.css .doc-* 绘制）
       假文书的破绽（= real 读法的实证，别修掉）：
       ① 拘留通知书送达对象是本人（真文书发家属） ② 正文出现"逮捕令"（不存在的文书）
       ③ 文号格式混乱 ④ "唯一指定安全核查账户"话术 ⑤ 承诺书要求切断联系+统一回复 */
    var DOCS = {
        "doc-arrest": {
            kind: "official", tab: "刑事拘留通知书_陈雨.pdf",
            org: "临江市公安局", serial: "临公刑拘字〔2026〕第0731号",
            title: "刑事拘留通知书",
            body: [
                "陈雨（女，2004年4月16日生，身份证号：3601**********0424）：",
                "经查，你名下银行账户涉嫌重大洗钱犯罪，涉案资金人民币2,680,000元，上游资金来源为跨境贩毒集团。根据《中华人民共和国刑事诉讼法》第八十二条之规定，本局决定对你执行刑事拘留，并已同步签发逮捕令。",
                "鉴于你目前在境外，现责令你配合本局远程调查。调查期间，你须严格遵守保密规定，每日按时向办案民警汇报。如实供述、配合资金核查（涉案资金须转入本局唯一指定安全核查账户）的，可依法从轻、减轻处理。",
                "拒不配合的，本局将通过国际刑警组织对你发布红色通缉令，并追究你亲属的连带责任。"
            ],
            stampText: "临江市公安局", date: "二〇二六年七月十四日"
        },
        "doc-secrecy": {
            kind: "official", tab: "保密承诺书（陈雨）.docx",
            org: "", serial: "密级：绝密★",
            title: "保密承诺书",
            body: [
                "本人陈雨，因涉嫌洗钱案接受临江市公安局调查。本人郑重承诺：",
                "一、严格遵守案件保密规定，不向任何人（包括父母、亲属、朋友、同学）透露案件任何信息；",
                "二、调查期间每日20:00准时接受视频监管，如实汇报当日行踪；",
                "三、未经办案民警批准，不得报警，不得向使领馆及任何机构求助；",
                "四、暂时中断与亲友的一切联系。如亲友反复询问，统一回复：“" + S_REPLY + "”；",
                "五、如违反上述条款，本人自愿承担全部法律后果，并接受从重处理。"
            ],
            sign: "承诺人：陈雨", date: "二〇二六年七月二十一日"
        },
        "doc-passport": {
            kind: "image", tab: "护照信息页.jpg",
            img: ph("素材 D4", "护照信息页扫描件（信息打码）", 210, 0.7, true)
        },
        "doc-notes": {
            kind: "image", tab: "CSC369_final_notes.pdf",
            img: ph("素材 D5", "普通课程笔记 PDF 首页", 200, 1.3)
        }
    };

    /* =====================================================================
       biliblil（假视频站，她还登录着）
       ===================================================================== */
    var BILIBLIL = {
        user: { name: CONFIG.daughter.wx, level: 4, avatar: ph("素材 B0", "她的头像", 320, 1) },
        /* 首页推荐（占位，正式素材换 cover 即可） */
        feed: [
            { title: "多伦多留学生一周伙食费挑战", up: "枫叶食堂", cover: ph("素材 B1", "首页占位 ①", 20, 0.62), views: "32.1万", time: "8-29" },
            { title: "图书馆通宵实录 | 期末周vlog", up: "卷心菜菜", cover: ph("素材 B2", "首页占位 ②", 200, 0.62), views: "12.8万", time: "8-28" },
            { title: "北方的秋天有多快", up: "无人机日记", cover: ph("素材 B3", "首页占位 ③", 150, 0.62), views: "8.2万", time: "8-30" },
            { title: "自习直播回放 8.30", up: "StudyWithLuna", cover: ph("素材 B4", "首页占位 ④", 260, 0.62), views: "4.1万", time: "8-30" },
            { title: "二手教材回血指南", up: "省钱研究所", cover: ph("素材 B5", "首页占位 ⑤", 60, 0.62), views: "6.7万", time: "8-27" },
            { title: "深夜电台：一个人在国外的第800天", up: "口袋电台", cover: ph("素材 B6", "首页占位 ⑥", 230, 0.62, true), views: "18.9万", time: "8-26" }
        ],
        /* 历史记录（video-last 线索）：倒序 = 时间线本身 */
        history: [
            { title: "留学生在加拿大亲历“公检法”诈骗全过程｜亲述", up: "反诈老陈说", when: "8月29日 03:40",
              progress: "看到 23:41 / 54:02", half: true, clue: "video-last",
              cover: ph("素材 B7", "历史·反诈亲历（关键）", 0, 0.62, true) },
            { title: "怎么判断自己是不是被立案调查了", up: "法律小白课", when: "8月27日 02:11",
              progress: "看到 06:02 / 18:44", cover: ph("素材 B8", "历史·法律科普", 220, 0.62) },
            { title: "考前冥想 | 放松白噪音 2小时", up: "SleepLab", when: "8月24日 01:32",
              progress: "看到 1:47:00 / 2:00:00", cover: ph("素材 B9", "历史·白噪音", 190, 0.62) },
            { title: "多伦多周末去哪玩 | 岛上一日", up: "枫叶食堂", when: "7月6日 19:20",
              progress: "看完", cover: ph("素材 B10", "历史·正常生活（7月前）", 100, 0.62) },
            { title: "宿舍快手菜：十分钟番茄牛腩饭", up: "小灶台", when: "7月4日 18:05",
              progress: "看完", cover: ph("素材 B11", "历史·正常生活", 30, 0.62) }
        ]
    };

    /* =====================================================================
       浏览器（Google 壳保留）
       recentSearches = search-history 线索（首页"最近的搜索"）
       ===================================================================== */
    var RECENT_SEARCHES = [
        { q: "安全账户 是什么 公安", when: "8月16日" },
        { q: "逮捕令 真的假的", when: "8月15日" },
        { q: "被调查 会遣返吗 留学生", when: "8月10日" },
        { q: "临江市公安局 电话", when: "7月12日" }
    ];

    var SEARCH_DB = [
        {
            matched: ["安全账户", "安全核查账户"],
            results: [
                {
                    title: "不存在“安全账户”！凡要求转账到安全账户的都是诈骗 - 国家反诈中心",
                    displayUrl: "www.fanzha96110.xyz › 提醒",
                    desc: "公检法机关不会通过电话、微信、QQ办案，不会发送任何“逮捕令”“通缉令”，更不存在所谓“安全账户”。凡自称公检法要求转账汇款的……",
                    favicon: "shield", open: { type: "page", id: "page-fanzha" }
                },
                {
                    title: "“安全账户”骗走留学生百万学费，母亲最后才知道 - 临江晚报",
                    displayUrl: "news.linjiang.xyz › 社会",
                    desc: "受害人被要求“配合资金核查”，将学费转入所谓安全账户，并被要求对家人保密。骗局持续两个月，家人毫不知情……",
                    favicon: "news", open: { type: "page", id: "page-news" }
                }
            ]
        },
        {
            matched: ["逮捕令", "拘留通知书", "通缉令"],
            results: [
                {
                    title: "中国法律文书中不存在“逮捕令” - 国家反诈中心",
                    displayUrl: "www.fanzha96110.xyz › 识骗",
                    desc: "我国刑事强制措施中没有“逮捕令”这一文书。《拘留通知书》依法送达家属而非嫌疑人本人。凡通过网络向你本人发送“文书”的……",
                    favicon: "shield", open: { type: "page", id: "page-fanzha" }
                }
            ]
        },
        {
            matched: ["临江市公安局", "临江公安"],
            results: [
                {
                    title: "临江市公安局（官方网站）",
                    displayUrl: "www.linjiang-ga.xyz",
                    desc: "机构职能、办事服务、警务公开。",
                    favicon: "gov", open: { type: "error", host: "www.linjiang-ga.xyz" }
                },
                {
                    title: "临江公安提醒：冒充“公检法”诈骗高发，认清这三招 - 临江晚报",
                    displayUrl: "news.linjiang.xyz › 反诈",
                    desc: "第一招洗脑控制：每日定时“汇报”；第二招伪造场景：假文书、假警官证；第三招制造失联：以“保密”为名切断受害人与亲友的联系……",
                    favicon: "news", open: { type: "page", id: "page-news" }
                }
            ]
        },
        {
            matched: ["被调查 会遣返吗", "遣返 留学生"],
            results: [
                {
                    title: "留学生涉案会被遣返吗？先确认“案件”是否存在 - 法律小白课",
                    displayUrl: "www.falv-xiaobai.xyz › 问答",
                    desc: "先冷静核实：真实的刑事调查不会要求你保密、不会远程视频“监管”你。如接到此类电话，请直接拨打使领馆求助电话核实……",
                    favicon: "news", open: { type: "error", host: "www.falv-xiaobai.xyz" }
                }
            ]
        }
    ];

    var PAGES = {
        "page-fanzha": {
            url: "www.fanzha96110.xyz/tixing/0731",
            tab: "国家反诈中心 - 提醒",
            html:
                "<h1>公检法机关不会这样“办案”</h1>" +
                '<div class="p-site">国家反诈中心 · 防骗提醒（本页为剧情虚构页面）</div>' +
                "<p><b>一、</b>公检法机关不会通过电话、微信、QQ 办案，不会要求你“保密”或切断与家人的联系。</p>" +
                "<p><b>二、</b>不存在“安全账户”。凡是要求把资金转入“安全账户”“核查账户”的，都是诈骗。</p>" +
                "<p><b>三、</b>法律文书不会通过网络发送给当事人本人。我国刑事文书中没有“逮捕令”。</p>" +
                "<p>如有疑问，请拨打 96110。人在境外的，请联系中国驻当地使领馆。</p>"
        },
        "page-news": {
            url: "news.linjiang.xyz/shehui/20260805",
            tab: "临江晚报 - “安全账户”骗局",
            html:
                "<h1>“安全账户”骗走留学生百万学费，母亲最后才知道</h1>" +
                '<div class="p-site">临江晚报 · 2026-08-05（本页为剧情虚构页面）</div>' +
                "<p>受害人小李在境外留学期间接到“快递涉案”电话，随后被转接“公安机关”。对方出示“警官证”“拘留通知书”，以案件保密为由，要求她每日定时视频汇报，并中断与亲友的一切联系。</p>" +
                "<p>两个月里，小李按对方要求将学费分三笔转入“安全核查账户”，其间家人毫不知情，只觉得“孩子最近话少了”。直到失联一周后家属报警，才发现是冒充公检法诈骗。</p>" +
                "<p>警方提醒，此类骗局有三个惯用步骤：定时“汇报”洗脑控制、伪造文书场景、以“保密”制造失联。</p>"
        }
    };

    /* ---------------- 导出 ---------------- */
    return {
        CONFIG: CONFIG, ph: ph, S_REPLY: S_REPLY,
        CLUES: CLUES, ENDING_GATE: ENDING_GATE, ENDING: ENDING,
        INTRO: INTRO, INTRO_MOBILE: INTRO_MOBILE, SHOTS: SHOTS, ASSIST: ASSIST,
        WECHAT: WECHAT, FILES: FILES, DOCS: DOCS,
        BILIBLIL: BILIBLIL, RECENT_SEARCHES: RECENT_SEARCHES,
        SEARCH_DB: SEARCH_DB, PAGES: PAGES
    };
})();
