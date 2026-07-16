/* =========================================================
   i18n — Chinese / English switching
   ---------------------------------------------------------
   UI            : dictionary of interface strings { key: {zh, en} }
   LangContext   : current language ("zh" | "en")
   useLangState(): App-level state hook (persists to localStorage)
   useLang()     : read current language inside any component
   useT()        : returns t(key) -> localized UI string
   pick(lang,obj): localize a content object { zh, en } (or a plain string)
   fmt(str, map) : replace {NAME} placeholders
   ========================================================= */

const LANG_KEY = "english_book_lang";

const LangContext = React.createContext("zh");

function useLangState() {
  const [lang, setLangRaw] = React.useState(() => {
    try { return localStorage.getItem(LANG_KEY) || "zh"; } catch (e) { return "zh"; }
  });
  React.useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    document.documentElement.setAttribute("data-lang", lang);
  }, [lang]);
  const setLang = (l) => {
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    setLangRaw(l);
  };
  const toggle = () => setLang(lang === "zh" ? "en" : "zh");
  return [lang, setLang, toggle];
}

function useLang() { return React.useContext(LangContext); }

function useT() {
  const lang = React.useContext(LangContext);
  return (key) => {
    const e = UI[key];
    if (e === undefined) return key;
    if (typeof e === "object") return e[lang] !== undefined ? e[lang] : e.zh;
    return e;
  };
}

function pick(lang, obj) {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] !== undefined ? obj[lang] : (obj.zh !== undefined ? obj.zh : (obj.en || ""));
}

