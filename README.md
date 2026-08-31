# 未命名恐怖叙事游戏 · 第一阶段

模拟一台 Windows 电脑：开机 → 登录 → 桌面 → 打开小红书 → 刷到寻人帖。
架构完全照着 `/Users/jiamulin/ningning`（参考项目）的做法搭。

## 运行

```bash
python3 -m http.server 4173
```

浏览器打开 http://localhost:4173 。想清档重玩：访问 `index.html?reset`，
或者在游戏里 开始菜单 → 重新开始。

## 流程（第一阶段范围）

1. **OOBE**：蓝屏设置向导，输入名字（= 电脑用户名 = 小红书昵称）
2. **开机动画 → 锁屏 → 登录**（Win10 样式）
3. **桌面**：此电脑 / 回收站 / 小红书 三个图标 + 任务栏 + 开始菜单
4. 首次进桌面弹"系统通知"，引导打开**小红书**窗口
5. 发现页刷帖（前面全是正常帖）→ 刷到**寻人帖**（全大写拼音标题 + 同校角标）
6. 帖内：系统推荐横幅（点出同校）、带玩家昵称的转发横幅、评论区骂骗子/劝报警
7. 母亲主页：仅 1 帖、上月注册、关注列表只有儿子 → **儿子主页**：三年封面墙由亮到暗，
   最后一帖是 12月19日 无标题的车窗雪，评论区有室友三连追问和"考古"路人

## 文件结构（对应 ningning 的架构）

| 文件 | 对应 ningning | 作用 |
|---|---|---|
| `index.html` + `css/lock.css` + `js/lock.js` | index.html + style.css + js/lock/* | OOBE/开机/锁屏/登录 |
| `js/boot-check.js` | js/lock/boot-check.js | document.write 首帧防闪屏 |
| `js/mobile.js` | js/mobile.js | html.mobile-mode 类适配层 |
| `pc.html` + `css/pc.css` + `js/pc.js` | pc.html + pc.css + js/pc/main.js | 桌面、窗口管理器、任务栏、开始菜单、系统弹窗 |
| `js/xhs.js` + `css/xhs.css` | js/pc/xhs.js | 小红书窗口应用（数据驱动渲染） |
| `js/data.js` | xhs.js 里的 POSTS/SEED_COMMENTS | 全部剧情内容：账号/帖子/评论 |

存档全部在 localStorage，前缀 `xy_`（`xy_name`、`xy_first_boot_done`、`xy_state`、`xy_welcomed`）。

## 占位说明

- 所有封面/头像是自动生成的灰色占位图，图上印着素材编号 → 见 `ASSETS.md`
- F1–F6 是你们真帖的占位，改 `js/data.js` 里的 `f1`–`f6`
- 人名都是占位：陈屿（儿子）/ 林晚（同班女生）/ Kevin（室友）/ 知足常乐-老陈（父亲），
  改名直接在 `js/data.js` 搜索替换

## 下一阶段（未做，按十步链条）

- 搜索功能（挖二手卖教材帖）、私信解锁、未公开帖密码门
- 林晚主页的"写给某个人的简介"、评论区关闭的细节强化
- 恐怖氛围演出（音效、加载延迟、深夜时间感）
- 结局分支：转发链接 / 关掉页面
