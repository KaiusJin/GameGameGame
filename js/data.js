/* =====================================================================
   剧情内容数据（学习 ningning/js/pc/xhs.js 的数据驱动模式）
   所有帖子/账号/评论都在这里，界面壳在 index.html，渲染在 app.js。

   命名约定：
   - mom  = 母亲    son = 陈屿（失踪者，占位名，可改）
   - wan  = 林晚（同班女生）   kevin = 室友   dad = 父亲
   - f1~f6 = 开头正常帖（占位，之后换成你们自己的真帖）
   - 封面图目前全部是自动生成的占位图，标签即素材编号，对应 ASSETS.md
   ===================================================================== */
window.DB = (function () {

    /* 占位封面生成器：灰渐变 + 素材编号，正式素材做好后替换为图片路径即可 */
    function ph(label, sub, hue, ratio, dark) {
        var w = 390, h = Math.round(w * (ratio || 1.33));
        var l1 = "hsl(" + hue + ",16%," + (dark ? 20 : 86) + "%)";
        var l2 = "hsl(" + ((hue + 45) % 360) + ",20%," + (dark ? 12 : 76) + "%)";
        var fg = dark ? "rgba(255,255,255,.72)" : "rgba(0,0,0,.42)";
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="' + l1 + '"/><stop offset="1" stop-color="' + l2 + '"/>' +
            "</linearGradient></defs>" +
            '<rect width="100%" height="100%" fill="url(#g)"/>' +
            '<text x="50%" y="46%" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="bold" fill="' + fg + '">' + label + "</text>" +
            (sub ? '<text x="50%" y="56%" text-anchor="middle" font-family="sans-serif" font-size="16" fill="' + fg + '">' + sub + "</text>" : "") +
            "</svg>";
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }

    /* ---------------- 账号 ---------------- */
    var USERS = {
        mom: {
            name: "找儿子陈屿",
            uid: "小红书号：cx_20260714_8831",
            avatar: ph("素材 M2", "头像·儿子小时候的照片", 30, 1),
            bio: "找儿子 陈屿\n滑铁卢大学 计算机专业\n2025年12月20日后 失去联系\n有消息请联系 139****2688\n好心人 谢谢",
            extra: "2026年7月加入小红书 · IP属地：江西",
            following: ["son"],
            followers: 2341,
            likes: "3204",
            posts: ["m1"]
        },
        son: {
            name: "屿在滑铁卢",
            uid: "小红书号：yu_uw2023",
            avatar: ph("素材 S0", "头像·大一阳光", 190, 1),
            bio: "UWaterloo CS 26届（大概）\n多伦多 ↔ 滑铁卢\n记录被 due 填满的日子",
            extra: "2023年9月加入小红书 · IP属地：加拿大",
            following: ["wan", "kevin"],
            followers: 8217,
            likes: "1.9万",
            posts: ["s13", "s12", "s11", "s10", "s9", "s8", "s7", "s6", "s5", "s4", "s3", "s2", "s1"]
        },
        wan: {
            name: "林晚wan",
            uid: "小红书号：wan_study",
            avatar: ph("素材 W0", "头像·林晚", 260, 1),
            bio: "背单词和写题之间\nuw",
            extra: "2023年10月加入小红书 · IP属地：加拿大",
            following: ["son"],
            followers: 1893,
            likes: "4102",
            posts: ["w3", "w2", "w1"]
        },
        kevin: {
            name: "Kevin在赶due",
            uid: "小红书号：kevin_no_sleep",
            avatar: null,
            bio: "还有三个due",
            extra: "2024年1月加入小红书 · IP属地：加拿大",
            following: ["son"],
            followers: 45,
            likes: "89",
            posts: []
        },
        dad: {
            name: "知足常乐-老陈",
            uid: "小红书号：cx_88342190",
            avatar: null,
            bio: "",
            extra: "2024年6月加入小红书 · IP属地：江西",
            following: ["son"],
            followers: 2,
            likes: "16",
            posts: []
        },
        fa1: { name: "阿哲不熬夜", uid: "小红书号：azhe2004", avatar: null, bio: "占位账号：换成你们的", extra: "IP属地：加拿大", following: [], followers: 320, likes: "1024", posts: ["f1"] },
        fa2: { name: "Momo的相机", uid: "小红书号：momo_cam", avatar: null, bio: "占位账号：换成你们的", extra: "IP属地：加拿大", following: [], followers: 1520, likes: "8912", posts: ["f2"] },
        fa3: { name: "卷不动的Lisa", uid: "小红书号：lisa_juan", avatar: null, bio: "占位账号：换成你们的", extra: "IP属地：加拿大", following: [], followers: 866, likes: "3201", posts: ["f3"] },
        fa4: { name: "DC受害者联盟", uid: "小红书号：dc_victim", avatar: null, bio: "占位账号：换成你们的", extra: "IP属地：加拿大", following: [], followers: 412, likes: "990", posts: ["f4"] },
        fa5: { name: "小飞象", uid: "小红书号：xiaofeixiang", avatar: null, bio: "占位账号：换成你们的", extra: "IP属地：加拿大", following: [], followers: 78, likes: "230", posts: ["f5"] },
        fa6: { name: "北门修车摊", uid: "小红书号：beimen_fix", avatar: null, bio: "占位账号：换成你们的", extra: "IP属地：加拿大", following: [], followers: 1204, likes: "5600", posts: ["f6"] }
    };

    /* ---------------- 帖子 ----------------
       字段：uid 作者 / title / body / cover / ratio 封面高宽比 /
             likes 点赞 / collects 收藏 / views 浏览 / time / ip /
             school 是否带"同校"角标 / comments / commentsClosed */
    var POSTS = {

        /* ===== 开头的正常帖（占位，之后换成你们的真帖） ===== */
        f1: {
            uid: "fa1", title: "食堂新出的麻辣香锅 排队40分钟值不值",
            body: "占位正文：这里以后换成你们自己的帖子。\n（图和文字都可以整个换掉，结构不用动）",
            cover: ph("占位 F1", "换成你们的真帖 ①", 20, 1.25), likes: 1892, collects: 230, views: "2.1万",
            time: "2026-08-27", ip: "加拿大", school: true,
            comments: [
                { name: "起个名字真难", text: "值！我上周排了五十分钟", time: "2026-08-27", likes: 12 },
                { name: "顺其自然", text: "求具体窗口 别让我瞎找", time: "2026-08-28", likes: 3 }
            ]
        },
        f2: {
            uid: "fa2", title: "把宿舍改造成了ins风 全程只花了200刀",
            body: "占位正文：换成你们的真帖 ②",
            cover: ph("占位 F2", "换成你们的真帖 ②", 320, 1.4), likes: 4210, collects: 1893, views: "6.8万",
            time: "2026-08-26", ip: "加拿大",
            comments: [{ name: "云淡风轻", text: "求床帘链接！！", time: "2026-08-26", likes: 45 }]
        },
        f3: {
            uid: "fa3", title: "凌晨四点的图书馆 只有我和保安大叔",
            body: "占位正文：换成你们的真帖 ③",
            cover: ph("占位 F3", "换成你们的真帖 ③", 220, 1.1), likes: 986, collects: 120, views: "1.5万",
            time: "2026-08-28", ip: "加拿大", school: true,
            comments: [{ name: "一只学术废物", text: "这不是我吗", time: "2026-08-28", likes: 89 }]
        },
        f4: {
            uid: "fa4", title: "这学期的课表 帮我看看还有救吗",
            body: "占位正文：换成你们的真帖 ④",
            cover: ph("占位 F4", "换成你们的真帖 ④", 40, 1.0), likes: 320, collects: 18, views: "8901",
            time: "2026-08-29", ip: "加拿大", school: true,
            comments: [{ name: "热心市民王女士", text: "没救了 退课吧（真心）", time: "2026-08-29", likes: 56 }]
        },
        f5: {
            uid: "fa5", title: "第一次做饭 差点把警报搞响",
            body: "占位正文：换成你们的真帖 ⑤",
            cover: ph("占位 F5", "换成你们的真帖 ⑤", 100, 1.3), likes: 671, collects: 44, views: "1.2万",
            time: "2026-08-29", ip: "加拿大",
            comments: []
        },
        f6: {
            uid: "fa6", title: "捡到一只校猫 有人认识它吗",
            body: "占位正文：换成你们的真帖 ⑥",
            cover: ph("占位 F6", "换成你们的真帖 ⑥", 150, 1.2), likes: 2201, collects: 310, views: "3.4万",
            time: "2026-08-30", ip: "加拿大", school: true,
            comments: [{ name: "爱吃冰的兔叽", text: "这是三食堂的橘座！它有编制的", time: "2026-08-30", likes: 230 }]
        },
        x1: {
            uid: "fa2", title: "今日份的湖边晚霞",
            body: "占位正文：普通滤镜帖。",
            cover: ph("占位 X1", "湖边晚霞·氛围填充帖", 280, 0.9), likes: 512, collects: 67, views: "9870",
            time: "2026-08-30", ip: "加拿大",
            comments: []
        },

        /* ===== 母亲的寻人帖（唯一入口） ===== */
        m1: {
            uid: "mom",
            title: "XUN REN QI SHI 寻人启示 儿孑失踪 滑铁卢大学 HAO XIN REN BANG BANG ZHUAN FA！！",
            body: "寻人 陈屿 男 22岁\n在加拿大 滑铁卢大学 读计算机\n12月20号 跟我视频了一次 说期末考完了 挺好的\n之后 电话不接 微信不回 QQ也不回\n他爸说 大了 忙 让我别催他\n可是过年 他也没有消息\n找他同学问 都说放假了 都走了\n我不会用这个 是他表姐帮我注册的 她说他以前 在这上面发东西\n有认识他的同学吗 有知道消息的好心人吗\n屿屿 妈妈不怪你 你回个话\n（电话微信同号 139****2688）",
            cover: ph("素材 M1", "客厅·母亲举着儿子的照片", 40, 1.25),
            likes: 3204, collects: 421, views: "15.6万",
            time: "2026-07-14", ip: "江西", school: true,
            comments: [
                {
                    name: "过路的", text: "又是骗子吧 这种图一看就是网上找的 套路见多了", time: "2026-07-14", likes: 89,
                    replies: [
                        { u: "mom", text: "是真的 是我儿子 好心人 真的", time: "2026-07-14", likes: 1893 },
                        { name: "螺蛳粉批发商", text: "注意看 阿姨的关注列表只有一个人 你再说是骗子", time: "2026-07-15", likes: 766 }
                    ]
                },
                {
                    name: "Tim不喝咖啡", text: "阿姨报警了吗？国内可以打领事保护热线12308 让使馆协助", time: "2026-07-14", likes: 1523,
                    replies: [
                        { u: "mom", text: "报了 那边说 成年人 自己走的 不算失踪 让我等", time: "2026-07-15", likes: 902 },
                        { name: "Tim不喝咖啡", text: "……唉", time: "2026-07-15", likes: 130 }
                    ]
                },
                { name: "滑大搬砖人", text: "滑铁卢的 已转发 校友群也发了 阿姨别急", time: "2026-07-15", likes: 674 },
                { name: "顺其自然", text: "留学生 大冬天的 失联……不敢多想 希望平安", time: "2026-07-16", likes: 448 },
                {
                    name: "理性吃瓜群众", text: "就一个帖 0粉丝 注册不到一个月 真假不好说 蹲一个后续", time: "2026-07-16", likes: 96,
                    replies: [{ name: "爱吃冰的兔叽", text: "万一是真的呢 转发一下又不花钱", time: "2026-07-16", likes: 214 }]
                },
                {
                    name: "热心市民王女士", text: "阿姨 给他学校的系里发邮件问过吗", time: "2026-07-17", likes: 55,
                    replies: [{ u: "mom", text: "邮件 我不会 他表姐发了 没有人回", time: "2026-07-17", likes: 320 }]
                },
                { name: "起个名字真难", text: "“妈妈不怪你 你回个话” 看哭了 屿屿快回家吧", time: "2026-07-19", likes: 1102 }
            ]
        },

        /* ===== 陈屿的三年（封面墙就是剧情曲线） ===== */
        s1: {
            uid: "son", title: "滑铁卢第一周！！宿舍开箱+选课踩坑",
            body: "落地第八天。宿舍比想象的小，但窗外有一棵超大的枫树！\n选课血泪教训放评论区了，学弟学妹避雷。\nCS的大家加个好友，一起卷！",
            cover: ph("素材 S1", "大一·宿舍开箱 明亮", 200, 1.3),
            likes: 2341, collects: 380, views: "3.1万",
            time: "2023-09-08", ip: "加拿大",
            comments: [
                {
                    u: "wan", text: "哈哈哈那棵枫树精：我又被拍了", time: "2023-09-08", likes: 145,
                    replies: [{ u: "son", text: "改天给它开个专栏", time: "2023-09-08", likes: 78 }]
                },
                {
                    u: "dad", text: "好好学习 注意安全 钱够不够", time: "2023-09-09", likes: 23,
                    replies: [{ u: "son", text: "够的够的 别担心", time: "2023-09-09", likes: 31 }]
                },
                { name: "学妹一枚", text: "求选课避雷合集！！", time: "2023-09-10", likes: 12 }
            ]
        },
        s2: {
            uid: "son", title: "秋天的校园真的会发光🍁",
            body: "课间随手拍的。\n这里的秋天很短，大家都说要抓紧看。",
            cover: ph("素材 S2", "大一·秋叶校园", 30, 1.15),
            likes: 1892, collects: 260, views: "2.4万",
            time: "2023-10-15", ip: "加拿大",
            comments: [{ u: "wan", text: "第三张拍得最好", time: "2023-10-15", likes: 40 }]
        },
        s3: {
            uid: "son", title: "第一个期末周存活实录 day1",
            body: "图书馆已经没有座位了。\n咖啡因摄入超标，但是还活着。求各位大佬保佑我 CS135。",
            cover: ph("素材 S3", "大一·期末图书馆", 230, 1.25),
            likes: 987, collects: 105, views: "1.6万",
            time: "2023-12-10", ip: "加拿大",
            comments: [
                {
                    u: "wan", text: "凌晨的DC 还得是你", time: "2023-12-10", likes: 66,
                    replies: [{ u: "son", text: "你不也在（转头对视）", time: "2023-12-10", likes: 92 }]
                },
                { u: "dad", text: "加油 别熬太晚", time: "2023-12-11", likes: 8 }
            ]
        },
        s4: {
            uid: "son", title: "-26°C上学是什么体验",
            body: "睫毛结冰了。真的。有图为证。\n听说这还不是最冷的时候？",
            cover: ph("素材 S4", "大一·雪路上学", 210, 1.35),
            likes: 1204, collects: 98, views: "1.9万",
            time: "2024-02-03", ip: "加拿大",
            comments: [{ name: "南方人震撼", text: "这也太冷了吧？？", time: "2024-02-03", likes: 30 }]
        },
        s5: {
            uid: "son", title: "大一下总结 | GPA保住了",
            body: "有惊无险。暑假回国，机场见。\n下学期想试试接点项目，攒攒简历。",
            cover: ph("素材 S5", "大一末·机场登机口", 190, 1.1),
            likes: 856, collects: 60, views: "1.2万",
            time: "2024-04-20", ip: "加拿大",
            comments: [{ u: "dad", text: "给你接风", time: "2024-04-21", likes: 15 }]
        },
        s6: {
            uid: "son", title: "大二开学 | study with me ep.1",
            body: "新学期第一条。这学期课好重，vlog可能更得少一点。\n一起自习吧。",
            cover: ph("素材 S6", "大二·书桌台灯 study", 250, 1.3),
            likes: 623, collects: 210, views: "8901",
            time: "2024-09-02", ip: "加拿大",
            comments: [{ u: "wan", text: "打卡 ep.1", time: "2024-09-02", likes: 22 }]
        },
        s7: {
            uid: "son", title: "co-op求职记录 week1 | 投了80份",
            body: "简历改到第11版。\n据说平均要投两百份才有面试，那我才走了三分之一？\n加油吧。",
            cover: ph("素材 S7", "大二·电脑屏幕 求职表格", 220, 1.2),
            likes: 402, collects: 96, views: "6203",
            time: "2024-11-08", ip: "加拿大",
            comments: [
                { u: "kevin", text: "简历发我 帮你看看格式", time: "2024-11-08", likes: 10 },
                { u: "wan", text: "加油！！我也在改简历 一起", time: "2024-11-08", likes: 18 },
                { u: "dad", text: "隔壁你李叔家孩子拿到大厂offer了 你也加把劲", time: "2024-11-10", likes: 2 }
            ]
        },
        s8: {
            uid: "son", title: "study with me ep.7 | 凌晨的DC",
            body: "这期没什么好说的。\n就是坐着，写题。",
            cover: ph("素材 S8", "大二·深夜自习 冷色", 235, 1.25, true),
            likes: 288, collects: 40, views: "4102",
            time: "2025-01-19", ip: "加拿大",
            comments: [{ u: "wan", text: "ep.7 打卡", time: "2025-01-19", likes: 9 }]
        },
        s9: {
            uid: "son", title: "拒信合集 | 第43封",
            body: "没什么好说的。看看吧。\n（这期没有剪辑，懒得剪了）",
            cover: ph("素材 S9", "大二末·邮箱拒信截图", 0, 1.0, true),
            likes: 195, collects: 12, views: "5320",
            time: "2025-03-14", ip: "加拿大",
            comments: [
                {
                    name: "过路的", text: "都留学生了还卖惨？家里有钱送你出去 有什么好抱怨的", time: "2025-03-14", likes: 213,
                    replies: [
                        { name: "一只学术废物", text: "楼上这话说的 谁的日子都不容易", time: "2025-03-15", likes: 87 }
                    ]
                },
                { u: "wan", text: "[抱抱]", time: "2025-03-14", likes: 26 },
                { u: "dad", text: "心态放好 男孩子要坚强", time: "2025-03-16", likes: 1 }
            ]
        },
        s10: {
            uid: "son", title: "咖啡店打工的一天 vlog",
            body: "暑假没回国，在打工。\n拉花学会了。就这样。",
            cover: ph("素材 S10", "大三前·咖啡店吧台", 25, 1.2),
            likes: 176, collects: 20, views: "3805",
            time: "2025-06-30", ip: "加拿大",
            comments: [{ u: "wan", text: "[咖啡]", time: "2025-06-30", likes: 7 }]
        },
        s11: {
            uid: "son", title: "好久不见",
            body: "换了个单人宿舍。最近在想一些事。\n等想清楚了 再跟你们说。",
            cover: ph("素材 S11", "大三·空宿舍 傍晚", 240, 1.15, true),
            likes: 143, collects: 9, views: "2907",
            time: "2025-09-21", ip: "加拿大",
            comments: [
                { u: "wan", text: "[抱抱]", time: "2025-09-21", likes: 11 },
                { u: "kevin", text: "可以啊 还活着", time: "2025-09-22", likes: 5 },
                { u: "dad", text: "加油", time: "2025-09-23", likes: 0 }
            ]
        },
        s12: {
            uid: "son", title: "期末 day3",
            body: "还剩两门。",
            cover: ph("素材 S12", "大三·期末 桌角 暗", 245, 1.0, true),
            likes: 47, collects: 2, views: "1201",
            time: "2025-11-30", ip: "加拿大",
            comments: [{ u: "dad", text: "注意身体", time: "2025-12-01", likes: 0 }]
        },
        s13: {
            uid: "son", title: "",
            body: "",
            cover: ph("素材 S13", "12月19日·车窗外的雪", 225, 0.75, true),
            likes: 33, collects: 4, views: "4.7万",
            time: "2025-12-19", ip: "加拿大",
            comments: [
                { u: "wan", text: "。", time: "2025-12-19", likes: 892 },
                { u: "dad", text: "加油 注意身体 过年记得视频", time: "2025-12-19", likes: 3 },
                {
                    u: "kevin", text: "期末结束了 出来吃火锅？", time: "2025-12-21", likes: 12,
                    replies: [
                        { u: "kevin", text: "哥们 回个消息", time: "2025-12-24", likes: 45 },
                        { u: "kevin", text: "回个消息 求你了", time: "2026-01-02", likes: 456 }
                    ]
                },
                { name: "螺蛳粉批发商", text: "从阿姨的寻人帖过来的……孩子 你在哪啊", time: "2026-07-16", likes: 1204 },
                { name: "顺其自然", text: "12月19号 雪 车窗……这种天气 唉 希望是我们想多了", time: "2026-07-17", likes: 866 },
                {
                    name: "云淡风轻", text: "阿姨你想开点[蜡烛]", time: "2026-07-20", likes: 92,
                    replies: [{ name: "爱吃冰的兔叽", text: "还没定论呢 别乱点蜡烛！", time: "2026-07-20", likes: 388 }]
                },
                { name: "momo", text: "考古：从他第一个帖子刷过来的 看到这里说不出话", time: "2026-08-02", likes: 501 }
            ]
        },

        /* ===== 林晚 ===== */
        w1: {
            uid: "wan", title: "期末自习room tour | 和搭子的第38天",
            body: "固定座位 固定的两杯咖啡。\n考完这科就解放了。",
            cover: ph("素材 W1", "林晚·自习桌 两杯咖啡", 270, 1.25),
            likes: 231, collects: 34, views: "4200",
            time: "2025-02-11", ip: "加拿大",
            comments: [{ name: "一只学术废物", text: "羡慕有搭子的人", time: "2025-02-11", likes: 9 }]
        },
        w2: {
            uid: "wan", title: "study with me | 秋招版",
            body: "十月了。\n把手机锁进抽屉，从早八坐到闭馆。",
            cover: ph("素材 W2", "林晚·图书馆窗边", 265, 1.3),
            likes: 178, collects: 21, views: "3100",
            time: "2025-10-05", ip: "加拿大",
            comments: []
        },
        w3: {
            uid: "wan", title: "七月 自习记录",
            body: "普通的一个月。图书馆 换了三楼靠窗的位置。\n最近睡得还行。\n\n希望你也在 好好吃饭。",
            cover: ph("素材 W3", "林晚·七月 靠窗座位", 255, 1.2),
            likes: 88, collects: 6, views: "2094",
            time: "2026-07-16", ip: "加拿大",
            commentsClosed: true,
            comments: []
        }
    };

    /* ---------------- 信息流 ---------------- */
    var FEED_DISCOVER = ["f1", "f2", "f3", "f4", "m1", "f5", "f6", "x1"];
    var FEED_SCHOOL = ["m1", "f3", "f4", "f6", "f1"];

    return { USERS: USERS, POSTS: POSTS, FEED_DISCOVER: FEED_DISCOVER, FEED_SCHOOL: FEED_SCHOOL, ph: ph };
})();
