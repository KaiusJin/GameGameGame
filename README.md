# 未命名恐怖叙事游戏 · 重构版（二手电脑）

你买了一台二手电脑，里面有一个删不掉的黑客软件，它不断给你派"求助单"。
你救下的人都会意外死亡。

设定、架构、规则见 [DESIGN.md](DESIGN.md)。**改剧情 = 改 `js/data.js`，不改代码。**
旧版（远程协助救女儿）完整代码在 git 历史 `aa39fb9`。

## 运行

```bash
python3 -m http.server 8940
```

浏览器打开 http://localhost:8940 。清档重玩：开始菜单 → 重新开始（清除进度）。

## 当前进度：第一周纵切片（占位文案，已跑通）

开机 → 读前任机主的 txt 链 → 发现 ARGUS_9 → 卸载失败 → 收到求助单 #001 →
接入目标设备（只读监控）→ 聊天 → 浏览记录 → 下载文书（解锁级联）→
回报 → 任务完成 → 时间 +3 天 → 新闻页刷到她的死讯。

## 文件结构

| 文件 | 作用 |
|---|---|
| `index.html` | 单页：开机遮罩 + 桌面 + 全部窗口 |
| `js/engine/state.js` | 状态机（flags/phase/triggers/时钟/存档）· 六条设计规则在文件头 |
| `js/engine/wm.js` | 窗口系统 + 文案应用 + 按 flag 显隐 |
| `js/engine/notify.js` | toast / 红点 / 任务栏闪烁 / 唯一亮点 |
| `js/engine/boot.js` | 开机序列 |
| `js/apps/files.js` | 文件管理器（虚拟文件树 + 桌面文件图标） |
| `js/apps/browser.js` | 浏览器（JSON 页面 / 新闻站 / 历史记录 / 地址栏） |
| `js/apps/chat.js` | 聊天（自己的会话 + 监控模式） |
| `js/apps/viewer.js` | 查看器（txt / 图片假元数据 / 红头文书） |
| `js/apps/virus.js` | 病毒软件（求助单 / 接入设备 / 永远失败的卸载 / 矛盾关于页） |
| `js/data.js` | **全部剧情与文案**（唯一要改的文件） |
| `css/system.css` `css/virus.css` | 新增样式；`pc/apps/browser.css` 为旧版复用 |

存档：localStorage 键 `g2_save`。存档接口收敛在 `state.js` 的 `STORE`，可换云端。

## 不做

剧情正式文案、人物设定、真实黑客技术、平台 SDK、正式美术资产。
