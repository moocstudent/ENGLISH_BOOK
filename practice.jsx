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

/* ---- Practice configs ---- */
const PRACTICE = {
  present: {
    caption: { zh: "听一读下列例句,再完成自测。", en: "Listen to the examples, then take the quiz." },
    speak: [
      { en: "I work from home on Fridays.", zh: "我周五在家办公" },
      { en: "She is studying for her exam.", zh: "她正在为考试学习" },
      { en: "Water boils at 100°C.", zh: "水在100°C沸腾" },
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
};

function PracticePanel({ config }) {
  const lang = useLang();
  const t = useT();
  if (!config) return null;
  return (
    <div className="practice" onClick={(e) => e.stopPropagation()}>
      {config.speak ? <SpeakRow items={config.speak} /> : null}
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
