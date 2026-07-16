/* =========================================================
   Roadmap — subway-style SVG (9 modules × 4 chapters)
   ========================================================= */

const Roadmap = ({ progress, onCourseClick, height = 520 }) => {
  const lang = useLang();
  const t = useT();
  const [hover, setHover] = React.useState(null);
  const [tipPos, setTipPos] = React.useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 760);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const byMod = MODULES.map((m) => ({
    mod: m,
    courses: CHAPTERS.filter((c) => c.moduleId === m.id),
  }));

  if (isMobile) {
    return <RoadmapMobile byMod={byMod} progress={progress} onCourseClick={onCourseClick} lang={lang} />;
  }

  const W = 1280;
  const padL = 170;
  const padR = 70;
  const trackGap = 72;
  const top = 60;
  const H = Math.max(height, top + (byMod.length - 1) * trackGap + 120);
  const cols = 4;
  const colSpan = (W - padL - padR) / (cols - 1);

  const rowSpan = (n) => (n > 1 ? (W - padL - padR) / (n - 1) : 0);
  const pos = (moduleIdx, courseIdx) => ({
    x: padL + courseIdx * rowSpan(byMod[moduleIdx].courses.length),
    y: top + moduleIdx * trackGap,
  });

  const arcs = [];
  CHAPTERS.forEach((c) => {
    const cMod = MODULES.findIndex((m) => m.id === c.moduleId);
    const cIdx = byMod[cMod].courses.findIndex((x) => x.id === c.id);
    c.prereq.forEach((pid) => {
      const p = CHAPTERS.find((x) => x.id === pid);
      if (!p) return;
      const pMod = MODULES.findIndex((m) => m.id === p.moduleId);
      const pIdx = byMod[pMod].courses.findIndex((x) => x.id === p.id);
      if (pMod === cMod) return;
      arcs.push({ from: pos(pMod, pIdx), to: pos(cMod, cIdx), pid, cid: c.id });
    });
  });

  const handleEnter = (e, c) => { setHover(c); setTipPos({ x: e.clientX, y: e.clientY }); };
  const handleMove = (e) => setTipPos({ x: e.clientX, y: e.clientY });

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {byMod.map((row, i) => {
          const y = top + i * trackGap;
          const isAccent = row.mod.accent === "accent";
          return (
            <g key={row.mod.id}>
              <text x={padL - 28} y={y - 10} textAnchor="end" fontFamily="var(--f-mono)" fontSize="10" letterSpacing="0.14em" fill="var(--muted)">{row.mod.code}</text>
              <text x={padL - 28} y={y + 8} textAnchor="end" fontFamily="var(--f-display)" fontStyle="italic" fontSize="18" fill={isAccent ? "var(--accent)" : "var(--ink)"}>
                {row.mod.en.split(" ")[0]}.
              </text>
              <line className={`rm-track t-${i}`} x1={padL - 18} y1={y} x2={W - padR + 20} y2={y} stroke={isAccent ? "var(--accent)" : "var(--ink)"} strokeWidth="2" />
              <circle cx={W - padR + 24} cy={y} r="4" fill={isAccent ? "var(--accent)" : "var(--ink)"} />
            </g>
          );
        })}

        {arcs.map((a, i) => {
          const curve = Math.abs(a.to.x - a.from.x) < 80 ? 28 : 44;
          const path = `M ${a.from.x} ${a.from.y} C ${a.from.x} ${a.from.y + curve}, ${a.to.x} ${a.to.y - curve}, ${a.to.x} ${a.to.y}`;
          const hi = hover && (hover.id === a.pid || hover.id === a.cid);
          return (
            <path key={i} className={hi ? "rm-arc hi" : ""} d={path} fill="none" stroke="var(--ink)" strokeWidth="1" strokeDasharray={hi ? undefined : "2 4"} opacity={hi ? 1 : 0.35} />
          );
        })}

        {byMod.map((row, mi) =>
          row.courses.map((c, ci) => {
            const p = pos(mi, ci);
            const done = !!progress[c.id];
            const accent = row.mod.accent === "accent";
            const delay = (mi * 4 + ci) * 50 + 300;
            return (
              <g key={c.id} className="rm-station-wrap" transform={`translate(${p.x},${p.y})`} onClick={() => onCourseClick(c.id)} onMouseEnter={(e) => handleEnter(e, c)} onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
                <g className="rm-station-inner" style={{ animationDelay: `${delay}ms` }}>
                  {hover?.id === c.id && (
                    <>
                      <circle className="rm-pulse" r="16" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
                      <circle r="22" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.4" />
                    </>
                  )}
                  <rect x={-14} y={-14} width="28" height="28" fill={done ? "var(--accent)" : "var(--bg)"} stroke={done ? "var(--accent)" : (accent ? "var(--accent)" : "var(--ink)")} strokeWidth="2" />
                  <text x="0" y="4" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="11" fontWeight="600" fill={done ? "var(--accent-ink)" : "var(--ink)"}>{c.code.replace(/[^0-9]/g, "")}</text>
                  <text x="0" y="34" textAnchor="middle" fontFamily={lang === "zh" ? "Noto Serif SC, serif" : "var(--f-display)"} fontStyle={lang === "zh" ? "normal" : "italic"} fontSize="12" fontWeight="500" fill="var(--ink)">{pick(lang, c.title)}</text>
                  <text x="0" y="48" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="9" letterSpacing="0.1em" fill="var(--muted)">{c.code} · {c.hours}h</text>
                </g>
              </g>
            );
          })
        )}

        <g transform={`translate(0, ${top + (byMod.length - 1) * trackGap + 72})`}>
          <line x1={padL} y1="0" x2={W - padR} y2="0" stroke="var(--hairline-strong)" strokeWidth="1" />
          {[t("rm_axis_1"), t("rm_axis_2"), t("rm_axis_3"), t("rm_axis_4")].map((label, i) => {
            const x = padL + i * colSpan;
            return (
              <g key={i} transform={`translate(${x}, 12)`}>
                <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--hairline-strong)" />
                <text x="0" y="22" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="10" letterSpacing="0.12em" fill="var(--muted)">{label}</text>
              </g>
            );
          })}
        </g>
      </svg>

      {hover && (
        <div className="station-tooltip" style={{ left: Math.min(tipPos.x + 16, window.innerWidth - 300), top: tipPos.y + 16, opacity: 1 }}>
          <div className="m">{hover.code} · {pick(lang, MODULES.find(m => m.id === hover.moduleId))}</div>
          <div className="t"><span className="cn">{pick(lang, hover.title)}</span></div>
          <div className="m" style={{ marginTop: 8 }}>{hover.hours} {t("hours_unit")} · {hover.prereq.length ? fmt(t("prereq_n"), { n: hover.prereq.length }) : t("no_prereq")}</div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>{pick(lang, hover.summary).slice(0, 56)}…</div>
        </div>
      )}
    </div>
  );
};

