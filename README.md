# 英语自学 · self-taught English

面向**中级学习者**的中英双语英语自学网站。把英语主干——时态与动词、句法结构、词汇搭配、读写听说、考试实用、考研英语——拆成 **9 大模块、38 个章节**;每章含学习目标、知识提纲、**交互练习**(发音 · 单词卡 · 选择/填空)与核心讲解。

- **内容全部开放**,无需登录即可学习。
- **登录后**进度与书签通过 **Firebase 云端同步**,可跨设备。
- **无构建**:纯静态站,CDN 加载 React,不需安装依赖。

> 姊妹项目 [MATH_BOOK](../MATH_BOOK) 同款技术栈(无构建 React SPA + Firebase)。

---

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [Firebase 配置](#firebase-配置englishbook-56374)
- [项目结构](#项目结构)
- [课程结构](#课程结构9-模块--38-章)
- [交互练习](#交互练习)
- [数据存储](#数据存储)
- [开发指南](#开发指南)
- [部署](#部署)
- [许可](#许可)

---

## 功能特性

| 功能 | 说明 |
|---|---|
| 中英双语 | 界面、标题、正文、例句一键切换(右上角「EN / 中」),偏好存本地 |
| 9 模块 / 38 章 | 中级向课程 + 考研英语板块,含学习目标、提纲、例句、练习、核心讲解 |
| 交互练习 | TTS 发音(Web Speech API)、可翻转单词卡、选择题 + 填空自测并打分 |
| 路线图 | 地铁线式可视化,展示章节位置与先修依赖 |
| 进度 & 书签 | 标记完成、加书签;游客存本地,登录后云端同步 |
| 邮箱登录 | Firebase Email/Password 注册与登录 |
| 明暗主题 | 亮/暗切换,偏好持久化 |

---

## 技术栈

- **React 18**(UMD,CDN)+ **Babel Standalone**(浏览器内编译 JSX)
- **marked**:渲染 `content/*.md` 章节正文
- **Firebase 10 (compat)**:`auth` 邮箱登录 + `database`(Realtime Database)同步
- 无打包器、无 `node_modules`;所有 `.jsx` 由 `index.html` 直接以 `type="text/babel"` 加载

---

## 快速开始

无需构建、无需安装依赖。因章节正文用 `fetch` 加载 `content/*.md`,**不能直接双击 `index.html`**,需通过静态服务器访问:

```bash
python -m http.server 5621 --directory D:/webcode/ENGLISH_BOOK
# 浏览器打开 http://localhost:5621
```

或使用 Node:

```bash
npx serve D:/webcode/ENGLISH_BOOK
```

> 首次加载会从 CDN 拉取 React/Babel/marked/Firebase,需要联网。

---

## Firebase 配置(englishbook-56374)

登录与云端同步依赖 Firebase。在 [Firebase 控制台](https://console.firebase.google.com/) 完成以下配置:

1. **Authentication → Sign-in method** → 启用 **Email/Password**
2. **Authentication → Settings → Authorized domains** → 加入 `localhost` 与你的部署域名(如 `*.github.io`)
3. **Realtime Database** → 创建数据库
4. **Realtime Database → 规则** → 粘贴:

```json
{
  "rules": {
    "english_progress":  { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } },
    "english_bookmarks": { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } }
  }
}
```

5. 若 RTDB 实际地址不是 `https://englishbook-56374-default-rtdb.firebaseio.com`,在控制台复制真实 URL 并修改 `firebase-config.js` 中的 `databaseURL`。

> **注意**:`firebase-config.js` 中的 apiKey 等为前端公开标识,安全性由上面的 Auth 规则与授权域名保证,不是密钥泄露。

---

## 项目结构

```
ENGLISH_BOOK/
├─ index.html              入口:加载 React/Babel/marked/Firebase + 各脚本
├─ firebase-config.js      Firebase 项目配置(window.__FIREBASE_CONFIG__)
├─ firebase-init.js        初始化 Firebase,暴露 window.__FIREBASE_READY__
├─ auth.jsx                邮箱登录/注册弹窗与 useAuth 钩子
├─ i18n.jsx                中英文字典、语言切换(useLang / useT / pick / fmt)
├─ data.jsx                9 模块 × 38 章节元数据(MODULES / CHAPTERS)
├─ practice.jsx            交互练习:TTS / 单词卡 / 测验(PRACTICE 配置表)
├─ roadmap.jsx             地铁线式路线图
├─ pages.jsx               Home / Module / Chapter / About 页面
├─ app.jsx                 路由 · 主题 · 进度 · 书签 · 登录状态
├─ styles.css              设计系统(暖米 + 墨蓝 + 珊瑚红,含明暗主题)
└─ content/
   └─ <id>.<lang>.md       章节核心讲解(中英各一份,如 t1.zh.md / t1.en.md)
```

**脚本加载顺序**(见 `index.html`):Firebase SDK → `firebase-config.js` → `firebase-init.js` → `i18n` → `data` → `practice` → `auth` → `roadmap` → `pages` → `app`。修改文件后如未刷新,可提升 `index.html` 里各脚本的 `?v=` 版本号强制刷新缓存。

---

## 课程结构(9 模块 / 38 章)

| # | 模块 | 章节 |
|---|---|---|
| E1 | 时态与动词 Tenses & Verbs | 现在时态 · 过去时态 · 完成时态 · 将来时与情态 |
| E2 | 句法结构 Sentence Structure | 复合句与从句 · 条件句 · 被动语态 · 间接引语 |
| E3 | 词汇与搭配 Vocabulary & Collocations | 构词法 · 短语动词与搭配 · 同义词与语域 · 习语与固定表达 |
| E4 | 阅读 Reading | 略读与寻读 · 推理与语气 · 学术阅读 · 新闻与长文 |
| E5 | 写作 Writing | 段落结构 · 议论文 · 正式与商务写作 · 修改与连贯 |
| E6 | 听力 Listening | 连读与弱读 · 讲座与演讲 · 口音与语流 · 听记要点 |
| E7 | 口语 Speaking | 发音与重音 · 流利度 · 讨论与辩论 · 展示与汇报 |
| E8 | 考试与实用 Exam & Practical | 雅思与托福策略 · 面试英语 · 邮件与消息 · 文化与语用 · 旅行英语 · 点餐与用餐 |
| E9 | 考研英语 Kaoyan English | 完形填空 · 阅读理解与新题型 · 英译汉翻译 · 小作文与大作文 |

每章元数据(`data.jsx`)包含:`id`、`code`、`moduleId`、`difficulty`、`hours`、`prereq`(先修)、`practice`(练习键)、`title` / `summary` / `objectives` / `outline`(均双语)。

**已编写核心讲解正文的示例章节:**

| 章节 id | 主题 | 练习键 |
|---|---|---|
| `t1` | 现在时态 | `present` |
| `s2` | 条件句 | `conditionals` |
| `v2` | 短语动词与搭配 | `phrasal` |
| `r1` | 略读与寻读 | `reading` |

其余章节框架已就绪,正文可按同样格式追加到 `content/`。

---

## 交互练习

练习配置集中在 `practice.jsx` 的 `PRACTICE` 对象,章节通过 `data.jsx` 中的 `practice: "<键>"` 关联。三种组件:

- **发音(speak)**:词/句列表,点喇叭用浏览器 TTS 朗读。
- **单词卡(cards)**:正面单词/音标,翻面看释义与例句;支持左右方向键与空格翻面。
- **测验(quiz)**:`mc`(选择,点选高亮,「检查」后打分)与 `fill`(填空,忽略大小写与首尾空格)。

已配置的练习键:`present`、`past`、`perfect`、`modals`、`clauses`、`conditionals`、`passive`、`reported`、`phrasal`(单词卡)、`reading`、`listening`(发音)、`pronunciation`(发音),以及考研板块的 `cloze`、`kyreading`、`translation`、`kywriting`。

---

## 数据存储

| 数据 | 游客(未登录) | 登录用户 |
|---|---|---|
| 学习进度 | `localStorage` — `english_progress__guest` | RTDB `english_progress/<uid>` |
| 书签 | `localStorage` — `english_bookmarks__guest` | RTDB `english_bookmarks/<uid>` |
| 语言 / 主题偏好 | `localStorage`(始终本地) | 同左 |

Firebase 未就绪或写入失败时会**优雅降级**到 localStorage,不阻断学习。

---

## 开发指南

### 新增一章正文

在 `content/` 下新建 `<id>.zh.md` 与 `<id>.en.md`。中文版结构:

```markdown
## 核心讲解
### 子主题…

## 典型例句
**例 1.** …
> **解.** …

## 练习与自测
1. …

**参考答案.** …
```

英文版对应用 `## Core Notes` / `## Worked Examples` / `## Exercises`。

### 为章节添加交互练习

1. 在 `data.jsx` 对应章节加 `practice: "<键>"`。
2. 在 `practice.jsx` 的 `PRACTICE` 中定义该键的 `speak` / `cards` / `quiz` / `caption`(参考现有条目)。

### 新增章节 / 模块

在 `data.jsx` 的 `MODULES` / `CHAPTERS` 中按现有格式补充,注意维护 `prereq` 先修关系(路线图依赖它绘制连线)。

---

## 部署

纯静态站,推送到 **GitHub Pages / Netlify / Vercel** 即可:

- 仓库:https://github.com/moocstudent/ENGLISH_BOOK
- GitHub Pages:**Settings → Pages** 选 `main` 分支根目录;部署后记得把 `*.github.io` 域名加入 Firebase **Authorized domains**。

---

## 许可

MIT。内容供自学使用。
