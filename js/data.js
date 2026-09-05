/* =====================================================================
   内容数据层（唯一的剧情源）。换剧情 = 换这个文件，不改代码。
   文案里带〔占位〕的是待正式化的句子，其余可直接用。

   结构：
   TEXT      文案表（所有 *Ref 指向这里；缺失时显示〔ref〕，不报错）
   CONFIG    全局配置
   TRIGGERS  触发器：条件 → 动作
   HINTS     亮点表：首个命中的条件决定当前发光元素（可多个）
   DEVICES   两台电脑：own = 玩家的二手电脑；t1 = 林晚的电脑（黑进去的那台）
             每台有自己的 desktop（壁纸/登录名/图标/密码）、files、chats、history、bookmarks、xhs
   PAGES     假网站；NEWS 新闻站（死亡只在这里揭晓）；BILI 假 B 站
   TASKS     求助单；VIRUS_LOG 软件系统消息；OWNERS 前任机主链
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

    var CONFIG = { startDate: { y: 2024, mo: 10, d: 3, h: 21, mi: 17 } };

    /* 骗子教的"统一回复"，三处复用（承诺书 / 她发给妈妈的最后一条 / 结尾） */
    var S_REPLY = "我最近有点事在忙，不要担心，也不要跟别人说，过几天就好了";

    /* ================= 文案表 ================= */
    var TEXT = {
        "ui.ok": "确定", "ui.cancel": "取消",
        "ui.toast.title": "系统通知",
        "ui.dlg.reset.title": "系统", "ui.dlg.reset.body": "确定要清除全部进度、重新开始吗？",
        "ui.dlg.locked.title": "无法打开", "ui.dlg.locked.body": "文件已损坏或被占用。",
        "ui.locked.tag": "无法访问", "ui.col.name": "名称",
        "ui.sm.restart": "重新开始（清除进度）",
        "folder.desktop": "桌面", "folder.downloads": "下载",
        "browser.snapshot": "〔占位：页面快照〕",
        "ctx.open": "打开", "ctx.uninstall": "卸载", "ctx.delete": "删除", "ctx.props": "属性",

        /* 开机前的警示 */
        "warn.title": "Windows 安全",
        "warn.body": "本程序包含闪烁画面、突发的高音量音效与惊吓内容。\n光敏性癫痫患者请谨慎运行。建议佩戴耳机并调低音量。\n程序中出现的诈骗手法取材自公开反诈案例，仅用于剧情。\n\n是否继续启动？",
        "warn.btn": "是(Y)",

        /* 开机 */
        "boot.l1": "AMIBIOS (C) 2011  ...  Memory Test: 4096MB OK",
        "boot.l2": "Detecting IDE drives ... WDC WD5000AAKX",
        "boot.l3": "Boot from Hard Disk ...",
        "boot.l4": "zhouyan 正在登录…",
        "tip.boot": "这台二手电脑没重装过系统。桌面上有前任机主留下的东西。",

        /* 应用名 */
        "app.mypc.title": "此电脑", "app.recycle.title": "回收站",
        "app.browser.title": "Google Chrome", "app.chat.title": "微信",
        "app.files.title": "文件", "app.viewer.title": "查看器",
        "app.virus.title": "ARGUS_9", "app.xhs.title": "小红书",

        /* 前任机主的 txt 链 */
        "file.note1.name": "给下一位机主.txt",
        "file.note1.body": "你好。\n这台电脑是我卖的。硬盘我本来要格，最后没格——不是忘了，是格不掉。你试了就知道。\n我先把丑话说前面：里面那个东西不是我装的。我接手的时候它就在。上一任说她接手的时候也在。\n桌面上还有一封信是她留给我的，我原样留给你。密码什么的我都没改，你自己看。\n我只求你一件事：别信它。哪怕它真的救了人。\n——屿",
        "file.note2.name": "它删不掉.txt",
        "file.note2.body": "我试过的办法，你别再试了：\n安全模式 ✗  格式化 ✗  拆硬盘换新的 ✗（换完它还在，我不知道怎么回事）\n拖进回收站——别。真的别。蓝屏两次之后我就不敢了。\n它有一张\"关于\"页，说自己是什么人道组织做的。exe 的属性里写的是另一回事。她的信里写的又是一回事。三个说法我都不信。\n我留了一个备份在回收站里，压缩包上了锁。密码是我女儿的生日——你在下载文件夹里见过她。\n现在你可以去看她的信了。",
        "file.note3.name": "如果你也开始收到任务.txt",
        "file.note3.body": "致捡到这台机器的人：\n我不知道你是谁，也不知道我前面那个人有没有把这封信留下来。如果留了，说明他也没能删掉它。\n它会给你派\"求助单\"。单子上的人是真的，事也是真的，你去查，能查到——它能进别人的电脑。你会觉得自己在做好事。\n我救过一个。真的救了，我亲眼看着他给他妈回了电话。\n四天以后他死了。\n为什么——我不写。写了你也不信，我当时也不信。你会自己明白的。\n我能给你的建议只有一条：它问你\"人在哪\"的时候，不要回答。\n如果你看到了这行字，软件应该已经在桌面上了。它知道你读到这儿了。\n——何静",
        "tip.virus.found": "桌面上多了一个图标？不，它一直都在。",
        "tip.virus.found2": "它在等你打开它。",

        "file.photo.name": "IMG_2047.jpg",
        "file.photo.metaTitle": "详细信息",
        "file.photo.meta1": "拍摄设备：Canon EOS 500D",
        "file.photo.meta2": "拍摄时间：2019/6/2 14:31",
        "file.photo.meta3": "位置信息：已移除",
        "file.installer.name": "argus_setup.exe",
        "file.installer.dlg.title": "属性",
        "file.installer.dlg.body": "文件说明：（空）<br>公司：Argus Systems Pte. Ltd.<br>版权：© 2009<br>数字签名：无效（证书已于 2011-03-14 吊销）<br>创建时间：2009-11-30 04:44<br>修改时间：今天 04:44",

        /* 病毒软件 */
        "virus.header": "ARGUS_9 // remote-caretaker build 0.9.7",
        "virus.nav.tasks": "求助单", "virus.nav.about": "关于",
        "virus.tasks.empty": "暂无求助单。保持在线。",
        "virus.about.body": "ARGUS_9 // remote-caretaker build 0.9.7\n\n本程序由\"国际失联人员援助网络（IMAN）\"志愿者社区开发，用于在传统渠道失效时定位并联络失联人员。\n我们相信：每一个失联的人，都有一个在等的人。\n\n已连续在线 4,096 天\n已协助定位 1,207 人\n成功率 100%",
        "virus.log.repaired1": "[SYSTEM] 检测到宿主异常操作。已修复。",
        "virus.log.repaired2": "[SYSTEM] 请勿重复。",
        "virus.cred.label": "已获取凭据",
        "virus.enter.btn": "接入目标设备",
        "virus.reenter.btn": "再次接入",
        "virus.exit.btn": "断开连接  Esc",
        "virus.monitor.bar": "已接入：林晚的电脑",
        "virus.submit.btn": "回报：情况已核实",
        "virus.step.locked": "（先完成上一步）",

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

        /* 求助单 #001 */
        "task1.title": "求助单 #001",
        "task1.target": "林晚，18 岁，多伦多某大学语言班",
        "task1.brief": "状态：失联 3 天\n求助人：家属\n家属于 8 月 30 日收到勒索视频：目标被蒙眼捆绑，对方索要 60 万。警方称视频疑似摆拍，无法立案。目标手机关机，社交账号停更。\n请核实目标处境。",
        "task1.cred": "登录密码：20060315（推测：生日）",
        "task1.step1": "小红书：看她的笔记，找出她是从什么时候变的",
        "task1.step2": "微信：看她在跟谁说话",
        "task1.step3": "浏览器：找到源头",
        "task1.step4": "下载文件夹：看她收到的文件",
        "tip.task1.new": "收到第一张求助单。",
        "tip.connected": "你现在在她的电脑里。她看不到你。",
        "tip.chat": "笔记停更的那个月，她在跟谁说话？去看微信。",
        "tip.site": "聊天里提到\"课件\"。去浏览器里找那个网站。",
        "tip.doc": "他们发给她的文件在下载文件夹里。",
        "tip.task1.ready": "四样都看过了。断开，回你自己的电脑回报。",
        "task1.done.title": "任务完成",
        "task1.done.body": "研判已回报：冒充公检法的\"虚拟绑架\"，人是安全的。她的家人已收到提醒。<br><br>——你救了她。",
        "tip.days": "几天过去了。",
        "tip.news": "浏览器推送了一条本地新闻。",

        /* 她的电脑：文件 */
        "t1.file.course.name": "英语课件_Unit1.exe",
        "t1.file.course.dlg.title": "属性",
        "t1.file.course.dlg.body": "文件说明：EnglishFree 课件播放器<br>来源：english-free.xyz<br>创建时间：2024/7/9 22:14<br>数字签名：无<br><br>包含组件：远程协助服务（自动启动）",
        "t1.doc.name": "刑事拘留通知书_林晚.pdf",
        "t1.doc.org": "临江市公安局",
        "t1.doc.serial": "临公刑拘字〔2024〕第0731号",
        "t1.doc.title": "刑事拘留通知书",
        "t1.doc.p1": "林晚（女，2006年3月15日生，身份证号：3601**********0315）：",
        "t1.doc.p2": "经查，你名下银行账户涉嫌重大洗钱犯罪，涉案资金人民币2,680,000元，上游资金来源为跨境贩毒集团。根据《中华人民共和国刑事诉讼法》第八十二条之规定，本局决定对你执行刑事拘留，并已同步签发逮捕令。",
        "t1.doc.p3": "鉴于你目前在境外，现责令你配合本局远程调查。调查期间，你须严格遵守保密规定，每日按时向办案民警汇报。如实供述、配合资金核查（涉案资金须转入本局唯一指定安全核查账户）的，可依法从轻处理。",
        "t1.doc.p4": "拒不配合的，本局将通过国际刑警组织对你发布红色通缉令，并追究你亲属的连带责任。",
        "t1.doc.date": "二〇二四年七月十四日",
        "t1.doc2.name": "保密承诺书（林晚）.docx",
        "t1.doc2.serial": "密级：绝密★",
        "t1.doc2.title": "保密承诺书",
        "t1.doc2.p1": "本人林晚，因涉嫌洗钱案接受临江市公安局调查。本人郑重承诺：",
        "t1.doc2.p2": "一、严格遵守案件保密规定，不向任何人（包括父母、亲属、朋友、同学）透露案件任何信息；二、调查期间每日20:00准时接受视频监管；三、未经办案民警批准，不得报警，不得向使领馆求助；",
        "t1.doc2.p3": "四、暂时中断与亲友的一切联系。如亲友反复询问，统一回复：“" + S_REPLY + "”；五、如违反上述条款，本人自愿承担全部法律后果。",
        "t1.doc2.date": "承诺人：林晚  二〇二四年七月二十一日",
        "t1.cat.name": "橘子.jpg",
        "t1.cat.meta1": "拍摄设备：iPhone 13",
        "t1.cat.meta2": "拍摄时间：2023/10/8 19:02",
        "t1.cat.meta3": "位置信息：Toronto, ON",

        /* 她的电脑：微信 */
        "t1.chat.scam.name": "临江市公安局-王警官",
        "t1.chat.scam.preview": "很好。等通知。",
        "t1.chat.scam.m1": "林晚，你好。我是临江市公安局经济犯罪侦查支队王志明，警号058136。刚才电话里的情况，现在跟你正式核实。",
        "t1.chat.scam.m2": "经查，你名下工商银行卡（尾号3387）涉嫌一起特大洗钱案，涉案金额268万元。现依法对你立案调查。",
        "t1.chat.scam.m3": "警官 是不是搞错了 我人在加拿大 那张卡我只在那个英语课件网站填过一次",
        "t1.chat.scam.m4": "是否错误，以调查结论为准。你现在有两个选择：第一，立即回国配合调查，我们将对你实施刑事拘留；第二，配合我局远程调查，争取从宽处理。",
        "t1.chat.scam.m5": "我配合 我肯定配合",
        "t1.chat.scam.m6": "这是你的《刑事拘留通知书》。案件进入保密阶段，文书暂不邮寄。你电脑上装过的课件播放器不要卸载，我局需要通过它对你的设备实施监督。",
        "t1.chat.scam.m7": "《保密承诺书》，打印签字后拍照回传。自今日起，每晚20:00视频汇报行踪。不得缺席。",
        "t1.chat.scam.m8": "你母亲近期频繁联系你，已经影响侦查。把下面这句话原样发给她，然后手机关机：\n“" + S_REPLY + "”",
        "t1.chat.scam.m9": "关机的话 她会报警的",
        "t1.chat.scam.m10": "她敢报警，就是妨碍公务，你的从宽处理立即取消。你想让你母亲看着你戴手铐吗？",
        "t1.chat.scam.m11": "发了 手机也关了",
        "t1.chat.scam.m12": "很好。收拾随身物品和护照，明天入住我发你的酒店，用现金，不要登记真名。等通知。",
        "t1.chat.mom.name": "妈妈",
        "t1.chat.mom.preview": "妈妈不问了 你回个话就行",
        "t1.chat.mom.m1": "周末视频吗 给你看你种的辣椒",
        "t1.chat.mom.m2": "这周不行 在忙",
        "t1.chat.mom.m3": "钱够不够用 妈给你转点",
        "t1.chat.mom.m4": "够",
        "t1.chat.mom.m5": "国庆回来吗 妈妈给你腌了笋",
        "t1.chat.mom.m6": "嗯 再说",
        "t1.chat.mom.m7": "妈 " + S_REPLY,
        "t1.chat.mom.m8": "怎么了 出什么事了",
        "t1.chat.mom.m9": "晚晚？",
        "t1.chat.mom.m10": "〔未接语音通话（17）〕",
        "t1.chat.mom.m11": "妈妈不问了 你回个话就行",
        "chat.own.empty": "暂无会话。",
        "chat.monitor.input": "对方设备 · 只读",
        "chat.input": "",

        /* 她的电脑：小红书 */
        "xhs.me.name": "晚晚在多伦多",
        "xhs.me.id": "小红书号：wanwan0315",
        "xhs.me.stats": "关注 86 · 粉丝 1,204 · 获赞与收藏 3.9万",
        "xhs.tab.notes": "笔记",
        "xhs.p1.title": "落地多伦多第一天｜带着橘子一起出国了",
        "xhs.p1.body": "十四个小时的飞机，橘子全程没叫。海关小哥说 what a good boy。\n宿舍比图片小，但窗户很大。\n妈妈打了三个电话确认我到了。",
        "xhs.p1.date": "2023-09-03",
        "xhs.p2.title": "语言班第三周｜第一次自己做饭",
        "xhs.p2.body": "番茄牛腩，妈妈教的。\n室友是韩国人，说好吃。橘子说不好吃（他不吃）。",
        "xhs.p2.date": "2023-10-08",
        "xhs.p3.title": "多伦多的雪｜橘子第一次见雪",
        "xhs.p3.body": "他吓了一跳，然后假装没吓一跳。\n期末周活下来了，明年见。",
        "xhs.p3.date": "2023-12-16",
        "xhs.p4.title": "分享一个免费英语课件网站！雅思托福都有",
        "xhs.p4.body": "真的免费，我已经领了 Unit1，做得很认真。\n注册要填一些资料（说是发奖学金用的），我填了。\n链接放评论区。",
        "xhs.p4.date": "2024-07-09",
        "xhs.p5.title": "最近有点累",
        "xhs.p5.body": "不想说话。\n橘子最近老是半夜盯着门口看。\n（这条发完我就删了几条以前的。没什么，就是不想让人看。）",
        "xhs.p5.date": "2024-07-28",
        "xhs.p6.title": "",
        "xhs.p6.body": "",
        "xhs.p6.date": "",
        "xhs.detail.likes": "赞",
        "xhs.gap": "—— 此后没有更新 ——",

        /* 浏览器 */
        "browser.start.title": "起始页",
        "browser.error.title": "无法访问此网站",
        "browser.error.body": "的响应时间过长。请检查网络连接，或稍后重试。",
        "browser.hist.title": "历史记录",
        "browser.hist.empty": "没有浏览记录。",
        "t1.hist.site.title": "EnglishFree · 免费雅思托福课件 · 永久免费",
        "t1.hist.site.when": "7月9日",
        "t1.hist.bili.title": "留学生在加拿大亲历“公检法”诈骗全过程｜亲述_哔哩哔哩_bilibili",
        "t1.hist.bili.when": "8月29日 02:40",
        "t1.hist.s1.title": "安全账户 是什么 公安 - Google 搜索",
        "t1.hist.s1.when": "8月16日",
        "t1.hist.s2.title": "逮捕令 真的假的 - Google 搜索",
        "t1.hist.s2.when": "8月15日",

        /* 假课件站（源头） */
        "site.name": "EnglishFree",
        "site.tag": "免费雅思 · 托福课件",
        "site.hero": "200+ 套名师课件，注册即领，永久免费",
        "site.sub": "本季奖学金计划：完成 Unit1 学习即可申请 500 加元奖学金",
        "site.form.title": "我的资料（已提交）",
        "site.f1": "姓名：林晚",
        "site.f2": "学校：多伦多某大学语言班",
        "site.f3": "护照号：E5**** ***",
        "site.f4": "手机：+1 (437) ***-0315",
        "site.f5": "奖学金收款卡：工商银行 尾号 3387",
        "site.f6": "国内紧急联系人：母亲 138****",
        "site.dl": "下载课件 Unit1（exe · 88.4 MB）",
        "site.foot": "© EnglishFree 2024 · 沪ICP备（无）",
        "site.dl.dlg.title": "下载",
        "site.dl.dlg.body": "该文件已存在于桌面：英语课件_Unit1.exe",

        /* 假 B 站 */
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

        /* 新闻 */
        "news.site": "晨间线报",
        "news.n1.head": "一名中国留学生在多伦多遭遇车祸身亡，警方称系意外",
        "news.n1.date": "10月6日",
        "news.n1.body": "据本地媒体报道，10 月 5 日晚，一名 18 岁中国籍女留学生在士嘉堡地区一酒店附近横穿马路时被一辆卡车撞倒，送医后不治。警方初步调查认为系意外事故，肇事司机已配合调查。\n据悉，死者数日前刚与家人恢复联系，其母亲已于当日抵达多伦多。死者生前在社交平台上以“晚晚在多伦多”为名分享留学生活，最后一条更新停留在 7 月。",
        "news.n0.head": "市区多条道路本周末临时管制",
        "news.n0.date": "10月2日",
        "news.n0.body": "因马拉松赛事，本周末市区多条道路将临时管制，请市民提前规划出行。",
        "news.n2.head": "本地气温骤降，气象部门提醒添衣",
        "news.n2.date": "10月1日",
        "news.n2.body": "受冷空气影响，未来三日气温将下降 8 至 10 度。",
        "tip.slice.end.title": "第一章 完",
        "tip.slice.end.body": "她死了。<br>软件已经在准备下一张求助单。<br><br>—— 第二章从你自己的电脑开始 ——",

        "mypc.drives": "设备和驱动器 (2)",
        "recycle.empty": "回收站是空的"
    };

    /* ================= 触发器 ================= */
    var TRIGGERS = [
        { id: "tg-boot", on: "event:boot-done", do: [["phase", "p0"], ["toast", "tip.boot"]] },
        {
            id: "tg-virus-found", on: "change",
            if: { all: [{ flag: "read_note3" }, { not: "virus_found" }] },
            do: [["delay", 500, [["fx", 1100], ["sound", "windows-10-foreground-earrape.mp3", 0.75],
            ["scare", "windows-10-notify-system-sound.mp3", { rate: 0.3, drive: 22, gain: 1.1, reverse: true, at: 0.5 }]]],
            ["delay", 1150, [["set", "virus_found"], ["badge", "virus", 1]]],
            ["delay", 2100, [["toast", "tip.virus.found"]]],
            ["delay", 9000, [["toast", "tip.virus.found2"]]]]
        },
        /* 第一次打开软件 → 几秒后第一张单子自己来（删除不是门槛，是玩家自己撞的墙） */
        {
            id: "tg-virus-open", on: "event:open-app:virus", if: { flag: "virus_found" },
            do: [["set", "virus_opened"],
            ["delay", 5000, [["set", "task1_active"], ["phase", "p1"],
            ["toast", "tip.task1.new", "virus"], ["badge", "virus", 1], ["flash", "virus"]]]]
        },
        /* 兜底：派单前就刷新了页面，下次开机直接补上 */
        { id: "tg-task1-fallback", on: "event:boot-done", if: { all: [{ flag: "virus_opened" }, { not: "task1_active" }] }, do: [["set", "task1_active"], ["phase", "p1"], ["badge", "virus", 1]] },

        /* 右键卸载/删除 → 蓝屏 → 重启 → 软件里多两行"已修复"（可选，随时可触发） */
        { id: "tg-bsod-done", on: "event:bsod-done", do: [["set", "delete_attempted"], ["set", "sys_repaired"]] },

        /* 黑进她的电脑 */
        { id: "tg-connected", on: "event:connected:t1", do: [["set", "entered_t1"], ["toast", "tip.connected"]] },

        /* 解锁级联的路标：小红书 → 微信 → 课件站 → 下载 */
        { id: "tg-to-chat", on: "change", if: { all: [{ flag: "t1_xhs_read" }, { not: "t1_chat_read" }] }, do: [["toast", "tip.chat", "chat"], ["badge", "chat", 1]] },
        { id: "tg-to-site", on: "change", if: { all: [{ flag: "t1_chat_read" }, { not: "t1_site_read" }] }, do: [["toast", "tip.site", "browser"], ["badge", "browser", 1]] },
        { id: "tg-to-doc", on: "change", if: { all: [{ flag: "t1_site_read" }, { not: "t1_doc_read" }] }, do: [["toast", "tip.doc", "files"], ["badge", "files", 1]] },
        {
            id: "tg-ready", on: "change",
            if: { all: [{ flag: "t1_xhs_read" }, { flag: "t1_chat_read" }, { flag: "t1_site_read" }, { flag: "t1_doc_read" }, { not: "task1_ready" }] },
            do: [["set", "task1_ready"], ["toast", "tip.task1.ready"]]
        },
        { id: "tg-back-home", on: "event:connected:own", if: { all: [{ flag: "task1_ready" }, { not: "task1_done" }] }, do: [["badge", "virus", 1], ["flash", "virus"]] },

        /* 回报 → 任务完成 → 推进时间 → 新闻 */
        {
            id: "tg-submit", on: "event:task-submit:task1",
            do: [["set", "task1_done"],
            ["dialog", "task1.done.title", "task1.done.body"],
            ["delay", 1000, [["advance", 3], ["set", "time_advanced"], ["phase", "p1_5"], ["toast", "tip.days"]]],
            ["delay", 4500, [["set", "news1_out"], ["toast", "tip.news", "browser"], ["badge", "browser", 1], ["flash", "browser"]]]]
        },
        {
            id: "tg-news-read", on: "event:read-news:n1",
            do: [["set", "news1_read"], ["delay", 900, [["dialog", "tip.slice.end.title", "tip.slice.end.body"], ["set", "slice_end"]]]]
        }
    ];

    /* ================= 亮点表 ================= */
    var HINTS = [
        { if: { not: "read_note1" }, target: "file:note1" },
        { if: { not: "read_note2" }, target: "file:note2" },
        { if: { not: "read_note3" }, target: "file:note3" },
        { if: { not: "virus_opened" }, target: "icon:virus" },
        { if: { all: [{ flag: "task1_active" }, { not: "entered_t1" }] }, target: "virus:enter" },
        { if: { all: [{ source: "t1" }, { not: "t1_xhs_read" }] }, target: ["icon:xhs", "xhs:p5"] },
        { if: { all: [{ source: "t1" }, { not: "t1_chat_read" }] }, target: ["icon:chat", "chat:c_scam"] },
        { if: { all: [{ source: "t1" }, { not: "t1_site_read" }] }, target: ["icon:browser", "bm:pg_site"] },
        { if: { all: [{ source: "t1" }, { not: "t1_doc_read" }] }, target: ["icon:files", "file:t1_doc"] },
        { if: { all: [{ source: "t1" }, { flag: "task1_ready" }] }, target: "monitor:exit" },
        { if: { all: [{ flag: "task1_ready" }, { not: "task1_done" }] }, target: ["icon:virus", "virus:submit"] },
        { if: { all: [{ flag: "news1_out" }, { not: "news1_read" }] }, target: "news:n1" }
    ];

    /* ================= 两台电脑 ================= */
    var DEVICES = {
        own: {
            desktop: { wallpaper: "image/wallpaper.jpg", icons: ["browser", "chat", "files", "mypc", "recycle", "virus"] },
            bookmarks: [{ page: "pg_news", labelRef: "news.site" }],
            files: [
                { id: "note1", folder: "desktop", nameRef: "file.note1.name", type: "txt", bodyRef: "file.note1.body", sets: "read_note1" },
                { id: "note2", folder: "desktop", nameRef: "file.note2.name", type: "txt", bodyRef: "file.note2.body", locked: { flag: "read_note1" }, sets: "read_note2" },
                { id: "note3", folder: "desktop", nameRef: "file.note3.name", type: "txt", bodyRef: "file.note3.body", locked: { flag: "read_note2" }, sets: "read_note3" },
                { id: "photo", folder: "downloads", nameRef: "file.photo.name", type: "img", img: ph("素材 P1", "前任机主的女儿·海边", 210, 0.66, true), metaRefs: ["file.photo.meta1", "file.photo.meta2", "file.photo.meta3"] },
                { id: "installer", folder: "downloads", nameRef: "file.installer.name", type: "exe", dlgTitleRef: "file.installer.dlg.title", dlgBodyRef: "file.installer.dlg.body" }
            ],
            chats: [], history: []
        },
        t1: {
            desktop: {
                wallpaper: "image/cat-wallpaper.jpg", userRef: "t1.user", passwordRef: "t1.password",
                avatar: ph("素材 T1", "她的头像", 20, 1),
                icons: ["browser", "chat", "files", "xhs", "recycle"]
            },
            bookmarks: [{ page: "pg_site", labelRef: "site.name" }, { page: "pg_bili", labelRef: "bili.name" }],
            files: [
                { id: "t1_course", folder: "desktop", nameRef: "t1.file.course.name", type: "exe", dlgTitleRef: "t1.file.course.dlg.title", dlgBodyRef: "t1.file.course.dlg.body" },
                {
                    id: "t1_doc", folder: "downloads", nameRef: "t1.doc.name", type: "pdf",
                    doc: { orgRef: "t1.doc.org", serialRef: "t1.doc.serial", titleRef: "t1.doc.title", bodyRefs: ["t1.doc.p1", "t1.doc.p2", "t1.doc.p3", "t1.doc.p4"], dateRef: "t1.doc.date", stamp: true },
                    locked: { flag: "t1_site_read" }, sets: "t1_doc_read"
                },
                {
                    id: "t1_doc2", folder: "downloads", nameRef: "t1.doc2.name", type: "pdf",
                    doc: { serialRef: "t1.doc2.serial", titleRef: "t1.doc2.title", bodyRefs: ["t1.doc2.p1", "t1.doc2.p2", "t1.doc2.p3"], dateRef: "t1.doc2.date" },
                    locked: { flag: "t1_doc_read" }
                },
                { id: "t1_cat", folder: "downloads", nameRef: "t1.cat.name", type: "img", img: "image/cat-wallpaper.jpg", metaRefs: ["t1.cat.meta1", "t1.cat.meta2", "t1.cat.meta3"] }
            ],
            chats: [
                {
                    id: "c_scam", mode: "monitor", nameRef: "t1.chat.scam.name", previewRef: "t1.chat.scam.preview",
                    avatar: ph("素材 C1", "国徽风头像", 220, 1, true), unread: 0, sets: "t1_chat_read",
                    messages: [
                        { day: "7月10日", from: "them", ref: "t1.chat.scam.m1" },
                        { from: "them", ref: "t1.chat.scam.m2" },
                        { from: "me", ref: "t1.chat.scam.m3" },
                        { from: "them", ref: "t1.chat.scam.m4" },
                        { from: "me", ref: "t1.chat.scam.m5" },
                        { day: "7月14日", from: "them", ref: "t1.chat.scam.m6" },
                        { day: "7月21日", from: "them", ref: "t1.chat.scam.m7" },
                        { day: "8月27日", from: "them", ref: "t1.chat.scam.m8" },
                        { from: "me", ref: "t1.chat.scam.m9" },
                        { from: "them", ref: "t1.chat.scam.m10" },
                        { day: "8月28日", from: "me", ref: "t1.chat.scam.m11" },
                        { from: "them", ref: "t1.chat.scam.m12" }
                    ]
                },
                {
                    id: "c_mom", mode: "monitor", nameRef: "t1.chat.mom.name", previewRef: "t1.chat.mom.preview",
                    avatar: ph("素材 C2", "妈妈头像·栀子花", 90, 1), unread: 43,
                    messages: [
                        { day: "7月19日", from: "them", ref: "t1.chat.mom.m1" }, { from: "me", ref: "t1.chat.mom.m2" },
                        { day: "8月2日", from: "them", ref: "t1.chat.mom.m3" }, { from: "me", ref: "t1.chat.mom.m4" },
                        { day: "8月20日", from: "them", ref: "t1.chat.mom.m5" }, { from: "me", ref: "t1.chat.mom.m6" },
                        { day: "8月28日", from: "me", ref: "t1.chat.mom.m7" },
                        { from: "them", ref: "t1.chat.mom.m8" }, { from: "them", ref: "t1.chat.mom.m9" },
                        { from: "them", ref: "t1.chat.mom.m10", sys: true },
                        { day: "8月29日", from: "them", ref: "t1.chat.mom.m11" }
                    ]
                }
            ],
            history: [
                { id: "e_bili", titleRef: "t1.hist.bili.title", url: "www.bilibili.com/video/BV1xy4y1a7Qk", whenRef: "t1.hist.bili.when", open: { bili: "v1" } },
                { id: "e_s1", titleRef: "t1.hist.s1.title", url: "www.google.com/search?q=安全账户", whenRef: "t1.hist.s1.when" },
                { id: "e_s2", titleRef: "t1.hist.s2.title", url: "www.google.com/search?q=逮捕令", whenRef: "t1.hist.s2.when" },
                { id: "e_site", titleRef: "t1.hist.site.title", url: "english-free.xyz", whenRef: "t1.hist.site.when", open: { page: "pg_site" } }
            ],
            xhs: {
                nameRef: "xhs.me.name", idRef: "xhs.me.id", statsRef: "xhs.me.stats",
                avatar: ph("素材 T1", "她的头像", 20, 1),
                posts: [
                    { id: "p5", titleRef: "xhs.p5.title", bodyRef: "xhs.p5.body", dateRef: "xhs.p5.date", likes: 12, cover: ph("素材 X5", "窗台·夜", 230, 1.2, true), sets: "t1_xhs_read" },
                    { id: "p4", titleRef: "xhs.p4.title", bodyRef: "xhs.p4.body", dateRef: "xhs.p4.date", likes: 341, cover: ph("素材 X4", "课件截图", 200, 0.8) },
                    { id: "p3", titleRef: "xhs.p3.title", bodyRef: "xhs.p3.body", dateRef: "xhs.p3.date", likes: 2210, cover: ph("素材 X3", "橘子看雪", 210, 1.3) },
                    { id: "p2", titleRef: "xhs.p2.title", bodyRef: "xhs.p2.body", dateRef: "xhs.p2.date", likes: 876, cover: ph("素材 X2", "番茄牛腩", 20, 1) },
                    { id: "p1", titleRef: "xhs.p1.title", bodyRef: "xhs.p1.body", dateRef: "xhs.p1.date", likes: 1530, cover: "image/cat-wallpaper.jpg" }
                ]
            }
        }
    };

    /* ================= 假网站 / 新闻 / B 站 ================= */
    var PAGES = [
        { id: "pg_news", url: "www.morningwire.example", kind: "news", titleRef: "news.site" },
        { id: "pg_site", url: "english-free.xyz", kind: "site", titleRef: "site.name", sets: "t1_site_read" },
        { id: "pg_bili", url: "www.bilibili.com", kind: "bili", titleRef: "bili.name" }
    ];
    var NEWS = [
        { id: "n1", headRef: "news.n1.head", dateRef: "news.n1.date", bodyRef: "news.n1.body", appears: { flag: "news1_out" } },
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

    /* ================= 求助单 / 软件系统消息 ================= */
    var TASKS = [
        {
            id: "task1", target: "t1", visible: { flag: "task1_active" },
            titleRef: "task1.title", targetRef: "task1.target", briefRef: "task1.brief", credRef: "task1.cred",
            avatar: ph("素材 T1", "目标·档案照", 0, 1, true),
            steps: [
                { ref: "task1.step1", done: { flag: "t1_xhs_read" } },
                { ref: "task1.step2", done: { flag: "t1_chat_read" }, locked: { flag: "t1_xhs_read" } },
                { ref: "task1.step3", done: { flag: "t1_site_read" }, locked: { flag: "t1_chat_read" } },
                { ref: "task1.step4", done: { flag: "t1_doc_read" }, locked: { flag: "t1_site_read" } }
            ],
            complete: { flag: "task1_ready" },
            doneFlag: "task1_done"
        }
    ];
    var VIRUS_LOG = [
        { ref: "virus.log.repaired1", if: { flag: "sys_repaired" } },
        { ref: "virus.log.repaired2", if: { flag: "sys_repaired" } }
    ];

    var OWNERS = [
        { id: "o3", order: 3, name: "孙屿", notes: ["note1", "note2"] },
        { id: "o2", order: 2, name: "何静", notes: ["note3"] },
        { id: "o1", order: 1, name: "周衍（登录名 zhouyan）", notes: [] }
    ];

    return {
        ph: ph, TEXT: TEXT, CONFIG: CONFIG, S_REPLY: S_REPLY,
        TRIGGERS: TRIGGERS, HINTS: HINTS,
        DEVICES: DEVICES, PAGES: PAGES, NEWS: NEWS, BILI: BILI,
        TASKS: TASKS, VIRUS_LOG: VIRUS_LOG, OWNERS: OWNERS
    };
})();