const RoadmapMobile = ({ byMod, progress, onCourseClick, lang }) => (
  <div style={{ padding: "16px 20px" }}>
    {byMod.map((row) => {
      const isAccent = row.mod.accent === "accent";
      return (
        <div key={row.mod.id} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, paddingBottom: 8, borderBottom: `2px solid ${isAccent ? "var(--accent)" : "var(--ink)"}` }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--muted)" }}>{row.mod.code}</span>
            <span style={{ fontFamily: "var(--f-display)", fontStyle: "italic", fontSize: 22, color: isAccent ? "var(--accent)" : "var(--ink)" }}>{row.mod.en.split(" ")[0]}</span>
            <span style={{ fontFamily: "Noto Serif SC, serif", fontSize: 14, fontWeight: 500, marginLeft: "auto" }}>{pick(lang, row.mod)}</span>
          </div>
          <div style={{ position: "relative", paddingLeft: 24, marginTop: 12 }}>
            <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: 2, background: isAccent ? "var(--accent)" : "var(--ink)" }} />
            {row.courses.map((c) => {
              const done = !!progress[c.id];
              return (
                <div key={c.id} onClick={() => onCourseClick(c.id)} style={{ position: "relative", padding: "10px 0", cursor: "pointer" }}>
                  <div style={{ position: "absolute", left: -22, top: 14, width: 18, height: 18, border: `2px solid ${done ? "var(--accent)" : "var(--ink)"}`, background: done ? "var(--accent)" : "var(--bg)" }} />
                  <div style={{ fontFamily: lang === "zh" ? "Noto Serif SC, serif" : "var(--f-display)", fontStyle: lang === "zh" ? "normal" : "italic", fontSize: 18, fontWeight: 500 }}>{pick(lang, c.title)}</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.06em", marginTop: 2 }}>{c.code} · {c.hours}h</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
);

window.Roadmap = Roadmap;
