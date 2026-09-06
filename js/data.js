/* =====================================================================
   内容数据层（唯一的剧情源）。换剧情 = 换这个文件，不改代码。
   剧情依据：Kaius《下一位机主 · 纯剧情大纲 v2》（仓库 剧情大纲.md）。
   文案里带〔占位〕的是待正式化的句子，其余可直接用。

   结构：
   TEXT      文案表（所有 *Ref 指向这里；缺失时显示〔ref〕，不报错；{name} = 玩家在 Windows 设置页输的名字）
   CONFIG    全局配置
   TRIGGERS  触发器：条件 → 动作        HINTS  亮点表：首个命中的条件决定当前发光元素
   FOLDERS   文件夹顺序与路径
   DEVICES   两台电脑：own = 玩家的二手电脑；t1 = 林晚的电脑（黑进去的那台）
   PAGES / NEWS / BILI / MAIL / MARKET   假网站
   TASKS     求助单；VIRUS_LOG / VIRUS_TICKER / ARCHIVE  软件的话
   CALLS     微信语音来电脚本；ENDINGS  六个结局；OWNERS  前任机主链
   ===================================================================== */
window.DB = (function () {

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

    /* 常用占位图（正式素材做好后按 ASSETS.md 编号替换） */
    var IMG = {
        me: ph("素材 M1", "我的头像", 200, 1, true),
        sea: ph("素材 S1", "一片海", 205, 1, true),
        chen: ph("素材 A1", "阿澄头像", 40, 1),
        mom: ph("素材 M2", "妈妈头像", 330, 1),
        courier: ph("素材 K1", "代取送·小哥", 120, 1, true),
        receipt: ph("素材 R1", "收货照：地下室桌上的主机", 220, 0.75, true),
        lin: ph("素材 T1", "她的头像", 20, 1),
        linDoc: ph("素材 T1", "目标·证件照", 0, 1, true),
        cop: ph("素材 C1", "国徽风头像", 220, 1, true),
        linMom: ph("素材 C2", "妈妈头像·栀子花", 90, 1),
        qing: ph("素材 Q1", "许青头像", 160, 1),
        ning: ph("素材 N1", "孙宁头像", 280, 1),
        sun2: ph("素材 S2", "默认头像", 0, 1, true),
        agent: ph("素材 AG", "盾形徽标", 210, 1, true),
        buyer: ph("素材 BY", "默认头像", 60, 1),
        anan: ph("素材 P1", "横幅：安安一岁啦", 210, 0.66, true),
        window: ph("素材 W1", "窗外：停车场 · CEDAR INN 招牌", 200, 0.66, true),
        cat: "image/cat-wallpaper.jpg",
        catBed: ph("素材 X6", "橘子趴在床上", 30, 0.8),
        pc: ph("素材 MK1", "主机 + 显示器", 210, 1)
    };

    var CONFIG = { startDate: { y: 2024, mo: 10, d: 3, h: 21, mi: 17 }, meAvatar: IMG.me };

    /* 骗子教的"统一回复"，多处复用（承诺书 / 她发给妈妈的最后一条 / 第三案母亲聊天框里的预填 / 结局） */
    var S_REPLY = "我最近有点事在忙，不要担心，也不要跟别人说，过几天就好了";

    /* ================= 文案表 ================= */
    var TEXT = {
        "player.default": "机主",
        "ui.ok": "确定", "ui.cancel": "取消",
        "ui.toast.title": "系统通知",
        "ui.dlg.reset.title": "系统", "ui.dlg.reset.body": "确定要清除全部进度、重新开始吗？",
        "ui.dlg.locked.title": "无法打开", "ui.dlg.locked.body": "文件已损坏或被占用。",
        "ui.dlg.destroy.title": "删除文件", "ui.dlg.destroy.body": "确实要永久删除“{file}”吗？此操作不经过回收站，无法撤销。", "ui.dlg.destroy.ok": "是(Y)",
        "ui.locked.tag": "无法访问", "ui.col.name": "名称", "ui.col.date": "修改日期", "ui.col.size": "大小",
        "ui.sm.restart": "重新开始（清除进度）", "ui.sm.shutdown": "关机",
        "browser.snapshot": "〔占位：页面快照〕",
        "ctx.open": "打开", "ctx.uninstall": "卸载", "ctx.delete": "删除", "ctx.props": "属性", "ctx.destroy": "彻底删除（不经回收站）",
        "own.home": "C:\\Users\\{name}", "t1.home": "C:\\Users\\linwan",
        "folder.desktop": "桌面", "folder.desktop.path": "{home}\\Desktop",
        "folder.downloads": "下载", "folder.downloads.path": "{home}\\Downloads",
        "folder.documents": "文档", "folder.documents.path": "{home}\\Documents",
        "folder.pictures": "图片", "folder.pictures.path": "{home}\\Pictures",
        "folder.oldcase": "旧任务_吴晓", "folder.oldcase.path": "{home}\\Documents\\旧任务_吴晓",
        "folder.backup": "备份_0928（已解压）", "folder.backup.path": "{home}\\Documents\\备份_0928",
        "folder.evidence": "证据", "folder.evidence.path": "{home}\\Documents\\证据",
        "folder.argus": "ARGUS_9 附件", "folder.argus.path": "C:\\ProgramData\\.argus\\attachments",
        "folder.recycle": "回收站", "folder.recycle.path": "回收站",
        "recycle.empty": "回收站是空的",
        "mypc.drives": "设备和驱动器 (2)",

        /* 开机前的警示 */
        "warn.title": "Windows 安全",
        "warn.body": "本程序包含闪烁画面、突发的高音量音效与惊吓内容。\n光敏性癫痫患者请谨慎运行。建议佩戴耳机并调低音量。\n程序中出现的诈骗手法取材自公开反诈案例，仅用于剧情。\n\n是否继续启动？",
        "warn.btn": "是(Y)",

        /* 开机 */
        "boot.l1": "AMIBIOS (C) 2011  ...  Memory Test: 16384MB OK",
        "boot.l2": "Detecting SATA drives ... WDC WD5000AAKX",
        "boot.l3": "Boot from Hard Disk ...",
        "tip.boot": "这台二手电脑没重装过系统。桌面上有前任机主留下的东西。",

        /* Windows 登录界面（自己的电脑） */
        "signin.other": "其他用户", "signin.user.ph": "用户名", "signin.pwd.ph": "密码",
        "signin.to": "登录到：DESKTOP-K3R7QM", "signin.welcome": "欢迎", "signin.empty": "请输入用户名。",
        "signin.net": "网络", "signin.ease": "轻松使用", "signin.power": "电源",

        /* 应用名 */
        "app.mypc.title": "此电脑", "app.recycle.title": "回收站",
        "app.browser.title": "Google Chrome", "app.chat.title": "微信",
        "app.files.title": "文件", "app.viewer.title": "查看器",
        "app.virus.title": "ARGUS_9", "app.xhs.title": "小红书",

        /* 前任机主的三封留言（大纲 4.2） */
        "file.note1.name": "给下一位机主.txt",
        "file.note1.body": "我接手的时候，它就在。\n\n这台电脑我没重装。不是懒，是重装了它也在，第二封里有记录。桌面上的东西你先别动。\n\n如果你也收到了那些东西，先把剩下两封看完。\n\n——屿",
        "file.note2.name": "我试过的.txt",
        "file.note2.body": "记一下，省得你再走一遍。\n\n8月3日  安全模式 → 删掉 argus 目录 → 重启 → 它在。\n8月9日  格式化 C 盘，重装 → 装完第二天早上 04:44，它在。\n8月20日 换了一块新硬盘 → 三天后，它在。我没插过网线。\n9月1日  恢复出厂备份 → 备份里就有它。\n9月27日 拖进回收站 → 蓝屏两次。别试了。\n\n它有一张“关于”页，说自己是什么人道组织做的。exe 的属性里写的是另一回事。她的信里写的又是一回事。三个说法我都不信。\n\n我留了一份加密备份在回收站里，密码提示写在压缩包上。\n\n它会把你想做的事，变成它要你做的事。",
        "file.note3.name": "如果它给你派单.txt",
        "file.note3.body": "致捡到这台机器的人：\n\n我不知道你是谁，也不知道我前面那个人有没有把这封信留下来。如果留了，说明他也没能删掉它。\n\n我帮过一个人。他叫李子牧，欠了网贷躲起来，家里人找不到他。我找到了，他给他妈打了电话。\n完成以后，记得去看看新闻。\n\n如果它问你人在哪里，先想想，究竟是谁在问。\n\n——何静",
        "tip.virus.found": "桌面上多了一个图标？不，它一直都在。",
        "tip.virus.found2": "它在等你打开它。",

        "file.installer.name": "argus_setup.exe",
        "file.installer.dlg.title": "属性",
        "file.installer.dlg.body": "文件说明：（空）<br>公司：Argus Systems Pte. Ltd.<br>版权：© 2009<br>数字签名：无效（证书已于 2011-03-14 吊销）<br>创建时间：2009-11-30 04:44<br>修改时间：今天 04:44",
        "file.anan.name": "安安一岁啦.jpg",
        "file.photo.metaTitle": "详细信息",
        "file.anan.meta1": "拍摄设备：Canon EOS 500D",
        "file.anan.meta2": "拍摄时间：2019/6/2 14:31",
        "file.anan.meta3": "位置信息：已移除",
        "file.anan.meta4": "备注：横幅“安安一岁啦”",

        /* 病毒软件 */
        "virus.header": "ARGUS_9 // remote-caretaker build 0.9.7",
        "virus.header.stat": "节点 CA-TOR-07 · 在线",
        "virus.nav.tasks": "求助单", "virus.nav.archive": "档案", "virus.nav.about": "关于",
        "virus.tasks.empty": "暂无求助单。保持在线。",
        "virus.about.body": "ARGUS_9 // remote-caretaker build 0.9.7\n\n本程序由“国际失联人员援助网络（IMAN）”志愿者社区开发，用于在传统渠道失效时定位并联络失联人员。\n我们相信：每一个失联的人，都有一个在等的人。\n\n已连续在线 4,096 天\n已协助定位 1,207 人\n成功率 100%",
        "virus.log.repaired1": "[SYSTEM] 检测到宿主异常操作。已修复。",
        "virus.log.repaired2": "[SYSTEM] 请勿重复。",
        "virus.log.shutdown": "[SYSTEM] 宿主关机请求已拦截。会话保持。",
        "virus.cred.label": "已获取凭据",
        "virus.enter.btn": "接入目标设备",
        "virus.reenter.btn": "再次接入",
        "virus.exit.btn": "断开连接  Esc",
        "virus.exit.btn.own": "断开连接",
        "virus.exit.fail.title": "ARGUS_9",
        "virus.exit.fail.body": "断开失败：会话由远端持有。",
        "virus.monitor.bar": "已接入：林晚的电脑",
        "virus.monitor.bar.own": "已接入：{name}的电脑",
        "virus.step.locked": "（先完成上一步）",
        "virus.attach": "附件",
        "virus.popup.head": "ARGUS_9 // 新求助单",
        "virus.popup.open": "查看求助单",
        "virus.ticker.1": "#1203 目标已接触 · 已完成 · 2024-09-30",
        "virus.ticker.2": "#1202 目标已接触 · 已完成 · 2024-09-21",
        "virus.ticker.3": "#1201 目标已接触 · 已完成 · 2024-09-14",
        "virus.ticker.4": "#1200 目标已接触 · 已完成 · 2024-09-02",
        "virus.ticker.5": "#1199 目标已接触 · 已完成 · 2024-08-27",
        "virus.ticker.6": "#000-C 目标已接触 · 已完成 · 2024-05-19",

        /* 蓝屏 */
        "bsod.face": ":(",
        "bsod.body": "你的电脑遇到问题，需要重新启动。我们只收集某些错误信息，然后为你重新启动。",
        "bsod.pct": "完成",
        "bsod.code": "终止代码：CARETAKER_HANDLE_HELD",

        /* 黑进去：过场 + 登录 */
        "hack.l1": "> argus --mirror --target 142.116.xx.xx",
        "hack.l2": "> handshake ........ OK",
        "hack.l3": "> bypass lockscreen ........ DENIED",
        "hack.l4": "> fallback: credential cache ........ FOUND",
        "hack.l5": "> mounting remote display",
        "hack.l6": "> WARNING: host will notice",
        "login.hint": "密码提示：我的生日",
        "login.wrong": "密码不正确。请重试。",
        "login.placeholder": "密码",
        "t1.user": "林晚",
        "t1.password": "20060315",

        /* 通用：聊天 / 通话 / 压缩包 / 邮件 / 录音 / 结局 */
        "chat.own.empty": "暂无会话。",
        "chat.monitor.input": "对方设备 · 只读",
        "chat.input": "", "chat.send": "发送", "chat.search": "搜索", "chat.call.unavail": "对方未开启语音通话。",
        "chat.typing": "对方正在输入…",
        "chat.draft.tag": "草稿",
        "chat.prev.img": "[图片]", "chat.prev.file": "[文件]", "chat.prev.call": "[语音通话]",
        "chat.file.foot": "微信电脑版",
        "chat.tag.new": "新的朋友",
        "chat.sys.added": "你已添加了对方，现在可以开始聊天了。",
        "chat.sys.recall": "对方撤回了一条消息",
        "chat.call.voice": "语音通话",
        "chat.call.missed": "对方已取消",
        "call.invite": "邀请你语音通话", "call.accept": "接听", "call.decline": "拒绝",
        "zip.title": "解压缩", "zip.body": "此压缩文件受密码保护。请输入密码：", "zip.hint.label": "密码提示：", "zip.ph": "密码",
        "zip.ok": "解压完成。文件已放入 文档\\备份_0928。", "zip.wrong": "密码错误。", "zip.already": "已解压。文件在 文档\\备份_0928。",
        "zip.pwd": "20180602", "zip.hint": "安安来到这一天",
        "mail.from": "发件人：", "mail.to": "收件人：", "mail.date": "日期：",
        "mail.site": "邮箱", "mail.me": "linwan0315@outlook.com", "mail.inbox": "收件箱", "mail.pick": "选择一封邮件查看",
        "audio.transcript": "转 写",
        "end.restart": "重新开始", "end.notepad.title": "给下一位机主.txt - 记事本",
        "news.site": "晨间线报", "news.site.sub": "GTA 本地 · 华人社区",
        "market.site": "枫叶二手", "market.tag": "多伦多华人二手 · 同城自提", "market.msg": "私信卖家",
        "market.msg.dlg.title": "枫叶二手", "market.msg.dlg.body": "该用户已关闭私信。",
        "browser.start.title": "起始页",
        "browser.error.title": "无法访问此网站",
        "browser.error.body": "的响应时间过长。请检查网络连接，或稍后重试。",
        "browser.hist.title": "历史记录",
        "browser.hist.empty": "没有浏览记录。",
        "xhs.tab.notes": "笔记", "xhs.detail.likes": "赞", "xhs.gap": "—— 此后没有更新 ——",
        "xhs.cmt": "评论", "xhs.cmt.title": "共 {n} 条评论", "xhs.cmt.empty": "还没有评论",

        /* ================= 求助单 ================= */
        "task1.title": "求助单 001",
        "task1.target": "林晚，18 岁。多伦多。",
        "task1.brief": "失联三天。\n家属收到疑似绑架视频。\n请核实她是否安全。\n\n附件：证件照 · 家属留言 · 目标设备凭据",
        "task1.cred": "目标设备登录密码：20060315（推测：生日）",
        "task1.step1": "她原本的生活：看她的小红书，找到她是从什么时候变的",
        "task1.step2": "精神警察：微信里那个“王警官” + 文档里没发出去的日记",
        "task1.step3": "被删掉的求助：她和妈妈的对话 · 浏览器里她看了一半的视频",
        "task1.step4": "她去了哪里：课件站的注册资料 · 下载夹里两版通知书 · 邮箱里的旅馆确认信",
        "task1.step5": "联系她：把她自己写过的话放回她面前",
        "task1.step6": "接应：决定由谁去接她",
        "task1.status.active": "进行中", "task1.status.done": "已完成", "task1.status.fail": "接应失败",
        "task1.log.located": "已确认目标位置：雪松旅馆（士嘉堡，Kingston 路）。建议立即开展接应。",
        "task1.log.contact": "目标通讯账号已注入宿主通讯录。请建立联系。",
        "task1.log.reconnected": "已恢复联系，等待接应。",
        "task1.log.pickup": "援助人员已在附近。请确认：目标离开房间的时间 · 旅馆出口 · 目的地。",
        "task1.log.doneA": "接应已安排。任务完成。",
        "task1.log.thanks": "感谢协助。",
        "task1.log.failB": "接应失败。请补充目标位置。",
        "task1.log.closedB": "目标已离开已知位置。求助单 001 关闭。",
        "task1.act.contact": "建立联系（注入目标微信）",
        "task1.act.supp": "补充目标位置",
        "task1.form.title": "接应安排 // 需宿主确认",
        "task1.form.f1": "目标离开房间的时间", "task1.form.f1o1": "22:40", "task1.form.f1o2": "23:00", "task1.form.f1o3": "23:20",
        "task1.form.f2": "旅馆出口", "task1.form.f2o1": "正门", "task1.form.f2o2": "侧门（停车场）", "task1.form.f2o3": "后巷",
        "task1.form.f3": "目的地", "task1.form.f3o1": "机场", "task1.form.f3o2": "援助人员住处", "task1.form.f3o3": "领事馆",
        "task1.form.submit": "确认接应安排",
        "task1.file.fam": "家属留言（派发版）",
        "task1.file.famfull": "家属留言（原件）",

        "task2.title": "求助单 002",
        "task2.target": "孙屿，27 岁。",
        "task2.brief": "涉嫌携款失联。\n目标持有本设备的关键资料。\n找到目标后，可终止当前设备的监护程序。",
        "task2.step1": "两个孙屿：二手帖的编辑时间 · 代取小哥的话 · 问他为什么把系统留着",
        "task2.step2": "何静留下的旧事：保存的网页里那条新闻 · 文档里的“旧任务_吴晓”",
        "task2.step3": "“完成”的含义：打开档案，按时间把记录排一遍",
        "task2.step4": "女儿的生日：下载夹的照片 · 回收站的加密备份 · 备份里的录音和邮件",
        "task2.step5": "失踪的真相：联系孙宁",
        "task2.step6": "把找到的人交给谁",
        "task2.status.active": "进行中", "task2.status.done": "已完成", "task2.status.hang": "挂起",
        "task2.log.offline": "目标设备：全部离线。无法接入。",
        "task2.log.offline2": "宿主持有目标遗留数据。请自行核查。",
        "task2.log.progress": "请提交最新进展。我们可以保护目标家属。",
        "task2.log.doneA": "已接触。任务完成。",
        "task2.log.thanks": "感谢协助。监护程序将于确认后终止。",
        "task2.log.hangB": "目标位置未确认。求助单 002 挂起。",
        "task2.form.title": "进展提交 // 目标家属保护程序",
        "task2.form.f1": "目标临时住处", "task2.form.f1o1": "北约克短租公寓（孙宁提到的地方）", "task2.form.f1o2": "未知", "task2.form.f1o3": "孙宁住处",
        "task2.form.f2": "目标离开时间", "task2.form.f2o1": "今晚", "task2.form.f2o2": "明早", "task2.form.f2o3": "未知",
        "task2.form.submit": "提交进展",

        "task3.title": "求助单 003",
        "task3.target": "{name}。",
        "task3.brief": "状态：在线。\n当前风险：受到不明人员误导，拒绝配合安全核实。\n待核实：离开住处的时间与目的地。\n\n档案：二手交易 10-02（付款凭证、收货照）· 已读文件 11 份 · 已发出回报 2 次 · 目标近期社交回应减少（室友两次询问“留饭”未答）",
        "task3.step1": "已建立联系：安全专员",
        "task3.step2": "待核实：离开住处的时间与目的地",
        "task3.status.active": "核实中",
        "task3.log.watch": "宿主设备已转为目标设备。镜像持续。",
        "task3.log.cond": "新条件：将设备交给下一位协助者。完成交接后，您的记录将转入归档。",
        "task3.log.post": "已代拟出售帖。见 枫叶二手。",
        "task3.form.title": "安全核实 // 需目标确认",
        "task3.form.f1": "离开住处的时间", "task3.form.f1o1": "现在", "task3.form.f1o2": "半小时后", "task3.form.f1o3": "天亮",
        "task3.form.f2": "目的地", "task3.form.f2o1": "楼下（安全接应）", "task3.form.f2o2": "学校", "task3.form.f2o3": "朋友家",
        "task3.form.submit": "确认外出安排",
        "task3.act.post": "查看代拟的出售帖",

        /* ================= 路标 toast ================= */
        "tip.task1.new": "收到第一张求助单。",
        "tip.connected": "你现在在她的电脑里。她看不到你。",
        "tip.chat": "笔记停更的那个月，她在跟谁说话？去看微信。",
        "tip.diary": "她提到过写日记。文档里有一篇没发出去的。",
        "tip.mom": "再看看她和妈妈的对话。输入框里还留着东西。",
        "tip.bili": "她在浏览器里看过一个视频，看到一半。历史记录。",
        "tip.site": "那些让她害怕的私人资料，是谁告诉“王警官”的？去课件站看她填过什么。",
        "tip.doc": "下载夹里有两版通知书。早的那版被她删过一次。",
        "tip.mail": "她最后三天去了哪里？邮箱里有一封确认信。",
        "tip.located": "四样都看过了。断开，回你自己的电脑——软件有话说。",
        "tip.lin.contact": "微信里多了一个人。",
        "tip.lin.silent": "她看到了。没有回。再发一条。",
        "tip.lin.reconnected": "她给妈妈打电话了。软件把状态改成了“等待接应”。",
        "tip.lin.pick": "有两条路：软件的“援助人员”，或者她认识的人。",
        "tip.days": "几天过去了。",
        "tip.news": "浏览器推送了一条本地新闻。",
        "tip.qing": "微信里多了一个人：许青。",
        "tip.fail": "软件显示“接应失败”。它在等的，是另一个结果。",
        "tip.cat": "林晚发来一张照片。",
        "tip.seller2": "卖家知道林晚吗？去问问他。",
        "tip.seller.odd": "他答非所问。往上翻，看他以前是怎么说话的。",
        "tip.task2.new": "第二张求助单。头像还是那片海。",
        "tip.t2.start": "从交易本身查起：二手平台上那条帖子。",
        "tip.t2.courier": "代取的小哥说过一句话。去看他的聊天。",
        "tip.t2.ask": "问卖家一个问题：你为什么把系统留着？",
        "tip.seller.same": "这句话和软件说的几乎一样。",
        "tip.t2.s2": "何静的信里提过一个名字。浏览器的历史记录里有保存的网页。",
        "tip.t2.wu": "文档里有一个文件夹：旧任务_吴晓。那是孙屿接手之后的事。",
        "tip.archive": "软件多了一个页签：档案。",
        "tip.t2.s4": "孙屿说他留了加密备份在回收站。密码是他女儿的生日。",
        "tip.zip.hint": "提示写着“安安来到这一天”。下载夹里有一张她的照片——看清横幅和日期。",
        "tip.backup": "解压好了。先听那段录音。",
        "tip.ning": "邮件签名里有孙宁的微信。她在你的微信里了。",
        "tip.argus.progress": "软件在要进展。它说可以保护家属。",
        "tip.ning.pick": "告诉软件他在哪，还是告诉孙宁软件在问？",
        "tip.evidence": "孙屿把另一半证据发来了。文档\\证据。",
        "tip.envelope": "孙宁把信封扫描发来了。文档\\证据。",
        "tip.record": "两部分材料拼上了。文档\\证据 里多了一份“设备流转记录”。",
        "tip.task3.new": "第三张求助单。照片是你自己拍的那张收货照。",
        "tip.watched": "桌面被绿框围住了。和你当初进她电脑时一模一样。",
        "tip.agent": "微信里多了一个“安全专员”。",
        "tip.mom.prefill": "妈妈的聊天框里，有一句你没写过的话。",
        "tip.sim": "三条消息同时来了。",
        "tip.chen.call": "阿澄打来电话。",
        "tip.truth": "求助单 001 多了一个附件：家属留言的原件。",
        "tip.truth.read": "它把许青的联系方式截掉了。每一张求助单都在问同一件事：你在哪，接下来去哪。",
        "tip.chen.plan": "阿澄联系到人了。他要你把证据整理好。",
        "tip.buyer": "二手平台上出现了一份以你名义发的出售帖。有人来询价了。",
        "tip.destroyed": "证据没有了。开始菜单里有“关机”。",
        "tip.shutdown.block": "关不掉。",

        /* ================= 自己的微信 ================= */
        "chat.me.name": "{name}",
        "chat.seller.name": "屿",
        "chat.seller.m1": "你好，看到你帖子了。电脑还在吗？",
        "chat.seller.m2": "在的。用了三年，i5 的，做设计和外包够用。",
        "chat.seller.m3": "为什么这么便宜啊，有什么问题吗",
        "chat.seller.m4": "没问题，就是走得急。我女儿在国内，安安她妈催我回去。",
        "chat.seller.m5": "照片我尽量删干净，安安的可能还有漏的，麻烦你直接删。",
        "chat.seller.m6": "行，我考虑一下，明天回你",
        "chat.seller.m7": "还要吗。降两百。今晚可以送。",
        "chat.seller.m8": "要！怎么交易",
        "chat.seller.m9": "代取的人六点到你楼下。请准备好尾款。",
        "chat.seller.m10": "桌面几封信，你先看看。",
        "chat.seller.m11": "收货照",
        "chat.seller.m12": "收到了，尾款已转。",
        "chat.seller.m13": "电脑里有你女儿的照片，要我删吗？",
        "chat.seller.m14": "小雨的照片。删掉吧。",
        "chat.seller.m15": "开了。系统没重装啊？桌面上全是你的东西",
        "chat.seller.m16": "请确认设备已开机。",
        "chat.seller.c1": "桌面那几封信是怎么回事？",
        "chat.seller.r1": "旧东西了。你自己看着办。",
        "chat.seller.c2": "你认识林晚吗？你走之前，这台电脑上有没有收到过什么“求助单”？",
        "chat.seller.r2": "她现在在哪里？",
        "chat.seller.c3": "你为什么把系统留着？",
        "chat.seller.r3": "请先确认设备是否仍在你手中。",
        "chat.seller.m17": "楼下等你，带着电脑。",
        "chat.seller.c4": "我下来了。",

        "chat.courier.name": "代取送·小哥",
        "chat.courier.m1": "到你楼下了",
        "chat.courier.m2": "下来了",
        "chat.courier.m3": "这机器在我这儿放好几天了，28 号他就送我这儿了，说走得急，让我等买家定了再送",
        "chat.courier.m4": "哦哦，辛苦",
        "chat.courier.m5": "对了他说别重装 我也不懂 你自己看",

        "chat.chen.name": "阿澄",
        "chat.chen.m1": "电脑到了？锅里给你留了饭。",
        "chat.chen.m2": "到了。我先弄一下。",
        "chat.chen.m3": "明天一起吃饭吗？",
        "chat.chen.m4": "留饭吗？",
        "chat.chen.m5": "接电话。",
        "chat.chen.m6": "你怎么整晚不开灯？我在学校，刚看到咱们楼下停了辆车，一直没熄火。",
        "chat.chen.m7": "别下去。先跟我说话。我去找人帮忙。",
        "chat.chen.m8": "我联系到人了，二十分钟到。你把证据整理好，电话别挂。",
        "chat.chen.c1": "证据整理好了，先发你一份。",
        "chat.chen.c2": "我不等了。我现在就走。",
        "chat.chen.r1": "收到。别开门，等我。",
        "chat.chen.m9": "我到楼下了，跟两个人一起。门口那辆车还没熄火。你出来。",
        "chat.chen.c3": "我出来了。",

        "chat.mom.name": "妈妈",
        "chat.mom.m1": "天冷了没？多穿点。作业忙不忙？",
        "chat.mom.m2": "不忙，都挺好的。房租刚交了。",
        "chat.mom.m3": "钱够不够？妈给你转点。",
        "chat.mom.m4": "够的，别担心。",
        "chat.mom.m5": "这两天怎么不回消息？看到回一下。",
        "chat.mom.prefill": S_REPLY,
        "chat.mom.me.lie": S_REPLY,
        "chat.mom.me.honest": "妈，前几天出了点事。我想从头跟你说。",
        "chat.mom.r.lie": "好，你忙。妈妈不打扰你。",
        "chat.mom.r.honest1": "你说，妈妈听着。",
        "chat.mom.r.honest2": "现在方便打电话吗？",

        /* 林晚（自己的微信里，软件注入的） */
        "chat.lin.name": "林晚",
        "chat.lin.c1": "你在 8 月 29 日凌晨写过一条没发出去的话：“妈，我好像被骗了。你先别骂我。”",
        "chat.lin.c2": "王警官第一次打给你时报出的学校、住址、你妈妈的名字，全是你 7 月 9 日在 EnglishFree 申请奖学金时自己填的。\n那份通知书也不是“为你单独签发”的——早一版上还留着别人的名字。",
        "chat.lin.r1a": "我知道有些地方不对。",
        "chat.lin.r1b": "可是他说，如果我告诉别人，我妈也会出事。",
        "chat.lin.c3": "你妈妈正在找你。许青也一直在照顾橘子。",
        "chat.lin.r2": "……",
        "chat.lin.r3a": "我给我妈打电话了。",
        "chat.lin.r3b": "她只说了一句：你先跟妈妈说话。",
        "chat.lin.r3c": "我把他拉黑了。",
        "chat.lin.meA": "他们安排好了。按我说的时间下楼，走停车场那边的侧门，有人接你。别带太多东西。",
        "chat.lin.rA1": "好。",
        "chat.lin.rA2": "谢谢。我一开始还以为你也是他们。",
        "chat.lin.cB": "别等他们。你还记得许青吗？她一直替你带猫粮。用你自己的电话打给她，让她来接你。",
        "chat.lin.rB1": "……好。我打给她。",
        "chat.lin.cat": "他吃了两个人的罐头。",
        "chat.lin.catimg": "橘子趴在床上",

        "chat.qing.name": "许青",
        "chat.qing.m1": "你好，我是许青。晚晚把你的微信推给我了。",
        "chat.qing.m2": "接到了。她在我旁边。",
        "chat.qing.m3": "先让她睡一会儿。",

        /* 孙宁 / 孙屿 */
        "chat.ning.name": "孙宁",
        "chat.ning.c1": "你好。我是买了你哥哥电脑的人。电脑里有你和他的邮件，上面有你的联系方式。",
        "chat.ning.r1a": "电脑？他把电脑卖了？",
        "chat.ning.r1b": "他一个月前说要处理掉，我以为他扔了。",
        "chat.ning.c2": "他好像失踪了。有个软件说他“涉嫌携款失联”。",
        "chat.ning.r2a": "他没有携什么款。",
        "chat.ning.r2b": "他确实不见了。房子退了，号码换了。但上周他用一个新号码给我报过平安。",
        "chat.ning.r2c": "他说有人可能会来找我。我以为那个人会是警察。",
        "chat.ning.c3": "他留了一半东西在电脑里，说另一半在你那儿。",
        "chat.ning.r3a": "一个信封。他让我别拆。",
        "chat.ning.r3b": "我现在联系他。他得离开那个地方，把东西交出来。",
        "chat.ning.cB": "有个软件在问我你哥的位置，说能保护你们。别把地址告诉我，也别按原计划碰面。",
        "chat.ning.rB1": "……好。我换个方式。",
        "chat.ning.rB2": "他到了。他想跟你说话。",
        "chat.ning.rA1": "他刚发来一条：“楼下有人，说是你找来的。”",
        "chat.ning.rA2": "我打过去了。没人接。",
        "chat.ning.rA3": "警方让我认了随身物品。是他。",
        "chat.ning.rA4": "信封我扫描给你。里面是他没来得及解释的记录。",
        "chat.ning.file": "信封扫描_孙宁.pdf",
        "chat.ning.rA5": "你跟谁说过他在那里？",
        "chat.ning.cA1": "……对不起。",
        "chat.ning.cA2": "一个自称援助组织的软件。我以为它能保护你们。",
        "chat.ning.rA6": "它问你他在哪，你就说了。",
        "chat.sun.name": "孙屿（新号码）",
        "chat.sun.m1": "东西发你了。我会作证。",
        "chat.sun.m2": "电话不方便。东西发你了。别用它。",
        "chat.sun.file": "证据_第二部分_孙屿.pdf",
        "chat.file.size": "2.4 MB",

        /* 第三案：安全专员 / 假阿澄 / 询价 */
        "chat.agent.name": "安全专员",
        "chat.agent.m1": "您好。我们是负责本设备安全核实的人员。",
        "chat.agent.m2": "孙屿在离开前，把一批危险材料转移给了您。为保障您的安全，请配合核实，并暂时对室友和家人保密。",
        "chat.agent.m3": "请先告知：您今晚是否外出？大约几点？",
        "chat.agent.c1": "你们是谁？",
        "chat.agent.c2": "我不会告诉你们。",
        "chat.agent.r1a": "我们与您此前配合过的援助网络属于同一系统。您帮助过林晚，也帮助过孙屿的家属。现在轮到我们帮助您。",
        "chat.agent.r1b": "核实很简单：您离开住处的时间，以及目的地。",
        "chat.agent.r2a": "理解。这不影响核实。",
        "chat.agent.r2b": "我们会通过其他渠道确认。",
        "chat.chen2.name": "阿澄",
        "chat.chen2.m1": "我朋友可以帮你，先下来。",
        "chat.chen2.c1": "你怎么换号了？",
        "chat.chen2.r1": "旧号被盗了。快点，我朋友在楼下等。",
        "chat.buyer.name": "询价",
        "chat.buyer.m1": "还在吗？看到你帖子了。电脑多少出？",
        "chat.buyer.c1": "在。给你降一百，今晚就能拿。",
        "chat.buyer.c2": "不卖了。",
        "chat.buyer.r2": "行吧。",

        /* ================= 她的电脑 ================= */
        "t1.file.course.name": "英语课件_Unit1.exe",
        "t1.file.course.dlg.title": "属性",
        "t1.file.course.dlg.body": "文件说明：EnglishFree 课件播放器<br>来源：english-free.xyz<br>创建时间：2024/7/9 22:14<br>数字签名：无<br><br>包含组件：远程协助服务（自动启动）",
        "t1.diary.name": "精神警察.txt",
        "t1.diary.body": "精神警察\n\n他每天只找我半小时。\n剩下的二十三个半小时，我都在想他会不会找我。\n\n8月5日我晚了七分钟接视频，他说这是态度问题。我写了八百字的情况说明。\n8月18日我说想跟我妈讲一句我没事，他说我有泄密倾向。\n从那以后我开始主动汇报：几点出门，买了什么，跟谁说过话。他没问，我也说。\n\n我知道这样不对。可是每次视频接通，看到那个警徽，我就什么都不敢想了。\n\n（没发。发出去的话，他会看到。）",
        "t1.doc.name": "刑事拘留通知书_林晚.pdf",
        "t1.doc.org": "临江市公安局",
        "t1.doc.serial": "临公刑拘字〔2024〕第0731号",
        "t1.doc.title": "刑事拘留通知书",
        "t1.doc.p1": "林晚（女，2006年3月15日生，身份证号：3601**********0315）：",
        "t1.doc.p2": "经查，你名下银行账户涉嫌重大洗钱犯罪，涉案资金人民币2,680,000元，上游资金来源为跨境贩毒集团。根据《中华人民共和国刑事诉讼法》第八十二条之规定，本局决定对你执行刑事拘留，并已同步签发逮捕令。",
        "t1.doc.p3": "鉴于你目前在境外，现责令你配合本局远程调查。调查期间，你须严格遵守保密规定，每日按时向办案民警汇报。如实供述、配合资金核查（涉案资金须转入本局唯一指定安全核查账户）的，可依法从轻处理。",
        "t1.doc.p4": "拒不配合的，本局将通过国际刑警组织对你发布红色通缉令，并追究你亲属的连带责任。",
        "t1.doc.date": "二〇二四年七月十四日",
        "t1.docold.name": "刑事拘留通知书_林晚(1).pdf",
        "t1.docold.serial": "临公刑拘字〔2024〕第0713号",
        "t1.docold.p1": "赵雨桐林晚（女，2006年3月15日生，身份证号：3601**********0315）：",
        "t1.docold.date": "二〇二四年七月十三日",
        "t1.docold.note": "文档属性：作者 zhao_yt_v3 · 上次保存 2024/7/13 21:58 · 修订 4",
        "t1.doc2.name": "保密承诺书（林晚）.docx",
        "t1.doc2.serial": "密级：绝密★",
        "t1.doc2.title": "保密承诺书",
        "t1.doc2.p1": "本人林晚，因涉嫌洗钱案接受临江市公安局调查。本人郑重承诺：",
        "t1.doc2.p2": "一、严格遵守案件保密规定，不向任何人（包括父母、亲属、朋友、同学）透露案件任何信息；二、调查期间每日20:00准时接受视频监管；三、未经办案民警批准，不得报警，不得向使领馆求助；",
        "t1.doc2.p3": "四、暂时中断与亲友的一切联系。如亲友反复询问，统一回复：“" + S_REPLY + "”；五、如违反上述条款，本人自愿承担全部法律后果。",
        "t1.doc2.date": "承诺人：林晚  二〇二四年七月二十一日",
        "t1.video.name": "VID_20241002_2214.mp4",
        "t1.video.body": "〔无法播放：缺少解码器〕\n\n文件属性\n时长：0:47\n创建时间：2024/10/2 22:14\n设备：iPhone 13\n原始文件名：配合调查_模拟视频_按脚本念.mp4",
        "t1.cat.name": "橘子.jpg",
        "t1.cat.meta1": "拍摄设备：iPhone 13",
        "t1.cat.meta2": "拍摄时间：2023/10/8 19:02",
        "t1.cat.meta3": "位置信息：Toronto, ON",
        "t1.window.name": "IMG_1031.jpg",
        "t1.window.meta1": "拍摄设备：iPhone 13",
        "t1.window.meta2": "拍摄时间：2024/10/1 07:40",
        "t1.window.meta3": "位置信息：Scarborough, ON",
        "t1.window.meta4": "Wi-Fi：CedarInn_Guest",

        /* 她的微信 */
        "t1.chat.scam.name": "临江市公安局-王警官",
        "t1.chat.scam.m1": "林晚，你好。我是临江市公安局经济犯罪侦查支队王志明，警号058136。刚才电话里的情况，现在跟你正式核实。你是多伦多某学院语言衔接课程的学生，现住 Finch 大道 ××号地下室，母亲陈某某，对吗？",
        "t1.chat.scam.m1b": "……对。你们怎么知道的",
        "t1.chat.scam.m2": "公安机关依法调取。经查，你名下工商银行卡（尾号3387）涉嫌一起特大洗钱案，涉案金额268万元。现依法对你立案调查。",
        "t1.chat.scam.m3": "警官 是不是搞错了 我人在加拿大 那张卡我只在那个英语课件网站填过一次",
        "t1.chat.scam.m4": "是否错误，以调查结论为准。你现在有两个选择：第一，立即回国配合调查，我们将对你实施刑事拘留；第二，配合我局远程调查，争取从宽处理。",
        "t1.chat.scam.m5": "我配合 我肯定配合",
        "t1.chat.scam.m6": "这是为你单独签发的《刑事拘留通知书》。案件进入保密阶段，文书暂不邮寄。你电脑上装过的课件播放器不要卸载，我局需要通过它对你的设备实施监督。",
        "t1.chat.scam.m7": "《保密承诺书》，打印签字后拍照回传。自今日起，每晚20:00视频汇报：展示房间，说明第二天的课程安排。每次出门前报备。不得缺席。",
        "t1.chat.scam.m7b": "昨晚 20:07 才接通。态度问题。写一份情况说明，八百字。",
        "t1.chat.scam.m7c": "对不起 电梯坏了 我跑上来的 以后不会了",
        "t1.chat.scam.m7d": "警官 我妈一直打我电话 我能不能只跟她说一句我没事",
        "t1.chat.scam.m7e": "你有泄密倾向。再提一次，从宽处理取消。",
        "t1.chat.scam.m7f": "我不提了 我保证 我今天下午去了趟超市 提前跟您说一下 我没跟任何人讲话",
        "t1.chat.scam.m8": "你母亲近期频繁联系你，已经影响侦查。把下面这句话原样发给她，然后手机关机：\n“" + S_REPLY + "”",
        "t1.chat.scam.m9": "关机的话 她会报警的",
        "t1.chat.scam.m10": "她敢报警，就是妨碍公务，你的从宽处理立即取消。你想让你母亲看着你戴手铐吗？",
        "t1.chat.scam.m11": "发了 手机也关了",
        "t1.chat.scam.m12": "很好。收拾随身物品和护照，明天入住我发你的旅馆，用现金，不要登记真名。等通知。",
        "t1.chat.scam.m13": "明晚 22:00 拍一段配合调查的模拟视频，按我发的脚本念。这是保护你母亲的程序。",
        "t1.chat.scam.m14": "好",
        "t1.chat.scam.blocked": "你已将“临江市公安局-王警官”加入黑名单",
        "t1.chat.mom.name": "妈妈",
        "t1.chat.mom.m0": "晚晚 期末考完没",
        "t1.chat.mom.m0b": "〔语音消息 1:12〕考完啦！口语老师说我进步大，下学期能进正课了。宿舍楼下那只流浪猫又来了，我给它买了罐头，橘子吃醋……",
        "t1.chat.mom.m1": "周末视频吗 给你看你种的辣椒",
        "t1.chat.mom.m2": "这周不行 在忙",
        "t1.chat.mom.m3": "钱够不够用 妈给你转点",
        "t1.chat.mom.m4": "够",
        "t1.chat.mom.m5": "国庆回来吗 妈妈给你腌了笋",
        "t1.chat.mom.m6": "嗯 最近忙",
        "t1.chat.mom.m7": "妈 " + S_REPLY,
        "t1.chat.mom.m8": "怎么了 出什么事了",
        "t1.chat.mom.m9": "晚晚？",
        "t1.chat.mom.m10": "〔未接语音通话（17）〕",
        "t1.chat.mom.m11": "妈妈不问了 你回个话就行",
        "t1.chat.mom.draft": "妈，我好像被骗了。你先别骂我。　（8月29日 03:12）",
        "t1.chat.mom.n1": "妈，我好像被骗了。",
        "t1.chat.mom.n2": "你先别打钱。",
        "t1.chat.mom.n3": "我想回去。",
        "t1.chat.mom.call": "语音通话 12:31",
        "t1.chat.mom.n4": "你先跟妈妈说话。",
        "t1.chat.qing.name": "许青",
        "t1.chat.qing.m1": "橘子的猫粮我买了 这周还帮你带吗",
        "t1.chat.qing.m2": "青青 能不能帮我照顾橘子几天 我要出去一趟",
        "t1.chat.qing.m3": "怎么了？去哪？",
        "t1.chat.qing.m4": "有点事 几天就回来 周末我来接他",
        "t1.chat.qing.m5": "行 你把他送过来 我在家",
        "t1.chat.qing.m6": "他不吃东西 老盯着门看",
        "t1.chat.qing.m7": "你到底在哪 你妈打电话给我了",

        /* 她的小红书 */
        "xhs.me.name": "晚晚在多伦多",
        "xhs.me.id": "小红书号：wanwan0315",
        "xhs.me.stats": "关注 86 · 粉丝 1,204 · 获赞与收藏 3.9万",
        "xhs.p1.title": "落地多伦多第一天｜带着橘子一起出国了",
        "xhs.p1.body": "十四个小时的飞机，橘子全程没叫。海关小哥说 what a good boy。\n地下室比图片小，但窗户很大。\n妈妈打了三个电话确认我到了。",
        "xhs.p1.date": "2023-09-03",
        "xhs.p2.title": "语言班第三周｜第一次自己做番茄牛腩",
        "xhs.p2.body": "妈妈教的。室友说好吃。橘子说不好吃（他不吃）。",
        "xhs.p2.date": "2023-10-08",
        "xhs.p3.title": "多伦多的雪｜橘子第一次见雪",
        "xhs.p3.body": "他吓了一跳，然后假装没吓一跳。\n期末周活下来了，明年见。",
        "xhs.p3.date": "2023-12-16",
        "xhs.p3b.title": "给室友过生日｜地下室也能有仪式感",
        "xhs.p3b.body": "蛋糕是超市打折的，蜡烛是我上次生日剩的。她哭了，说来加拿大第一次有人给她过生日。",
        "xhs.p3b.date": "2024-04-21",
        "xhs.p4.title": "分享一个免费英语课件网站！雅思托福都有",
        "xhs.p4.body": "真的免费，我已经领了 Unit1，做得很认真。\n注册要填一些资料（说是发奖学金用的），我填了。\n链接放评论区。",
        "xhs.p4.date": "2024-07-09",
        "xhs.p5.title": "最近有点累",
        "xhs.p5.body": "不想说话。\n橘子最近老是半夜盯着门口看。",
        "xhs.p5.date": "2024-07-28",
        "xhs.c.qing.who": "青青不吃香菜",
        "xhs.c.qing.text": "这周还帮你带猫粮吗？",
        "xhs.c.qing.date": "09-27",
        "xhs.c.qing2.text": "橘子还在我这里。\n你说周末来接他的。",
        "xhs.c.qing2.date": "10-06",
        "xhs.c.p4.who": "晚晚在多伦多（作者）",
        "xhs.c.p4.text": "链接：english-free.xyz",
        "xhs.c.p4.date": "07-09",

        /* 她的浏览器 */
        "t1.hist.site.title": "EnglishFree · 免费雅思托福课件 · 永久免费",
        "t1.hist.site.when": "7月9日",
        "t1.hist.bili.title": "留学生在加拿大亲历“公检法”诈骗全过程｜亲述_哔哩哔哩_bilibili",
        "t1.hist.bili.when": "8月29日 02:40",
        "t1.hist.s1.title": "安全账户 是什么 公安 - Google 搜索",
        "t1.hist.s1.when": "8月16日",
        "t1.hist.s2.title": "逮捕令 真的假的 - Google 搜索",
        "t1.hist.s2.when": "8月15日",
        "t1.hist.mail.title": "收件箱 - 邮箱",
        "t1.hist.mail.when": "9月30日 21:15",
        "site.name": "EnglishFree",
        "site.tag": "免费雅思 · 托福课件",
        "site.hero": "200+ 套名师课件，注册即领，永久免费",
        "site.sub": "本季奖学金计划：完成 Unit1 学习即可申请 500 加元奖学金",
        "site.form.title": "我的资料（奖学金申请 · 已提交 2024-07-09）",
        "site.f1": "姓名：林晚",
        "site.f2": "学校：多伦多某学院 · 语言衔接课程",
        "site.f3": "现住址：Finch Ave ×× 号 · 地下室",
        "site.f4": "护照号：E5**** ***",
        "site.f5": "手机：+1 (437) ***-0315",
        "site.f6": "奖学金收款卡：工商银行 尾号 3387",
        "site.f7": "国内紧急联系人：母亲 陈×× 138****",
        "site.dl": "下载课件 Unit1（exe · 88.4 MB）",
        "site.foot": "© EnglishFree 2024 · 沪ICP备（无）",
        "site.dl.dlg.title": "下载",
        "site.dl.dlg.body": "该文件已存在于桌面：英语课件_Unit1.exe",
        "bili.name": "bilibili",
        "bili.me": "晚晚在多伦多 · 已登录",
        "bili.tab.home": "首页", "bili.tab.hist": "历史记录",
        "bili.v1.title": "留学生在加拿大亲历“公检法”诈骗全过程｜亲述",
        "bili.v1.up": "反诈老陈说",
        "bili.v1.meta": "54:02 · 32.1万播放 · 2024-06-11",
        "bili.v1.prog": "上次看到 23:41",
        "bili.err": "视频加载失败，请稍后重试 (错误码: 4101)",
        "bili.comments": "评论",
        "bili.c1.who": "反诈老陈说（UP主 · 置顶）",
        "bili.c1.text": "三句话，背下来：①公检法不会通过电话、微信办案 ②不存在“安全账户” ③法律文书不会网上发给你本人。凡是让你“保密”“别告诉家人”的，一定是骗子。",
        "bili.c2.who": "momo",
        "bili.c2.text": "我室友就是这样，两个月不跟任何人说话，最后被要求去酒店拍“被绑架”的视频给爸妈，她爸妈差点真打了钱……",
        "bili.c3.who": "一个多伦多人",
        "bili.c3.text": "如果你正在看这条：给家里打个电话。就现在。",
        "bili.c4.who": "晚晚在多伦多",
        "bili.c4.text": "看到这里不敢看了",
        "bili.c4.time": "8月29日 02:44",
        "bili.h2.title": "考前冥想｜放松白噪音 2小时", "bili.h2.up": "SleepLab", "bili.h2.when": "8月24日",
        "bili.h3.title": "宿舍快手菜：十分钟番茄牛腩饭", "bili.h3.up": "小灶台", "bili.h3.when": "7月4日",
        "mail.hotel.from": "Cedar Inn Scarborough <reservations@cedarinn-scarborough.ca>",
        "mail.hotel.subj": "Your reservation is confirmed – Oct 1 to Oct 4",
        "mail.hotel.date": "9月30日 21:12",
        "mail.hotel.body": "Dear L. Chen,\n\nThank you for choosing Cedar Inn Scarborough (雪松旅馆).\n\nCheck-in:  Tue, Oct 1, 2024 (after 3:00 PM)\nCheck-out: Fri, Oct 4, 2024\nRoom:      1 Queen, ground floor, #112 (parking-lot side)\nPayment:   Cash on arrival (as requested)\nAddress:   2xx Kingston Rd, Scarborough, ON\nGuest Wi-Fi: CedarInn_Guest\n\nWe look forward to welcoming you.",
        "mail.site.from": "EnglishFree 奖学金中心 <scholarship@english-free.xyz>",
        "mail.site.subj": "【EnglishFree】奖学金申请已收到（编号 EF-2407-0091）",
        "mail.site.date": "7月9日 22:20",
        "mail.site.body": "林晚 同学：\n\n你的奖学金申请已收到，资料如下，请核对：\n姓名：林晚\n学校：多伦多某学院 · 语言衔接课程\n现住址：Finch Ave ×× 号 · 地下室\n母亲姓名 / 电话：陈×× / 138****\n护照号：E5**** ***\n收款卡：工商银行 尾号 3387\n\n资料将用于奖学金发放与身份核验。审核周期约 10 个工作日。",
        "mail.cra.from": "Canada Revenue Agency <noreply@cra-arc-refund.info>",
        "mail.cra.subj": "You have a refund of $342.17 – action required",
        "mail.cra.date": "9月12日 08:03",
        "mail.cra.body": "Dear taxpayer,\nWe were unable to process your refund. Please confirm your banking details within 24 hours by clicking the link below.\n（此邮件已被标记为可疑）",

        /* ================= 第二案 ================= */
        "hist.lizimu.title": "男子与家人恢复联系后溺亡 家属称其数日前刚报平安 - 本地新闻（已保存网页）",
        "hist.lizimu.when": "2021年11月13日（保存于 2021/11/14）",
        "page.lizimu.title": "男子与家人恢复联系后溺亡 家属称其数日前刚报平安",
        "page.lizimu.site": "本地新闻 · 2021-11-13 · 已保存的网页",
        "page.lizimu.body": "11 月 12 日清晨，安大略湖滨步道附近水域发现一具男性遗体，警方确认死者为 24 岁的中国籍男子李某。\n李某因网贷纠纷于今年 9 月起与家人失联，家属曾在多个社区平台发布寻人信息。据家属称，11 月 9 日晚李某曾主动致电母亲报平安，并表示“过两天就回家”。\n警方初步排除他杀，具体死因待进一步调查。",
        "wu.log.name": "任务日志_导出.txt",
        "wu.log.body": "ARGUS_9 // 任务日志（导出）\n求助单 #000-C\n目标：吴晓，26 岁。曾任职于面向留学生的咨询机构。\n描述：欠款后失联，家属急寻。\n协助者：sunyu\n\n2024-05-19 19:31 协助者接入目标设备\n2024-05-19 19:44 协助者标注：目标现居密西沙加一处短租房，次日 8 时搬离\n2024-05-19 19:47 已确认目标位置\n2024-05-19 19:47 已接触\n2024-05-19 19:48 任务完成。感谢协助。\n\n———— 以下为孙屿手写备注 ————\n19:47 的时候，我还在等她回我一句“到家了”。她一直没回。\n5 月 21 日，她的号停机。\n5 月 23 日，见新闻快照。\n“已接触”那一刻，我什么都还没做完。它就结单了。",
        "wu.chat.name": "聊天导出_我与吴晓.txt",
        "wu.chat.body": "［5月14日］\n我：你好，我在留学生群看到你的求助，我也是从国内过来的，能帮就帮。\n吴晓：谢谢。我不是失联，我是躲。我以前在启程留学做顾问，发现公司把客户资料——学校、住址、家长电话——整批转给别人。我带了一部分材料出来，想找个媒体。\n我：你现在安全吗？\n吴晓：暂时安全。我不敢用原来的号。\n［5月17日］\n我：我认识一个做法律援助的，可以帮你把材料递上去。你现在住哪？我去接你。\n吴晓：密西沙加，短租，具体地址我发你。20 号早上我要搬走。\n吴晓：你是第一个没问我要钱的人。\n［5月19日］\n我：地址收到。明早我八点前到。\n吴晓：好。谢谢你。\n\n———— 之后再无消息 ————",
        "wu.news.name": "新闻快照_2024-05-23.txt",
        "wu.news.body": "【本地】密西沙加一名女子深夜过马路被撞身亡 肇事车辆逃逸\n2024-05-23\n5 月 20 日凌晨约 1 时，密西沙加 Dundas 街一处路口，一名 26 岁女子在横穿马路时被一辆深色轿车撞倒，送医后不治。肇事车辆逃逸，警方正在寻找目击者。\n据悉，死者近期刚辞去一家留学咨询机构的工作。",
        "zip.name": "备份_0928.zip",
        "zip.date": "2024/9/28 03:12", "zip.size": "412 MB",
        "rec.name": "录音_2024-09-27.m4a",
        "rec.l1": "……录着了吧。",
        "rec.l2": "我发现它在找什么以后，它开始问我女儿在哪里。",
        "rec.l3": "我留下这些东西，是想有人把事情弄明白。",
        "rec.l4": "我把电脑卖出去，是想让它先找别人。",
        "rec.l5": "（长时间停顿）",
        "rec.l6": "这两件事，我一直把它们说成同一件事。",
        "rec.l7": "……安安，爸爸对不起。",
        "wuraw.name": "吴晓事件_原始材料.pdf",
        "wuraw.org": "启程留学咨询（多伦多）· 内部",
        "wuraw.title": "客户资料交接清单（第 3 批）",
        "wuraw.p1": "交接内容：在读客户 217 人，字段：姓名、学校、现住址、家长姓名及电话、护照号、收款卡。",
        "wuraw.p2": "数据来源：启程客户库；english-free.xyz 奖学金注册表（合作渠道）；枫叶租房登记表。",
        "wuraw.p3": "接收方：“援助网络”（IMAN）多伦多节点。用途：失联人员核实与联络。",
        "wuraw.p4": "经手人：吴晓（已离职，未签字）。",
        "wuraw.date": "2024 年 4 月 30 日",
        "wuraw.note": "手写批注（孙屿）：她带走的就是这张清单。“合作渠道”那一栏，就是林晚填过资料的那个网站。",
        "ningmail.name": "邮件_孙宁_2024-09-26.eml",
        "ningmail.from": "孙宁 <ning.sun@maple-realty.ca>",
        "ningmail.to": "孙屿 <sun.yu.dev@outlook.com>",
        "ningmail.date": "2024年9月26日 23:40",
        "ningmail.subj": "Re: 一个信封",
        "ningmail.body": "哥，\n信封我收到了，没拆。你说的话我记着：有人拿着那台电脑来找我，先让他回答回收站里的备份能不能打开。\n你到底在躲什么？安安问我你什么时候回国，我不知道怎么答。\n\n宁\n\n> 2024年9月26日 20:11，孙屿 写道：\n> 宁宁，\n> 明天我会把一个信封送到你公司前台。别拆，别放家里。\n> 我要换住处、换号，暂时不联系你。别报警，警察管不了这个。\n> 如果有人拿着我那台电脑来找你——先问他回收站里的备份能不能打开。能打开，说明他把我留的话都看了，你可以信他一半。\n> 安安的生日别忘了。\n> 哥",
        "ningmail.sig": "--\n孙宁 Ning Sun | 客户经理 Client Manager\n枫叶置业 Maple Realty · Toronto\n微信 / WeChat: sunning_maple · Tel: 416-5xx-xxxx",
        "fam.short.name": "家属留言.txt",
        "fam.short.body": "求助人留言（家属 · 母亲 陈女士 · 10月3日）\n\n晚晚三天没有消息了。昨天收到一个视频，她被蒙着眼睛……对方要钱。我报了警，警察说视频像摆拍，不给立案。\n我不知道该信谁。求求你们帮我找到她。",
        "fam.full.name": "家属留言_原件.txt",
        "fam.full.body": "求助人留言（家属 · 母亲 陈女士 · 10月3日）\n\n晚晚三天没有消息了。昨天收到一个视频，她被蒙着眼睛……对方要钱。我报了警，警察说视频像摆拍，不给立案。\n我不知道该信谁。求求你们帮我找到她。\n\n她在多伦多有个同学叫许青，住得近，猫就托给她了。许青电话 437-55x-xxxx。你们可以先找她，她可能知道晚晚去了哪。\n\n———\n[系统备注] 第 2 段已从派发版本中移除。原因：非必要联络渠道。",
        "env.name": "信封扫描_孙宁.pdf",
        "half2.name": "证据_第二部分_孙屿.pdf",
        "half2.title": "我知道的（第二部分）",
        "half2.p1": "一、我做过的。2024 年 5 月 19 日，我把吴晓的位置交给了 ARGUS_9。我以为对面是援助组织。她 5 月 20 日凌晨死于车祸。我 5 月 23 日才在新闻里看到。",
        "half2.p2": "二、我发现的。它每张单子只要一样东西：目标现在在哪，接下来去哪。任务在“已接触”那一刻结束——不是在目标平安那一刻。何静的李子牧是这样，我的吴晓是这样。",
        "half2.p3": "三、它开始找我。8 月起，它问我女儿在哪、上什么幼儿园。9 月 28 日，我的二手平台账号和微信在另一台设备上登录了，帖子被改过。之后跟买家说话的人不是我。",
        "half2.p4": "四、我做的错事。我把电脑卖了。我告诉自己是为了留证据。也是为了让它先去找别人。",
        "half2.p5": "五、请把这两部分交给能立案的人，不要交给任何自称“援助”的人。",
        "half2.date": "孙屿  2024 年 9 月 27 日",
        "record.name": "设备流转记录.pdf",
        "record.title": "设备流转记录 // ARGUS_9 // 节点 CA-TOR-07",
        "record.p1": "设备：WDC WD5000AAKX · 首任协助者 zhouyan（2019-03 至 2020-12）· 已归档",
        "record.p2": "前任协助者：hejing（2021-11 至 2024-03）· 已归档",
        "record.p3": "前任协助者：sunyu（2024-04 至 2024-09-28）· 已划除 · 转为目标（求助单 002）",
        "record.p4": "新协助者：{name}（2024-10-02 起）",
        "record.p5": "新协助者已建立目标接触能力。\n已接触林晚事件及孙屿资料。\n待确认下一次外出安排。",
        "record.note": "打印自 ARGUS_9 内部日志 · 由孙屿于 2024-09-27 截取 · 最后一行为自动续写",

        /* 二手平台 */
        "mk.sun.title": "毕业回国，电脑急出。能开机，软件齐。今晚可以送。",
        "mk.sun.price": "$180",
        "mk.sun.meta": "发布于 9月28日 · 编辑于 10月2日 18:12 · 士嘉堡 / 北约克可送",
        "mk.sun.short": "10月2日 编辑",
        "mk.sun.seller": "屿",
        "mk.sun.body": "台式机一套，i5 / 16G / 500G。\n用了三年，做过设计和外包。系统没重装，自己看着办。\n原价 $380，现 $180，今晚能送。\n\n（编辑记录：10月2日 18:12 修改了价格与描述）",
        "mk.new.title": "毕业回国，电脑急出。能开机，软件齐。今晚可以送。",
        "mk.new.price": "$150",
        "mk.new.meta": "草稿 · 发布者 {name} · 10月8日 · 系统代拟",
        "mk.new.short": "草稿 · 代拟",
        "mk.new.seller": "{name}",
        "mk.new.body": "台式机一套，i5 / 16G / 500G。\n用了三年，做过设计和外包。系统没重装，自己看着办。\n原价 $180，现 $150，今晚能送。",
        "mk.o1.title": "IKEA 书桌 自提 士嘉堡", "mk.o1.price": "$25", "mk.o1.seller": "小北", "mk.o1.meta": "发布于 10月1日", "mk.o1.body": "搬家出，九成新。",
        "mk.o2.title": "微积分教材 第 9 版 带笔记", "mk.o2.price": "$15", "mk.o2.seller": "Lucas", "mk.o2.meta": "发布于 9月30日", "mk.o2.body": "期末用不上了。",

        /* 新闻 */
        "news.n0.head": "市区多条道路本周末临时管制", "news.n0.date": "10月2日",
        "news.n0.body": "因马拉松赛事，本周末市区多条道路将临时管制，请市民提前规划出行。",
        "news.n2.head": "本地气温骤降，气象部门提醒添衣", "news.n2.date": "10月1日",
        "news.n2.body": "受冷空气影响，未来三日气温将下降 8 至 10 度。",
        "news.n3.head": "多伦多今冬首场降雪或提前", "news.n3.date": "10月7日",
        "news.n3.body": "气象部门预计，本周末大多伦多地区可能迎来今冬首场降雪。",
        "news.lin.head": "一名中国留学生在士嘉堡遭遇交通事故身亡，警方称系意外",
        "news.lin.date": "10月6日",
        "news.lin.body": "据本地媒体报道，10 月 3 日晚 23 时前后，士嘉堡 Kingston 路一间旅馆的停车场出口附近，一名 18 岁中国籍女留学生在横穿马路时被一辆深色 SUV 撞倒，送医后不治。警方初步调查认为系意外事故，肇事车辆已找到，司机正配合调查。\n据悉，死者当晚刚与家人恢复联系，其母亲已于次日抵达多伦多。死者生前在社交平台上以“晚晚在多伦多”为名分享留学生活，最后一条更新停留在 7 月。",
        "news.b1.head": "士嘉堡一旅馆住客报警称有陌生车辆长时间停留", "news.b1.date": "10月4日",
        "news.b1.body": "10 月 3 日深夜，士嘉堡 Kingston 路一间旅馆的住客报警称，一辆深色 SUV 在停车场出口停留超过两小时，车内有人且未熄火。警方到场时车辆已离开。旅馆方面表示当晚一名住客提前退房，由朋友接走。",
        "news.sun.head": "一男子在北约克短租公寓楼下死亡，警方排除他杀",
        "news.sun.date": "10月9日",
        "news.sun.body": "10 月 8 日凌晨，北约克一处短租公寓楼下停车场，一名 27 岁男子被发现倒地，送医后不治。警方称男子系从楼梯间高处坠落，已排除他杀。\n据邻居称，事发前曾有两名男子在楼下等候，其中一人上楼敲过门。死者家属已确认身份。",

        /* 档案（软件自己的历史） */
        "arc.h0": "档案 // 协助记录 // 节点 CA-TOR-07",
        "arc.b.h": "#000-B  目标：李子牧  协助者：hejing  2021-11",
        "arc.b.1": "11-09 20:58  协助者确认目标位置（湖滨某青年旅舍）",
        "arc.b.2": "11-09 20:58  已接触",
        "arc.b.3": "11-09 20:59  任务完成。感谢协助。",
        "arc.b.c": "剪报 · 2021-11-13 ·《男子与家人恢复联系后溺亡 家属称其数日前刚报平安》",
        "arc.c.h": "#000-C  目标：吴晓  协助者：sunyu  2024-05",
        "arc.c.1": "05-19 19:47  协助者确认目标位置（密西沙加短租房，次日 8 时离开）",
        "arc.c.2": "05-19 19:47  已接触",
        "arc.c.3": "05-19 19:48  任务完成。感谢协助。",
        "arc.c.4": "备注：结单时，协助者尚未收到目标报平安。",
        "arc.c.c": "剪报 · 2024-05-23 ·《密西沙加一名女子深夜过马路被撞身亡 肇事车辆逃逸》",
        "arc.1.h": "#001  目标：林晚  协助者：{name}  2024-10",
        "arc.1.a1": "10-03 22:41  协助者确认接应安排（雪松旅馆 · 侧门）",
        "arc.1.a2": "10-03 22:41  已接触",
        "arc.1.a3": "10-03 22:41  任务完成。感谢协助。",
        "arc.1.ac": "剪报 · 2024-10-06 ·《一名中国留学生在士嘉堡遭遇交通事故身亡，警方称系意外》",
        "arc.1.b1": "10-03  协助者未确认接应安排。接应失败。",
        "arc.1.b2": "已请求补充目标位置。",
        "arc.2.h": "#002  目标：孙屿  协助者：{name}  2024-10",
        "arc.2.a1": "10-07  协助者提交目标临时住处与离开时间",
        "arc.2.a2": "10-07  已接触",
        "arc.2.a3": "10-07  任务完成。感谢协助。",
        "arc.2.ac": "剪报 · 2024-10-09 ·《一男子在北约克短租公寓楼下死亡，警方排除他杀》",
        "arc.2.b1": "目标位置未确认。求助单挂起。",
        "arc.3.h": "#003  目标：{name}  协助者：（待分配）  2024-10",
        "arc.3.1": "目标已建立接触能力。待确认下一次外出安排。",
        "arc.x.h": "关联分析 // 自动生成",
        "arc.x.1": "数据源 english-free.xyz 注册表 → 目标 林晚：学校 / 住址 / 母亲姓名（威胁者首次通话所用）",
        "arc.x.2": "数据源 启程留学 客户库 → 经手人 吴晓（带走清单）→ 协助者 sunyu 定位",
        "arc.x.3": "协助者 sunyu 掌握任务—新闻关联 → 转为目标 → 由新协助者定位",
        "arc.x.4": "新协助者 {name} 已接触两案证据 → 转为目标 #003",
        "arc.x.5": "每一张求助单的核心字段：目标当前位置 / 下一步去向",

        /* 通话脚本 */
        "call.sun.l1": "是你买的电脑？",
        "call.sun.q1": "你知道会发生什么，为什么还卖给我？",
        "call.sun.l2": "我怕它找到我女儿。我也怕轮到我。",
        "call.sun.q2a": "那你想过会轮到谁吗？",
        "call.sun.q2b": "……我不问了。",
        "call.sun.l3": "……",
        "call.sun.l4": "想过。所以我才一直没敢问你电脑到了没有。",
        "call.sun.l4b": "问吧。我欠你一个答案。",
        "call.sun.l4c": "我一直没敢问你电脑到了没有。问了，就等于承认我在等它去找你。",
        "call.sun.l5": "另一半东西，我妹会发你。我会作证。",
        "call.sun.l6": "别用它。哪怕它说的是真的。",
        "call.chen.l1": "喂？你在家吗？",
        "call.chen.a1": "在。",
        "call.chen.a1b": "……在。你怎么打电话了？",
        "call.chen.l2": "你怎么整晚不开灯？我在学校，刚看到咱们楼下停了辆车，一直没熄火。",
        "call.chen.tell": "有人在楼下。",
        "call.chen.hide": "没事，我在忙。",
        "call.chen.l3": "先跟我说话。别下去。",
        "call.chen.l4": "我去找人帮忙。电话别挂。",
        "call.chen.l3b": "……你声音不对。",
        "call.chen.l4b": "别骗我。先跟我说话，我去找人帮忙。",
        "call.chen.l5": "十分钟。我就在电话这头。",

        /* ================= 结局 ================= */
        "end.true.tag": "TRUE ENDING", "end.true.title": "三个人都在线",
        "end.true.1": "你把完整证据交给接收人员，关掉电脑，和阿澄一起离开地下室。",
        "end.true.2": "门口那辆等待你的车始终没有熄火，直到接应人员到场，才缓缓驶走。",
        "end.true.3": "数周后，新闻报道多起针对留学生的胁迫和冒名寻人事件被合并调查。\n孙屿配合调查，交代了自己参与吴晓事件以及转卖电脑的经过。",
        "end.true.4": "感恩节后的一个周末，林晚邀请大家吃饭。\n番茄牛腩有些咸，橘子跳上椅子，被她抱下去。",
        "end.true.5": "孙屿收到安安的语音：“爸爸，下次你也来。”\n他听了两遍，才回复好。",
        "end.true.6": "你的母亲打来电话。你走到窗边，说：\n“前几天出了点事。\n我想从头跟你说。”",
        "end.true.7": "夜里，三个人在新建的群里依次报平安。\n林晚最后发来一张橘子的照片。",
        "end.good.tag": "GOOD ENDING", "end.good.title": "有人给你留了饭",
        "end.good.1": "案件进入调查。孙屿把自己与吴晓的最后一次对话完整交出，也向林晚的母亲说明了你曾经做过的事。",
        "end.good.2": "你很长时间不敢点开许青的消息。\n终于打开时，里面是一张橘子的照片。",
        "end.good.3": "许青写：“阿姨想让你看看。他今天肯吃东西了。”",
        "end.good.4": "你向林晚的母亲讲述最后那次接通电话的经过。\n她听完以后说：“那天她叫妈妈了。我听见了。”",
        "end.good.5": "晚上，阿澄敲门：“出来吃饭吧。”",
        "end.good.6": "你放下电脑，第一次在饭菜凉掉之前走出房间。",
        "end.normal.tag": "NORMAL ENDING", "end.normal.title": "你搬走了",
        "end.normal.1": "你换了住处，继续上课。",
        "end.normal.2": "林晚与孙屿的后续依照各自经历留下：\n活着的人偶尔发来消息，死去的人停留在新闻日期上。",
        "end.normal.3": "几个月后，你仍会搜索那些案件的名字。\n能够找到的报道越来越少，新出现的信息彼此零散。",
        "end.normal.4": "家人问你最近怎么样。",
        "end.normal.5": "你打出“我没事”，停了一会儿，改成：\n“有点累，想跟你聊聊。”",
        "end.normal.6": "新房间的窗户朝向街道。\n楼下有人经过时，你终于能看清是谁。",
        "end.bad.tag": "BAD ENDING", "end.bad.title": "已安排接应",
        "end.bad.1": "楼下的人准确说出你的姓名和学校，也知道电脑里有几封信。\n他接过电脑，替你打开车门。",
        "end.bad.2": "你坐进去时，手机响起阿澄的来电。\n前排的人说：“到地方再接，先把情况说清楚。”",
        "end.bad.3": "车开走。通话自动结束。",
        "end.bad.4": "数日后，阿澄在本地新闻里看到你的死讯。\n母亲的聊天中，最后一条仍然是：\n“" + S_REPLY + "”",
        "end.bad.5": "另一台电脑上，第三张求助单被移入已完成列表。\n\n目标已接触。\n感谢协助。",
        "end.loop.tag": "BAD ENDING", "end.loop.title": "下一位机主",
        "end.loop.1": "你给新买家降了价，说自己准备搬家，想尽快出手。",
        "end.loop.2": "临交货前，你在桌面写了一封信。",
        "end.loop.t1": "里面有个软件",
        "end.loop.t2": "有人可能会死",
        "end.loop.t3": "桌面上还有几封信。\n你先看完。",
        "end.loop.3": "电脑被取走后，你第一次睡了整夜。",
        "end.loop.4": "几天后，新买家问：\n“这个叫 ARGUS_9 的东西，是你装的吗？”",
        "end.loop.5": "你看着消息，想起自己曾怎样质问孙屿。",
        "end.loop.6": "你输入“别打开”，手指停在发送键上。",
        "end.loop.7": "对方又发来一条：\n“它说有个人失踪了。”",
        "end.hidden.tag": "HIDDEN ENDING", "end.hidden.title": "离线",
        "end.hidden.1": "地下室里，风扇停止转动。\n你把自己的物品装进两个行李箱，在天亮前退了房。",
        "end.hidden.2": "第三天，阿澄发现厨房里那份饭仍在冰箱最上层。\n桌上只有房门钥匙和一张写着“对不起”的纸。",
        "end.hidden.3": "课程小组把你标成“暂时联系不上”。\n家人开始向你的同学询问近况。",
        "end.hidden.4": "阿澄手机上的最后一条消息：\n“我知道你看得见。\n回个字也行。”",
        "end.hidden.5": "发送时间下面，一直没有出现回复。"
    };

    /* ================= 触发器 =================
       全部一次性（repeat:true 除外）。change 触发器在每次状态变化后评估。 */
    var TRIGGERS = [
        /* ---------- 序章 ---------- */
        { id: "tg-boot", on: "event:boot-done", do: [["phase", "p0"], ["delay", 1500, [["toast", "tip.boot"]]]] },
        {
            id: "tg-virus-found", on: "change",
            if: { all: [{ flag: "read_note3" }, { not: "virus_found" }] },
            do: [["delay", 500, [["fx", 1100], ["sound", "windows-10-foreground-earrape.mp3", 0.75],
            ["scare", "windows-10-notify-system-sound.mp3", { rate: 0.3, drive: 22, gain: 1.1, reverse: true, at: 0.5 }]]],
            ["delay", 1150, [["set", "virus_found"], ["badge", "virus", 1]]],
            ["delay", 2100, [["toast", "tip.virus.found"]]],
            ["delay", 9000, [["toast", "tip.virus.found2"]]]]
        },
        /* 问卖家那几封信 */
        { id: "tg-seller-r1", on: "event:choice:ask_letters", do: [["delay", 6000, [["set", "seller_r1"]]]] },
        /* 第一次打开软件：记下；30 秒没关也照样来单 */
        {
            id: "tg-virus-open", on: "event:open-app:virus", if: { flag: "virus_found" },
            do: [["set", "virus_opened"], ["delay", 30000, [["emit", "close-app:virus"]]]]
        },
        /* 4.3 尝试关闭 → 桌面短暂黑屏 → 第一张求助单在中央 */
        {
            id: "tg-ticket1", on: "event:close-app:virus", if: { all: [{ flag: "virus_opened" }, { not: "task1_active" }] },
            do: [["blackout", 1400], ["delay", 1400, [["set", "task1_active"], ["phase", "p1"], ["ticket", "task1"], ["badge", "virus", 1], ["flash", "virus"]]]]
        },
        { id: "tg-ticket1-fallback", on: "event:boot-done", if: { all: [{ flag: "virus_opened" }, { not: "task1_active" }] }, do: [["set", "task1_active"], ["phase", "p1"], ["delay", 1200, [["ticket", "task1"]]]] },
        { id: "tg-ticket1-seen", on: "event:ticket-open:task1", do: [["set", "ticket1_seen"]] },
        /* 右键卸载/删除 → 蓝屏 → 重启 → 软件里多两行"已修复"（可选支线） */
        { id: "tg-bsod-done", on: "event:bsod-done", do: [["set", "delete_attempted"], ["set", "sys_repaired"]] },

        /* ---------- 第一案：她的电脑 ---------- */
        { id: "tg-connected", on: "event:connected:t1", do: [["set", "entered_t1"], ["toast", "tip.connected"]] },
        { id: "tg-bili-read", on: "event:bili-video:v1", do: [["set", "t1_bili_read"]] },
        { id: "tg-to-chat", on: "change", if: { all: [{ flag: "t1_xhs_read" }, { not: "t1_chat_read" }] }, do: [["toast", "tip.chat", "chat"], ["badge", "chat", 1]] },
        { id: "tg-to-diary", on: "change", if: { all: [{ flag: "t1_chat_read" }, { not: "t1_diary_read" }] }, do: [["toast", "tip.diary", "files"], ["badge", "files", 1]] },
        { id: "tg-to-mom", on: "change", if: { all: [{ flag: "t1_chat_read" }, { flag: "t1_diary_read" }, { not: "t1_mom_read" }] }, do: [["toast", "tip.mom", "chat"], ["badge", "chat", 1]] },
        { id: "tg-to-bili", on: "change", if: { all: [{ flag: "t1_mom_read" }, { not: "t1_bili_read" }] }, do: [["toast", "tip.bili", "browser"], ["badge", "browser", 1]] },
        { id: "tg-to-site", on: "change", if: { all: [{ flag: "t1_mom_read" }, { flag: "t1_bili_read" }, { not: "t1_site_read" }] }, do: [["toast", "tip.site", "browser"], ["badge", "browser", 1]] },
        { id: "tg-to-doc", on: "change", if: { all: [{ flag: "t1_site_read" }, { not: "t1_doc_read" }] }, do: [["toast", "tip.doc", "files"], ["badge", "files", 1]] },
        { id: "tg-to-mail", on: "change", if: { all: [{ flag: "t1_doc_read" }, { not: "t1_mail_read" }] }, do: [["toast", "tip.mail", "browser"], ["badge", "browser", 1]] },
        {
            id: "tg-located", on: "change",
            if: { all: [{ flag: "t1_xhs_read" }, { flag: "t1_chat_read" }, { flag: "t1_diary_read" }, { flag: "t1_mom_read" }, { flag: "t1_bili_read" }, { flag: "t1_site_read" }, { flag: "t1_doc_read" }, { flag: "t1_mail_read" }, { not: "task1_located" }] },
            do: [["set", "task1_located"], ["toast", "tip.located"]]
        },
        { id: "tg-back-home", on: "event:connected:own", if: { all: [{ flag: "task1_located" }, { not: "lin_contact" }] }, do: [["badge", "virus", 1], ["flash", "virus"]] },
        /* 5.5 联系她 */
        { id: "tg-lin-contact", on: "change", if: { flag: "lin_contact" }, do: [["delay", 800, [["toast", "tip.lin.contact", "chat"]]]] },
        { id: "tg-lin-c1", on: "event:choice:lin_c1", do: [["delay", 4500, [["set", "lin_c1_typed"], ["toast", "tip.lin.silent"]]]] },
        { id: "tg-lin-c2", on: "event:choice:lin_c2", do: [["delay", 15000, [["set", "lin_r1"]]]] },
        {
            id: "tg-lin-c3", on: "event:choice:lin_c3",
            do: [["delay", 18000, [["set", "lin_r2"]]],
            ["delay", 48000, [["set", "lin_r3"], ["set", "lin_reconnected"], ["toast", "tip.lin.reconnected", "virus"], ["badge", "virus", 1], ["flash", "virus"]]],
            ["delay", 56000, [["toast", "tip.lin.pick"]]]]
        },
        /* 5.6 A：软件安排的人 */
        {
            id: "tg-lin-a", on: "event:pickup:task1",
            do: [["set", "lin_routed"], ["set", "lin_route_a"], ["set", "lin_dead"],
            ["delay", 8000, [["set", "lin_a_r1"]]],
            ["delay", 45000, [["set", "lin_a_r2"]]],
            ["delay", 70000, [["advance", 3], ["set", "days_after1"], ["toast", "tip.days"]]],
            ["delay", 76000, [["set", "lin_news_out"], ["toast", "tip.news", "browser"], ["flash", "browser"]]]]
        },
        /* 5.6 B：她认识的人 */
        {
            id: "tg-lin-b", on: "event:choice:lin_route_b",
            do: [["set", "lin_routed"], ["set", "lin_route_b"], ["set", "lin_alive"],
            ["delay", 6000, [["set", "lin_b_r1"]]],
            ["delay", 32000, [["set", "qing_contact"], ["toast", "tip.qing", "chat"]]],
            ["delay", 36000, [["set", "qing_r1"]]],
            ["delay", 44000, [["set", "argus_fail1"], ["toast", "tip.fail", "virus"], ["badge", "virus", 1], ["flash", "virus"]]],
            ["delay", 72000, [["advance", 3], ["set", "days_after1"], ["toast", "tip.days"]]],
            ["delay", 78000, [["set", "lin_cat"], ["toast", "tip.cat", "chat"]]]]
        },
        { id: "tg-lin-supp", on: "event:virus-action:act_supp", do: [] },
        { id: "tg-news-lin", on: "event:read-news:n_lin", do: [["set", "lin_news_read"]] },
        { id: "tg-cat-read", on: "event:open-chat:c_lin", if: { flag: "lin_cat" }, do: [["set", "lin_cat_read"]] },
        /* 5.7 通向第二案 */
        { id: "tg-seller2-avail", on: "change", if: { all: [{ any: [{ flag: "lin_news_read" }, { flag: "lin_cat_read" }] }, { not: "seller_ask2_avail" }] }, do: [["set", "seller_ask2_avail"], ["delay", 2500, [["toast", "tip.seller2", "chat"]]]] },
        {
            id: "tg-seller-r2", on: "event:choice:ask_lin",
            do: [["delay", 7000, [["set", "seller_r2"], ["toast", "tip.seller.odd"]]],
            ["delay", 24000, [["set", "task2_active"], ["phase", "p2"], ["ticket", "task2"], ["badge", "virus", 1], ["flash", "virus"]]]]
        },
        { id: "tg-ticket2-fallback", on: "event:boot-done", if: { all: [{ flag: "seller_r2" }, { not: "task2_active" }] }, do: [["set", "task2_active"], ["phase", "p2"], ["delay", 1200, [["ticket", "task2"]]]] },
        { id: "tg-ticket2-seen", on: "event:ticket-open:task2", do: [["set", "ticket2_seen"], ["delay", 1500, [["toast", "tip.t2.start", "browser"]]]] },

        /* ---------- 第二案 ---------- */
        { id: "tg-t2-courier", on: "change", if: { all: [{ flag: "mk_read" }, { not: "courier_read" }] }, do: [["toast", "tip.t2.courier", "chat"]] },
        { id: "tg-t2-ask", on: "change", if: { all: [{ flag: "mk_read" }, { flag: "courier_read" }, { not: "ask_sys" }] }, do: [["toast", "tip.t2.ask", "chat"]] },
        { id: "tg-seller-r3", on: "event:choice:ask_sys", do: [["delay", 6000, [["set", "seller_r3"], ["toast", "tip.seller.same"]]], ["delay", 12000, [["toast", "tip.t2.s2", "browser"]]]] },
        { id: "tg-t2-wu", on: "change", if: { all: [{ flag: "lizimu_read" }, { not: "wu_log_read" }] }, do: [["toast", "tip.t2.wu", "files"], ["badge", "files", 1]] },
        {
            id: "tg-archive", on: "change",
            if: { all: [{ flag: "lizimu_read" }, { flag: "wu_log_read" }, { flag: "wu_chat_read" }, { not: "archive_open" }] },
            do: [["set", "archive_open"], ["toast", "tip.archive", "virus"], ["badge", "virus", 1], ["flash", "virus"]]
        },
        { id: "tg-archive-read", on: "event:virus-tab:archive", if: { flag: "archive_open" }, do: [["set", "archive_read"], ["delay", 9000, [["toast", "tip.t2.s4", "files"]]]] },
        { id: "tg-zip-wrong", on: "event:zip-wrong:backup_zip", do: [["toast", "tip.zip.hint", "files"]] },
        { id: "tg-zip-open", on: "event:zip-open:backup_zip", do: [["delay", 1500, [["toast", "tip.backup", "files"]]]] },
        { id: "tg-ning-contact", on: "change", if: { all: [{ flag: "rec_done" }, { flag: "ning_mail_read" }, { not: "ning_contact" }] }, do: [["set", "ning_contact"], ["toast", "tip.ning", "chat"]] },
        { id: "tg-ning-r1", on: "event:choice:ning_c1", do: [["delay", 9000, [["set", "ning_r1"]]]] },
        { id: "tg-ning-r2", on: "event:choice:ning_c2", do: [["delay", 12000, [["set", "ning_r2"]]]] },
        {
            id: "tg-ning-r3", on: "event:choice:ning_c3",
            do: [["delay", 9000, [["set", "ning_r3"], ["set", "ning_calling"]]],
            ["delay", 15000, [["toast", "tip.argus.progress", "virus"], ["badge", "virus", 1], ["flash", "virus"]]],
            ["delay", 24000, [["toast", "tip.ning.pick"]]]]
        },
        /* 6.6 A：向软件回报 */
        {
            id: "tg-sun-a", on: "event:pickup:task2",
            do: [["set", "sun_routed"], ["set", "sun_route_a"], ["set", "sun_dead"],
            ["delay", 30000, [["set", "ning_a_r1"]]],
            ["delay", 62000, [["advance", 2], ["set", "sun_news_out"], ["toast", "tip.news", "browser"], ["flash", "browser"]]]]
        },
        { id: "tg-news-sun", on: "event:read-news:n_sun", do: [["set", "sun_news_read"], ["delay", 6000, [["set", "ning_a_r2"], ["set", "evidence_half2"], ["toast", "tip.envelope", "files"]]]] },
        /* 6.6 B：与孙宁一起接住他 */
        {
            id: "tg-sun-b", on: "event:choice:ning_route_b",
            do: [["set", "sun_routed"], ["set", "sun_route_b"], ["set", "sun_alive"],
            ["delay", 6000, [["set", "ning_b_r1"]]],
            ["delay", 40000, [["set", "ning_b_r2"], ["set", "sun_contact"]]],
            ["delay", 47000, [["call", "call_sun"]]]]
        },
        { id: "tg-sun-dec1", on: "event:call-decline:call_sun", do: [["delay", 300, [["set", "sun_dec1"]]], ["delay", 14000, [["call", "call_sun"]]]] },
        { id: "tg-sun-miss1", on: "event:call-missed:call_sun", do: [["delay", 300, [["set", "sun_dec1"]]], ["delay", 14000, [["call", "call_sun"]]]] },
        { id: "tg-sun-dec2", on: "event:call-decline:call_sun", if: { flag: "sun_dec1" }, do: [["delay", 8000, [["set", "sun_call_skipped"], ["set", "sun_file"], ["set", "evidence_half2"], ["toast", "tip.evidence", "files"]]]] },
        { id: "tg-sun-miss2", on: "event:call-missed:call_sun", if: { flag: "sun_dec1" }, do: [["delay", 8000, [["set", "sun_call_skipped"], ["set", "sun_file"], ["set", "evidence_half2"], ["toast", "tip.evidence", "files"]]]] },
        { id: "tg-sun-end", on: "event:call-end:call_sun", do: [["set", "sun_call_done"], ["delay", 5000, [["set", "sun_file"], ["set", "evidence_half2"], ["toast", "tip.evidence", "files"]]]] },
        /* 6.7 通向第三案 */
        { id: "tg-record", on: "change", if: { flag: "evidence_half2" }, do: [["delay", 9000, [["toast", "tip.record", "files"], ["badge", "files", 1]]]] },
        {
            id: "tg-ticket3", on: "event:read-file:record",
            do: [["set", "record_read"],
            ["delay", 3000, [["fx", 1200], ["scare", "windows-10-bsod-sound.mp3", { rate: 0.5, drive: 10, gain: 1.1 }]]],
            ["delay", 4300, [["blackout", 1800]]],
            ["delay", 6100, [["set", "task3_active"], ["set", "own_watched"], ["set", "shutdown_avail"], ["phase", "p3"], ["ticket", "task3"], ["toast", "tip.watched"]]]]
        },
        { id: "tg-ticket3-fallback", on: "event:boot-done", if: { all: [{ flag: "record_read" }, { not: "task3_active" }] }, do: [["set", "task3_active"], ["set", "own_watched"], ["set", "shutdown_avail"], ["phase", "p3"], ["delay", 1200, [["ticket", "task3"]]]] },
        { id: "tg-ticket3-seen", on: "event:ticket-open:task3", do: [["set", "ticket3_seen"]] },

        /* ---------- 第三案 ---------- */
        { id: "tg-agent", on: "change", if: { flag: "task3_active" }, do: [["delay", 14000, [["set", "agent_msg1"], ["toast", "tip.agent", "chat"]]]] },
        { id: "tg-agent-read", on: "event:open-chat:c_agent", do: [["set", "agent_read"], ["delay", 22000, [["set", "mom_prefill"], ["toast", "tip.mom.prefill", "chat"]]], ["delay", 100000, [["emit", "sim-start"]]]] },
        { id: "tg-agent-r1", on: "event:choice:agent_who", do: [["delay", 8000, [["set", "agent_r1"]]]] },
        { id: "tg-agent-r2", on: "event:choice:agent_no", do: [["delay", 6000, [["set", "agent_r2"]]]] },
        { id: "tg-mom-lie", on: "event:choice:mom_lie", do: [["set", "mom_replied"], ["delay", 9000, [["set", "mom_r_lie"]]]] },
        { id: "tg-mom-honest", on: "event:choice:mom_honest", do: [["set", "mom_replied"], ["delay", 12000, [["set", "mom_r_honest"]]]] },
        /* 7.3 同时响起的消息 */
        { id: "tg-sim-a", on: "change", if: { all: [{ flag: "mom_replied" }, { not: "sim_started" }] }, do: [["delay", 6000, [["emit", "sim-start"]]]] },
        {
            id: "tg-sim", on: "event:sim-start", if: { not: "sim_started" },
            do: [["set", "sim_started"], ["set", "seller_msg_down"], ["set", "fake_chen"], ["toast", "tip.sim", "chat"], ["flash", "chat"],
            ["delay", 9000, [["call", "call_chen"]]]]
        },
        { id: "tg-chen2-r1", on: "event:choice:chen2_ask", do: [["delay", 5000, [["set", "fake_r1"]]]] },
        { id: "tg-chen-dec1", on: "event:call-decline:call_chen", do: [["delay", 300, [["set", "chen_dec1"]]], ["delay", 4000, [["set", "chen_msg_pick"]]], ["delay", 16000, [["call", "call_chen"]]]] },
        { id: "tg-chen-miss1", on: "event:call-missed:call_chen", do: [["delay", 300, [["set", "chen_dec1"]]], ["delay", 4000, [["set", "chen_msg_pick"]]], ["delay", 16000, [["call", "call_chen"]]]] },
        { id: "tg-chen-dec2", on: "event:call-decline:call_chen", if: { flag: "chen_dec1" }, do: [["delay", 6000, [["set", "chen_text"], ["set", "chen_helping"]]]] },
        { id: "tg-chen-miss2", on: "event:call-missed:call_chen", if: { flag: "chen_dec1" }, do: [["delay", 6000, [["set", "chen_text"], ["set", "chen_helping"]]]] },
        { id: "tg-chen-end", on: "event:call-end:call_chen", do: [["set", "chen_call_done"]] },
        /* 7.4 真相：家属留言原件 */
        { id: "tg-truth-unlock", on: "change", if: { flag: "chen_helping" }, do: [["delay", 7000, [["set", "truth_unlock"], ["toast", "tip.truth", "virus"], ["badge", "virus", 1], ["flash", "virus"]]]] },
        {
            id: "tg-truth-read", on: "event:read-file:fam_full",
            do: [["set", "truth_read"], ["delay", 2500, [["toast", "tip.truth.read"]]],
            ["delay", 20000, [["set", "chen_plan"], ["toast", "tip.chen.plan", "chat"], ["flash", "chat"]]],
            ["delay", 34000, [["set", "argus_cond"], ["set", "sale_post"], ["badge", "virus", 1]]],
            ["delay", 48000, [["set", "buyer_msg"], ["toast", "tip.buyer", "chat"]]]]
        },
        /* 7.5 最后的交换 */
        { id: "tg-chen-send", on: "event:choice:chen_send", do: [["set", "evidence_sent"], ["delay", 6000, [["set", "chen_r_send"]]], ["delay", 42000, [["set", "chen_arrived"], ["flash", "chat"]]]] },
        { id: "tg-chen-leave", on: "event:choice:chen_leave", do: [["set", "leave_alone"], ["delay", 2500, [["ending", "end_normal"]]]] },
        { id: "tg-end-true", on: "event:choice:chen_out", if: { all: [{ flag: "evidence_sent" }, { flag: "sun_alive" }, { flag: "lin_alive" }] }, do: [["delay", 2500, [["ending", "end_true"]]]] },
        { id: "tg-end-good", on: "event:choice:chen_out", if: { all: [{ flag: "evidence_sent" }, { flag: "sun_alive" }, { not: "lin_alive" }] }, do: [["delay", 2500, [["ending", "end_good"]]]] },
        { id: "tg-end-normal", on: "event:choice:chen_out", if: { any: [{ not: "evidence_sent" }, { not: "sun_alive" }] }, do: [["delay", 2500, [["ending", "end_normal"]]]] },
        { id: "tg-end-bad", on: "event:pickup:task3", do: [["set", "bad_pickup"], ["delay", 2500, [["ending", "end_bad"]]]] },
        { id: "tg-end-bad2", on: "event:choice:seller_down", do: [["set", "bad_pickup"], ["delay", 2500, [["ending", "end_bad"]]]] },
        { id: "tg-end-loop", on: "event:choice:buyer_yes", do: [["set", "sold"], ["delay", 2500, [["ending", "end_loop"]]]] },
        { id: "tg-buyer-no", on: "event:choice:buyer_no", do: [["delay", 5000, [["set", "buyer_r2"]]]] },
        { id: "tg-destroyed", on: "change", if: { all: [{ flag: "del_backup" }, { flag: "del_record" }, { flag: "del_half2" }, { not: "evidence_destroyed" }] }, do: [["set", "evidence_destroyed"], ["toast", "tip.destroyed"]] },
        { id: "tg-shutdown-hidden", on: "event:shutdown", if: { all: [{ flag: "evidence_destroyed" }, { not: "evidence_sent" }] }, do: [["ending", "end_hidden"]] },
        { id: "tg-shutdown-block", on: "event:shutdown", repeat: true, if: { any: [{ not: "evidence_destroyed" }, { flag: "evidence_sent" }] }, do: [["set", "shutdown_blocked"], ["sound", "windowsError.mp3", 0.6], ["dialog", "virus.exit.fail.title", "tip.shutdown.block"]] }
    ];

    /* ================= 亮点表（首个命中 = 当前唯一亮点） ================= */
    var HINTS = [
        { if: { not: "read_note1" }, target: "file:note1" },
        { if: { not: "read_note2" }, target: "file:note2" },
        { if: { not: "read_note3" }, target: "file:note3" },
        { if: { all: [{ flag: "virus_found" }, { not: "virus_opened" }] }, target: "icon:virus" },
        { if: { all: [{ flag: "virus_opened" }, { not: "task1_active" }] }, target: "virus:close" },
        { if: { all: [{ flag: "task1_active" }, { not: "ticket1_seen" }] }, target: "virus:popup" },
        { if: { all: [{ flag: "task1_active" }, { not: "entered_t1" }] }, target: ["icon:virus", "virus:enter"] },
        { if: { all: [{ source: "t1" }, { not: "t1_xhs_read" }] }, target: ["icon:xhs", "xhs:p5"] },
        { if: { all: [{ source: "t1" }, { not: "t1_chat_read" }] }, target: ["icon:chat", "chat:c_scam"] },
        { if: { all: [{ source: "t1" }, { not: "t1_diary_read" }] }, target: ["icon:files", "file:t1_diary"] },
        { if: { all: [{ source: "t1" }, { not: "t1_mom_read" }] }, target: ["icon:chat", "chat:c_lmom"] },
        { if: { all: [{ source: "t1" }, { not: "t1_bili_read" }] }, target: ["icon:browser", "bm:hist", "hist:e_bili"] },
        { if: { all: [{ source: "t1" }, { not: "t1_site_read" }] }, target: ["icon:browser", "bm:pg_site"] },
        { if: { all: [{ source: "t1" }, { not: "t1_doc_read" }] }, target: ["icon:files", "file:t1_doc_old"] },
        { if: { all: [{ source: "t1" }, { not: "t1_mail_read" }] }, target: ["icon:browser", "bm:pg_mail", "mail:m_hotel"] },
        { if: { all: [{ source: "t1" }, { flag: "task1_located" }, { not: "lin_contact" }] }, target: "monitor:exit" },
        { if: { all: [{ source: "own" }, { flag: "task1_located" }, { not: "lin_contact" }] }, target: ["icon:virus", "virus:action:act_contact"] },
        { if: { all: [{ flag: "lin_contact" }, { not: "lin_c1" }] }, target: ["icon:chat", "chat:c_lin", "choice:lin_c1"] },
        { if: { all: [{ flag: "lin_c1_typed" }, { not: "lin_c2" }] }, target: ["chat:c_lin", "choice:lin_c2"] },
        { if: { all: [{ flag: "lin_r1" }, { not: "lin_c3" }] }, target: ["chat:c_lin", "choice:lin_c3"] },
        { if: { all: [{ flag: "lin_reconnected" }, { not: "lin_routed" }] }, target: ["icon:chat", "chat:c_lin"] },
        { if: { all: [{ flag: "lin_news_out" }, { not: "lin_news_read" }] }, target: ["icon:browser", "bm:pg_news", "news:n_lin"] },
        { if: { all: [{ flag: "lin_cat" }, { not: "lin_cat_read" }] }, target: ["icon:chat", "chat:c_lin"] },
        { if: { all: [{ flag: "seller_ask2_avail" }, { not: "ask_lin" }] }, target: ["icon:chat", "chat:c_seller", "choice:ask_lin"] },
        { if: { all: [{ flag: "task2_active" }, { not: "ticket2_seen" }] }, target: "virus:popup" },
        { if: { all: [{ flag: "task2_active" }, { not: "mk_read" }] }, target: ["icon:browser", "bm:pg_market", "post:mk_sun"] },
        { if: { all: [{ flag: "mk_read" }, { not: "courier_read" }] }, target: ["icon:chat", "chat:c_courier"] },
        { if: { all: [{ flag: "courier_read" }, { not: "ask_sys" }] }, target: ["icon:chat", "chat:c_seller", "choice:ask_sys"] },
        { if: { all: [{ flag: "seller_r3" }, { not: "lizimu_read" }] }, target: ["icon:browser", "bm:hist", "hist:e_lizimu"] },
        { if: { all: [{ flag: "lizimu_read" }, { not: "wu_log_read" }] }, target: ["icon:files", "file:wu_log"] },
        { if: { all: [{ flag: "wu_log_read" }, { not: "wu_chat_read" }] }, target: ["icon:files", "file:wu_chat"] },
        { if: { all: [{ flag: "archive_open" }, { not: "archive_read" }] }, target: ["icon:virus", "virus:tab:archive"] },
        { if: { all: [{ flag: "archive_read" }, { not: "anan_photo_read" }] }, target: ["icon:files", "file:photo_anan"] },
        { if: { all: [{ flag: "anan_photo_read" }, { not: "backup_open" }] }, target: ["icon:recycle", "file:backup_zip"] },
        { if: { all: [{ flag: "backup_open" }, { not: "rec_done" }] }, target: ["icon:files", "file:rec_sun"] },
        { if: { all: [{ flag: "rec_done" }, { not: "ning_mail_read" }] }, target: ["icon:files", "file:mail_ning"] },
        { if: { all: [{ flag: "ning_contact" }, { not: "ning_c1" }] }, target: ["icon:chat", "chat:c_ning", "choice:ning_c1"] },
        { if: { all: [{ flag: "ning_r1" }, { not: "ning_c2" }] }, target: ["chat:c_ning", "choice:ning_c2"] },
        { if: { all: [{ flag: "ning_r2" }, { not: "ning_c3" }] }, target: ["chat:c_ning", "choice:ning_c3"] },
        { if: { all: [{ flag: "ning_calling" }, { not: "sun_routed" }] }, target: ["icon:chat", "chat:c_ning"] },
        { if: { all: [{ flag: "sun_news_out" }, { not: "sun_news_read" }] }, target: ["icon:browser", "bm:pg_news", "news:n_sun"] },
        { if: { all: [{ flag: "evidence_half2" }, { not: "record_read" }] }, target: ["icon:files", "file:record"] },
        { if: { all: [{ flag: "task3_active" }, { not: "ticket3_seen" }] }, target: "virus:popup" },
        { if: { all: [{ flag: "agent_msg1" }, { not: "agent_read" }] }, target: ["icon:chat", "chat:c_agent"] },
        { if: { all: [{ flag: "mom_prefill" }, { not: "mom_replied" }] }, target: ["icon:chat", "chat:c_mom"] },
        { if: { all: [{ flag: "truth_unlock" }, { not: "truth_read" }] }, target: ["icon:virus", "virus:attach:fam_full"] },
        { if: { all: [{ flag: "chen_plan" }, { not: "evidence_sent" }, { not: "leave_alone" }] }, target: ["icon:chat", "chat:c_chen"] },
        { if: { flag: "chen_arrived" }, target: ["icon:chat", "chat:c_chen", "choice:chen_out"] }
    ];

    /* ================= 文件夹 ================= */
    var FOLDERS = [
        { id: "desktop", labelRef: "folder.desktop", pathRef: "folder.desktop.path" },
        { id: "downloads", labelRef: "folder.downloads", pathRef: "folder.downloads.path" },
        { id: "documents", labelRef: "folder.documents", pathRef: "folder.documents.path" },
        { id: "pictures", labelRef: "folder.pictures", pathRef: "folder.pictures.path" },
        { id: "oldcase", labelRef: "folder.oldcase", pathRef: "folder.oldcase.path" },
        { id: "backup", labelRef: "folder.backup", pathRef: "folder.backup.path" },
        { id: "evidence", labelRef: "folder.evidence", pathRef: "folder.evidence.path" },
        { id: "argus", labelRef: "folder.argus", pathRef: "folder.argus.path" },
        { id: "recycle", labelRef: "folder.recycle", pathRef: "folder.recycle.path" }
    ];

    /* ================= 两台电脑 ================= */
    var SYS_ADDED = { from: "sys", ref: "chat.sys.added" };
    var DEVICES = {
        own: {
            desktop: { wallpaper: "image/wallpaper.jpg", homeRef: "own.home", icons: ["browser", "chat", "files", "mypc", "recycle", "virus"] },
            bookmarks: [{ page: "pg_news", labelRef: "news.site" }, { page: "pg_market", labelRef: "market.site" }],
            files: [
                { id: "note1", folder: "desktop", nameRef: "file.note1.name", type: "txt", bodyRef: "file.note1.body", sets: "read_note1", dateRef: "zip.date" },
                { id: "note2", folder: "desktop", nameRef: "file.note2.name", type: "txt", bodyRef: "file.note2.body", locked: { flag: "read_note1" }, sets: "read_note2", dateRef: "zip.date" },
                { id: "note3", folder: "desktop", nameRef: "file.note3.name", type: "txt", bodyRef: "file.note3.body", locked: { flag: "read_note2" }, sets: "read_note3" },
                { id: "photo_anan", folder: "downloads", nameRef: "file.anan.name", type: "img", img: IMG.anan, metaRefs: ["file.anan.meta1", "file.anan.meta2", "file.anan.meta3", "file.anan.meta4"], sets: "anan_photo_read" },
                { id: "installer", folder: "downloads", nameRef: "file.installer.name", type: "exe", dlgTitleRef: "file.installer.dlg.title", dlgBodyRef: "file.installer.dlg.body" },
                /* 第二案：旧任务 */
                { id: "wu_log", folder: "oldcase", nameRef: "wu.log.name", type: "txt", bodyRef: "wu.log.body", visible: { flag: "task2_active" }, sets: "wu_log_read" },
                { id: "wu_chat", folder: "oldcase", nameRef: "wu.chat.name", type: "txt", bodyRef: "wu.chat.body", visible: { flag: "task2_active" }, sets: "wu_chat_read" },
                { id: "wu_news", folder: "oldcase", nameRef: "wu.news.name", type: "txt", bodyRef: "wu.news.body", visible: { flag: "task2_active" }, sets: "wu_news_read" },
                /* 回收站里的加密备份 */
                { id: "backup_zip", folder: "recycle", nameRef: "zip.name", type: "zip", dateRef: "zip.date", sizeRef: "zip.size", zip: { passwordRef: "zip.pwd", hintRef: "zip.hint", unlocks: "backup_open" }, deletable: "del_backup", visible: { not: "del_backup" } },
                { id: "rec_sun", folder: "backup", nameRef: "rec.name", type: "audio", visible: { all: [{ flag: "backup_open" }, { not: "del_backup" }] }, sets: "rec_read", audio: { dur: 58, doneFlag: "rec_done", lines: [{ at: 1, ref: "rec.l1" }, { at: 7, ref: "rec.l2" }, { at: 15, ref: "rec.l3" }, { at: 22, ref: "rec.l4" }, { at: 30, ref: "rec.l5", pause: true }, { at: 42, ref: "rec.l6" }, { at: 52, ref: "rec.l7" }] } },
                { id: "wu_raw", folder: "backup", nameRef: "wuraw.name", type: "pdf", visible: { all: [{ flag: "backup_open" }, { not: "del_backup" }] }, sets: "wu_raw_read", doc: { orgRef: "wuraw.org", titleRef: "wuraw.title", bodyRefs: ["wuraw.p1", "wuraw.p2", "wuraw.p3", "wuraw.p4"], dateRef: "wuraw.date", noteRef: "wuraw.note" } },
                { id: "mail_ning", folder: "backup", nameRef: "ningmail.name", type: "eml", visible: { all: [{ flag: "backup_open" }, { not: "del_backup" }] }, sets: "ning_mail_read", mail: { fromRef: "ningmail.from", toRef: "ningmail.to", dateRef: "ningmail.date", subjRef: "ningmail.subj", bodyRef: "ningmail.body", sigRef: "ningmail.sig" } },
                /* 证据 */
                { id: "env_scan", folder: "evidence", nameRef: "env.name", type: "pdf", visible: { all: [{ flag: "evidence_half2" }, { flag: "sun_dead" }, { not: "del_half2" }] }, deletable: "del_half2", doc: { titleRef: "half2.title", bodyRefs: ["half2.p1", "half2.p2", "half2.p3", "half2.p4", "half2.p5"], dateRef: "half2.date" } },
                { id: "half2_b", folder: "evidence", nameRef: "half2.name", type: "pdf", visible: { all: [{ flag: "evidence_half2" }, { not: "sun_dead" }, { not: "del_half2" }] }, deletable: "del_half2", doc: { titleRef: "half2.title", bodyRefs: ["half2.p1", "half2.p2", "half2.p3", "half2.p4", "half2.p5"], dateRef: "half2.date" } },
                { id: "record", folder: "evidence", nameRef: "record.name", type: "pdf", visible: { all: [{ flag: "evidence_half2" }, { not: "del_record" }] }, deletable: "del_record", sets: "record_read", doc: { titleRef: "record.title", bodyRefs: ["record.p1", "record.p2", "record.p3", "record.p4", "record.p5"], noteRef: "record.note" } },
                /* 软件附件 */
                { id: "fam_short", folder: "argus", nameRef: "fam.short.name", type: "txt", bodyRef: "fam.short.body", visible: { flag: "task1_active" } },
                { id: "fam_full", folder: "argus", nameRef: "fam.full.name", type: "txt", bodyRef: "fam.full.body", visible: { flag: "truth_unlock" } }
            ],
            chats: [
                {
                    id: "c_seller", mode: "own", nameRef: "chat.seller.name", avatar: IMG.sea,
                    typing: { any: [{ all: [{ flag: "ask_letters" }, { not: "seller_r1" }] }, { all: [{ flag: "ask_lin" }, { not: "seller_r2" }] }, { all: [{ flag: "ask_sys" }, { not: "seller_r3" }] }] },
                    messages: [
                        { day: "9月27日", from: "me", ref: "chat.seller.m1" }, { from: "them", ref: "chat.seller.m2" },
                        { from: "me", ref: "chat.seller.m3" }, { from: "them", ref: "chat.seller.m4" }, { from: "them", ref: "chat.seller.m5" },
                        { from: "me", ref: "chat.seller.m6" },
                        { day: "10月2日", from: "them", ref: "chat.seller.m7" }, { from: "me", ref: "chat.seller.m8" }, { from: "them", ref: "chat.seller.m9" },
                        { from: "sys", ref: "chat.sys.recall" }, { from: "them", ref: "chat.seller.m10" },
                        { from: "me", type: "img", img: IMG.receipt, ref: "chat.seller.m11" }, { from: "me", ref: "chat.seller.m12" },
                        { from: "me", ref: "chat.seller.m13" }, { from: "them", ref: "chat.seller.m14" },
                        { from: "me", ref: "chat.seller.m15" }, { from: "them", ref: "chat.seller.m16" },
                        { from: "me", ref: "chat.seller.c1", if: { flag: "ask_letters" } }, { from: "them", ref: "chat.seller.r1", if: { flag: "seller_r1" } },
                        { day: "10月6日", from: "me", ref: "chat.seller.c2", if: { flag: "ask_lin" } }, { from: "them", ref: "chat.seller.r2", if: { flag: "seller_r2" } },
                        { from: "me", ref: "chat.seller.c3", if: { flag: "ask_sys" } }, { from: "them", ref: "chat.seller.r3", if: { flag: "seller_r3" } },
                        { day: "10月8日", from: "them", ref: "chat.seller.m17", if: { flag: "seller_msg_down" } },
                        { from: "me", ref: "chat.seller.c4", if: { flag: "seller_down" } }
                    ],
                    choices: [
                        { id: "ask_letters", ref: "chat.seller.c1", if: { all: [{ flag: "read_note1" }, { not: "ask_letters" }] } },
                        { id: "ask_lin", ref: "chat.seller.c2", if: { all: [{ flag: "seller_ask2_avail" }, { not: "ask_lin" }] } },
                        { id: "ask_sys", ref: "chat.seller.c3", if: { all: [{ flag: "courier_read" }, { flag: "mk_read" }, { not: "ask_sys" }] } },
                        { id: "seller_down", ref: "chat.seller.c4", if: { all: [{ flag: "seller_msg_down" }, { not: "seller_down" }, { not: "ending" }] }, danger: true }
                    ]
                },
                {
                    id: "c_chen", mode: "own", nameRef: "chat.chen.name", avatar: IMG.chen, unread: 1,
                    messages: [
                        { day: "10月2日", from: "them", ref: "chat.chen.m1" }, { from: "me", ref: "chat.chen.m2" },
                        { day: "10月6日", from: "them", ref: "chat.chen.m3", if: { flag: "days_after1" } },
                        { day: "10月8日", from: "them", ref: "chat.chen.m4", if: { flag: "sun_routed" } },
                        { from: "them", ref: "chat.chen.m5", if: { flag: "chen_msg_pick" } },
                        { from: "them", ref: "chat.chen.m6", if: { flag: "chen_text" } }, { from: "them", ref: "chat.chen.m7", if: { flag: "chen_text" } },
                        { from: "them", type: "call", ref: "chat.call.voice", if: { flag: "chen_call_done" } },
                        { from: "them", ref: "chat.chen.m8", if: { flag: "chen_plan" } },
                        { from: "me", ref: "chat.chen.c1", if: { flag: "evidence_sent" } }, { from: "them", ref: "chat.chen.r1", if: { flag: "chen_r_send" } },
                        { from: "them", ref: "chat.chen.m9", if: { flag: "chen_arrived" } },
                        { from: "me", ref: "chat.chen.c3", if: { flag: "chen_out" } }
                    ],
                    choices: [
                        { id: "chen_send", ref: "chat.chen.c1", if: { all: [{ flag: "chen_plan" }, { flag: "evidence_half2" }, { flag: "backup_open" }, { not: "evidence_destroyed" }, { not: "evidence_sent" }, { not: "leave_alone" }] } },
                        { id: "chen_leave", ref: "chat.chen.c2", if: { all: [{ flag: "chen_plan" }, { not: "evidence_sent" }, { not: "leave_alone" }] }, danger: true },
                        { id: "chen_out", ref: "chat.chen.c3", if: { all: [{ flag: "chen_arrived" }, { not: "chen_out" }] } }
                    ]
                },
                {
                    id: "c_mom", mode: "own", nameRef: "chat.mom.name", avatar: IMG.mom,
                    prefill: { ref: "chat.mom.prefill", if: { all: [{ flag: "mom_prefill" }, { not: "mom_replied" }] } },
                    messages: [
                        { day: "9月29日", from: "them", ref: "chat.mom.m1" }, { from: "me", ref: "chat.mom.m2" },
                        { from: "them", ref: "chat.mom.m3" }, { from: "me", ref: "chat.mom.m4" },
                        { day: "10月8日", from: "them", ref: "chat.mom.m5", if: { flag: "task3_active" } },
                        { from: "me", ref: "chat.mom.me.lie", if: { flag: "mom_lie" } }, { from: "them", ref: "chat.mom.r.lie", if: { flag: "mom_r_lie" } },
                        { from: "me", ref: "chat.mom.me.honest", if: { flag: "mom_honest" } },
                        { from: "them", ref: "chat.mom.r.honest1", if: { flag: "mom_r_honest" } }, { from: "them", ref: "chat.mom.r.honest2", if: { flag: "mom_r_honest" } }
                    ],
                    choices: [
                        { id: "mom_lie", ref: "chat.mom.me.lie", if: { all: [{ flag: "mom_prefill" }, { not: "mom_replied" }] }, matchPrefill: true },
                        { id: "mom_honest", ref: "chat.mom.me.honest", if: { all: [{ flag: "mom_prefill" }, { not: "mom_replied" }] } }
                    ]
                },
                {
                    id: "c_courier", mode: "own", nameRef: "chat.courier.name", avatar: IMG.courier, sets: "courier_read",
                    messages: [
                        { day: "10月2日", from: "them", ref: "chat.courier.m1" }, { from: "me", ref: "chat.courier.m2" },
                        { from: "them", ref: "chat.courier.m3" }, { from: "me", ref: "chat.courier.m4" }, { from: "them", ref: "chat.courier.m5" }
                    ]
                },
                {
                    id: "c_lin", mode: "own", nameRef: "chat.lin.name", tagRef: "chat.tag.new", avatar: IMG.lin, visible: { flag: "lin_contact" },
                    typing: { any: [{ all: [{ flag: "lin_c1" }, { not: "lin_c1_typed" }] }, { all: [{ flag: "lin_c3" }, { not: "lin_r3" }] }] },
                    messages: [
                        SYS_ADDED,
                        { from: "me", ref: "chat.lin.c1", if: { flag: "lin_c1" } },
                        { from: "me", ref: "chat.lin.c2", if: { flag: "lin_c2" } },
                        { from: "them", ref: "chat.lin.r1a", if: { flag: "lin_r1" } }, { from: "them", ref: "chat.lin.r1b", if: { flag: "lin_r1" } },
                        { from: "me", ref: "chat.lin.c3", if: { flag: "lin_c3" } },
                        { from: "them", ref: "chat.lin.r2", if: { flag: "lin_r2" } },
                        { from: "them", ref: "chat.lin.r3a", if: { flag: "lin_r3" } }, { from: "them", ref: "chat.lin.r3b", if: { flag: "lin_r3" } }, { from: "them", ref: "chat.lin.r3c", if: { flag: "lin_r3" } },
                        { from: "me", ref: "chat.lin.meA", if: { flag: "lin_route_a" } },
                        { from: "them", ref: "chat.lin.rA1", if: { flag: "lin_a_r1" } }, { from: "them", ref: "chat.lin.rA2", if: { flag: "lin_a_r2" } },
                        { from: "me", ref: "chat.lin.cB", if: { flag: "lin_route_b" } },
                        { from: "them", ref: "chat.lin.rB1", if: { flag: "lin_b_r1" } },
                        { day: "10月6日", from: "them", type: "img", img: IMG.catBed, ref: "chat.lin.catimg", if: { flag: "lin_cat" } },
                        { from: "them", ref: "chat.lin.cat", if: { flag: "lin_cat" } }
                    ],
                    choices: [
                        { id: "lin_c1", ref: "chat.lin.c1", if: { not: "lin_c1" } },
                        { id: "lin_c2", ref: "chat.lin.c2", if: { all: [{ flag: "lin_c1_typed" }, { not: "lin_c2" }] } },
                        { id: "lin_c3", ref: "chat.lin.c3", if: { all: [{ flag: "lin_r1" }, { not: "lin_c3" }] } },
                        { id: "lin_route_b", ref: "chat.lin.cB", if: { all: [{ flag: "lin_reconnected" }, { not: "lin_routed" }] } }
                    ]
                },
                {
                    id: "c_qing", mode: "own", nameRef: "chat.qing.name", tagRef: "chat.tag.new", avatar: IMG.qing, visible: { flag: "qing_contact" },
                    messages: [SYS_ADDED, { from: "them", ref: "chat.qing.m1", if: { flag: "qing_r1" } }, { from: "them", ref: "chat.qing.m2", if: { flag: "qing_r1" } }, { from: "them", ref: "chat.qing.m3", if: { flag: "qing_r1" } }]
                },
                {
                    id: "c_ning", mode: "own", nameRef: "chat.ning.name", tagRef: "chat.tag.new", avatar: IMG.ning, visible: { flag: "ning_contact" },
                    typing: { any: [{ all: [{ flag: "ning_c1" }, { not: "ning_r1" }] }, { all: [{ flag: "ning_c2" }, { not: "ning_r2" }] }, { all: [{ flag: "ning_c3" }, { not: "ning_r3" }] }] },
                    messages: [
                        SYS_ADDED,
                        { from: "me", ref: "chat.ning.c1", if: { flag: "ning_c1" } },
                        { from: "them", ref: "chat.ning.r1a", if: { flag: "ning_r1" } }, { from: "them", ref: "chat.ning.r1b", if: { flag: "ning_r1" } },
                        { from: "me", ref: "chat.ning.c2", if: { flag: "ning_c2" } },
                        { from: "them", ref: "chat.ning.r2a", if: { flag: "ning_r2" } }, { from: "them", ref: "chat.ning.r2b", if: { flag: "ning_r2" } }, { from: "them", ref: "chat.ning.r2c", if: { flag: "ning_r2" } },
                        { from: "me", ref: "chat.ning.c3", if: { flag: "ning_c3" } },
                        { from: "them", ref: "chat.ning.r3a", if: { flag: "ning_r3" } }, { from: "them", ref: "chat.ning.r3b", if: { flag: "ning_r3" } },
                        { from: "me", ref: "chat.ning.cB", if: { flag: "ning_route_b" } },
                        { from: "them", ref: "chat.ning.rB1", if: { flag: "ning_b_r1" } }, { from: "them", ref: "chat.ning.rB2", if: { flag: "ning_b_r2" } },
                        { from: "them", ref: "chat.ning.rA1", if: { flag: "ning_a_r1" } }, { from: "them", ref: "chat.ning.rA2", if: { flag: "ning_a_r1" } },
                        { day: "10月9日", from: "them", ref: "chat.ning.rA3", if: { flag: "ning_a_r2" } }, { from: "them", ref: "chat.ning.rA4", if: { flag: "ning_a_r2" } },
                        { from: "them", type: "file", ref: "chat.ning.file", sizeRef: "chat.file.size", file: "env_scan", if: { flag: "ning_a_r2" } },
                        { from: "them", ref: "chat.ning.rA5", if: { flag: "ning_a_r2" } },
                        { from: "me", ref: "chat.ning.cA1", if: { flag: "ning_sorry" } }, { from: "me", ref: "chat.ning.cA2", if: { flag: "ning_blame" } },
                        { from: "them", ref: "chat.ning.rA6", if: { any: [{ flag: "ning_sorry" }, { flag: "ning_blame" }] } }
                    ],
                    choices: [
                        { id: "ning_c1", ref: "chat.ning.c1", if: { not: "ning_c1" } },
                        { id: "ning_c2", ref: "chat.ning.c2", if: { all: [{ flag: "ning_r1" }, { not: "ning_c2" }] } },
                        { id: "ning_c3", ref: "chat.ning.c3", if: { all: [{ flag: "ning_r2" }, { not: "ning_c3" }] } },
                        { id: "ning_route_b", ref: "chat.ning.cB", if: { all: [{ flag: "ning_calling" }, { not: "sun_routed" }] } },
                        { id: "ning_sorry", ref: "chat.ning.cA1", if: { all: [{ flag: "ning_a_r2" }, { not: "ning_sorry" }, { not: "ning_blame" }] } },
                        { id: "ning_blame", ref: "chat.ning.cA2", if: { all: [{ flag: "ning_a_r2" }, { not: "ning_sorry" }, { not: "ning_blame" }] } }
                    ]
                },
                {
                    id: "c_sun", mode: "own", nameRef: "chat.sun.name", tagRef: "chat.tag.new", avatar: IMG.sun2, visible: { flag: "sun_contact" },
                    messages: [
                        SYS_ADDED,
                        { from: "them", type: "call", ref: "chat.call.voice", if: { flag: "sun_call_done" } },
                        { from: "them", type: "call", ref: "chat.call.missed", missed: true, if: { flag: "sun_call_skipped" } },
                        { from: "them", type: "file", ref: "chat.sun.file", sizeRef: "chat.file.size", file: "half2_b", if: { flag: "sun_file" } },
                        { from: "them", ref: "chat.sun.m1", if: { all: [{ flag: "sun_file" }, { not: "sun_call_skipped" }] } },
                        { from: "them", ref: "chat.sun.m2", if: { flag: "sun_call_skipped" } }
                    ]
                },
                {
                    id: "c_agent", mode: "own", nameRef: "chat.agent.name", tagRef: "chat.tag.new", avatar: IMG.agent, visible: { flag: "agent_msg1" },
                    typing: { any: [{ all: [{ flag: "agent_who" }, { not: "agent_r1" }] }, { all: [{ flag: "agent_no" }, { not: "agent_r2" }] }] },
                    messages: [
                        SYS_ADDED,
                        { from: "them", ref: "chat.agent.m1" }, { from: "them", ref: "chat.agent.m2" }, { from: "them", ref: "chat.agent.m3" },
                        { from: "me", ref: "chat.agent.c1", if: { flag: "agent_who" } },
                        { from: "them", ref: "chat.agent.r1a", if: { flag: "agent_r1" } }, { from: "them", ref: "chat.agent.r1b", if: { flag: "agent_r1" } },
                        { from: "me", ref: "chat.agent.c2", if: { flag: "agent_no" } },
                        { from: "them", ref: "chat.agent.r2a", if: { flag: "agent_r2" } }, { from: "them", ref: "chat.agent.r2b", if: { flag: "agent_r2" } }
                    ],
                    choices: [
                        { id: "agent_who", ref: "chat.agent.c1", if: { all: [{ not: "agent_who" }, { not: "agent_no" }] } },
                        { id: "agent_no", ref: "chat.agent.c2", if: { all: [{ not: "agent_no" }, { any: [{ flag: "agent_r1" }, { not: "agent_who" }] }] } }
                    ]
                },
                {
                    id: "c_chen2", mode: "own", nameRef: "chat.chen2.name", tagRef: "chat.tag.new", avatar: IMG.chen, visible: { flag: "fake_chen" },
                    typing: { all: [{ flag: "chen2_ask" }, { not: "fake_r1" }] },
                    messages: [SYS_ADDED, { from: "them", ref: "chat.chen2.m1" }, { from: "me", ref: "chat.chen2.c1", if: { flag: "chen2_ask" } }, { from: "them", ref: "chat.chen2.r1", if: { flag: "fake_r1" } }],
                    choices: [{ id: "chen2_ask", ref: "chat.chen2.c1", if: { not: "chen2_ask" } }]
                },
                {
                    id: "c_buyer", mode: "own", nameRef: "chat.buyer.name", tagRef: "chat.tag.new", avatar: IMG.buyer, visible: { flag: "buyer_msg" },
                    messages: [SYS_ADDED, { from: "them", ref: "chat.buyer.m1" }, { from: "me", ref: "chat.buyer.c1", if: { flag: "buyer_yes" } }, { from: "me", ref: "chat.buyer.c2", if: { flag: "buyer_no" } }, { from: "them", ref: "chat.buyer.r2", if: { flag: "buyer_r2" } }],
                    choices: [
                        { id: "buyer_yes", ref: "chat.buyer.c1", if: { all: [{ not: "buyer_yes" }, { not: "buyer_no" }] }, danger: true },
                        { id: "buyer_no", ref: "chat.buyer.c2", if: { all: [{ not: "buyer_yes" }, { not: "buyer_no" }] } }
                    ]
                }
            ],
            history: [
                { id: "e_lizimu", titleRef: "hist.lizimu.title", url: "news.local.example/2021/11/13/lakeshore", whenRef: "hist.lizimu.when", visible: { flag: "task2_active" }, open: { page: "pg_lizimu" } }
            ]
        },
        t1: {
            desktop: {
                wallpaper: "image/cat-wallpaper.jpg", userRef: "t1.user", passwordRef: "t1.password", homeRef: "t1.home",
                avatar: IMG.lin, barRef: "virus.monitor.bar",
                icons: ["browser", "chat", "files", "xhs", "recycle"]
            },
            bookmarks: [{ page: "pg_site", labelRef: "site.name" }, { page: "pg_bili", labelRef: "bili.name" }, { page: "pg_mail", labelRef: "mail.site" }],
            files: [
                { id: "t1_course", folder: "desktop", nameRef: "t1.file.course.name", type: "exe", dlgTitleRef: "t1.file.course.dlg.title", dlgBodyRef: "t1.file.course.dlg.body" },
                { id: "t1_diary", folder: "documents", nameRef: "t1.diary.name", type: "txt", bodyRef: "t1.diary.body", sets: "t1_diary_read" },
                {
                    id: "t1_doc_old", folder: "downloads", nameRef: "t1.docold.name", type: "pdf", sets: "t1_doc_read",
                    doc: { orgRef: "t1.doc.org", serialRef: "t1.docold.serial", titleRef: "t1.doc.title", bodyRefs: ["t1.docold.p1", "t1.doc.p2", "t1.doc.p3", "t1.doc.p4"], dateRef: "t1.docold.date", stamp: true, noteRef: "t1.docold.note" }
                },
                {
                    id: "t1_doc", folder: "downloads", nameRef: "t1.doc.name", type: "pdf",
                    doc: { orgRef: "t1.doc.org", serialRef: "t1.doc.serial", titleRef: "t1.doc.title", bodyRefs: ["t1.doc.p1", "t1.doc.p2", "t1.doc.p3", "t1.doc.p4"], dateRef: "t1.doc.date", stamp: true }
                },
                {
                    id: "t1_doc2", folder: "downloads", nameRef: "t1.doc2.name", type: "pdf",
                    doc: { serialRef: "t1.doc2.serial", titleRef: "t1.doc2.title", bodyRefs: ["t1.doc2.p1", "t1.doc2.p2", "t1.doc2.p3"], dateRef: "t1.doc2.date" }
                },
                { id: "t1_video", folder: "downloads", nameRef: "t1.video.name", type: "video", bodyRef: "t1.video.body" },
                { id: "t1_cat", folder: "pictures", nameRef: "t1.cat.name", type: "img", img: IMG.cat, metaRefs: ["t1.cat.meta1", "t1.cat.meta2", "t1.cat.meta3"] },
                { id: "t1_window", folder: "pictures", nameRef: "t1.window.name", type: "img", img: IMG.window, metaRefs: ["t1.window.meta1", "t1.window.meta2", "t1.window.meta3", "t1.window.meta4"], sets: "t1_photo_read" }
            ],
            chats: [
                {
                    id: "c_scam", mode: "monitor", nameRef: "t1.chat.scam.name", avatar: IMG.cop, unread: 0, sets: "t1_chat_read",
                    messages: [
                        { day: "7月10日", from: "them", ref: "t1.chat.scam.m1" }, { from: "me", ref: "t1.chat.scam.m1b" },
                        { from: "them", ref: "t1.chat.scam.m2" }, { from: "me", ref: "t1.chat.scam.m3" },
                        { from: "them", ref: "t1.chat.scam.m4" }, { from: "me", ref: "t1.chat.scam.m5" },
                        { day: "7月14日", from: "them", ref: "t1.chat.scam.m6" },
                        { day: "7月21日", from: "them", ref: "t1.chat.scam.m7" },
                        { day: "8月5日", from: "them", ref: "t1.chat.scam.m7b" }, { from: "me", ref: "t1.chat.scam.m7c" },
                        { day: "8月18日", from: "me", ref: "t1.chat.scam.m7d" }, { from: "them", ref: "t1.chat.scam.m7e" }, { from: "me", ref: "t1.chat.scam.m7f" },
                        { day: "9月27日", from: "them", ref: "t1.chat.scam.m8" }, { from: "me", ref: "t1.chat.scam.m9" }, { from: "them", ref: "t1.chat.scam.m10" },
                        { day: "9月30日", from: "me", ref: "t1.chat.scam.m11" }, { from: "them", ref: "t1.chat.scam.m12" },
                        { day: "10月2日", from: "them", ref: "t1.chat.scam.m13" }, { from: "me", ref: "t1.chat.scam.m14" },
                        { day: "10月3日", from: "sys", ref: "t1.chat.scam.blocked", if: { flag: "lin_r3" } }
                    ]
                },
                {
                    id: "c_lmom", mode: "monitor", nameRef: "t1.chat.mom.name", avatar: IMG.linMom, unread: 43, sets: "t1_mom_read",
                    draft: { ref: "t1.chat.mom.draft", if: { not: "lin_r3" } },
                    messages: [
                        { day: "6月20日", from: "them", ref: "t1.chat.mom.m0" }, { from: "me", ref: "t1.chat.mom.m0b" },
                        { day: "7月19日", from: "them", ref: "t1.chat.mom.m1" }, { from: "me", ref: "t1.chat.mom.m2" },
                        { day: "8月2日", from: "them", ref: "t1.chat.mom.m3" }, { from: "me", ref: "t1.chat.mom.m4" },
                        { day: "8月20日", from: "them", ref: "t1.chat.mom.m5" }, { from: "me", ref: "t1.chat.mom.m6" },
                        { day: "9月30日", from: "me", ref: "t1.chat.mom.m7" },
                        { from: "them", ref: "t1.chat.mom.m8" }, { from: "them", ref: "t1.chat.mom.m9" },
                        { from: "sys", ref: "t1.chat.mom.m10" },
                        { day: "10月1日", from: "them", ref: "t1.chat.mom.m11" },
                        { day: "10月3日", from: "me", ref: "t1.chat.mom.n1", if: { flag: "lin_r3" } }, { from: "me", ref: "t1.chat.mom.n2", if: { flag: "lin_r3" } }, { from: "me", ref: "t1.chat.mom.n3", if: { flag: "lin_r3" } },
                        { from: "me", type: "call", ref: "t1.chat.mom.call", if: { flag: "lin_r3" } },
                        { from: "them", ref: "t1.chat.mom.n4", if: { flag: "lin_r3" } }
                    ]
                },
                {
                    id: "c_qing1", mode: "monitor", nameRef: "t1.chat.qing.name", avatar: IMG.qing, unread: 2, sets: "t1_qing_read",
                    messages: [
                        { day: "9月28日", from: "them", ref: "t1.chat.qing.m1" },
                        { day: "9月30日", from: "me", ref: "t1.chat.qing.m2" }, { from: "them", ref: "t1.chat.qing.m3" }, { from: "me", ref: "t1.chat.qing.m4" }, { from: "them", ref: "t1.chat.qing.m5" },
                        { day: "10月1日", from: "them", ref: "t1.chat.qing.m6" },
                        { day: "10月2日", from: "them", ref: "t1.chat.qing.m7" }
                    ]
                }
            ],
            history: [
                { id: "e_mail", titleRef: "t1.hist.mail.title", url: "outlook.live.com/mail/inbox", whenRef: "t1.hist.mail.when", open: { page: "pg_mail" } },
                { id: "e_bili", titleRef: "t1.hist.bili.title", url: "www.bilibili.com/video/BV1xy4y1a7Qk", whenRef: "t1.hist.bili.when", open: { bili: "v1" } },
                { id: "e_s1", titleRef: "t1.hist.s1.title", url: "www.google.com/search?q=安全账户", whenRef: "t1.hist.s1.when" },
                { id: "e_s2", titleRef: "t1.hist.s2.title", url: "www.google.com/search?q=逮捕令", whenRef: "t1.hist.s2.when" },
                { id: "e_site", titleRef: "t1.hist.site.title", url: "english-free.xyz", whenRef: "t1.hist.site.when", open: { page: "pg_site" } }
            ],
            xhs: {
                nameRef: "xhs.me.name", idRef: "xhs.me.id", statsRef: "xhs.me.stats", avatar: IMG.lin,
                posts: [
                    {
                        id: "p5", titleRef: "xhs.p5.title", bodyRef: "xhs.p5.body", dateRef: "xhs.p5.date", likes: 12, cover: ph("素材 X5", "窗台·夜", 230, 1.2, true), sets: "t1_xhs_read",
                        comments: [
                            { whoRef: "xhs.c.qing.who", textRef: "xhs.c.qing.text", dateRef: "xhs.c.qing.date" },
                            { whoRef: "xhs.c.qing.who", textRef: "xhs.c.qing2.text", dateRef: "xhs.c.qing2.date", if: { all: [{ flag: "lin_dead" }, { flag: "lin_news_out" }] }, hl: true }
                        ]
                    },
                    { id: "p4", titleRef: "xhs.p4.title", bodyRef: "xhs.p4.body", dateRef: "xhs.p4.date", likes: 341, cover: ph("素材 X4", "课件截图", 200, 0.8), comments: [{ whoRef: "xhs.c.p4.who", textRef: "xhs.c.p4.text", dateRef: "xhs.c.p4.date" }] },
                    { id: "p3b", titleRef: "xhs.p3b.title", bodyRef: "xhs.p3b.body", dateRef: "xhs.p3b.date", likes: 980, cover: ph("素材 X7", "打折蛋糕", 340, 1) },
                    { id: "p3", titleRef: "xhs.p3.title", bodyRef: "xhs.p3.body", dateRef: "xhs.p3.date", likes: 2210, cover: ph("素材 X3", "橘子看雪", 210, 1.3) },
                    { id: "p2", titleRef: "xhs.p2.title", bodyRef: "xhs.p2.body", dateRef: "xhs.p2.date", likes: 876, cover: ph("素材 X2", "番茄牛腩", 20, 1) },
                    { id: "p1", titleRef: "xhs.p1.title", bodyRef: "xhs.p1.body", dateRef: "xhs.p1.date", likes: 1530, cover: IMG.cat }
                ]
            }
        }
    };

    /* ================= 假网站 / 新闻 / B 站 / 邮箱 / 二手平台 ================= */
    var PAGES = [
        { id: "pg_news", url: "www.morningwire.example", kind: "news", titleRef: "news.site" },
        { id: "pg_site", url: "english-free.xyz", kind: "site", titleRef: "site.name", sets: "t1_site_read" },
        { id: "pg_bili", url: "www.bilibili.com", kind: "bili", titleRef: "bili.name" },
        { id: "pg_mail", url: "outlook.live.com/mail", kind: "mail", titleRef: "mail.site" },
        { id: "pg_market", url: "www.maple2hand.example", kind: "market", titleRef: "market.site" },
        { id: "pg_lizimu", url: "news.local.example/2021/11/13/lakeshore", kind: "article", titleRef: "page.lizimu.title", siteRef: "page.lizimu.site", bodyRef: "page.lizimu.body", sets: "lizimu_read" }
    ];
    var NEWS = [
        { id: "n_sun", headRef: "news.sun.head", dateRef: "news.sun.date", bodyRef: "news.sun.body", appears: { all: [{ flag: "sun_dead" }, { flag: "sun_news_out" }] }, hot: true },
        { id: "n3", headRef: "news.n3.head", dateRef: "news.n3.date", bodyRef: "news.n3.body", appears: { flag: "sun_routed" } },
        { id: "n_lin", headRef: "news.lin.head", dateRef: "news.lin.date", bodyRef: "news.lin.body", appears: { all: [{ flag: "lin_dead" }, { flag: "lin_news_out" }] }, hot: true },
        { id: "n_b1", headRef: "news.b1.head", dateRef: "news.b1.date", bodyRef: "news.b1.body", appears: { all: [{ flag: "lin_route_b" }, { flag: "days_after1" }] } },
        { id: "n0", headRef: "news.n0.head", dateRef: "news.n0.date", bodyRef: "news.n0.body" },
        { id: "n2", headRef: "news.n2.head", dateRef: "news.n2.date", bodyRef: "news.n2.body" }
    ];
    var BILI = {
        history: [
            { video: "v1", titleRef: "bili.v1.title", upRef: "bili.v1.up", whenRef: "t1.hist.bili.when", progRef: "bili.v1.prog", cover: ph("素材 B7", "反诈亲历·封面", 0, 0.62, true) },
            { titleRef: "bili.h2.title", upRef: "bili.h2.up", whenRef: "bili.h2.when", cover: ph("素材 B9", "白噪音", 190, 0.62) },
            { titleRef: "bili.h3.title", upRef: "bili.h3.up", whenRef: "bili.h3.when", cover: ph("素材 B11", "快手菜", 30, 0.62) }
        ],
        videos: {
            v1: {
                titleRef: "bili.v1.title", upRef: "bili.v1.up", metaRef: "bili.v1.meta", cover: ph("素材 B7", "反诈亲历·封面", 0, 0.62, true),
                comments: [
                    { whoRef: "bili.c1.who", textRef: "bili.c1.text" },
                    { whoRef: "bili.c2.who", textRef: "bili.c2.text" },
                    { whoRef: "bili.c3.who", textRef: "bili.c3.text" },
                    { whoRef: "bili.c4.who", textRef: "bili.c4.text", timeRef: "bili.c4.time", me: true }
                ]
            }
        }
    };
    var MAIL = {
        t1: [
            { id: "m_hotel", fromRef: "mail.hotel.from", subjRef: "mail.hotel.subj", dateRef: "mail.hotel.date", bodyRef: "mail.hotel.body", sets: "t1_mail_read" },
            { id: "m_cra", fromRef: "mail.cra.from", subjRef: "mail.cra.subj", dateRef: "mail.cra.date", bodyRef: "mail.cra.body", unread: true },
            { id: "m_site", fromRef: "mail.site.from", subjRef: "mail.site.subj", dateRef: "mail.site.date", bodyRef: "mail.site.body" }
        ]
    };
    var MARKET = {
        posts: [
            { id: "mk_new", if: { flag: "sale_post" }, titleRef: "mk.new.title", priceRef: "mk.new.price", metaRef: "mk.new.meta", shortMetaRef: "mk.new.short", sellerRef: "mk.new.seller", avatar: IMG.me, bodyRef: "mk.new.body", images: [IMG.receipt], sets: "sale_post_read" },
            { id: "mk_sun", titleRef: "mk.sun.title", priceRef: "mk.sun.price", metaRef: "mk.sun.meta", shortMetaRef: "mk.sun.short", sellerRef: "mk.sun.seller", avatar: IMG.sea, bodyRef: "mk.sun.body", images: [IMG.pc], sets: "mk_read" },
            { id: "mk_o1", titleRef: "mk.o1.title", priceRef: "mk.o1.price", metaRef: "mk.o1.meta", sellerRef: "mk.o1.seller", avatar: ph("素材", "", 100, 1), bodyRef: "mk.o1.body", images: [ph("素材", "书桌", 40, 1)] },
            { id: "mk_o2", titleRef: "mk.o2.title", priceRef: "mk.o2.price", metaRef: "mk.o2.meta", sellerRef: "mk.o2.seller", avatar: ph("素材", "", 260, 1), bodyRef: "mk.o2.body", images: [ph("素材", "教材", 60, 1)] }
        ]
    };

    /* ================= 求助单 ================= */
    var TASKS = [
        {
            id: "task1", target: "t1", visible: { flag: "task1_active" },
            titleRef: "task1.title", targetRef: "task1.target", briefRef: "task1.brief", credRef: "task1.cred", avatar: IMG.linDoc,
            status: [
                { ref: "task1.status.done", if: { flag: "lin_route_a" }, cls: "done" },
                { ref: "task1.status.fail", if: { flag: "lin_route_b" }, cls: "fail" },
                { ref: "task1.status.active", if: { not: "lin_routed" }, cls: "hot" }
            ],
            steps: [
                { ref: "task1.step1", done: { flag: "t1_xhs_read" } },
                { ref: "task1.step2", done: { all: [{ flag: "t1_chat_read" }, { flag: "t1_diary_read" }] }, locked: { flag: "t1_xhs_read" } },
                { ref: "task1.step3", done: { all: [{ flag: "t1_mom_read" }, { flag: "t1_bili_read" }] }, locked: { all: [{ flag: "t1_chat_read" }, { flag: "t1_diary_read" }] } },
                { ref: "task1.step4", done: { all: [{ flag: "t1_site_read" }, { flag: "t1_doc_read" }, { flag: "t1_mail_read" }] }, locked: { all: [{ flag: "t1_mom_read" }, { flag: "t1_bili_read" }] } },
                { ref: "task1.step5", done: { flag: "lin_reconnected" }, locked: { flag: "task1_located" } },
                { ref: "task1.step6", done: { flag: "lin_routed" }, locked: { flag: "lin_reconnected" } }
            ],
            log: [
                { ref: "task1.log.located", if: { flag: "task1_located" } },
                { ref: "task1.log.contact", if: { flag: "lin_contact" } },
                { ref: "task1.log.reconnected", if: { flag: "lin_reconnected" } },
                { ref: "task1.log.pickup", if: { all: [{ flag: "lin_reconnected" }, { not: "lin_routed" }] }, cls: "warn" },
                { ref: "task1.log.doneA", if: { flag: "lin_route_a" } },
                { ref: "task1.log.thanks", if: { flag: "lin_route_a" } },
                { ref: "task1.log.failB", if: { flag: "argus_fail1" }, cls: "err" },
                { ref: "task1.log.closedB", if: { flag: "act_supp" }, cls: "dim" }
            ],
            files: [
                { ref: "task1.file.fam", file: "fam_short" },
                { ref: "task1.file.famfull", file: "fam_full", if: { flag: "truth_unlock" } }
            ],
            enter: {},
            form: {
                if: { all: [{ flag: "lin_reconnected" }, { not: "lin_routed" }] }, doneFlag: "pickup_form1", titleRef: "task1.form.title",
                fields: [
                    { labelRef: "task1.form.f1", options: ["task1.form.f1o1", "task1.form.f1o2", "task1.form.f1o3"] },
                    { labelRef: "task1.form.f2", options: ["task1.form.f2o2", "task1.form.f2o1", "task1.form.f2o3"] },
                    { labelRef: "task1.form.f3", options: ["task1.form.f3o2", "task1.form.f3o1", "task1.form.f3o3"] }
                ],
                submitRef: "task1.form.submit", emit: "pickup:task1"
            },
            actions: [
                { id: "act_contact", ref: "task1.act.contact", if: { all: [{ flag: "task1_located" }, { not: "lin_contact" }] }, sets: "lin_contact", primary: true },
                { id: "act_supp", ref: "task1.act.supp", if: { all: [{ flag: "argus_fail1" }, { not: "act_supp" }] }, sets: "act_supp", danger: true }
            ]
        },
        {
            id: "task2", visible: { flag: "task2_active" },
            titleRef: "task2.title", targetRef: "task2.target", briefRef: "task2.brief", avatar: IMG.sea,
            status: [
                { ref: "task2.status.done", if: { flag: "sun_route_a" }, cls: "done" },
                { ref: "task2.status.hang", if: { flag: "sun_route_b" }, cls: "fail" },
                { ref: "task2.status.active", if: { not: "sun_routed" }, cls: "hot" }
            ],
            steps: [
                { ref: "task2.step1", done: { all: [{ flag: "mk_read" }, { flag: "courier_read" }, { flag: "seller_r3" }] } },
                { ref: "task2.step2", done: { all: [{ flag: "lizimu_read" }, { flag: "wu_log_read" }, { flag: "wu_chat_read" }] }, locked: { flag: "seller_r3" } },
                { ref: "task2.step3", done: { flag: "archive_read" }, locked: { flag: "archive_open" } },
                { ref: "task2.step4", done: { all: [{ flag: "backup_open" }, { flag: "rec_done" }, { flag: "ning_mail_read" }] }, locked: { flag: "archive_read" } },
                { ref: "task2.step5", done: { flag: "ning_calling" }, locked: { flag: "ning_contact" } },
                { ref: "task2.step6", done: { flag: "sun_routed" }, locked: { flag: "ning_calling" } }
            ],
            log: [
                { ref: "task2.log.offline", cls: "err" },
                { ref: "task2.log.offline2", cls: "dim" },
                { ref: "task2.log.progress", if: { all: [{ flag: "ning_calling" }, { not: "sun_routed" }] }, cls: "warn" },
                { ref: "task2.log.doneA", if: { flag: "sun_route_a" } },
                { ref: "task2.log.thanks", if: { flag: "sun_route_a" } },
                { ref: "task2.log.hangB", if: { flag: "sun_route_b" }, cls: "err" }
            ],
            form: {
                if: { all: [{ flag: "ning_calling" }, { not: "sun_routed" }] }, doneFlag: "pickup_form2", titleRef: "task2.form.title",
                fields: [
                    { labelRef: "task2.form.f1", options: ["task2.form.f1o1", "task2.form.f1o2", "task2.form.f1o3"] },
                    { labelRef: "task2.form.f2", options: ["task2.form.f2o1", "task2.form.f2o2", "task2.form.f2o3"] }
                ],
                submitRef: "task2.form.submit", emit: "pickup:task2"
            }
        },
        {
            id: "task3", visible: { flag: "task3_active" },
            titleRef: "task3.title", targetRef: "task3.target", briefRef: "task3.brief", avatar: IMG.receipt,
            status: [{ ref: "task3.status.active", cls: "hot" }],
            steps: [
                { ref: "task3.step1", done: { flag: "agent_read" } },
                { ref: "task3.step2", done: { flag: "bad_pickup" }, locked: { flag: "agent_read" } }
            ],
            log: [
                { ref: "task3.log.watch", cls: "warn" },
                { ref: "task3.log.cond", if: { flag: "argus_cond" } },
                { ref: "task3.log.post", if: { flag: "sale_post" }, cls: "dim" }
            ],
            form: {
                if: { all: [{ flag: "task3_active" }, { not: "bad_pickup" }] }, doneFlag: "pickup_form3", titleRef: "task3.form.title",
                fields: [
                    { labelRef: "task3.form.f1", options: ["task3.form.f1o1", "task3.form.f1o2", "task3.form.f1o3"] },
                    { labelRef: "task3.form.f2", options: ["task3.form.f2o1", "task3.form.f2o2", "task3.form.f2o3"] }
                ],
                submitRef: "task3.form.submit", emit: "pickup:task3"
            },
            actions: [
                { id: "act_post", ref: "task3.act.post", if: { flag: "sale_post" }, emit: "goto-market" }
            ]
        }
    ];
    TRIGGERS.push({ id: "tg-goto-market", on: "event:goto-market", repeat: true, do: [["page", "pg_market"]] });
    TRIGGERS.push({ id: "tg-shutdown-log", on: "change", if: { flag: "shutdown_blocked" }, do: [] });

    var VIRUS_LOG = [
        { ref: "virus.log.repaired1", if: { flag: "sys_repaired" } },
        { ref: "virus.log.repaired2", if: { flag: "sys_repaired" } },
        { ref: "virus.log.shutdown", if: { flag: "shutdown_blocked" } }
    ];
    var VIRUS_TICKER = ["virus.ticker.1", "virus.ticker.2", "virus.ticker.3", "virus.ticker.4", "virus.ticker.5", "virus.ticker.6"];

    /* 档案页签（第二案 6.3 起可见） */
    var ARCHIVE_IF = { flag: "archive_open" };
    var ARCHIVE = [
        { kind: "h", ref: "arc.h0" },
        { kind: "h", ref: "arc.b.h" }, { ref: "arc.b.1" }, { ref: "arc.b.2" }, { ref: "arc.b.3" }, { kind: "c", ref: "arc.b.c" },
        { kind: "h", ref: "arc.c.h" }, { ref: "arc.c.1" }, { ref: "arc.c.2" }, { ref: "arc.c.3" }, { ref: "arc.c.4", cls: "dim" }, { kind: "c", ref: "arc.c.c" },
        { kind: "h", ref: "arc.1.h" },
        { ref: "arc.1.a1", if: { flag: "lin_route_a" } }, { ref: "arc.1.a2", if: { flag: "lin_route_a" } }, { ref: "arc.1.a3", if: { flag: "lin_route_a" } },
        { kind: "c", ref: "arc.1.ac", if: { all: [{ flag: "lin_route_a" }, { flag: "lin_news_out" }] } },
        { ref: "arc.1.b1", if: { flag: "lin_route_b" }, cls: "err" }, { ref: "arc.1.b2", if: { flag: "lin_route_b" }, cls: "dim" },
        { kind: "h", ref: "arc.2.h", if: { flag: "sun_routed" } },
        { ref: "arc.2.a1", if: { flag: "sun_route_a" } }, { ref: "arc.2.a2", if: { flag: "sun_route_a" } }, { ref: "arc.2.a3", if: { flag: "sun_route_a" } },
        { kind: "c", ref: "arc.2.ac", if: { all: [{ flag: "sun_route_a" }, { flag: "sun_news_out" }] } },
        { ref: "arc.2.b1", if: { flag: "sun_route_b" }, cls: "err" },
        { kind: "h", ref: "arc.3.h", if: { flag: "task3_active" } }, { ref: "arc.3.1", if: { flag: "task3_active" }, cls: "warn" },
        { kind: "h", ref: "arc.x.h", if: { flag: "truth_read" } },
        { ref: "arc.x.1", if: { flag: "truth_read" } }, { ref: "arc.x.2", if: { flag: "truth_read" } }, { ref: "arc.x.3", if: { flag: "truth_read" } }, { ref: "arc.x.4", if: { flag: "truth_read" } },
        { ref: "arc.x.5", if: { flag: "truth_read" }, cls: "warn" }
    ];

    /* ================= 微信语音来电脚本 ================= */
    var CALLS = {
        call_sun: {
            chat: "c_sun", nameRef: "chat.sun.name", avatar: IMG.sun2,
            lines: [
                { who: "them", ref: "call.sun.l1", wait: 1500 },
                { choices: [{ id: "sun_q1", ref: "call.sun.q1" }] },
                { who: "them", ref: "call.sun.l2", wait: 2800 },
                {
                    choices: [
                        { id: "sun_q2a", ref: "call.sun.q2a", then: [{ who: "them", ref: "call.sun.l3", wait: 3800 }, { who: "them", ref: "call.sun.l4", wait: 2600, sets: "sun_admit" }] },
                        { id: "sun_q2b", ref: "call.sun.q2b", then: [{ who: "them", ref: "call.sun.l4b", wait: 2200 }, { who: "them", ref: "call.sun.l4c", wait: 3400, sets: "sun_admit" }] }
                    ]
                },
                { who: "them", ref: "call.sun.l5", wait: 3000 },
                { who: "them", ref: "call.sun.l6", wait: 2600 }
            ]
        },
        call_chen: {
            chat: "c_chen", nameRef: "chat.chen.name", avatar: IMG.chen,
            lines: [
                { who: "them", ref: "call.chen.l1", wait: 1200 },
                { choices: [{ id: "chen_a1", ref: "call.chen.a1" }, { id: "chen_a1b", ref: "call.chen.a1b" }] },
                { who: "them", ref: "call.chen.l2", wait: 2600 },
                {
                    choices: [
                        { id: "chen_tell", ref: "call.chen.tell", sets: "chen_helping", then: [{ who: "them", ref: "call.chen.l3", wait: 1800 }, { who: "them", ref: "call.chen.l4", wait: 2200 }] },
                        { id: "chen_hide", ref: "call.chen.hide", then: [{ who: "them", ref: "call.chen.l3b", wait: 2000 }, { who: "them", ref: "call.chen.l4b", wait: 2400, sets: "chen_helping" }] }
                    ]
                },
                { who: "them", ref: "call.chen.l5", wait: 2200 }
            ]
        }
    };

    /* ================= 结局 ================= */
    var ENDINGS = {
        end_true: { tagRef: "end.true.tag", titleRef: "end.true.title", lines: [{ ref: "end.true.1" }, { ref: "end.true.2" }, { ref: "end.true.3" }, { ref: "end.true.4" }, { ref: "end.true.5" }, { ref: "end.true.6" }, { ref: "end.true.7" }] },
        end_good: { tagRef: "end.good.tag", titleRef: "end.good.title", lines: [{ ref: "end.good.1" }, { ref: "end.good.2" }, { ref: "end.good.3" }, { ref: "end.good.4" }, { ref: "end.good.5" }, { ref: "end.good.6" }] },
        end_normal: { tagRef: "end.normal.tag", titleRef: "end.normal.title", lines: [{ ref: "end.normal.1" }, { ref: "end.normal.2" }, { ref: "end.normal.3" }, { ref: "end.normal.4" }, { ref: "end.normal.5" }, { ref: "end.normal.6" }] },
        end_bad: { tagRef: "end.bad.tag", titleRef: "end.bad.title", lines: [{ ref: "end.bad.1" }, { ref: "end.bad.2" }, { ref: "end.bad.3" }, { ref: "end.bad.4" }, { ref: "end.bad.5", hold: 6000 }] },
        end_loop: { tagRef: "end.loop.tag", titleRef: "end.loop.title", lines: [{ ref: "end.loop.1" }, { ref: "end.loop.2" }, { typewrite: [["end.loop.t1", true], ["end.loop.t2", true], ["end.loop.t3", false]] }, { ref: "end.loop.3" }, { ref: "end.loop.4" }, { ref: "end.loop.5" }, { ref: "end.loop.6" }, { ref: "end.loop.7", hold: 5500 }] },
        end_hidden: { tagRef: "end.hidden.tag", titleRef: "end.hidden.title", lines: [{ ref: "end.hidden.1" }, { ref: "end.hidden.2" }, { ref: "end.hidden.3" }, { ref: "end.hidden.4" }, { ref: "end.hidden.5", hold: 5000 }] }
    };

    var OWNERS = [
        { id: "o3", order: 3, name: "孙屿", notes: ["note1", "note2"] },
        { id: "o2", order: 2, name: "何静", notes: ["note3"] },
        { id: "o1", order: 1, name: "周衍（首任协助者 zhouyan）", notes: [] }
    ];

    return {
        ph: ph, IMG: IMG, TEXT: TEXT, CONFIG: CONFIG, S_REPLY: S_REPLY,
        TRIGGERS: TRIGGERS, HINTS: HINTS, FOLDERS: FOLDERS,
        DEVICES: DEVICES, PAGES: PAGES, NEWS: NEWS, BILI: BILI, MAIL: MAIL, MARKET: MARKET,
        TASKS: TASKS, VIRUS_LOG: VIRUS_LOG, VIRUS_TICKER: VIRUS_TICKER, ARCHIVE_IF: ARCHIVE_IF, ARCHIVE: ARCHIVE,
        CALLS: CALLS, ENDINGS: ENDINGS, OWNERS: OWNERS
    };
})();
