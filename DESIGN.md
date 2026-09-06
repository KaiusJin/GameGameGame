# 设计文档 v3 · 《下一位机主》

> 本文档是唯一的设定源。剧情依据 Kaius 的《纯剧情大纲 v2》（仓库 [剧情大纲.md](剧情大纲.md)）。
> 改剧情 = 改 `js/data.js`，不改代码。旧版（远程协助救女儿）代码见 git 历史 `aa39fb9`；v2 纵切片见 `9157f4b`。
> 2026-09-06 按大纲实装全流程：序章 + 三案 + 六结局。

## 一句话

你买了一台二手电脑，里面有一个删不掉的软件 ARGUS_9，它给你派"求助单"让你找人。
第一张是失联的留学生，第二张是卖你电脑的人，第三张是你自己。

## 已拍板（Aaron，2026-09-06）

- 大纲全盘采用；旧稿《一周目流程.md》（张岚案 / 回溯·定位·介入页签）作废，只留档。
- **不做手机**：大纲里"主人公自己的手机"全部走电脑上的微信；来电做成微信语音通话弹窗。
- **玩家名字**来自开机时的 Windows 首次设置页（OOBE，"谁将会使用这台电脑？"），存 `flags.player_name`，文案里用 `{name}`。
  设置完成后登录名仍是前任机主 `zhouyan`（大纲 4.2）——系统没被真正重装，这是第一个"有人在操作"的信号。
- 一次做完，能从头玩到任一结局；大纲没给原句的地方由我补写，可逐条替换。

## 流程（结构级）

| 阶段 | 内容 | 状态 |
|---|---|---|
| 0 序章 | 游玩须知 → BIOS → **Windows 首次设置**（区域/键盘/网络/许可/名字/密码/安全问题/隐私/"嗨，正在为你准备一切"）→ `zhouyan 正在登录` → 三封留言 → ARGUS_9 现身 → 打开 → 关闭时黑屏 → 求助单 001 弹在屏幕中央 | ✅ |
| 1 第一案 林晚 | 黑进她的电脑：小红书 → 王警官 + 日记《精神警察》→ 妈妈会话（草稿）+ B 站评论 → 课件站注册表 / 两版通知书 / 旅馆邮件 → 定位 → 回自己电脑，软件把她的微信注入 → 三句话让她回话 → 她给妈妈打电话 → **分支**：软件的接应表单（A，她死）/ 让许青接（B，她活） | ✅ |
| 1.5 余波 | A：三天后新闻 + 许青在她最后一条笔记下留言；B："接应失败" + 橘子照片 | ✅ |
| 2 第二案 孙屿 | 全在自己电脑：二手帖编辑时间 / 代取小哥 / "请先确认设备是否仍在你手中" → 李子牧新闻 + 旧任务_吴晓 → 档案页签（"完成"= 已接触那一刻）→ 女儿生日解压备份（录音 / 交接清单 / 孙宁邮件）→ 联系孙宁 → **分支**：向软件提交进展（A，他死；孙宁寄来信封）/ 告诉孙宁软件在问（B，他活；孙屿来电） | ✅ |
| 2.5 余波 | 设备流转记录：孙屿被划掉，下一行是 `{name}` → 求助单 003，照片是你的收货照 | ✅ |
| 3 第三案 你 | 自己的桌面套上绿框，断不开 → "安全专员" → 妈妈聊天框里预填的那句话 → 三条消息同时来（卖家 / 假阿澄 / 真阿澄来电）→ 家属留言原件（许青的联系方式被截掉）→ 阿澄要你整理证据；软件要你交接设备；二手平台出现以你名义的帖子；询价的人来了 | ✅ |
| 4 结局 | 六个，见下 | ✅ |

## 结局判定

| 结局 | 条件 |
|---|---|
| True · 三个人都在线 | 林晚活（B）+ 孙屿活（B）+ 证据发给阿澄 + "我出来了" |
| Good · 有人给你留了饭 | 林晚死（A）+ 孙屿活 + 证据发给阿澄 + "我出来了" |
| Normal · 你搬走了 | 接受阿澄帮助但证据未交（"我不等了"），或孙屿已死 |
| Bad · 已安排接应 | 在 ARGUS 里提交自己的外出安排，或回复卖家"我下来了" |
| Bad · 下一位机主 | 回复询价"给你降一百，今晚就能拿" |
| Hidden · 离线 | 右键"彻底删除"备份 / 第二部分证据 / 流转记录 → 开始菜单"关机" |

## 架构

