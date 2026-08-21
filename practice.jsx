/* =========================================================
   practice.jsx — interactive English learning widgets
   ---------------------------------------------------------
   Chapters set practice: "<key>" in data.jsx; chapter page
   renders <Practice name={...} />. Configs hold flashcards,
   quizzes (MC + fill), and speakable word lists.
   ========================================================= */

function cssvar(name, fb) {
  try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; }
  catch (e) { return fb; }
}

/* ---- Text-to-speech ---- */
function speakEn(text, lang) {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = lang === "zh" ? "en-US" : "en-US";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}

function SpeakBtn({ text, className }) {
  const t = useT();
  const lang = useLang();
  const [on, setOn] = React.useState(false);
  const timerRef = React.useRef(null);
  const hasTTS = typeof window !== "undefined" && !!window.speechSynthesis;
  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  if (!hasTTS) return <span className="tiny" style={{ color: "var(--muted)" }}>{t("no_tts")}</span>;
  const handleSpeak = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOn(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    speakEn(text, lang);
    timerRef.current = setTimeout(() => setOn(false), Math.max(1200, String(text).length * 80));
  };
  return (
    <button type="button" className={`speak-btn ${on ? "speaking" : ""} ${className || ""}`}
      title={t("speak_aria")} aria-label={t("speak_aria")}
      onClick={handleSpeak}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
    </button>
  );
}

function SpeakRow({ items }) {
  const lang = useLang();
  return (
    <div className="speak-row" style={{ margin: "12px 0 20px", gap: 10 }}>
      {items.map((w, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid var(--hairline-strong)", background: "var(--surface)" }}>
          <span className="en-text">{w.en}</span>
          <SpeakBtn text={w.en} />
          {lang === "zh" && w.zh ? <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>{w.zh}</span> : null}
        </span>
      ))}
    </div>
  );
}

/* ---- Flashcards ---- */
function FlashDeck({ cards }) {
  const t = useT();
  const lang = useLang();
  const [i, setI] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const n = cards.length;
  const c = cards[i] || cards[0];
  React.useEffect(() => { setFlipped(false); }, [i]);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") { setI((x) => Math.max(0, x - 1)); }
      if (e.key === "ArrowRight") { setI((x) => Math.min(n - 1, x + 1)); }
      if (e.key === " ") { e.preventDefault(); setFlipped((f) => !f); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n]);
  if (!n) return null;
  return (
    <div className="flash-deck">
      <div className="flash-toolbar">
        <span className="pos">{fmt(t("flash_pos"), { n: i + 1, t: n })}</span>
        <div className="flash-nav">
          <button type="button" disabled={i <= 0} onClick={() => setI((x) => x - 1)}>←</button>
          <button type="button" onClick={() => setFlipped((f) => !f)}>{t("flash_flip")}</button>
          <button type="button" disabled={i >= n - 1} onClick={() => setI((x) => x + 1)}>→</button>
        </div>
      </div>
      <div className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)} role="button" tabIndex={0}>
        <div className="flashcard-inner">
          <div className="flashcard-face front">
            <div className="fc-pos">{c.pos || "word"}</div>
            <div className="fc-word">{c.word}</div>
            {c.phon ? <div className="fc-phon">{c.phon}</div> : null}
            <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}><SpeakBtn text={c.word} /></div>
            <div className="fc-hint">{t("flash_front")}</div>
          </div>
          <div className="flashcard-face back">
            <div className="fc-gloss">{pick(lang, c.gloss)}</div>
            {c.example ? <div className="fc-ex">"{c.example}"</div> : null}
            <div className="fc-hint">{t("flash_back")}</div>
          </div>
        </div>
      </div>
      <div className="practice-caption">{t("flash_hint")}</div>
    </div>
  );
}