const UI = {
  /* ---- nav ---- */
  brand_word:      { zh: "自学英语", en: "self-taught" },
  nav_home:        { zh: "路线图", en: "Roadmap" },
  nav_about:       { zh: "关于", en: "About" },
  nav_login:       { zh: "登录 / 注册", en: "Log in / Sign up" },
  nav_logout:      { zh: "登出", en: "Sign out" },
  nav_about_site:  { zh: "关于本站", en: "About this site" },
  theme_title:     { zh: "切换明暗", en: "Toggle theme" },
  lang_title:      { zh: "Switch to English", en: "切换到中文" },
  chip_unit:       { zh: "章", en: "ch." },

  /* ---- home hero ---- */
  hero_badge:      { zh: "课程体系 v1.0 · 2026", en: "CURRICULUM v1.0 · 2026" },
  open_mode:       { zh: "开放访问", en: "OPEN ACCESS" },
  welcome:         { zh: "欢迎", en: "WELCOME" },
  hero_l1:         { zh: "从语法、词汇,", en: "From grammar & vocabulary," },
  hero_l2a:        { zh: "系统提升到", en: "to" },
  hero_l2b:        { zh: "地道英语", en: "natural English." },
  hero_sub: {
    zh: "把中级英语的主干——时态、句法、词汇、读写、听说——拆成 {M} 大模块、{C} 个章节。每章配学习目标、知识提纲、核心讲解、典型例句与交互练习(发音 · 单词卡 · 选择填空)。进度本机保存,全站一键中英切换。",
    en: "The backbone of intermediate English — tenses, syntax, vocabulary, reading, writing, listening and speaking — broken into {M} modules and {C} chapters. Each chapter ships with objectives, an outline, core notes, worked examples and interactive practice (pronunciation · flashcards · quizzes). Progress is saved locally; the whole site switches between Chinese and English with one click.",
  },
  cta_start:       { zh: "从第一章开始 →", en: "Start chapter one →" },
  cta_howto:       { zh: "如何使用", en: "How to use" },
  cta_roadmap:     { zh: "看完整路线图 ↓", en: "See the full roadmap ↓" },
  meta_modules:    { zh: "模块", en: "Modules" },
  meta_chapters:   { zh: "章节", en: "Chapters" },
  meta_examples:   { zh: "例句", en: "Examples" },
  meta_hours:      { zh: "学时", en: "Hours" },
  your_progress:   { zh: "你的进度", en: "Your progress" },
  of_chapters:     { zh: "章已完成", en: "chapters done" },
  saved_local:     { zh: "本机保存 · 浏览器内", en: "saved in this browser" },
  synced:          { zh: "Firebase · 跨设备同步", en: "Firebase · synced across devices" },
  cta_register:    { zh: "登录同步进度 →", en: "Log in to sync →" },

  /* ---- sections ---- */
  sec01:           { zh: "路线图", en: "Roadmap" },
  sec01_aside:     { zh: "从左到右 · 从上到下", en: "left → right · top → bottom" },
  sec02:           { zh: "八大模块", en: "Eight modules" },
  sec02_aside:     { zh: "点击进入", en: "click to enter" },
  sec03:           { zh: "怎么用这份地图", en: "How to use this map" },
  sec03_aside:     { zh: "三条原则", en: "three rules" },
  modules_count:   { zh: "章节", en: "chapters" },
  done_word:       { zh: "完成", en: "done" },
  enter_word:      { zh: "→ 进入", en: "→ enter" },

  /* roadmap legend */
  rm_notstarted:   { zh: "未开始", en: "not started" },
  rm_done:         { zh: "已完成", en: "done" },
  rm_track:        { zh: "横线 = 模块主线", en: "line = module track" },
  rm_axis_1:       { zh: "I · 时态与谓语", en: "I · tenses & verbs" },
  rm_axis_2:       { zh: "II · 句法结构", en: "II · syntax" },
  rm_axis_3:       { zh: "III · 词汇与读写", en: "III · vocab & literacy" },
  rm_axis_4:       { zh: "IV · 听说与实用", en: "IV · speaking & use" },

  /* philosophy cards */
  phil1_zh:        { zh: "输入要够,输出要勤。", en: "Input enough, output often." },
  phil1_b:         { zh: "语法和词汇先吃透,再用例句和练习把它们说出来、写出来。看十遍不如开口一遍。", en: "Digest the grammar and vocabulary first, then make them yours by speaking and writing. Reading ten times can't match saying it once." },
  phil2_zh:        { zh: "先准确,再流利。", en: "Accuracy first, then fluency." },
  phil2_b:         { zh: "中级阶段先把时态、搭配、句式用对,再追求地道与速度。错了再改,比从未尝试好。", en: "At the intermediate stage, get tenses, collocations and patterns right first, then chase naturalness and speed. Correcting a mistake beats never trying." },
  phil3_zh:        { zh: "在语境中学,不在词表里背。", en: "Learn in context, not from lists." },
  phil3_b:         { zh: "每个词、每个句式都放进例句和场景里记。脱离语境的单词,记住了也用不出。", en: "Learn every word and pattern inside a sentence and a scene. Words memorized out of context stay on the shelf." },

  /* ---- module page ---- */
  bc_home:         { zh: "首页", en: "Home" },
  bc_modules:      { zh: "模块", en: "Modules" },
  module_word:     { zh: "模块", en: "Module" },
  of_word:         { zh: "/", en: "of" },
  m_chapters:      { zh: "章节 · CHAPTERS", en: "CHAPTERS" },
  m_meta_chapters: { zh: "章节", en: "CHAPTERS" },
  m_meta_hours:    { zh: "学时", en: "HOURS" },
  m_meta_level:    { zh: "难度", en: "LEVEL" },
  m_meta_progress: { zh: "进度", en: "PROGRESS" },
  chapter_list:    { zh: "章节清单", en: "Chapter list" },
  click_enter:     { zh: "点击进入 · 勾选标记完成", en: "click to enter · check to mark done" },
  hours_unit:      { zh: "学时", en: "hrs" },
  no_prereq:       { zh: "无先修", en: "no prereq" },
  prereq_n:        { zh: "先修 {n}", en: "{n} prereq" },
  mark_done_title: { zh: "标记完成", en: "mark as done" },
  mark_login_hint: { zh: "登录后进度云端同步", en: "log in to sync progress" },
  back_to:         { zh: "回到", en: "Back to" },

  /* ---- chapter page ---- */
  toc_contents:    { zh: "目录", en: "Contents" },
  toc_siblings:    { zh: "同模块", en: "In this module" },
  ch_sec_intro:    { zh: "导读 / Intro", en: "Intro" },
  ch_sec_obj:      { zh: "学习目标 / Objectives", en: "Objectives" },
  ch_sec_outline:  { zh: "知识提纲 / Outline", en: "Outline" },
  ch_sec_practice: { zh: "交互练习 / Practice", en: "Interactive practice" },
  practice_hint:   { zh: "点单词听发音 · 翻单词卡 · 做选择与填空——边学边练(免费开放)。", en: "Click words to hear them, flip flashcards, and try the quizzes — learn by doing (free)." },
  ch_sec_notes:    { zh: "核心讲解 / Core notes", en: "Core notes" },
  ch_sec_examples: { zh: "典型例句 / Examples", en: "Worked examples" },
  ch_sec_exercises:{ zh: "练习与自测 / Exercises", en: "Exercises" },
  toc_intro:       { zh: "00 · 导读", en: "00 · Intro" },
  toc_obj:         { zh: "01 · 学习目标", en: "01 · Objectives" },
  toc_outline:     { zh: "02 · 知识提纲", en: "02 · Outline" },
  toc_practice:    { zh: "✦ · 交互练习", en: "✦ · Practice" },
  toc_notes:       { zh: "03 · 核心讲解", en: "03 · Core notes" },
  toc_examples:    { zh: "04 · 典型例句", en: "04 · Examples" },
  toc_exercises:   { zh: "05 · 练习自测", en: "05 · Exercises" },
  practice_badge:  { zh: "交互", en: "INTERACTIVE" },
  notes_missing:   { zh: "本章讲解正在编写中。", en: "Notes for this chapter are in progress." },
  example_word:    { zh: "例", en: "Example" },
  solution_word:   { zh: "答", en: "Answer" },
  show_solution:   { zh: "显示答案", en: "Show answer" },
  hide_solution:   { zh: "收起答案", en: "Hide answer" },
  level_word:      { zh: "难度", en: "Level" },
  est_word:        { zh: "建议学时", en: "Est. time" },
  ch_prev:         { zh: "上一章", en: "Prev" },
  ch_next:         { zh: "下一章", en: "Next" },
  mark_done_btn:   { zh: "标记完成", en: "Mark as done" },
  marked_done:     { zh: "已完成", en: "Completed" },
  ch_meta_examples:{ zh: "例句", en: "Examples" },
  ch_meta_exercises:{ zh: "练习", en: "Exercises" },

  /* ---- bookmarks ---- */
  bm_section:      { zh: "书签", en: "Bookmark" },
  bm_add:          { zh: "📑 在此处加书签", en: "📑 Bookmark this spot" },
  bm_jump:         { zh: "↧ 跳到书签", en: "↧ Jump to spot" },
  bm_update:       { zh: "更新到当前位置", en: "Update to current spot" },
  bm_remove:       { zh: "移除", en: "Remove" },
  bm_note_ph:      { zh: "记几个字(可选,如:看到虚拟语气)", en: "A few words (optional)" },
  bm_at:           { zh: "位置", en: "at" },
  bm_hint:         { zh: "提示:登录后书签可云端跨设备同步。", en: "Tip: log in to sync bookmarks across devices." },
  bm_hint_guest:   { zh: "提示:登录后书签可云端跨设备同步。", en: "Tip: log in to sync bookmarks across devices." },
  home_resume:     { zh: "继续阅读", en: "Resume reading" },
  home_resume_aside: { zh: "你的书签 · 点击跳回", en: "your bookmarks · click to jump back" },
  bm_continue:     { zh: "继续 →", en: "Resume →" },

  /* difficulty labels */
  diff_1:          { zh: "复习", en: "Review" },
  diff_2:          { zh: "中级", en: "Intermediate" },
  diff_3:          { zh: "进阶", en: "Advanced" },

  /* ---- interactive practice (practice.jsx) ---- */
  speak_aria:      { zh: "朗读", en: "Read aloud" },
  flash_title:     { zh: "单词卡", en: "Flashcards" },
  flash_hint:      { zh: "点卡片翻面 · 用 ← / → 切换 · 点喇叭听发音", en: "Click to flip · ← / → to switch · click the speaker to hear it" },
  flash_pos:       { zh: "第 {n} / {t} 张", en: "Card {n} / {t}" },
  flash_flip:      { zh: "翻面", en: "Flip" },
  flash_front:     { zh: "正面:单词", en: "front: word" },
  flash_back:      { zh: "背面:释义", en: "back: meaning" },
  quiz_title:      { zh: "自测题", en: "Quiz" },
  quiz_check:      { zh: "检查", en: "Check" },
  quiz_score:      { zh: "得分", en: "Score" },
  quiz_reset:      { zh: "重做", en: "Reset" },
  quiz_correct:    { zh: "正确", en: "Correct" },
  quiz_wrong:      { zh: "再试试", en: "Try again" },
  quiz_fb_label:   { zh: "解析", en: "Feedback" },
  quiz_fill_ph:    { zh: "输入你的答案…", en: "Type your answer…" },
  quiz_q_word:     { zh: "题", en: "Q" },
  mc_word:         { zh: "选择", en: "Multiple choice" },
  fill_word:       { zh: "填空", en: "Fill in the blank" },
  no_tts:          { zh: "(浏览器不支持朗读)", en: "(browser has no speech)" },
  no_practice:     { zh: "本章暂无交互练习。", en: "No interactive practice for this chapter yet." },
  scene_title:     { zh: "情景对话", en: "In context" },
  scene_label:     { zh: "情景 {n}", en: "Scene {n}" },
  scene_hint:      { zh: "地道口语场景 · 点喇叭听单句,点标题旁的喇叭听整段 · 中文仅作参考", en: "Real-life colloquial scenes · tap a line's speaker to hear it, or the speaker by the title to play the whole scene · Chinese is only a gloss" },

  /* ---- auth ---- */
  auth_welcome:    { zh: "WELCOME BACK", en: "WELCOME BACK" },
  auth_join:       { zh: "JOIN IN", en: "JOIN IN" },
  auth_login_t1:   { zh: "登入。", en: "Welcome" },
  auth_login_t2:   { zh: "resume.", en: "back." },
  auth_reg_t1:     { zh: "注册。", en: "Begin" },
  auth_reg_t2:     { zh: "begin.", en: "here." },
  auth_blurb_course:{ zh: "登录后可同步《{name}》的学习进度与书签。", en: "Log in to sync your progress and bookmarks for “{name}”." },
  auth_blurb:      { zh: "登录后学习进度与书签由 Firebase 托管,跨设备同步。内容全部免费开放,无需解锁。", en: "Log in to sync progress and bookmarks via Firebase across devices. All content stays free — no paywall." },
  auth_b1:         { zh: "进度与书签云端同步", en: "Progress & bookmarks synced" },
  auth_b2:         { zh: "跨设备继续学习", en: "Continue on any device" },
  auth_b3:         { zh: "账号由 Firebase 安全托管", en: "Accounts secured by Firebase" },
  auth_tab_login:  { zh: "登录 / login", en: "Log in" },
  auth_tab_reg:    { zh: "注册 / register", en: "Sign up" },
  auth_name:       { zh: "显示名 · Name", en: "Display name" },
  auth_name_ph:    { zh: "例如:英语爱好者", en: "e.g. English learner" },
  auth_email:      { zh: "邮箱 · Email", en: "Email" },
  auth_pass:       { zh: "密码 · Password", en: "Password" },
  auth_pass_hint:  { zh: "(≥ 6 位)", en: "(≥ 6 chars)" },
  auth_submit_login:{ zh: "登录 →", en: "Log in →" },
  auth_submit_reg: { zh: "注册并登录 →", en: "Sign up →" },
  auth_busy:       { zh: "请稍候…", en: "Please wait…" },
  auth_note:       { zh: "使用邮箱 + 密码注册。账号仅用于保存学习进度与书签。", en: "Sign up with email + password. Your account is used only to save progress and bookmarks." },
  auth_close:      { zh: "关闭", en: "Close" },
  err_email:       { zh: "邮箱格式不对", en: "Invalid email format" },
  err_pass:        { zh: "密码至少 6 位", en: "Password must be at least 6 characters" },
  err_email_used:  { zh: "该邮箱已注册,请直接登录", en: "Email already registered — please log in" },
  err_notfound:    { zh: "找不到该用户,请先注册", en: "User not found — please sign up first" },
  err_wrongpass:   { zh: "邮箱或密码错误", en: "Wrong email or password" },
  err_toomany:     { zh: "尝试过于频繁,请稍后再试", en: "Too many attempts — try again later" },
  err_network:     { zh: "网络异常,请检查连接", en: "Network error — check your connection" },
  err_notallowed:  { zh: "邮箱登录未启用 — 需在 Firebase 控制台开启 Email/Password", en: "Email login disabled — enable Email/Password in Firebase console" },
  err_noconfig:    { zh: "认证未配置 — 请检查 Firebase 设置与授权域名", en: "Auth not configured — check Firebase settings and authorized domains" },
  err_need_both:   { zh: "请输入邮箱和密码", en: "Enter both email and password" },
  err_notready:    { zh: "认证服务未就绪,请稍后重试", en: "Auth service not ready — try again shortly" },
  err_generic:     { zh: "操作失败", en: "Something went wrong" },

  /* ---- about ---- */
  about_kicker:    { zh: "关于", en: "ABOUT" },
  about_q:         { zh: "为什么自己学英语?", en: "Why teach yourself English?" },
  about_q_accent:  { zh: "自己学", en: "yourself" },
  about_sub:       { zh: "因为语言是练出来的,不是听出来的。", en: "Because a language is built by using it, not by hearing about it." },
  about_h1:        { zh: "这是什么", en: "What is this" },
  about_p1:        { zh: "一份面向中级学习者的英语自学地图。我们把通常分散在好几本教材里的内容,重新组织成 {M} 个模块、{C} 个章节,每章配学习目标、知识提纲、核心讲解、典型例句与交互练习。", en: "A self-study map of English for intermediate learners. Content usually scattered across several textbooks is reorganized into {M} modules and {C} chapters, each with objectives, an outline, core notes, worked examples and interactive practice." },
  about_p1b:       { zh: "不卖课、不收钱、不发证书。它只是一份你可以随时打开、关上、再打开的地图。", en: "No courses for sale, no fees, no certificates. Just a map you can open, close and reopen anytime." },
  about_h2:        { zh: "如何使用", en: "How to use it" },
  about_p2:        { zh: "1. 从首页路线图看清各章的位置与依赖。\n2. 选一章感兴趣的,读完导读与提纲。\n3. 走完核心讲解、典型例句,再用交互练习自测。\n4. 勾选「已完成」,进度保存在本机;卡住了就回到先修补一补。", en: "1. Use the roadmap to see where each chapter sits and what it depends on.\n2. Pick a chapter, read the intro and outline.\n3. Work through the core notes and examples, then self-test with the interactive practice.\n4. Check “done”; progress is saved locally. Stuck? Go back to a prerequisite." },
  about_h3:        { zh: "中英双语", en: "Bilingual" },
  about_p3:        { zh: "全站支持中英文一键切换——界面、章节标题、讲解正文与例句都有两种语言版本。点右上角的「EN / 中」即可切换。讲解为中文,例句与练习的英语本身保持英文(这正是你要学的)。", en: "The whole site switches between Chinese and English with one click — interface, chapter titles, notes and examples all have both. Use the “EN / 中” button at the top right. Explanations are in Chinese; the English in examples and quizzes stays in English (that's what you're here to learn)." },
  about_h4:        { zh: "不承诺什么", en: "What we don't promise" },
  about_p4:        { zh: "不承诺学完就能考满分、不承诺覆盖每一个考点、也不承诺替你开口。它能做的,是把你愿意付出的时间,用在更有效的地方。", en: "We don't promise a perfect score, full exam coverage, or speaking for you. What it can do is help you spend the time you're willing to invest more effectively." },

  footer_tag:      { zh: "英语自学 · self-taught English", en: "self-taught English" },
  footer_local:    { zh: "本机保存", en: "saved locally" },
  footer_sync:     { zh: "云端同步", en: "cloud sync" },
  not_found_ch:    { zh: "未找到章节。", en: "Chapter not found." },
  not_found_m:     { zh: "未找到模块。", en: "Module not found." },
};

function fmt(str, map) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (map && map[k] !== undefined ? map[k] : "{" + k + "}"));
}

window.UI = UI;
window.LangContext = LangContext;
window.useLangState = useLangState;
window.useLang = useLang;
window.useT = useT;
window.pick = pick;
window.fmt = fmt;
