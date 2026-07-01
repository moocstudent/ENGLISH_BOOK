/* =========================================================
   App — Router · Theme · Language · Progress · Auth · Nav
   ========================================================= */

const THEME_KEY = "english_book_theme";

function useHashRoute() {
  const [hash, setHash] = React.useState(window.location.hash || "#/");
  React.useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return [hash, (h) => { window.location.hash = h; window.scrollTo({ top: 0 }); }];
}

function useProgress(user) {
  const uid = user ? user.uid : null;
  const [progress, setProgress] = React.useState({});

  React.useEffect(() => {
    if (!uid) {
      try { setProgress(JSON.parse(localStorage.getItem("english_progress__guest")) || {}); }
      catch (e) { setProgress({}); }
      return;
    }
    let ref = null, handler = null, alive = true;
    (async () => {
      const ok = await window.__FIREBASE_READY__;
      if (!alive) return;
      if (!ok || typeof firebase === "undefined" || !firebase.database) {
        try { setProgress(JSON.parse(localStorage.getItem("english_progress__" + uid)) || {}); }
        catch (e) { setProgress({}); }
        return;
      }
      ref = firebase.database().ref("english_progress/" + uid);
      handler = ref.on("value",
        (snap) => { if (alive) setProgress(snap.val() || {}); },
        (err) => console.error("[progress] read failed:", err && err.code));
    })();
    return () => { alive = false; if (ref && handler) ref.off("value", handler); };
  }, [uid]);

  const toggle = (id) => {
    if (!uid || typeof firebase === "undefined" || !firebase.database) {
      setProgress((p) => {
        const next = { ...p };
        if (next[id]) delete next[id]; else next[id] = true;
        try { localStorage.setItem(uid ? "english_progress__" + uid : "english_progress__guest", JSON.stringify(next)); } catch (e) {}
        return next;
      });
      return;
    }
    const turningOff = !!progress[id];
    setProgress((p) => {
      const next = { ...p };
      if (turningOff) delete next[id]; else next[id] = true;
      return next;
    });
    firebase.database().ref("english_progress/" + uid + "/" + id).set(turningOff ? null : true)
      .catch((e) => {
        console.error("[progress] write failed:", e && e.code);
        setProgress((p) => {
          const next = { ...p };
          if (turningOff) next[id] = true; else delete next[id];
          return next;
        });
      });
  };

  return [progress, toggle];
}

function useBookmarks(user) {
  const uid = user ? user.uid : null;
  const [bookmarks, setBookmarks] = React.useState({});

  React.useEffect(() => {
    if (!uid) {
      try { setBookmarks(JSON.parse(localStorage.getItem("english_bookmarks__guest")) || {}); }
      catch (e) { setBookmarks({}); }
      return;
    }
    let ref = null, handler = null, alive = true;
    (async () => {
      const ok = await window.__FIREBASE_READY__;
      if (!alive) return;
      if (!ok || typeof firebase === "undefined" || !firebase.database) {
        try { setBookmarks(JSON.parse(localStorage.getItem("english_bookmarks__" + uid)) || {}); }
        catch (e) { setBookmarks({}); }
        return;
      }
      ref = firebase.database().ref("english_bookmarks/" + uid);
      handler = ref.on("value",
        (snap) => { if (alive) setBookmarks(snap.val() || {}); },
        (err) => console.error("[bookmarks] read failed:", err && err.code));
    })();
    return () => { alive = false; if (ref && handler) ref.off("value", handler); };
  }, [uid]);

  const cloud = () => uid && typeof firebase !== "undefined" && firebase.database;
  const saveLocal = (next) => {
    try { localStorage.setItem(uid ? "english_bookmarks__" + uid : "english_bookmarks__guest", JSON.stringify(next)); } catch (e) {}
  };

  const setBookmark = (id, patch) => {
    const merged = { ...(bookmarks[id] || {}), ...patch };
    setBookmarks((p) => ({ ...p, [id]: merged }));
    if (cloud()) {
      firebase.database().ref("english_bookmarks/" + uid + "/" + id).set(merged)
        .catch((e) => console.error("[bookmarks] write failed:", e && e.code));
    } else {
      saveLocal({ ...bookmarks, [id]: merged });
    }
  };

  const removeBookmark = (id) => {
    if (!bookmarks[id]) return;
    setBookmarks((p) => { const next = { ...p }; delete next[id]; return next; });
    if (cloud()) {
      firebase.database().ref("english_bookmarks/" + uid + "/" + id).remove()
        .catch((e) => console.error("[bookmarks] remove failed:", e && e.code));
    } else {
      const next = { ...bookmarks }; delete next[id]; saveLocal(next);
    }
  };

  return [bookmarks, setBookmark, removeBookmark];
}

function useTheme() {
  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem(THEME_KEY) || "light"; } catch (e) { return "light"; }
  });
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "light" ? "dark" : "light"))];
}

