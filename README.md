# 未命名恐怖叙事游戏 · 第一章（纵切片）

你是陈雨的网友。她妈妈深夜找到你：女儿在多伦多失联三天了。
你远程连上她的电脑，一边翻，一边回答一个不停发消息的母亲。
每样东西都有两种读法：她出事了 / 这是一场骗局。

设定、线索表、纪律见 [DESIGN.md](DESIGN.md)。**改剧情 = 改 `js/data.js`，不改代码。**

## 运行

```bash
python3 -m http.server 4173
```

浏览器打开 http://localhost:4173 。清档重玩：访问 `index.html?reset`，
或游戏里 开始菜单 → 重新开始。

## 流程（第一章范围）

1. **冷开场**（index.html）：微信收到"平安是福"好友申请 → 母亲求助（脚本化，无自由输入）
   → 两张手机截图（+1 未接来电 / 她最后的消息）→ ToDask 远程协助邀请
2. **分流**：PC 点"接受并连接"→ 连接动画 → 女儿桌面；
   移动端连接失败（剧情：手机发起不了远程），留在聊天里收母亲的截图
3. **桌面**（pc.html）：远程顶栏 + 母亲聊天坞**常驻**；时钟 = 本机时间 −12h（多伦多）
4. 可翻的东西：微信（妈妈 / 王警官 / 同学群 / **通话记录★**）、下载文件夹（假文书）、
   Chrome（最近搜索 / biliblil 首页与历史记录 / 反诈假网页）
5. **结束**：拘留通知书 + 通话记录 +（王警官聊天 或 搜索记录）三条集齐 →
   母亲狂喜"她回我了"——回复和《保密承诺书》的统一回复一字不差 → 黑屏"第一章 完"

## 文件结构

| 文件 | 作用 |
|---|---|
| `index.html` + `css/chat.css` + `js/intro.js` | 冷开场（玩家的微信）+ 双端分流 |
| `js/boot-check.js` | 首帧检查：?reset 清档、已连接的直接进桌面 |
| `js/mobile.js` | 移动端判定（学 ningning：pointer coarse / 宽度≤820） |
| `pc.html` + `css/pc.css` + `js/pc.js` | 桌面、窗口管理器、任务栏、开始菜单 |
| `css/apps.css` | 远程壳 + 微信/下载/查看器/biliblil 样式 |
| `js/remote.js` | 远程顶栏、她时区的时钟、倒计时接口、母亲聊天坞、结束判定 |
| `js/wechat.js` | 她的微信窗口（会话 + 通话记录★锚点线索） |
| `js/files.js` | 下载文件夹 + 假文书查看器 |
| `js/browser.js` + `css/browser.css` | Chrome：Google/搜索/假网页 + biliblil |
| `js/clues.js` | 线索引擎（发现/解锁/订阅） |
| `js/shots.js` + `css/shot.css` | 手机截图气泡渲染（两页共用） |
| `js/data.js` | **全部剧情**：脚本/聊天/文书/线索表（唯一要改的文件） |

存档全在 localStorage，前缀 `xy_`（xy_stage / xy_ip_main / xy_ip_tail /
xy_choices / xy_assist_log / xy_clues / xy_ended）。

## 占位说明

- 头像/封面是灰色占位图，图上印素材编号 → 见 `ASSETS.md`
- 人名占位：陈雨（女儿）/ 平安是福（妈妈）/ 王警官（骗子），改名在 `js/data.js` 搜索替换
- biliblil 首页 6 张卡、历史记录里的正常生活视频：换成你们自己的素材

## 第一章不做（见 DESIGN.md）

后续章节、小游戏、真实视频、B 站账号运营、SDK 昵称、倒计时启用
（接口已留：`REMOTE.setCountdown(时间戳)`）、4399 副站。

## 发布（Toy）

ZIP 根目录放 index.html，总大小 ≤140MB，不塞白名单外文件。slug/密码：暂缓。
