# 《下一位机主》· 恐怖叙事游戏（假 Windows 桌面）

你买了一台二手电脑，里面有一个删不掉的软件 ARGUS_9，它给你派"求助单"让你找人。
第一张是失联的留学生，第二张是卖你电脑的人，第三张是你自己。

剧情依据 Kaius 的大纲：[剧情大纲.md](剧情大纲.md)。设定、架构、结局判定见 [DESIGN.md](DESIGN.md)。
**改剧情 = 改 `js/data.js`，不改代码。**

## 运行

```bash
python3 -m http.server 8940
```

浏览器打开 http://localhost:8940 。清档重玩：开始菜单 → 重新开始（清除进度）。

## 当前进度：全流程可玩（占位美术，文案待逐条正式化）

游玩须知 → BIOS → Windows 登录（输入你的名字）→ 三封留言 → ARGUS_9 →
求助单 001 → 黑进林晚的电脑 → 定位 → 用微信把她劝回来 → 分支（软件接应 / 许青接应）→ 新闻或橘子的照片 →
求助单 002 → 二手帖 / 旧任务 / 档案 / 加密备份 / 孙宁 → 分支（向软件回报 / 与孙宁一起接住他）→
设备流转记录 → 求助单 003（目标是你）→ 安全专员 / 妈妈的预填消息 / 三条同时来的消息 / 阿澄来电 →
家属留言原件 → 最后的选择 → 六个结局。

## 文件结构

| 文件 | 作用 |
|---|---|
| `index.html` | 单页：开机遮罩 + 桌面 + 全部窗口 |
| `js/engine/state.js` | 状态机（flags/phase/triggers/时钟/存档）· 六条设计规则在文件头 |
| `js/engine/signin.js` | Windows 10 登录界面 |
| `js/engine/boot.js` | 开机序列 |
| `js/engine/wm.js` | 窗口系统 + 文案应用 + 按 flag 显隐 + 右键菜单 + 弹窗 |
| `js/engine/notify.js` | toast / 红点 / 任务栏闪烁 / 唯一亮点 |
| `js/engine/fx.js` | 音效 / 故障 / 黑入过场 / 蓝屏 / 黑屏 / 铃声 |
| `js/engine/hack.js` | 黑进目标电脑：过场 → 登录 → 切桌面 |
| `js/engine/call.js` | 微信语音来电 |
| `js/engine/ending.js` | 结局序列 |
| `js/apps/*.js` | 文件 / 查看器 / 微信 / 浏览器 / 小红书 / ARGUS_9 |
| `js/data.js` | **全部剧情与文案**（唯一要改的文件） |
| `css/*.css` | 样式 |
| `BORROWED_ASSETS.txt` | 借来的占位资源清单，正式版逐条替换后删除 |
| `一周目流程.md` | 旧稿，已作废，仅留档 |

存档：localStorage 键 `g2_save`。存档接口收敛在 `state.js` 的 `STORE`，可换云端。