```
index.html            单页：开机遮罩 + 桌面 + 全部窗口（预置，display 切换）
js/engine/state.js    状态机：flags + phase + triggers + 时钟 + 存档 STORE；T() 文案（{name} 替换）
js/engine/oobe.js     Windows 10 首次设置页（画面顺序与文案照真实 OOBE）
js/engine/boot.js     游玩须知 → BIOS → OOBE → 登录行 → 桌面
js/engine/wm.js       窗口/任务栏/右键菜单/系统弹窗 sysDialog·sysPrompt/双桌面/被接入模式(own_watched)
js/engine/notify.js   toast / 红点 / 闪烁 / 唯一亮点 HINTS
js/engine/fx.js       音效变体 / 故障 / 黑入过场 / 蓝屏 / 黑屏 / 来电铃声（合成）
js/engine/hack.js     黑进目标电脑：过场 → 登录 → 切桌面
js/engine/call.js     微信语音来电：响铃 → 接听 → 逐句转写 + 候选回话 → 结束（DB.CALLS）
js/engine/ending.js   结局序列：逐句浮现 / 记事本打字 / 标题 + 重新开始（DB.ENDINGS）
js/apps/chat.js       微信：消息按 if 出现、候选句 choices、正在输入、草稿、预填、来电记录、未读数
js/apps/virus.js      ARGUS_9：求助单（步骤/日志/附件/表单/按钮）、档案、关于、滚动记录、求助单弹窗
js/apps/files.js      文件：多文件夹 + 回收站 + 加密 zip + 录音 + 右键彻底删除
js/apps/viewer.js     查看器：txt / 图片元数据 / 红头文书 / 邮件 / 录音播放器
js/apps/browser.js    浏览器：新闻站 / 课件站 / B 站 / 网页邮箱 / 二手平台 / 保存的文章
js/apps/xhs.js        小红书：笔记 + 评论
js/data.js            唯一剧情源
```

## 数据模型（js/data.js）

```
TEXT      { ref: 文案 }  全部界面文字；{name} = 玩家名
OOBE      首次设置页的列表（区域 / 键盘 / Wi-Fi / 安全问题 / 隐私项）
TRIGGERS  [{ id, on:"event:x"|"change", if, do, repeat? }]
HINTS     [{ if, target }]  首个命中 = 唯一亮点
FOLDERS   文件夹顺序 + 路径（{home} 按设备替换）
DEVICES   own / t1：desktop, bookmarks, files, chats, history, xhs
  chats[]    { id, mode, nameRef, avatar, visible, typing, draft, prefill,
               messages:[{day, from, ref, if, type:img|file|call}], choices:[{id, ref, if, sets, emit}] }
  files[]    { id, folder, type:txt|img|pdf|exe|zip|audio|eml|video, visible, locked, sets, deletable, zip, audio, mail, doc }
PAGES / NEWS / BILI / MAIL / MARKET
TASKS     [{ id, target, visible, status[], steps[], log[], files[], enter, form, actions[] }]
VIRUS_LOG / VIRUS_TICKER / ARCHIVE_IF / ARCHIVE
CALLS     { id: { chat, nameRef, avatar, lines:[{who, ref, wait} | {choices:[{id, ref, sets, then}]}] } }
ENDINGS   { id: { tagRef, titleRef, lines:[{ref, hold} | {typewrite:[[ref, del]]}] } }
<cond> = {flag}|{not}|{phase}|{source}|{eq}|{all}|{any}
动作 = set / phase / advance / toast / badge / flash / open / close / dialog / source / sound / scare / fx /
       blackout / ticket / call / ending / page / emit / delay
```

**关键机制**
- 一切由状态机驱动：app 只发事件、读 flag、渲染数据。对方"回复"= 触发器延时置 flag，消息的 `if` 命中后出现。
- 分支 = 两个互斥入口：第一案是 ARGUS 表单（A）vs 微信候选句（B）；第二案同理；第三案是四条待回复的消息 + 关机。
- 存档 localStorage `g2_save`；结局 id 存 `flags.ending`，重进直接重放。
- 引导三件套：toast 指路 + 红点/闪烁 + 唯一亮点。分支点不给亮点指向某一边。

## 设计规则（同步写在 state.js 头部注释）

1. 黑客解释必须始终成立。2. 软件来历只以三个互相矛盾的来源出现。3. 死亡不演，只在新闻页揭晓。
4. 前十分钟一条直线；每屏一个亮点；软件派单就是教程。5. 不出现真实黑客工具名与手法。6. 页面不写死任何文字。

## 待办 / 已知取舍

- 文案：大纲有原句的已照录；其余为我补写，全部在 `js/data.js` 的 TEXT 里，可逐条替换。
- 美术：全部占位图（编号见 ASSETS.md）。
- 音效：沿用 BORROWED_ASSETS.txt 里的借用素材；来电铃声与录音底噪为 Web Audio 实时合成。
- 时序：对方回复的延时按"像真人"设计（6–48 秒）；二周目 / 循环结局的再开机钩子未做。