/* ---- Quiz (MC + fill) ---- */
function QuizBlock({ questions }) {
  const t = useT();
  const lang = useLang();
  const [answers, setAnswers] = React.useState({});
  const [checked, setChecked] = React.useState(false);
  const reset = () => { setAnswers({}); setChecked(false); };
  const score = () => {
    let ok = 0;
    questions.forEach((q, i) => {
      const a = answers[i];
      if (q.type === "mc" && a === q.correct) ok++;
      if (q.type === "fill" && a && String(a).trim().toLowerCase() === String(q.answer).trim().toLowerCase()) ok++;
    });
    return ok;
  };
  return (
    <div>
      {questions.map((q, i) => {
        const a = answers[i];
        const isMc = q.type === "mc";
        const correct = checked && (isMc ? a === q.correct : a && String(a).trim().toLowerCase() === String(q.answer).trim().toLowerCase());
        const wrong = checked && !correct && a !== undefined && a !== "";
        return (
          <div key={i} className="quiz-block">
            <div className="quiz-q">
              <span className="qnum">{t("quiz_q_word")} {i + 1}</span>
              {pick(lang, q.prompt)}
            </div>
            {isMc ? (
              <div className="quiz-opts" role="radiogroup" aria-label={pick(lang, q.prompt)}>
                {q.options.map((opt, j) => {
                  const letter = String.fromCharCode(65 + j);
                  const sel = a === j;
                  const cls = checked
                    ? (j === q.correct ? "correct locked" : sel ? "wrong locked" : "locked")
                    : (sel ? "selected" : "");
                  const pickOpt = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (checked) return;
                    setAnswers((prev) => ({ ...prev, [i]: j }));
                  };
                  return (
                    <button key={j} type="button" role="radio" aria-checked={sel}
                      className={`quiz-opt ${cls}`} disabled={!!checked}
                      onClick={pickOpt} onPointerDown={pickOpt}>
                      <span className="letter">{letter}</span>
                      <span className="quiz-opt-text">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="quiz-fill">
                <input type="text" placeholder={t("quiz_fill_ph")} value={a || ""} disabled={checked}
                  className={checked ? (correct ? "correct" : wrong ? "wrong" : "") : ""}
                  onChange={(e) => setAnswers((s) => ({ ...s, [i]: e.target.value }))} />
              </div>
            )}
            {checked && q.feedback ? (
              <div className={`quiz-fb ${correct ? "ok" : ""}`}>
                <strong>{t("quiz_fb_label")}: </strong>{pick(lang, q.feedback)}
              </div>
            ) : null}
          </div>
        );
      })}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
        {!checked ? (
          <button type="button" className="quiz-check" onClick={() => setChecked(true)}>{t("quiz_check")}</button>
        ) : (
          <>
            <div className="quiz-score">{t("quiz_score")}: <b>{score()}</b> / {questions.length}</div>
            <button type="button" className="quiz-reset" onClick={reset}>{t("quiz_reset")}</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Contextual scenes (authentic, colloquial dialogues) ---- */
function SceneBlock({ scenes }) {
  const t = useT();
  const lang = useLang();
  if (!scenes || !scenes.length) return null;
  return (
    <div className="scene-wrap">
      {scenes.map((s, i) => (
        <div className="scene" key={i}>
          <div className="scene-head">
            <span className="scene-tag">{fmt(t("scene_label"), { n: i + 1 })}</span>
            <span className="scene-situation">{pick(lang, s.situation)}</span>
            <SpeakBtn className="scene-play-all" text={s.lines.map((l) => l.en).join(" … ")} />
          </div>
          <div className="scene-lines">
            {s.lines.map((ln, j) => (
              <div className={`scene-line ${ln.who === "B" ? "who-b" : ln.who === "A" ? "who-a" : "who-x"}`} key={j}>
                <span className="scene-who">{ln.who || "·"}</span>
                <div className="scene-bubble">
                  <span className="scene-say">
                    <span className="en-text">{ln.en}</span>
                    <SpeakBtn text={ln.en} />
                  </span>
                  {lang === "zh" && ln.zh ? <span className="scene-zh">{ln.zh}</span> : null}
                  {ln.note ? <span className="scene-note">{pick(lang, ln.note)}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="practice-caption">{t("scene_hint")}</div>
    </div>
  );
}

/* ---- Practice configs ---- */
const PRACTICE = {
  present: {
    caption: { zh: "听一读下列例句,再完成自测。", en: "Listen to the examples, then take the quiz." },
    speak: [
      { en: "I work from home on Fridays.", zh: "我周五在家办公" },
      { en: "She is studying for her exam.", zh: "她正在为考试学习" },
      { en: "Water boils at 100°C.", zh: "水在100°C沸腾" },
    ],
    scenes: [
      {
        situation: { zh: "在街上偶遇老朋友", en: "Running into an old friend on the street" },
        lines: [
          { who: "A", en: "Hey, long time no see! How've you been?", zh: "嘿,好久不见!你最近怎么样?", note: { zh: "\"long time no see\" 是固定寒暄语。", en: "\"Long time no see\" is a set greeting." } },
          { who: "B", en: "Pretty good, actually. Still at the same job, just crazy busy these days.", zh: "其实还不错。还在原来那家公司,就是最近忙得要命。" },
          { who: "A", en: "Tell me about it. I barely have time to breathe lately.", zh: "可不是嘛。我最近忙得喘不过气。", note: { zh: "\"Tell me about it\" = 我完全懂(表示同感)。", en: "\"Tell me about it\" = I know exactly what you mean." } },
          { who: "B", en: "So what are you up to now? You heading home?", zh: "那你现在要去哪儿?回家吗?", note: { zh: "\"What are you up to?\" = 你在忙什么/要干嘛。", en: "\"What are you up to?\" = what are you doing." } },
          { who: "A", en: "Yeah, I'm meeting my sister for dinner. She's in town for the week.", zh: "对,我要和我妹吃晚饭。她这周在城里。" },
        ],
      },
      {
        situation: { zh: "室友聊早晨习惯(一般现在 vs 现在进行)", en: "Roommates on morning habits (simple vs continuous)" },
        lines: [
          { who: "A", en: "You're up early. What's going on?", zh: "你起得挺早啊,怎么了?" },
          { who: "B", en: "I always get up at six on weekdays. I go for a run before work.", zh: "我工作日总是六点起,上班前去跑步。", note: { zh: "always/on weekdays → 习惯,用一般现在。", en: "always / on weekdays → habit → present simple." } },
          { who: "A", en: "Every day? That's rough.", zh: "每天?够呛啊。" },
          { who: "B", en: "Nah, you get used to it. Right now I'm training for a half marathon, so I can't skip it.", zh: "不会,习惯就好。我现在在练半马,所以不能偷懒。", note: { zh: "\"right now\" → 阶段性动作,用现在进行。", en: "\"right now\" → temporary action → present continuous." } },
        ],
      },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "哪句一般现在用得对?", en: "Which present simple sentence is correct?" },
        options: ["She is knowing the answer.", "She knows the answer.", "She know the answer."],
        correct: 1,
        feedback: { zh: "know 是状态动词,不用进行时。", en: "Know is stative — no progressive form." },
      },
      {
        type: "mc",
        prompt: { zh: "「此刻正在发生」选哪句?", en: "Which shows an action happening now?" },
        options: ["He reads a book every night.", "He is reading a book right now.", "He read a book yesterday."],
        correct: 1,
        feedback: { zh: "right now 提示现在进行。", en: "Right now signals present continuous." },
      },
      {
        type: "fill",
        prompt: { zh: "填空: I ___ (watch) TV at the moment.", en: "Fill in: I ___ (watch) TV at the moment." },
        answer: "am watching",
        feedback: { zh: "at the moment → 现在进行。", en: "At the moment → present continuous." },
      },
    ],
  },
  conditionals: {
    caption: { zh: "条件句自测:形式与意义要配对。", en: "Match conditional form to meaning." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "If it ___ tomorrow, we will cancel the picnic.", en: "If it ___ tomorrow, we will cancel the picnic." },
        options: ["rained", "rains", "will rain"],
        correct: 1,
        feedback: { zh: "第一条件:If + 一般现在, will + 动词。", en: "First conditional: if + present, will + verb." },
      },
      {
        type: "mc",
        prompt: { zh: "与现在事实相反:", en: "Unreal present:" },
        options: ["If I was rich, I will travel.", "If I were rich, I would travel.", "If I am rich, I would travel."],
        correct: 1,
        feedback: { zh: "第二条件:were + would。", en: "Second conditional: were + would." },
      },
      {
        type: "fill",
        prompt: { zh: "If I ___ (know) her number, I would call her.", en: "If I ___ (know) her number, I would call her." },
        answer: "knew",
        feedback: { zh: "第二条件从句用过去式。", en: "Second conditional clause uses past form." },
      },
    ],
  },
  phrasal: {
    caption: { zh: "高频短语动词:翻面记义,点喇叭听读。", en: "Core phrasal verbs: flip for meaning, speaker to hear." },
    cards: [
      { word: "look up", pos: "v", phon: "/lʊk ʌp/", gloss: { zh: "查阅(词典/信息)", en: "search for information" }, example: "I'll look up the word in the dictionary." },
      { word: "give up", pos: "v", phon: "/ɡɪv ʌp/", gloss: { zh: "放弃", en: "stop trying" }, example: "Don't give up — keep practicing." },
      { word: "take off", pos: "v", phon: "/teɪk ɒf/", gloss: { zh: "起飞;脱掉;突然成功", en: "leave the ground; remove; succeed quickly" }, example: "The plane took off on time." },
      { word: "put off", pos: "v", phon: "/pʊt ɒf/", gloss: { zh: "推迟", en: "postpone" }, example: "We put off the meeting until Monday." },
      { word: "run into", pos: "v", phon: "/rʌn ˈɪntuː/", gloss: { zh: "偶然遇见", en: "meet by chance" }, example: "I ran into an old friend yesterday." },
      { word: "figure out", pos: "v", phon: "/ˈfɪɡjər aʊt/", gloss: { zh: "弄明白", en: "understand or solve" }, example: "Can you figure out this puzzle?" },
    ],
    scenes: [
      {
        situation: { zh: "打电话敲定周末计划(满是短语动词)", en: "Sorting out weekend plans on the phone" },
        lines: [
          { who: "A", en: "Hey, are we still on for Saturday?", zh: "嘿,周六还算数吧?", note: { zh: "\"be still on\" = 计划仍然有效。", en: "\"be still on\" = the plan is still happening." } },
          { who: "B", en: "I might have to bail, honestly. Something came up at work.", zh: "老实说我可能得放你鸽子。工作上有点急事。", note: { zh: "\"bail\" = 临时退出;\"something came up\" = 有事情冒出来。", en: "\"bail\" = back out; \"something came up\" = an unexpected thing happened." } },
          { who: "A", en: "Aw, come on. Can't you get out of it?", zh: "别啊,你就不能推掉吗?", note: { zh: "\"get out of\" = 摆脱/躲开(某个义务)。", en: "\"get out of\" = avoid an obligation." } },
          { who: "B", en: "Let me see if I can move it around. I'll get back to you tonight.", zh: "我看看能不能调一下。今晚给你答复。", note: { zh: "\"get back to you\" = 稍后回复你。", en: "\"get back to you\" = reply later." } },
          { who: "A", en: "Cool. Just don't leave me hanging — I already booked the table.", zh: "行。别把我晾着就行——我桌都订好了。", note: { zh: "\"leave someone hanging\" = 让人干等、没个准信。", en: "\"leave someone hanging\" = leave them waiting without an answer." } },
        ],
      },
      {
        situation: { zh: "找人帮忙修电脑", en: "Asking a friend for tech help" },
        lines: [
          { who: "A", en: "My laptop keeps freezing. I've tried everything.", zh: "我电脑老是卡死。我什么都试过了。" },
          { who: "B", en: "Did you back up your files before you messed with it?", zh: "你在瞎折腾之前备份文件了吗?", note: { zh: "\"back up\" = 备份;\"mess with\" = 摆弄/瞎动。", en: "\"back up\" = save a copy; \"mess with\" = tinker with." } },
          { who: "A", en: "Yeah, and I even reset the whole thing. Still acting up.", zh: "备份了,我甚至整个重置了。还是不正常。", note: { zh: "\"act up\" = (机器/身体)出毛病。", en: "\"act up\" = malfunction / misbehave." } },
          { who: "B", en: "Weird. Drop it off tomorrow and I'll take a look.", zh: "怪了。明天拿过来,我给你瞧瞧。", note: { zh: "\"drop off\" = 顺路送到;\"take a look\" = 看一看。", en: "\"drop off\" = leave it somewhere; \"take a look\" = check it." } },
        ],
      },
    ],
  },
  reading: {
    caption: { zh: "阅读策略小测。", en: "Quick check on reading strategies." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "只想快速了解新闻大意,应该:", en: "To get the gist of a news article quickly, you should:" },
        options: ["Read every word carefully", "Skim headings and the lead paragraph", "Translate each sentence"],
        correct: 1,
        feedback: { zh: "略读抓标题与导语。", en: "Skim titles and the lead." },
      },
      {
        type: "mc",
        prompt: { zh: "在文中找某个日期,应该:", en: "To find a specific date in the text, you should:" },
        options: ["Scan for numbers and dates", "Read from start to finish slowly", "Memorize the whole article"],
        correct: 0,
        feedback: { zh: "寻读定位细节。", en: "Scan for the detail." },
      },
    ],
  },
  listening: {
    caption: { zh: "连读与弱读:听并跟读这些常见组合。", en: "Linking and weak forms: listen and repeat." },
    speak: [
      { en: "a lot of", zh: "弱读 of → /əv/" },
      { en: "kind of", zh: "口语中常弱读" },
      { en: "want to → wanna", zh: "want to 口语缩约" },
      { en: "going to → gonna", zh: "going to 口语缩约" },
    ],
  },
  pronunciation: {
    caption: { zh: "点击听单词重音位置。", en: "Click to hear word stress." },
    speak: [
      { en: "photograph", zh: "重音在第一音节" },
      { en: "photography", zh: "重音在第二音节" },
      { en: "record (n.)", zh: "名词重音在前" },
      { en: "record (v.)", zh: "动词重音在后" },
    ],
  },
  past: {
    caption: { zh: "过去时态快速练习。", en: "Past tense quick quiz." },
    quiz: [
      {
        type: "fill",
        prompt: { zh: "While I ___ (walk) home, it started to rain.", en: "While I ___ (walk) home, it started to rain." },
        answer: "was walking",
        feedback: { zh: "while + 过去进行作背景。", en: "While + past continuous for background." },
      },
    ],
  },
  perfect: {
    caption: { zh: "完成时填空。", en: "Perfect tense fill-in." },
    quiz: [
      {
        type: "fill",
        prompt: { zh: "I ___ (live) here since 2020.", en: "I ___ (live) here since 2020." },
        answer: "have lived",
        feedback: { zh: "since → 现在完成。", en: "Since → present perfect." },
      },
    ],
  },
  modals: {
    caption: { zh: "情态动词选择。", en: "Modal verb choice." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "You ___ wear a seatbelt. It's the law.", en: "You ___ wear a seatbelt. It's the law." },
        options: ["can", "must", "might"],
        correct: 1,
        feedback: { zh: "must = 必须(规则)。", en: "Must = obligation (law/rule)." },
      },
    ],
  },
  clauses: {
    caption: { zh: "从句连接练习。", en: "Clause connection practice." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "The book ___ I borrowed is due tomorrow.", en: "The book ___ I borrowed is due tomorrow." },
        options: ["who", "which", "where"],
        correct: 1,
        feedback: { zh: "先行词 book → which/that。", en: "Book takes which/that." },
      },
    ],
  },
  passive: {
    caption: { zh: "被动语态填空。", en: "Passive voice fill-in." },
    quiz: [
      {
        type: "fill",
        prompt: { zh: "The report ___ (write) last week.", en: "The report ___ (write) last week." },
        answer: "was written",
        feedback: { zh: "过去被动:was/were + past participle。", en: "Past passive: was/were + past participle." },
      },
    ],
  },
  reported: {
    caption: { zh: "间接引语转换。", en: "Reported speech conversion." },
    quiz: [
      {
        type: "fill",
        prompt: { zh: "She said she ___ (be) tired. (direct: \"I am tired.\")", en: "She said she ___ (be) tired." },
        answer: "was",
        feedback: { zh: "am → was (backshift)。", en: "Am → was (backshift)." },
      },
    ],
  },
  cloze: {
    caption: { zh: "完形填空:靠上下文逻辑选词。", en: "Cloze: choose by context and logic." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "The plan sounds good; ___, it may cost too much.", en: "The plan sounds good; ___, it may cost too much." },
        options: ["therefore", "however", "moreover"],
        correct: 1,
        feedback: { zh: "前后转折 → however。", en: "Contrast → however." },
      },
      {
        type: "mc",
        prompt: { zh: "He failed twice ___ finally succeeded.", en: "He failed twice ___ finally succeeded." },
        options: ["but", "so", "because"],
        correct: 0,
        feedback: { zh: "失败与成功对立 → but。", en: "Failure vs success → but." },
      },
    ],
  },
  clozeworkfree: {
    caption: { zh: "完形真题自测:20 空,凭上下文逻辑与搭配选;做完看下方「讲义」中的逐题解析。", en: "Real cloze self-test: 20 blanks — choose by context and collocation, then read the walkthrough in Notes." },
    quiz: [
      { type: "mc", prompt: { zh: "(1) …activists once again ___ that technology be replacing human workers.", en: "(1) …activists once again ___ that technology be replacing human workers." }, options: ["boasting", "denying", "warning", "ensuring"], correct: 2, feedback: { zh: "warning:全段是担忧口吻;boast 相反、deny 矛盾、ensure 不通。", en: "warning — the passage is worried; boast is opposite, deny contradicts, ensure is illogical." } },
      { type: "mc", prompt: { zh: "(2) The coming work-free world will be defined by ___. (few own all capital, masses in poverty)", en: "(2) The coming work-free world will be defined by ___. (few own all capital, masses in poverty)" }, options: ["inequality", "instability", "unreliability", "uncertainty"], correct: 0, feedback: { zh: "少数富人+大众贫困 = 不平等。", en: "few own all, masses poor = inequality." } },
      { type: "mc", prompt: { zh: "(3) A different, not mutually exclusive ___ holds that the future will be a wasteland…", en: "(3) A different, not mutually exclusive ___ holds that the future will be a wasteland…" }, options: ["policy", "guideline", "resolution", "prediction"], correct: 3, feedback: { zh: "与前一种设想并列;holds that the future will be… 只能是『预测』。", en: "parallels the first vision; only a prediction can 'hold that the future will be…'." } },
      { type: "mc", prompt: { zh: "(4) …a wasteland of a different sort, one ___ by purposelessness.", en: "(4) …a wasteland of a different sort, one ___ by purposelessness." }, options: ["characterized", "divided", "balanced", "measured"], correct: 0, feedback: { zh: "be characterized by = 以…为特征(固定搭配)。", en: "be characterized by = marked/defined by (fixed)." } },
      { type: "mc", prompt: { zh: "(5) Without jobs to give their lives ___, people become lazy and depressed.", en: "(5) Without jobs to give their lives ___, people become lazy and depressed." }, options: ["wisdom", "meaning", "glory", "freedom"], correct: 1, feedback: { zh: "give one's life meaning = 赋予生活意义。", en: "give one's life meaning." } },
      { type: "mc", prompt: { zh: "(6) ___, today's unemployed don't seem to be having a great time.", en: "(6) ___, today's unemployed don't seem to be having a great time." }, options: ["Instead", "Indeed", "Thus", "Nevertheless"], correct: 1, feedback: { zh: "举证印证上句 → Indeed;Instead/Nevertheless 需转折,Thus 非因果。", en: "evidence backs the claim → Indeed; the others need contrast or cause." } },
      { type: "mc", prompt: { zh: "(7) …double the rate for ___ Americans (vs. the unemployed).", en: "(7) …double the rate for ___ Americans (vs. the unemployed)." }, options: ["rich", "urban", "working", "educated"], correct: 2, feedback: { zh: "与 unemployed 对比 → 在职者。", en: "contrast with unemployed → working." } },
      { type: "mc", prompt: { zh: "(8) …the ___ for rising mortality / mental-health / addiction is shortage of well-paid jobs.", en: "(8) …the ___ for rising mortality / mental-health / addiction is shortage of well-paid jobs." }, options: ["explanation", "requirement", "compensation", "substitute"], correct: 0, feedback: { zh: "the explanation for … is … = ……的原因是……。", en: "the explanation for … is …." } },
      { type: "mc", prompt: { zh: "(9) …and addiction ___ poorly-educated middle-aged people.", en: "(9) …and addiction ___ poorly-educated middle-aged people." }, options: ["under", "beyond", "alongside", "among"], correct: 3, feedback: { zh: "among = 在(某人群)当中。", en: "among = within a group." } },
      { type: "mc", prompt: { zh: "(10) Perhaps this is why many ___ the agonizing dullness of a jobless future.", en: "(10) Perhaps this is why many ___ the agonizing dullness of a jobless future." }, options: ["leave behind", "make up", "worry about", "set aside"], correct: 2, feedback: { zh: "承接前文负面 → 担忧。", en: "after the negatives → worry about." } },
      { type: "mc", prompt: { zh: "(11) But it doesn't ___ follow that a world without work would be full of unease.", en: "(11) But it doesn't ___ follow that a world without work would be full of unease." }, options: ["statistically", "occasionally", "necessarily", "economically"], correct: 2, feedback: { zh: "it doesn't necessarily follow that…(固定;全文转折关键)。", en: "it doesn't necessarily follow that… (fixed; the hinge)." } },
      { type: "mc", prompt: { zh: "(12) Such visions are based on the ___ of being unemployed in a job-centered society.", en: "(12) Such visions are based on the ___ of being unemployed in a job-centered society." }, options: ["chances", "downsides", "benefits", "principles"], correct: 1, feedback: { zh: "依据失业的『弊端』,下文随即反驳;benefits 相反。", en: "based on the downsides of joblessness; benefits is the opposite." } },
      { type: "mc", prompt: { zh: "(13) In the ___ of work, a society designed with other ends could…", en: "(13) In the ___ of work, a society designed with other ends could…" }, options: ["absence", "height", "face", "course"], correct: 0, feedback: { zh: "in the absence of = 在没有…的情况下。", en: "in the absence of = without." } },
      { type: "mc", prompt: { zh: "(14) …could ___ strikingly different circumstances for labor and leisure.", en: "(14) …could ___ strikingly different circumstances for labor and leisure." }, options: ["disturb", "restore", "exclude", "yield"], correct: 3, feedback: { zh: "yield = 产生/带来(结果)。", en: "yield = produce/bring about." } },
      { type: "mc", prompt: { zh: "(15) Today, the ___ of work may be a bit overblown.", en: "(15) Today, the ___ of work may be a bit overblown." }, options: ["model", "practice", "virtue", "hardship"], correct: 2, feedback: { zh: "the virtue of work = 工作的价值(被高估);下文打脸。hardship 会与引文矛盾。", en: "the virtue of work (overblown); the quote deflates it. hardship contradicts the quote." } },
      { type: "mc", prompt: { zh: "(16) …because leisure time is relatively ___ for most workers…", en: "(16) …because leisure time is relatively ___ for most workers…" }, options: ["tricky", "lengthy", "mysterious", "scarce"], correct: 3, feedback: { zh: "闲暇『稀缺』才需抵消工作消耗;lengthy 相反。", en: "leisure is scarce; lengthy is the opposite." } },
      { type: "mc", prompt: { zh: "(17) …counterbalance the intellectual and emotional ___ of their jobs.", en: "(17) …counterbalance the intellectual and emotional ___ of their jobs." }, options: ["demands", "standards", "qualities", "threats"], correct: 0, feedback: { zh: "the intellectual and emotional demands = 智力与情感上的要求/压力。", en: "the intellectual and emotional demands of a job." } },
      { type: "mc", prompt: { zh: "(18) When I come home from a hard day's work, I often feel ___.", en: "(18) When I come home from a hard day's work, I often feel ___." }, options: ["ignored", "tired", "confused", "starved"], correct: 1, feedback: { zh: "辛苦一天→累;与『不工作会不同』对照。", en: "hard day → tired; contrasts with 'a work-free life would differ'." } },
      { type: "mc", prompt: { zh: "(19) …different enough to throw himself ___ a hobby or a passion project.", en: "(19) …different enough to throw himself ___ a hobby or a passion project." }, options: ["off", "against", "behind", "into"], correct: 3, feedback: { zh: "throw oneself into = 全身心投入。", en: "throw oneself into = commit fully." } },
      { type: "mc", prompt: { zh: "(20) …with the intensity usually reserved for ___ matters.", en: "(20) …with the intensity usually reserved for ___ matters." }, options: ["technological", "professional", "educational", "interpersonal"], correct: 1, feedback: { zh: "留给『工作正事』的强度 → professional;工作 vs 爱好对照。", en: "intensity saved for work → professional; a work-vs-hobby contrast." } },
    ],
  },
  kyreading: {
    caption: { zh: "考研阅读:题型与解法快测。", en: "Kaoyan reading: question types quick check." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "问「main idea of the passage」属于哪类题?", en: "\"Main idea of the passage\" is which type?" },
        options: ["细节题 Detail", "主旨题 Main idea", "词义题 Vocabulary"],
        correct: 1,
        feedback: { zh: "考全文中心 → 主旨题。", en: "Overall point → main idea." },
      },
      {
        type: "mc",
        prompt: { zh: "Part B 七选五主要考:", en: "Part B gapped text mainly tests:" },
        options: ["段落间逻辑连贯", "单词拼写", "语法改错"],
        correct: 0,
        feedback: { zh: "靠上下衔接与代词/连接词。", en: "Cohesion via reference and connectors." },
      },
    ],
  },
  translation: {
    caption: { zh: "英译汉:先拆结构,再调语序。", en: "Translation: parse first, then reorder." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "定语从句 \"the book which I bought\" 常译为:", en: "\"the book which I bought\" is best rendered as:" },
        options: ["书,我买的那个", "我买的书", "书哪个我买"],
        correct: 1,
        feedback: { zh: "较短定语从句前置译。", en: "Short relative clause → pre-positioned." },
      },
      {
        type: "fill",
        prompt: { zh: "被动 \"It is said that…\" 常译作「据___」。", en: "Passive \"It is said that…\" → 据___" },
        answer: "说",
        feedback: { zh: "It is said that → 据说。", en: "It is said that → 据说 (it is said)." },
      },
    ],
  },
  kywriting: {
    caption: { zh: "写作:分清应用文与图画作文。", en: "Writing: letter vs picture essay." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "小作文(约 100 词)通常是:", en: "The short essay (~100 words) is usually:" },
        options: ["图画议论文", "应用文(书信/通知)", "翻译"],
        correct: 1,
        feedback: { zh: "小作文考应用文。", en: "Short essay = practical writing." },
      },
      {
        type: "mc",
        prompt: { zh: "大作文图画作文常用几段式?", en: "The picture essay commonly uses how many paragraphs?" },
        options: ["一段", "三段(描述-分析-总结)", "五段"],
        correct: 1,
        feedback: { zh: "描述图画→分析原因/意义→总结建议。", en: "Describe → analyze → conclude." },
      },
    ],
  },

  /* ---- E3 Vocabulary ---- */
  wordform: {
    caption: { zh: "构词法:前后缀翻卡记忆 + 词性转换自测。", en: "Word formation: flip affix cards, then test word class." },
    cards: [
      { word: "un-", pos: "prefix", phon: "/ʌn/", gloss: { zh: "否定:un + 形容词 → 相反义", en: "negation: unhappy, unfair" }, example: "happy → unhappy" },
      { word: "-tion", pos: "suffix", phon: "/ʃən/", gloss: { zh: "动词→名词", en: "verb → noun" }, example: "educate → education" },
      { word: "-able", pos: "suffix", phon: "/əbl/", gloss: { zh: "动词→形容词:「可…的」", en: "verb → adj: 'able to be'" }, example: "read → readable" },
      { word: "re-", pos: "prefix", phon: "/riː/", gloss: { zh: "再、重新", en: "again" }, example: "write → rewrite" },
      { word: "-ment", pos: "suffix", phon: "/mənt/", gloss: { zh: "动词→名词", en: "verb → noun" }, example: "develop → development" },
      { word: "-ize", pos: "suffix", phon: "/aɪz/", gloss: { zh: "形/名→动词:「使…化」", en: "adj/noun → verb" }, example: "modern → modernize" },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "\"decide\" 的名词形式是:", en: "The noun form of \"decide\" is:" },
        options: ["decidement", "decision", "deciding"],
        correct: 1,
        feedback: { zh: "decide → decision。", en: "decide → decision." },
      },
      {
        type: "fill",
        prompt: { zh: "加前缀表否定: ___possible = 不可能的", en: "Add a prefix for negation: ___possible = not possible" },
        answer: "im",
        feedback: { zh: "possible → impossible(p 前用 im-)。", en: "possible → impossible (im- before p)." },
      },
      {
        type: "mc",
        prompt: { zh: "\"care\" + 后缀,表示「粗心的」:", en: "\"care\" + suffix meaning 'without care':" },
        options: ["careful", "careless", "caring"],
        correct: 1,
        feedback: { zh: "-less 表「没有」。", en: "-less means 'without'." },
      },
      {
        type: "fill",
        prompt: { zh: "把 \"strong\" 变成名词: ___", en: "Turn \"strong\" into a noun: ___" },
        answer: "strength",
        feedback: { zh: "strong → strength(不规则)。", en: "strong → strength (irregular)." },
      },
    ],
  },
  register: {
    caption: { zh: "同义词与语域:正式 vs 非正式选词。", en: "Synonyms & register: formal vs informal." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "正式邮件里「想要」最合适:", en: "Most formal for 'want' in an email:" },
        options: ["wanna", "want", "would like"],
        correct: 2,
        feedback: { zh: "would like 更正式礼貌。", en: "'Would like' is more formal and polite." },
      },
      {
        type: "mc",
        prompt: { zh: "\"kids\" 的正式对应词:", en: "The formal equivalent of \"kids\":" },
        options: ["children", "guys", "folks"],
        correct: 0,
        feedback: { zh: "children 中性/正式。", en: "'Children' is neutral/formal." },
      },
      {
        type: "mc",
        prompt: { zh: "论文里「get」应换成:", en: "In an essay, replace \"get\" with:" },
        options: ["obtain", "grab", "snag"],
        correct: 0,
        feedback: { zh: "obtain 更书面。", en: "'Obtain' is more academic." },
      },
      {
        type: "mc",
        prompt: { zh: "口语中最自然的道歉:", en: "Most natural spoken apology:" },
        options: ["I express my regret.", "Sorry about that.", "I hereby apologize."],
        correct: 1,
        feedback: { zh: "口语用简短自然表达。", en: "Speech prefers short, natural phrasing." },
      },
    ],
  },
  idioms: {
    caption: { zh: "习语:翻卡记整体义,勿逐字翻译。", en: "Idioms: learn as chunks, not word by word." },
    cards: [
      { word: "break the ice", pos: "idiom", phon: "", gloss: { zh: "打破僵局;活跃气氛", en: "ease initial tension" }, example: "A joke helped break the ice at the meeting." },
      { word: "a piece of cake", pos: "idiom", phon: "", gloss: { zh: "小菜一碟;非常容易", en: "very easy" }, example: "The test was a piece of cake." },
      { word: "hit the books", pos: "idiom", phon: "", gloss: { zh: "用功学习", en: "study hard" }, example: "Exams are near — time to hit the books." },
      { word: "under the weather", pos: "idiom", phon: "", gloss: { zh: "身体不适", en: "feeling ill" }, example: "I'm a bit under the weather today." },
      { word: "cost an arm and a leg", pos: "idiom", phon: "", gloss: { zh: "非常昂贵", en: "very expensive" }, example: "That car cost an arm and a leg." },
    ],
    scenes: [
      {
        situation: { zh: "同事聊刚做完的汇报", en: "Coworkers chatting after a presentation" },
        lines: [
          { who: "A", en: "So how'd the big presentation go?", zh: "那场大汇报怎么样?" },
          { who: "B", en: "Honestly? It was a piece of cake. I worried for nothing.", zh: "说真的?小菜一碟。白担心了。", note: { zh: "\"a piece of cake\" = 很容易;\"for nothing\" = 白费。", en: "\"a piece of cake\" = very easy; \"for nothing\" = pointlessly." } },
          { who: "A", en: "See? I told you. You just had cold feet.", zh: "看吧?我就说。你只是临阵怯场了。", note: { zh: "\"have cold feet\" = 临时胆怯、打退堂鼓。", en: "\"have cold feet\" = lose your nerve at the last minute." } },
          { who: "B", en: "Yeah, I need to stop overthinking. I was up all night for nothing.", zh: "是啊,我得别再想太多了。熬了一整夜全白搭。" },
        ],
      },
      {
        situation: { zh: "劝累坏的朋友歇一歇", en: "Telling a worn-out friend to rest" },
        lines: [
          { who: "A", en: "You look wiped out. You okay?", zh: "你看着累坏了。还好吗?", note: { zh: "\"wiped out\" = 精疲力竭。", en: "\"wiped out\" = totally exhausted." } },
          { who: "B", en: "I'm beat. I've been burning the candle at both ends all week.", zh: "累趴了。我这一周都在连轴转。", note: { zh: "\"burn the candle at both ends\" = 过度操劳、日夜连轴。", en: "\"burn the candle at both ends\" = overwork, day and night." } },
          { who: "A", en: "You should take it easy this weekend.", zh: "这周末你该放松放松。", note: { zh: "\"take it easy\" = 别太拼、放轻松。", en: "\"take it easy\" = relax, don't push yourself." } },
          { who: "B", en: "Trust me, I'm not going to lift a finger.", zh: "放心,我啥也不干。", note: { zh: "\"not lift a finger\" = 一点力都不出。", en: "\"not lift a finger\" = do nothing at all." } },
        ],
      },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "\"It's a piece of cake\" 意思是:", en: "\"It's a piece of cake\" means:" },
        options: ["很好吃", "很容易", "很贵"],
        correct: 1,
        feedback: { zh: "= 非常容易。", en: "= very easy." },
      },
      {
        type: "mc",
        prompt: { zh: "感觉「身体不舒服」用哪个习语?", en: "Which idiom means 'feeling ill'?" },
        options: ["under the weather", "over the moon", "on cloud nine"],
        correct: 0,
        feedback: { zh: "under the weather = 不舒服。", en: "Under the weather = unwell." },
      },
      {
        type: "mc",
        prompt: { zh: "\"break the ice\" 在会议开场指:", en: "\"Break the ice\" at a meeting means:" },
        options: ["制造冲突", "缓和气氛、打开话题", "结束会议"],
        correct: 1,
        feedback: { zh: "缓和初始紧张。", en: "Ease initial tension." },
      },
    ],
  },

  /* ---- E4 Reading ---- */
  inference: {
    caption: { zh: "推理与语气:读出言外之意。", en: "Inference & tone: read between the lines." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "\"She forced a smile.\" 暗示她:", en: "\"She forced a smile\" implies she was:" },
        options: ["很开心", "并不真开心", "很生气到发抖"],
        correct: 1,
        feedback: { zh: "forced 暗示勉强、不情愿。", en: "'Forced' implies reluctance." },
      },
      {
        type: "mc",
        prompt: { zh: "作者用大量讽刺语言,其态度多半是:", en: "Heavy irony usually signals the author is:" },
        options: ["赞同", "批评", "中立"],
        correct: 1,
        feedback: { zh: "讽刺常表隐含批评。", en: "Irony often marks implicit criticism." },
      },
      {
        type: "mc",
        prompt: { zh: "\"Some claim it works, but no data supports this.\" 作者语气:", en: "Tone of \"...but no data supports this\":" },
        options: ["怀疑", "热情", "羡慕"],
        correct: 0,
        feedback: { zh: "指出缺乏证据 → 怀疑。", en: "Points out lack of evidence → skeptical." },
      },
      {
        type: "mc",
        prompt: { zh: "区分事实与观点,哪句是观点?", en: "Which is an opinion, not a fact?" },
        options: ["Water boils at 100°C.", "This is the best film of the year.", "The store opens at 9."],
        correct: 1,
        feedback: { zh: "\"best\" 是主观评价。", en: "'Best' is subjective." },
      },
    ],
  },
  academic: {
    caption: { zh: "学术阅读:结构与论证。", en: "Academic reading: structure and argument." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "IMRaD 中 \"M\" 指:", en: "In IMRaD, \"M\" stands for:" },
        options: ["Motivation", "Methods", "Meaning"],
        correct: 1,
        feedback: { zh: "Introduction-Methods-Results-Discussion。", en: "Introduction-Methods-Results-Discussion." },
      },
      {
        type: "mc",
        prompt: { zh: "论文摘要(abstract)主要作用是:", en: "The main purpose of an abstract is to:" },
        options: ["概述全文要点", "列出参考文献", "致谢"],
        correct: 0,
        feedback: { zh: "摘要浓缩全文。", en: "It summarizes the whole paper." },
      },
      {
        type: "mc",
        prompt: { zh: "遇到不认识的术语,高效做法是:", en: "For an unknown technical term, the efficient move is:" },
        options: ["立刻查每个词", "先看能否从上下文推断,不打断论证", "跳过整段"],
        correct: 1,
        feedback: { zh: "跟论证,靠语境。", en: "Follow the argument; use context." },
      },
      {
        type: "mc",
        prompt: { zh: "\"thesis statement\" 指:", en: "A \"thesis statement\" is:" },
        options: ["文章的核心主张", "一个例子", "结论中的致谢"],
        correct: 0,
        feedback: { zh: "全文中心论点。", en: "The central claim of the text." },
      },
    ],
  },
  news: {
    caption: { zh: "新闻与长文:体裁决定读法。", en: "News & long-form: genre shapes reading." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "「倒金字塔」把最重要信息放在:", en: "The inverted pyramid puts the most important info:" },
        options: ["开头", "中间", "结尾"],
        correct: 0,
        feedback: { zh: "导语先给核心事实。", en: "The lead gives key facts first." },
      },
      {
        type: "mc",
        prompt: { zh: "新闻导语(lead)通常回答:", en: "A news lead usually answers:" },
        options: ["5W1H", "作者生平", "广告信息"],
        correct: 0,
        feedback: { zh: "who/what/when/where/why/how。", en: "Who, what, when, where, why, how." },
      },
      {
        type: "mc",
        prompt: { zh: "op-ed 属于:", en: "An op-ed is:" },
        options: ["客观消息", "署名评论/观点", "分类广告"],
        correct: 1,
        feedback: { zh: "评论版观点文章。", en: "An opinion/commentary piece." },
      },
      {
        type: "mc",
        prompt: { zh: "核查来源可靠性,应看:", en: "To check source reliability, look at:" },
        options: ["标题是否吸睛", "出处、作者与佐证", "字数多少"],
        correct: 1,
        feedback: { zh: "看出处、作者与证据。", en: "Check origin, author and evidence." },
      },
    ],
  },

  /* ---- E5 Writing ---- */
  paragraph: {
    caption: { zh: "段落结构:一段一个中心。", en: "Paragraph structure: one idea per paragraph." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "主题句(topic sentence)通常位于:", en: "A topic sentence usually appears:" },
        options: ["段末", "段首", "全文最后"],
        correct: 1,
        feedback: { zh: "多数在段首点明中心。", en: "Usually opens the paragraph." },
      },
      {
        type: "mc",
        prompt: { zh: "TEEL 中第二个 E 指:", en: "In TEEL, the second E stands for:" },
        options: ["Example", "Emotion", "Ending"],
        correct: 0,
        feedback: { zh: "Topic-Explain-Example-Link。", en: "Topic-Explain-Example-Link." },
      },
      {
        type: "mc",
        prompt: { zh: "表示「此外」增加论据的连接词:", en: "Linker to add a point ('furthermore'):" },
        options: ["However", "Moreover", "Therefore"],
        correct: 1,
        feedback: { zh: "Moreover/Furthermore 表递进。", en: "Moreover/Furthermore add points." },
      },
      {
        type: "mc",
        prompt: { zh: "一段里出现两个不相关中心,应:", en: "If a paragraph has two unrelated ideas, you should:" },
        options: ["拆成两段", "加更多例子", "删掉主题句"],
        correct: 0,
        feedback: { zh: "一段一个中心 → 拆分。", en: "One idea per paragraph → split." },
      },
    ],
  },
  essay: {
    caption: { zh: "议论文:立场、论据、反驳。", en: "Argumentative essays: claim, evidence, rebuttal." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "议论文引言的核心是:", en: "The core of an argumentative intro is:" },
        options: ["讲个笑话", "明确的 thesis(立场)", "列全部数据"],
        correct: 1,
        feedback: { zh: "引言要亮明立场。", en: "State your thesis." },
      },
      {
        type: "mc",
        prompt: { zh: "\"counterargument\" 指:", en: "A \"counterargument\" is:" },
        options: ["支持己方的例子", "对立观点(再加以反驳)", "结论重复"],
        correct: 1,
        feedback: { zh: "先列对立观点再反驳更有力。", en: "Address the opposing view, then rebut." },
      },
      {
        type: "mc",
        prompt: { zh: "以偏概全属于哪类问题?", en: "Hasty generalization is a kind of:" },
        options: ["逻辑谬误", "拼写错误", "标点错误"],
        correct: 0,
        feedback: { zh: "属逻辑谬误。", en: "It's a logical fallacy." },
      },
      {
        type: "mc",
        prompt: { zh: "好的结论应当:", en: "A good conclusion should:" },
        options: ["原样重复引言", "总结并升华,不引入全新论点", "第一次给出 thesis"],
        correct: 1,
        feedback: { zh: "总结提升,不堆新论点。", en: "Synthesize; don't add brand-new points." },
      },
    ],
  },
  business: {
    caption: { zh: "商务写作:礼貌、清楚、有行动项。", en: "Business writing: polite, clear, actionable." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "正式商务邮件的开头最合适:", en: "Best opening for a formal business email:" },
        options: ["Hey!", "Dear Mr. Smith,", "Yo"],
        correct: 1,
        feedback: { zh: "Dear + 姓氏,正式。", en: "Dear + surname is formal." },
      },
      {
        type: "mc",
        prompt: { zh: "礼貌请求最佳表达:", en: "Most polite request:" },
        options: ["Send me the file.", "Could you please send me the file?", "File. Now."],
        correct: 1,
        feedback: { zh: "Could you please… 更礼貌。", en: "'Could you please…' is polite." },
      },
      {
        type: "mc",
        prompt: { zh: "邮件应尽早说明:", en: "An email should state early:" },
        options: ["天气", "目的与所需行动", "个人爱好"],
        correct: 1,
        feedback: { zh: "先讲目的和 action items。", en: "State purpose and action items first." },
      },
      {
        type: "mc",
        prompt: { zh: "正式结尾语选:", en: "Formal sign-off:" },
        options: ["Cya", "Best regards,", "lol"],
        correct: 1,
        feedback: { zh: "Best regards / Yours sincerely。", en: "Best regards / Yours sincerely." },
      },
    ],
  },
  editing: {
    caption: { zh: "修改与连贯:自己当编辑。", en: "Editing & coherence: be your own editor." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "\"In my personal opinion, I think that…\" 问题是:", en: "\"In my personal opinion, I think that…\" is:" },
        options: ["太正式", "冗余重复", "语法错误"],
        correct: 1,
        feedback: { zh: "opinion/think 重复,删冗余。", en: "Redundant — trim it." },
      },
      {
        type: "mc",
        prompt: { zh: "修改应先关注:", en: "Revision should first address:" },
        options: ["逗号", "内容与结构", "字体"],
        correct: 1,
        feedback: { zh: "先大后小:内容→结构→语言。", en: "Big to small: content → structure → language." },
      },
      {
        type: "fill",
        prompt: { zh: "精简: \"due to the fact that\" → 一个词 ___", en: "Trim: \"due to the fact that\" → one word ___" },
        answer: "because",
        feedback: { zh: "= because。", en: "= because." },
      },
      {
        type: "mc",
        prompt: { zh: "检查代词指代不清,最好:", en: "To catch unclear pronoun reference, best to:" },
        options: ["朗读全文", "只查拼写", "换字体"],
        correct: 0,
        feedback: { zh: "朗读能发现拗口与歧义。", en: "Reading aloud reveals ambiguity." },
      },
    ],
  },

  /* ---- E6 Listening ---- */
  lectures: {
    caption: { zh: "讲座:抓信号词与要点。", en: "Lectures: catch signposts and key points." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "\"Today I'll cover three points…\" 属于:", en: "\"Today I'll cover three points…\" is a:" },
        options: ["结论", "roadmap/预告结构", "例子"],
        correct: 1,
        feedback: { zh: "开场预告讲座结构。", en: "It previews the lecture structure." },
      },
      {
        type: "mc",
        prompt: { zh: "\"For example / for instance\" 提示接下来是:", en: "\"For example\" signals what follows is:" },
        options: ["核心定义", "举例说明", "反对意见"],
        correct: 1,
        feedback: { zh: "举例信号词。", en: "Example marker." },
      },
      {
        type: "mc",
        prompt: { zh: "听讲座时应重点记:", en: "While listening to a lecture, focus notes on:" },
        options: ["每个词", "主旨、要点与例证关系", "讲者的口头禅"],
        correct: 1,
        feedback: { zh: "抓结构与要点。", en: "Capture structure and key points." },
      },
      {
        type: "mc",
        prompt: { zh: "\"To sum up…\" 出现,说明:", en: "\"To sum up…\" indicates:" },
        options: ["开场", "总结要点", "举新例"],
        correct: 1,
        feedback: { zh: "总结信号词。", en: "Summary signal." },
      },
    ],
  },
  accents: {
    caption: { zh: "口音与语流:先听常见弱读/缩约,再自测。", en: "Accents & fast speech: hear reductions, then test." },
    speak: [
      { en: "What do you want?", zh: "口语常听成 whaddaya want" },
      { en: "I don't know.", zh: "常缩成 I dunno" },
      { en: "Did you eat?", zh: "常听成 didja eat" },
      { en: "a cup of tea", zh: "of 弱读为 /ə/" },
    ],
    scenes: [
      {
        situation: { zh: "快语流真实对话(连读与缩约)", en: "Fast, casual speech (reductions and contractions)" },
        lines: [
          { who: "A", en: "Whatcha doin' this weekend?", zh: "这周末你干嘛?", note: { zh: "\"whatcha\" = what are you;\"doin'\" 省略 g。", en: "\"Whatcha\" = what are you; \"doin'\" drops the g." } },
          { who: "B", en: "Dunno yet. Probably gonna chill. You?", zh: "还不知道。大概就躺平吧。你呢?", note: { zh: "\"dunno\" = don't know;\"gonna\" = going to;\"chill\" = 放松。", en: "\"dunno\" = don't know; \"gonna\" = going to; \"chill\" = relax." } },
          { who: "A", en: "I gotta help my brother move. Wanna come? I'll buy ya pizza.", zh: "我得帮我弟搬家。想来吗?我请你吃披萨。", note: { zh: "\"gotta\" = got to;\"wanna\" = want to;\"ya\" = you。", en: "\"gotta\" = got to; \"wanna\" = want to; \"ya\" = you." } },
          { who: "B", en: "Lemme think about it — I'll letcha know.", zh: "让我想想——回头告诉你。", note: { zh: "\"lemme\" = let me;\"letcha\" = let you。", en: "\"lemme\" = let me; \"letcha\" = let you." } },
        ],
      },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "英音与美音的一个典型差异是:", en: "A typical BrE/AmE difference is:" },
        options: ["是否发词尾 r(rhotic)", "是否用大写", "是否有标点"],
        correct: 0,
        feedback: { zh: "美音多为 rhotic,英音多非 rhotic。", en: "AmE is rhotic; RP BrE is non-rhotic." },
      },
      {
        type: "mc",
        prompt: { zh: "\"gonna\" 是哪个的口语缩约?", en: "\"Gonna\" is a reduction of:" },
        options: ["going to", "got to", "gone"],
        correct: 0,
        feedback: { zh: "going to → gonna。", en: "Going to → gonna." },
      },
      {
        type: "mc",
        prompt: { zh: "听快语流时更有效的策略:", en: "Better strategy for fast speech:" },
        options: ["执着听懂每个词", "抓关键词与语境", "只看字幕"],
        correct: 1,
        feedback: { zh: "抓关键词,放下每词执念。", en: "Catch keywords; let go of every word." },
      },
    ],
  },
  notetaking: {
    caption: { zh: "听记要点:符号与缩写。", en: "Note-taking: symbols and shorthand." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "记笔记时应:", en: "When taking notes you should:" },
        options: ["逐字全记", "只记关键词与符号", "只记开头"],
        correct: 1,
        feedback: { zh: "关键词 + 符号,别逐字。", en: "Keywords + symbols, not verbatim." },
      },
      {
        type: "mc",
        prompt: { zh: "符号 \"→\" 常表示:", en: "The symbol \"→\" often means:" },
        options: ["导致/因此", "相等", "删除"],
        correct: 0,
        feedback: { zh: "→ 表导致/结果。", en: "→ leads to / therefore." },
      },
      {
        type: "fill",
        prompt: { zh: "常用缩写: \"w/\" 表示 ___", en: "Common shorthand: \"w/\" means ___" },
        answer: "with",
        feedback: { zh: "w/ = with。", en: "w/ = with." },
      },
      {
        type: "mc",
        prompt: { zh: "Cornell 笔记法把页面分为:", en: "Cornell notes divide the page into:" },
        options: ["线索栏、笔记栏、总结栏", "只有一栏", "图片栏"],
        correct: 0,
        feedback: { zh: "cue / notes / summary。", en: "Cue, notes, summary." },
      },
    ],
  },

  /* ---- E7 Speaking ---- */
  fluency: {
    caption: { zh: "流利度:填充词、改述、延展回答。", en: "Fluency: fillers, paraphrase, extended answers." },
    scenes: [
      {
        situation: { zh: "开会前的闲聊(如何把话接下去)", en: "Small talk before a meeting starts" },
        lines: [
          { who: "A", en: "So, did you catch the game last night?", zh: "话说,你昨晚看那场球了吗?", note: { zh: "\"catch\" 在这里 = 看到、赶上(节目/比赛)。", en: "Here \"catch\" = to see / watch (a show, game)." } },
          { who: "B", en: "I missed it, actually. What happened?", zh: "其实我没看。怎么了?" },
          { who: "A", en: "Oh man, you should've seen it — it came down to the last minute.", zh: "哎哟,你真该看看的——一直拖到最后一分钟才见分晓。", note: { zh: "\"you should've seen it\" 用来强调「太精彩了」。", en: "\"You should've seen it\" hypes up how great it was." } },
          { who: "B", en: "No way. I'll have to watch the highlights.", zh: "不是吧。我得去看看集锦。", note: { zh: "\"No way\" 表示惊讶(不敢相信)。", en: "\"No way\" shows surprise/disbelief." } },
          { who: "A", en: "Definitely worth it. Anyway, how's the new role treating you?", zh: "绝对值得。对了,新岗位干得还顺吗?", note: { zh: "\"how's X treating you?\" = X 进展得如何。", en: "\"How's X treating you?\" = how is X going for you." } },
        ],
      },
      {
        situation: { zh: "想不起某个词时,如何绕过去(改述)", en: "Paraphrasing when a word won't come" },
        lines: [
          { who: "A", en: "I need that thing — you know, the thing you use to open a bottle.", zh: "我要那个东西——就是,开瓶子用的那个。", note: { zh: "想不起 \"corkscrew\" 时,用简单话描述功能。", en: "Forgot \"corkscrew\"? Describe what it does." } },
          { who: "B", en: "Oh, a corkscrew? It's in the drawer.", zh: "哦,开瓶器?在抽屉里。" },
          { who: "A", en: "Yes, that's the one. Thanks — my mind went blank.", zh: "对,就是它。谢啦——我一下子脑子空白。", note: { zh: "\"my mind went blank\" = 一时想不起来。", en: "\"My mind went blank\" = I drew a blank." } },
        ],
      },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "想不起某词时,流利的做法是:", en: "When you forget a word, the fluent move is to:" },
        options: ["长时间沉默", "用别的话改述(paraphrase)", "换成母语"],
        correct: 1,
        feedback: { zh: "绕开生词,用简单话解释。", en: "Paraphrase around it." },
      },
      {
        type: "mc",
        prompt: { zh: "自然的英语填充词是:", en: "A natural English filler is:" },
        options: ["那个那个", "well / you know", "嗯…(中文)"],
        correct: 1,
        feedback: { zh: "well/you know 是英语填充语。", en: "'Well/you know' are English fillers." },
      },
      {
        type: "mc",
        prompt: { zh: "被问 \"Do you like coffee?\" 更好的回答:", en: "Better answer to \"Do you like coffee?\":" },
        options: ["Yes.", "Yes, especially in the morning — it helps me focus.", "沉默"],
        correct: 1,
        feedback: { zh: "延展回答,别单字。", en: "Extend beyond one word." },
      },
    ],
  },
  debate: {
    caption: { zh: "讨论与辩论:表达、同意、反驳。", en: "Discussion & debate: opine, agree, rebut." },
    scenes: [
      {
        situation: { zh: "团队讨论:如何礼貌地表示不同意见", en: "Team discussion: disagreeing without friction" },
        lines: [
          { who: "A", en: "I think we should just push the deadline back a week.", zh: "我觉得我们干脆把截止日往后推一周。" },
          { who: "B", en: "I see where you're coming from, but that could set off a chain reaction.", zh: "我理解你的想法,但那样可能引发连锁反应。", note: { zh: "\"I see where you're coming from\" = 我明白你的出发点(先认可)。", en: "\"I see where you're coming from\" acknowledges their view first." } },
          { who: "A", en: "Fair point. So what would you suggest?", zh: "有道理。那你有什么建议?", note: { zh: "\"Fair point\" = 说得对(让步)。", en: "\"Fair point\" = you make a valid point." } },
          { who: "B", en: "Maybe we trim the scope instead of moving the date?", zh: "要不我们缩小范围,而不是改日期?" },
          { who: "A", en: "Hmm, I'm not totally sold, but let's hear it out.", zh: "嗯,我还没完全被说服,不过咱们听你说完。", note: { zh: "\"I'm not totally sold\" = 我还不太信服;\"hear it out\" = 把话听完。", en: "\"I'm not totally sold\" = not fully convinced; \"hear it out\" = listen fully." } },
        ],
      },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "礼貌地表示不同意:", en: "Politely disagree:" },
        options: ["You're wrong.", "I see your point, but I think…", "That's stupid."],
        correct: 1,
        feedback: { zh: "先认可再表达异议。", en: "Acknowledge, then differ." },
      },
      {
        type: "mc",
        prompt: { zh: "引出个人观点的句型:", en: "Frame to give your opinion:" },
        options: ["As far as I'm concerned,", "Full stop.", "The end."],
        correct: 0,
        feedback: { zh: "观点引导句型。", en: "An opinion frame." },
      },
      {
        type: "mc",
        prompt: { zh: "「部分同意」怎么说?", en: "How to partly agree?" },
        options: ["I totally disagree.", "I agree to some extent, however…", "No comment."],
        correct: 1,
        feedback: { zh: "to some extent = 部分同意。", en: "'To some extent' = partial agreement." },
      },
      {
        type: "mc",
        prompt: { zh: "小组讨论中应:", en: "In a group discussion you should:" },
        options: ["一直说不让别人开口", "分享话轮、回应他人", "全程沉默"],
        correct: 1,
        feedback: { zh: "共享话轮,互相回应。", en: "Share the floor; respond to others." },
      },
    ],
  },
  presentation: {
    caption: { zh: "展示与汇报:结构与视觉。", en: "Presentations: structure and visuals." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "好的开场(hook)可以是:", en: "A good opening hook can be:" },
        options: ["念完整目录", "一个问题或惊人数据", "先致谢五分钟"],
        correct: 1,
        feedback: { zh: "用问题/数据抓注意。", en: "Grab attention with a question/stat." },
      },
      {
        type: "mc",
        prompt: { zh: "\"First… next… finally…\" 属于:", en: "\"First… next… finally…\" are:" },
        options: ["signposting 过渡语", "结论", "题外话"],
        correct: 0,
        feedback: { zh: "指路语,帮助听众跟随。", en: "Signposts guide the audience." },
      },
      {
        type: "mc",
        prompt: { zh: "幻灯片最佳做法:", en: "Best practice for slides:" },
        options: ["整段照念", "关键词+视觉,不照读", "全是动画"],
        correct: 1,
        feedback: { zh: "少字多讲,别照读。", en: "Keywords + visuals; don't read them." },
      },
      {
        type: "mc",
        prompt: { zh: "面对不会的提问:", en: "For a question you can't answer:" },
        options: ["假装没听见", "诚实说会后跟进", "指责提问者"],
        correct: 1,
        feedback: { zh: "诚实并承诺跟进。", en: "Be honest; offer to follow up." },
      },
    ],
  },

  /* ---- E8 Exam & Practical ---- */
  ieltstoefl: {
    caption: { zh: "雅思托福:题型与策略。", en: "IELTS/TOEFL: formats and strategy." },
    quiz: [
      {
        type: "mc",
        prompt: { zh: "雅思写作 Task 2 是:", en: "IELTS Writing Task 2 is:" },
        options: ["图表描述", "议论文/观点文", "书信"],
        correct: 1,
        feedback: { zh: "Task 2 是议论文。", en: "Task 2 is an argument essay." },
      },
      {
        type: "mc",
        prompt: { zh: "托福是机考且含:", en: "TOEFL is computer-based and includes:" },
        options: ["综合口语/写作任务", "手写作文", "面对面口试"],
        correct: 0,
        feedback: { zh: "TOEFL 有 integrated 任务。", en: "TOEFL has integrated tasks." },
      },
      {
        type: "mc",
        prompt: { zh: "限时阅读遇到难题应:", en: "For a hard question under time pressure:" },
        options: ["死磕到底", "标记跳过,先做易题", "随便乱选全部"],
        correct: 1,
        feedback: { zh: "先易后难,回头再补。", en: "Skip and return; do easy first." },
      },
      {
        type: "mc",
        prompt: { zh: "最有效的备考是:", en: "The most effective prep is:" },
        options: ["只背技巧", "用真题限时训练+复盘", "考前一晚熬夜"],
        correct: 1,
        feedback: { zh: "真题 + 计时 + 复盘。", en: "Real tests, timing, review." },
      },
    ],
  },
  interview: {
    caption: { zh: "面试英语:STAR 与自我介绍。", en: "Interview English: STAR and self-intro." },
    scenes: [
      {
        situation: { zh: "面试开场的暖场闲聊", en: "The warm-up small talk that opens an interview" },
        lines: [
          { who: "A", en: "Thanks for coming in. Did you find the place okay?", zh: "感谢你过来。地方好找吗?", note: { zh: "面试常以轻松寒暄开场,别只回 \"yes\"。", en: "Interviews often open with light small talk — don't just say \"yes\"." } },
          { who: "B", en: "Yeah, no problem at all — your directions were spot on.", zh: "嗯,完全没问题——你给的路线很准。", note: { zh: "\"spot on\" = 完全正确、很准。", en: "\"Spot on\" = exactly right." } },
          { who: "A", en: "Great. So, tell me a little about yourself.", zh: "很好。那,先简单介绍一下你自己吧。", note: { zh: "经典开场问题,准备一段 60 秒左右的自我介绍。", en: "The classic opener — have a ~60-second self-intro ready." } },
          { who: "B", en: "Sure. So, I've spent the last few years in customer support, and lately I've been moving more into product.", zh: "好的。过去几年我一直做客户支持,最近逐渐转向产品方向。", note: { zh: "用 \"So,\" 自然开头;现在完成进行体现「一直在做」。", en: "\"So,\" eases you in; present perfect continuous shows an ongoing shift." } },
        ],
      },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "STAR 答法中的 R 指:", en: "In STAR, R stands for:" },
        options: ["Result", "Reason", "Repeat"],
        correct: 0,
        feedback: { zh: "Situation-Task-Action-Result。", en: "Situation-Task-Action-Result." },
      },
      {
        type: "mc",
        prompt: { zh: "被问缺点,较好的策略:", en: "Asked about a weakness, better to:" },
        options: ["说自己没缺点", "说真实小缺点+改进措施", "抱怨前公司"],
        correct: 1,
        feedback: { zh: "真实 + 展示成长。", en: "Real weakness + how you improve." },
      },
      {
        type: "mc",
        prompt: { zh: "面试结尾被问 \"Any questions?\" 应:", en: "At \"Any questions?\" you should:" },
        options: ["说 No", "问一两个用心的问题", "问能不能早退"],
        correct: 1,
        feedback: { zh: "准备有深度的反问。", en: "Ask thoughtful questions." },
      },
      {
        type: "mc",
        prompt: { zh: "面试后应发:", en: "After an interview, send a:" },
        options: ["thank-you email", "投诉信", "什么都不发"],
        correct: 0,
        feedback: { zh: "感谢邮件加分。", en: "A thank-you email helps." },
      },
    ],
  },
  emailmsg: {
    caption: { zh: "邮件与消息:频道不同,规矩不同。", en: "Email & messaging: channel matters." },
    scenes: [
      {
        situation: { zh: "发消息告诉朋友你要迟到(随意语体)", en: "Texting a friend that you're running late" },
        lines: [
          { who: "A", en: "hey, running like 10 min late, sorry!!", zh: "嘿,大概晚到十分钟,抱歉!!", note: { zh: "短信常省略主语和标点;\"like\" = 大约。", en: "Texts drop subjects/punctuation; \"like\" = about, roughly." } },
          { who: "B", en: "no worries, take your time", zh: "没事,不急。", note: { zh: "\"no worries\" = 没关系(很日常)。", en: "\"No worries\" = it's fine (very everyday)." } },
          { who: "A", en: "ok cool, order without me — get me whatever you're having", zh: "行,你先点吧——你吃啥给我来一份。" },
          { who: "B", en: "haha ok sounds good", zh: "哈哈行,可以。" },
        ],
      },
      {
        situation: { zh: "同一件事,正式邮件怎么写", en: "The same message, written as a formal email" },
        lines: [
          { who: null, en: "Hi Mark, I'm running a little behind and will be about ten minutes late. Apologies — please go ahead and start without me.", zh: "Mark 你好,我这边稍有耽搁,大约会晚到十分钟。抱歉——请先开始,不用等我。", note: { zh: "同样的意思,正式邮件更完整、更客气。", en: "Same idea, but the formal email is fuller and more courteous." } },
        ],
      },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "好的邮件主题行应:", en: "A good subject line is:" },
        options: ["空着", "简短且具体(如 Meeting request: Fri 3pm)", "全大写喊话"],
        correct: 1,
        feedback: { zh: "简短具体,方便检索。", en: "Short and specific." },
      },
      {
        type: "mc",
        prompt: { zh: "正式邮件里表情符号:", en: "Emojis in a formal email:" },
        options: ["随意多用", "一般避免", "必须每句一个"],
        correct: 1,
        feedback: { zh: "正式场合少用/不用。", en: "Generally avoid in formal contexts." },
      },
      {
        type: "mc",
        prompt: { zh: "催办对方回复,礼貌说法:", en: "Polite follow-up/reminder:" },
        options: ["Why no reply??", "Just following up on my previous email.", "Reply now!"],
        correct: 1,
        feedback: { zh: "用温和的 following up。", en: "Use a gentle 'following up'." },
      },
      {
        type: "mc",
        prompt: { zh: "CC 的用途是:", en: "CC is used to:" },
        options: ["让相关方知情", "隐藏收件人", "加大字号"],
        correct: 0,
        feedback: { zh: "抄送让相关人知情。", en: "Keep others informed." },
      },
    ],
  },
  pragmatics: {
    caption: { zh: "文化与语用:说得对,更要说得体。", en: "Culture & pragmatics: correct and appropriate." },
    scenes: [
      {
        situation: { zh: "在办公室请人帮个小忙", en: "Asking a colleague for a quick favor" },
        lines: [
          { who: "A", en: "Sorry to bother you — do you have a sec?", zh: "不好意思打扰一下——你有空吗?", note: { zh: "\"do you have a sec?\" = 你有一会儿时间吗(很口语)。", en: "\"Do you have a sec?\" = do you have a moment (casual)." } },
          { who: "B", en: "Sure, what's up?", zh: "当然,怎么了?" },
          { who: "A", en: "I was wondering if you could take a quick look at this before I send it.", zh: "我想问你能不能在我发出去之前帮我快速看一眼。", note: { zh: "\"I was wondering if you could…\" 是很礼貌的请求句型。", en: "\"I was wondering if you could…\" is a very polite request frame." } },
          { who: "B", en: "Yeah, no worries. Shoot it over.", zh: "行,没问题。发过来吧。", note: { zh: "\"shoot it over\" = 发过来(口语)。", en: "\"Shoot it over\" = send it to me (casual)." } },
          { who: "A", en: "You're a lifesaver, thanks.", zh: "你真是帮了大忙,谢谢!", note: { zh: "\"You're a lifesaver\" = 你救了我(夸张道谢)。", en: "\"You're a lifesaver\" = thank you so much." } },
        ],
      },
      {
        situation: { zh: "婉拒邀约", en: "Turning down an invitation politely" },
        lines: [
          { who: "A", en: "We're grabbing drinks after work — you in?", zh: "我们下班去喝一杯——你来吗?", note: { zh: "\"you in?\" = 你加入吗(很随意)。", en: "\"You in?\" = are you joining (very casual)." } },
          { who: "B", en: "I'd love to, but I've got to get home tonight. Rain check?", zh: "我很想去,但今晚得回家。改天行吗?", note: { zh: "\"I'd love to, but…\" 先软化再拒绝;\"rain check\" = 改天再约。", en: "\"I'd love to, but…\" softens the refusal; \"rain check\" = postpone." } },
          { who: "A", en: "Of course. Next time for sure.", zh: "当然。下次一定。" },
        ],
      },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "\"Can you pass the salt?\" 在餐桌上是:", en: "\"Can you pass the salt?\" at a table is:" },
        options: ["询问能力", "礼貌请求", "抱怨"],
        correct: 1,
        feedback: { zh: "间接请求,不是问能力。", en: "An indirect request, not about ability." },
      },
      {
        type: "mc",
        prompt: { zh: "英语中礼貌拒绝常先说:", en: "Polite English refusals often start with:" },
        options: ["No.", "I'd love to, but…", "Never."],
        correct: 1,
        feedback: { zh: "先软化再拒绝。", en: "Soften before declining." },
      },
      {
        type: "mc",
        prompt: { zh: "跨文化中「直接程度」:", en: "Across cultures, 'directness':" },
        options: ["各地一样", "差异明显,需调整", "无所谓"],
        correct: 1,
        feedback: { zh: "直接/间接因文化而异。", en: "Directness varies by culture." },
      },
      {
        type: "mc",
        prompt: { zh: "使用讽刺/幽默的风险在于:", en: "The risk of irony/humor is that:" },
        options: ["总是安全", "可能被误解或冒犯", "让语法更好"],
        correct: 1,
        feedback: { zh: "跨文化易被误读。", en: "Easily misread across cultures." },
      },
    ],
  },

  /* ---- E8 Travel English ---- */
  travel: {
    caption: { zh: "旅途场景:听整段或单句,注意委婉请求与地道说法。", en: "Travel scenes: play a line or the whole scene; note the soft requests and idioms." },
    scenes: [
      {
        situation: { zh: "酒店办理入住", en: "Checking in at a hotel" },
        lines: [
          { who: "A", en: "Hi, I've got a reservation under Chen.", zh: "你好,我有个预订,用的是 Chen 这个名字。", note: { zh: "\"under + 名字\" = 用某人名字预订的。", en: "\"under + name\" = the booking is in that name." } },
          { who: "B", en: "Let me pull that up… Chen, two nights, right?", zh: "我调一下记录……Chen,住两晚,对吧?", note: { zh: "\"pull that up\" = 把(记录)调出来。", en: "\"Pull that up\" = bring up the record on screen." } },
          { who: "A", en: "That's right. Any chance I could get a room on a higher floor?", zh: "没错。有没有可能给我安排高一点的楼层?", note: { zh: "\"Any chance I could…?\" 是很自然的委婉请求。", en: "\"Any chance I could…?\" is a natural, soft request." } },
          { who: "B", en: "Sure, I can bump you up to the ninth. Check-out's at eleven.", zh: "可以,我给您升到九楼。退房时间是十一点。", note: { zh: "\"bump you up\" = 往上调/升级;\"check-out\" = 退房。", en: "\"Bump you up\" = move you up; \"check-out\" = leaving/returning the room." } },
          { who: "A", en: "Perfect. Is breakfast included?", zh: "太好了。含早餐吗?" },
          { who: "B", en: "It is — seventh floor, seven to ten.", zh: "含的——七楼,七点到十点。" },
        ],
      },
      {
        situation: { zh: "迷路时问路", en: "Asking for directions when lost" },
        lines: [
          { who: "A", en: "Excuse me, I'm a bit lost. How do I get to the station from here?", zh: "打扰一下,我有点迷路了。从这儿怎么去车站?", note: { zh: "\"a bit lost\" = 有点找不着路(很日常)。", en: "\"A bit lost\" = slightly lost (very everyday)." } },
          { who: "B", en: "Oh, it's not far. Go straight down this street and take your second left.", zh: "哦,不远。顺这条街一直走,在第二个路口左转。", note: { zh: "\"take your second left\" = 在第二个路口向左拐。", en: "\"Take your second left\" = turn left at the second street." } },
          { who: "A", en: "Second left, got it. Is it walkable?", zh: "第二个路口左转,明白了。走得到吗?", note: { zh: "\"walkable\" = 步行可达的。", en: "\"Walkable\" = close enough to walk." } },
          { who: "B", en: "Yeah, ten minutes tops. You can't miss it — it's right next to a big mall.", zh: "嗯,最多十分钟。绝对找得到——就在一个大商场旁边。", note: { zh: "\"ten minutes tops\" = 最多十分钟;\"You can't miss it\" = 一定找得到(很显眼)。", en: "\"Ten minutes tops\" = ten minutes at most; \"You can't miss it\" = it's easy to find." } },
          { who: "A", en: "Great, thanks so much!", zh: "太好了,非常感谢!" },
        ],
      },
      {
        situation: { zh: "打车去机场", en: "Taking a taxi to the airport" },
        lines: [
          { who: "A", en: "Hi, could you take me to the airport, please? Terminal 2.", zh: "你好,能送我去机场吗?2 号航站楼。" },
          { who: "B", en: "Sure. Any bags for the trunk?", zh: "好的。有行李要放后备箱吗?", note: { zh: "\"trunk\"(美)= 后备箱(英式为 \"boot\")。", en: "\"Trunk\" (AmE) = the luggage space (\"boot\" in BrE)." } },
          { who: "A", en: "Just this one — I'll keep it with me. About how long will it take?", zh: "就这一件——我自己拿着。大概要多久?" },
          { who: "B", en: "This time of day? Maybe forty minutes, give or take.", zh: "这个点儿?差不多四十分钟吧,上下浮动。", note: { zh: "\"give or take\" = 大约、上下浮动。", en: "\"Give or take\" = roughly, more or less." } },
          { who: "A", en: "No rush. Do you take card?", zh: "不急。能刷卡吗?", note: { zh: "\"Do you take card?\" = 收不收卡/能刷卡吗。", en: "\"Do you take card?\" = do you accept card payment." } },
          { who: "B", en: "Card's fine.", zh: "刷卡可以。" },
        ],
      },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "\"Is it walkable?\" 是在问一个地方:", en: "\"Is it walkable?\" asks whether a place is:" },
        options: ["近到可以走过去", "值得一去", "现在开门"],
        correct: 0,
        feedback: { zh: "walkable = 步行可达。", en: "Walkable = close enough to walk to." },
      },
      {
        type: "fill",
        prompt: { zh: "酒店前台:\"I have a reservation ___ Smith.\"(用 Smith 的名字)", en: "At the desk: \"I have a reservation ___ Smith.\"" },
        answer: "under",
        feedback: { zh: "reservation under + 名字。", en: "\"Reservation under + name.\"" },
      },
      {
        type: "mc",
        prompt: { zh: "司机问 \"Any bags for the trunk?\",trunk 指:", en: "A driver asks \"Any bags for the trunk?\" — the trunk is:" },
        options: ["后备箱", "前排座位", "计价器"],
        correct: 0,
        feedback: { zh: "trunk(美)= 后备箱。", en: "Trunk (AmE) = the luggage space." },
      },
    ],
  },

  /* ---- E8 Dining & Ordering ---- */
  dining: {
    caption: { zh: "用餐场景:点单、定制、买单、上错菜——都用地道口语。", en: "Dining scenes: ordering, customizing, paying, fixing a wrong dish — all in natural English." },
    scenes: [
      {
        situation: { zh: "在餐厅点单", en: "Ordering at a restaurant" },
        lines: [
          { who: "A", en: "Hi there, can I start you off with something to drink?", zh: "你好,先给二位上点喝的?", note: { zh: "\"start you off with…\" 是服务员常用的开场。", en: "\"Start you off with…\" is a common server opener." } },
          { who: "B", en: "Just water for now, thanks. Could we get a couple more minutes?", zh: "先来点水就好,谢谢。能再给我们几分钟吗?", note: { zh: "\"a couple more minutes\" = 再多几分钟(还没想好点什么)。", en: "\"A couple more minutes\" = a bit more time to decide." } },
          { who: "A", en: "Of course, take your time. Ready to order?", zh: "当然,不着急。可以点了吗?" },
          { who: "B", en: "Yeah, I'll have the grilled salmon. Does it come with a side?", zh: "好了,我要那份烤三文鱼。配菜吗?", note: { zh: "\"I'll have…\" 是点餐最常用句;\"come with a side\" = 是否配小菜。", en: "\"I'll have…\" is the go-to ordering phrase; \"come with a side\" = include a side dish." } },
          { who: "A", en: "It comes with fries or a salad.", zh: "配薯条或沙拉。" },
          { who: "B", en: "Salad, please — and can I get the dressing on the side?", zh: "沙拉吧——酱汁能单独放吗?", note: { zh: "\"dressing on the side\" = 沙拉酱另外装、不要拌上。", en: "\"Dressing on the side\" = sauce served separately, not poured on." } },
        ],
      },
      {
        situation: { zh: "咖啡店(随意)", en: "At a coffee shop (casual)" },
        lines: [
          { who: "A", en: "Hi, what can I get for you?", zh: "你好,要点什么?", note: { zh: "\"What can I get for you?\" 是店员最常见的招呼。", en: "\"What can I get for you?\" is the most common counter greeting." } },
          { who: "B", en: "Can I get a medium latte, please? For here.", zh: "来一杯中杯拿铁,谢谢。堂食。", note: { zh: "\"for here\" = 堂食(相对 \"to go\" 外带)。", en: "\"For here\" = to eat/drink in (vs. \"to go\" = takeaway)." } },
          { who: "A", en: "Sure. Anything else?", zh: "好的。还要别的吗?" },
          { who: "B", en: "Actually, is the blueberry muffin any good?", zh: "对了,那个蓝莓马芬好吃吗?", note: { zh: "\"is it any good?\" = 好不好吃/好不好(口语征询意见)。", en: "\"Is it any good?\" = casual way to ask if something's worth it." } },
          { who: "A", en: "It's one of our best. Want me to heat it up?", zh: "是我们最受欢迎的之一。要帮您加热吗?", note: { zh: "\"heat it up\" = 加热一下。", en: "\"Heat it up\" = warm it up." } },
          { who: "B", en: "Please. And that's it, thanks.", zh: "好的。就这些,谢谢。", note: { zh: "\"that's it\" = 就这些了(点完了)。", en: "\"That's it\" = that's all (I'm done ordering)." } },
        ],
      },
      {
        situation: { zh: "上错菜,然后买单", en: "A wrong dish, then paying the bill" },
        lines: [
          { who: "A", en: "Sorry, I think there's been a mix-up — I ordered the chicken, not the beef.", zh: "不好意思,好像弄错了——我点的是鸡肉,不是牛肉。", note: { zh: "\"there's been a mix-up\" = 弄混/搞错了(很委婉)。", en: "\"There's been a mix-up\" = something got confused (polite)." } },
          { who: "B", en: "Oh, my apologies! I'll get that sorted right away.", zh: "哦,非常抱歉!我马上给您处理。", note: { zh: "\"get that sorted\" = 把问题解决好。", en: "\"Get that sorted\" = fix/handle the problem." } },
          { who: "A", en: "Thanks, no worries.", zh: "谢谢,没关系。" },
          { who: "A", en: "Could we get the check whenever you get a chance?", zh: "您方便的时候能结一下账吗?", note: { zh: "\"the check\"(美)= 账单(英式为 \"the bill\")。", en: "\"The check\" (AmE) = the bill (\"the bill\" in BrE)." } },
          { who: "B", en: "Of course. Are you paying together or separately?", zh: "当然。是一起付还是分开付?" },
          { who: "A", en: "Together, and we'll split it on two cards.", zh: "一起付,用两张卡分一下。", note: { zh: "\"split it\" = 分摊/AA;可以拆到两张卡。", en: "\"Split it\" = divide the bill (here across two cards)." } },
        ],
      },
    ],
    quiz: [
      {
        type: "mc",
        prompt: { zh: "\"For here or to go?\" 是在问你要:", en: "\"For here or to go?\" asks whether you'll:" },
        options: ["堂食还是外带", "付现金还是刷卡", "坐里面还是外面"],
        correct: 0,
        feedback: { zh: "for here = 堂食,to go = 外带。", en: "For here = eat in; to go = take away." },
      },
      {
        type: "fill",
        prompt: { zh: "美式英语要账单:\"Could we get the ___, please?\"", en: "Ask for the bill (US English): \"Could we get the ___, please?\"" },
        answer: "check",
        feedback: { zh: "美式 the check = 英式 the bill。", en: "AmE \"check\" = BrE \"bill\"." },
      },
      {
        type: "mc",
        prompt: { zh: "\"Can I get the dressing on the side?\" 意思是:", en: "\"Can I get the dressing on the side?\" means:" },
        options: ["酱汁单独放", "多加酱汁", "不要酱汁"],
        correct: 0,
        feedback: { zh: "on the side = 另外单独放。", en: "On the side = served separately." },
      },
    ],
  },
};