const Nav = ({ progress, theme, toggleTheme, lang, toggleLang, nav, route, auth, onLogin }) => {
  const t = useT();
  const done = Object.values(progress).filter(Boolean).length;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="nav">
      <div className="nav-brand" onClick={() => nav("#/")}>
        <span className="mark">A</span>
        <span>self-taught.</span>
      </div>
      <nav className="nav-links">
        <a className={route === "home" ? "active" : ""} onClick={() => nav("#/")}>{t("nav_home")}</a>
        {MODULES.map((m) => (
          <a key={m.id} title={pick(lang, m)} className={route === "module" && window.location.hash.includes("/" + m.id) ? "active" : ""} onClick={() => nav(`#/m/${m.id}`)}>{m.code}</a>
        ))}
        <a className={route === "about" ? "active" : ""} onClick={() => nav("#/about")}>{t("nav_about")}</a>
      </nav>
      <div className="nav-right">
        {auth.user && (
          <div className="progress-chip" title={t("your_progress")}>
            <span className="dot">{done}</span>
            <span>/ {CHAPTERS.length} {t("chip_unit")}</span>
          </div>
        )}
        <button type="button" className="lang-btn" onClick={toggleLang} title={t("lang_title")}>{lang === "zh" ? "EN" : "中"}</button>
        <button type="button" className="icon-btn" onClick={toggleTheme} title={t("theme_title")}>
          {theme === "light" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          )}
        </button>
        {auth.user ? (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button type="button" className="user-chip" onClick={() => setMenuOpen((o) => !o)}>
              <span className="avatar">{auth.user.name.slice(0, 1).toUpperCase()}</span>
              <span>{auth.user.name}</span>
            </button>
            {menuOpen && (
              <div className="user-menu">
                <div className="um-head">
                  <div className="nm">{auth.user.name}</div>
                  <div className="em">{auth.user.email}</div>
                </div>
                <button type="button" onClick={() => { setMenuOpen(false); nav("#/about"); }}>{t("nav_about_site")}</button>
                <button type="button" onClick={() => { setMenuOpen(false); auth.logout(); }}>{t("nav_logout")}</button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="login-cta" onClick={() => onLogin("login")}>{t("nav_login")}</button>
        )}
      </div>
    </header>
  );
};

const App = () => {
  const [hash, nav] = useHashRoute();
  const [lang, setLang, toggleLang] = useLangState();
  const auth = useAuth();
  const [progress, toggleProgress] = useProgress(auth.user);
  const [bookmarks, setBookmark, removeBookmark] = useBookmarks(auth.user);
  const [theme, toggleTheme] = useTheme();
  const [authModal, setAuthModal] = React.useState({ open: false, mode: "login", courseHint: null });
  const openLogin = (mode = "login", courseHint = null) => setAuthModal({ open: true, mode, courseHint });
  const closeLogin = () => setAuthModal({ open: false, mode: "login", courseHint: null });

  const markDone = (id) => {
    const wasDone = !!progress[id];
    toggleProgress(id);
    if (!wasDone) removeBookmark(id);
  };

  let route = "home";
  let courseId = null, moduleId = null;
  if (hash.startsWith("#/c/")) { route = "course"; courseId = hash.slice(4); }
  else if (hash.startsWith("#/m/")) { route = "module"; moduleId = hash.slice(4); }
  else if (hash === "#/about") { route = "about"; }

  const screenLabel = (() => {
    if (route === "home") return "01 Home · Roadmap";
    if (route === "module") { const m = MODULES.find((x) => x.id === moduleId); return m ? `02 Module · ${m.code} ${m.en}` : "02 Module"; }
    if (route === "course") { const c = CHAPTERS.find((x) => x.id === courseId); return c ? `03 Chapter · ${c.code} ${c.en}` : "03 Chapter"; }
    return "04 About";
  })();

  return (
    <LangContext.Provider value={lang}>
      <div data-screen-label={screenLabel}>
        <Nav progress={progress} theme={theme} toggleTheme={toggleTheme} lang={lang} toggleLang={toggleLang} nav={nav} route={route} auth={auth} onLogin={openLogin} />
        <div className="running-label">{screenLabel} · self-taught English · 2026</div>

        {route === "home" && <HomePage progress={progress} bookmarks={bookmarks} nav={nav} user={auth.user} onLogin={openLogin} />}
        {route === "module" && <ModulePage moduleId={moduleId} progress={progress} toggleProgress={markDone} nav={nav} user={auth.user} onLogin={openLogin} />}
        {route === "course" && <ChapterPage courseId={courseId} progress={progress} toggleProgress={markDone} bookmarks={bookmarks} setBookmark={setBookmark} removeBookmark={removeBookmark} nav={nav} user={auth.user} onLogin={openLogin} />}
        {route === "about" && <AboutPage nav={nav} />}

        <AuthModal open={authModal.open} mode={authModal.mode} onModeChange={(m) => setAuthModal((s) => ({ ...s, mode: m }))} onClose={closeLogin} auth={auth} courseHint={authModal.courseHint} />
      </div>
    </LangContext.Provider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
