# 英语自学 · self-taught English

面向**中级学习者**的中英双语英语自学网站。主干——时态与动词、句法结构、词汇搭配、读写听说、考试实用——拆成 **8 大模块、32 个章节**;每章含学习目标、知识提纲、**交互练习**(发音 · 单词卡 · 选择填空)与核心讲解。**内容全部开放**;登录后进度与书签 **Firebase 云端同步**。

> 姊妹项目 [MATH_BOOK](../MATH_BOOK) 同款技术栈(无构建 React SPA + Firebase)。

---

## Firebase 配置(englishbook-56374)

1. **Authentication** → 启用 **Email/Password**
2. **Authentication → Settings → Authorized domains** → 加入 `localhost` 与你的部署域名
3. **Realtime Database** → 创建数据库
4. **Realtime Database → 规则**:

```json
{
  "rules": {
    "english_progress":  { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } },
    "english_bookmarks": { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } }
  }
}
```

5. 若 RTDB URL 不同,修改 `firebase-config.js` 中的 `databaseURL`。

游客未登录时进度/书签存 **localStorage**;登录后写入云端。

---

## 本地运行

无需构建、无需安装依赖。任意静态服务器即可(章节正文用 `fetch` 加载 `content/*.md`,**不能直接双击 `index.html`**):

```bash
python -m http.server 5621 --directory D:/webcode/ENGLISH_BOOK
# 浏览器打开 http://localhost:5621
```

或:

```bash
npx serve D:/webcode/ENGLISH_BOOK
```

---

## 文件结构

```
index.html              入口: React/Babel/marked/Firebase + 脚本
firebase-config.js      Firebase 项目配置
firebase-init.js        初始化 __FIREBASE_READY__
auth.jsx                邮箱登录/注册弹窗
styles.css              设计系统(暖米 + 墨蓝 + 珊瑚红)
i18n.jsx                中英文字典与语言切换
data.jsx                8 模块 × 32 章节元数据
practice.jsx            交互练习: TTS / 单词卡 / 测验
roadmap.jsx             地铁线式路线图
pages.jsx               Home / Module / Chapter / About
app.jsx                 路由 · 主题 · 进度 · 书签 · 登录
content/<id>.<lang>.md  章节核心讲解(中英各一份)
```

## 已编写内容的示例章节

| 章节 | 主题 |
|---|---|
| t1 | 现在时态 |
| s2 | 条件句 |
| v2 | 短语动词与搭配 |
| r1 | 略读与寻读 |

其余章节框架已在 `data.jsx` 中,正文可按同样格式追加到 `content/`。

## 写章节内容

`content/<id>.zh.md` 结构:

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

英文版用 `## Core Notes / ## Worked Examples / ## Exercises`。

在 `data.jsx` 中为章节添加 `practice: "present"` 等键,并在 `practice.jsx` 的 `PRACTICE` 对象里配置对应练习。

## 部署

纯静态站,推送到 GitHub Pages / Netlify / Vercel 即可。

## 许可

MIT。内容供自学使用。