function PracticePanel({ config }) {
  const lang = useLang();
  const t = useT();
  if (!config) return null;
  return (
    <div className="practice" onClick={(e) => e.stopPropagation()}>
      {config.speak ? <SpeakRow items={config.speak} /> : null}
      {config.scenes ? (
        <>
          <div className="mono tiny" style={{ margin: "4px 0 8px", color: "var(--muted)" }}>{t("scene_title")}</div>
          <SceneBlock scenes={config.scenes} />
        </>
      ) : null}
      {config.cards ? (
        <>
          <div className="mono tiny" style={{ marginBottom: 8, color: "var(--muted)" }}>{t("flash_title")}</div>
          <FlashDeck cards={config.cards} />
        </>
      ) : null}
      {config.quiz ? (
        <>
          <div className="mono tiny" style={{ margin: "16px 0 8px", color: "var(--muted)" }}>{t("quiz_title")}</div>
          <QuizBlock questions={config.quiz} />
        </>
      ) : null}
      {config.caption ? <div className="practice-caption">{pick(lang, config.caption)}</div> : null}
    </div>
  );
}

function Practice({ name }) {
  const t = useT();
  const cfg = PRACTICE[name];
  if (!cfg) return <p className="practice-hint">{t("no_practice")}</p>;
  return <PracticePanel config={cfg} key={name} />;
}

window.PRACTICE = PRACTICE;
window.Practice = Practice;
window.SpeakBtn = SpeakBtn;
