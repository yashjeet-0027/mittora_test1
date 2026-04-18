"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const SECTIONS = ["Origin", "Craft", "Process", "Collection"];
const SNAP_DUR  = 1.05;
const SNAP_EASE = "power3.inOut";
const KILN_MAX  = 500;
const BACK_THRESH = -80;

function fadeIn(panel, onDone) {
  const kids = [...panel.querySelector(".section-content").children];
  kids.forEach((k) => gsap.set(k, { opacity: 0, y: 36 }));
  const tl = gsap.timeline({ onComplete: onDone });
  kids.forEach((k, i) =>
    tl.to(k, { opacity: 1, y: 0, duration: 0.72, ease: "power3.out" }, i * 0.13)
  );
}

function fadeOut(panel) {
  const kids = [...panel.querySelector(".section-content").children];
  gsap.to(kids, { opacity: 0, y: -22, duration: 0.45, ease: "power2.in", stagger: 0.04 });
}

function resetContent(panel) {
  const kids = [...panel.querySelector(".section-content").children];
  gsap.set(kids, { opacity: 1, y: 0 });
}

function NavBar({ onNav }) {
  return (
    <nav className="nav-bar">
      <div className="nav-logo">Mittora</div>
      <ul className="nav-links">
        {SECTIONS.map((label, i) => (
          <li key={i}><a onClick={() => onNav(i)}>{label}</a></li>
        ))}
      </ul>
    </nav>
  );
}

function Dots({ active, onNav }) {
  return (
    <div className="scroll-indicator">
      {SECTIONS.map((_, i) => (
        <div
          key={i}
          className={"scroll-dot" + (i === active ? " active" : "")}
          onClick={() => onNav(i)}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const containerRef = useRef(null);
  const stripRef     = useRef(null);
  const [active,   setActive]   = useState(0);
  const [hint,     setHint]     = useState(true);
  const [kilnPct,  setKilnPct]  = useState(0);

  useEffect(() => {
    const strip  = stripRef.current;
    if (!strip) return;

    const panels = [...strip.querySelectorAll(".section-panel")];
    if (panels.length < 4) return;

    // Grab kiln + integration elements after confirming they exist
    const kilnBg      = panels[2].querySelector(".section-bg");
    const kilnContent = panels[2].querySelector(".section-content");
    const intOverlay  = panels[3].querySelector(".crossfade-overlay");

    let cur      = 0;
    let busy     = false;
    let kilnAcc  = 0;

    // ── Initial layout ─────────────────────────────────────
    gsap.set(strip, { y: 0 });

    // Hide all content children up front
    panels.forEach((p) => {
      gsap.set([...p.querySelector(".section-content").children], { opacity: 0, y: 36 });
    });

    // Section 4 overlay starts opaque black
    if (intOverlay) gsap.set(intOverlay, { opacity: 1 });

    // Entrance animation for section 0
    gsap.delayedCall(0.35, () => {
      fadeIn(panels[0], () => { busy = false; });
    });
    busy = true;

    // ── Reel snap ──────────────────────────────────────────
    function goTo(target) {
      if (busy)                    return;
      if (target < 0)              return;
      if (target >= panels.length) return;
      if (target === cur)          return;

      busy = true;
      setHint(false);

      const goingForward = target > cur;

      // Reset kiln visuals when leaving or entering section 2
      if (cur === 2 || target === 2) {
        gsap.set(kilnBg,      { scale: 1, opacity: 1 });
        gsap.set(kilnContent, { opacity: 1 });
        kilnAcc = 0;
        setKilnPct(0);
      }

      // Prep integration overlay
      if (target === 3 && intOverlay) gsap.set(intOverlay, { opacity: 1 });
      if (cur    === 3 && intOverlay) gsap.set(intOverlay, { opacity: 1 });

      // Only fade out content when going forward — going back feels cleaner as a pure slide
      if (goingForward) fadeOut(panels[cur]);

      gsap.to(strip, {
        y: -(target * window.innerHeight),
        duration: SNAP_DUR,
        ease: SNAP_EASE,
        onComplete() {
          resetContent(panels[cur]); // restore leaving panel for future visits
          cur = target;
          setActive(target);

          if (goingForward) {
            // Forward: animate text in
            fadeIn(panels[target], () => { busy = false; });
            if (target === 3 && intOverlay) {
              gsap.to(intOverlay, { opacity: 0, duration: 1.8, ease: "power2.inOut", delay: 0.15 });
            }
          } else {
            // Backward: content already visible — just unlock immediately
            resetContent(panels[target]);
            busy = false;
          }
        },
      });
    }

    // ── Kiln scrub ──────────────────────────────────────────
    function scrubKiln(delta) {
      kilnAcc += delta;
      kilnAcc = Math.max(BACK_THRESH - 10, Math.min(KILN_MAX + 10, kilnAcc));

      const progress = Math.max(0, Math.min(1, kilnAcc / KILN_MAX));
      setKilnPct(Math.round(progress * 100));

      gsap.set(kilnBg, { scale: 1 + progress * 0.32 });

      const textAlpha = progress < 0.4
        ? 1
        : Math.max(0, 1 - (progress - 0.4) / 0.35);
      gsap.set(kilnContent, { opacity: textAlpha });

      if (kilnAcc >= KILN_MAX) {
        kilnAcc = KILN_MAX;
        enterIntegration();
        return;
      }

      if (kilnAcc <= BACK_THRESH) {
        kilnAcc = 0;
        gsap.set(kilnBg,      { scale: 1, opacity: 1 });
        gsap.set(kilnContent, { opacity: 1 });
        setKilnPct(0);
        goTo(1);
      }
    }

    // ── Kiln → Integration cinematic cut ────────────────────
    function enterIntegration() {
      if (busy) return;
      busy = true;
      setKilnPct(0);

      gsap.to(kilnBg, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
        onComplete() {
          // Instant strip jump; section 4 has black overlay so seam is invisible
          gsap.set(strip, { y: -(3 * window.innerHeight) });

          // Reset kiln for next visit
          gsap.set(kilnBg,      { scale: 1, opacity: 1 });
          gsap.set(kilnContent, { opacity: 1 });
          kilnAcc = 0;

          cur = 3;
          setActive(3);

          if (intOverlay) {
            gsap.to(intOverlay, { opacity: 0, duration: 1.8, ease: "power2.inOut", delay: 0.15 });
          }
          fadeIn(panels[3], () => { busy = false; });
        },
      });
    }

    // ── Wheel ────────────────────────────────────────────────
    function onWheel(e) {
      e.preventDefault();

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 32;
      if (e.deltaMode === 2) delta *= window.innerHeight;
      delta = Math.max(-180, Math.min(180, delta));

      if (cur === 2) {
        scrubKiln(delta);
        return;
      }

      if (busy) return;
      if (delta > 0) goTo(cur + 1);
      else            goTo(cur - 1);
    }

    // ── Touch ────────────────────────────────────────────────
    let touchY = 0;
    function onTouchStart(e) { touchY = e.touches[0].clientY; }
    function onTouchEnd(e) {
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 40) return;
      if (cur === 2) { scrubKiln(dy > 0 ? 120 : -120); return; }
      if (busy) return;
      if (dy > 0) goTo(cur + 1);
      else         goTo(cur - 1);
    }

    window.addEventListener("wheel",      onWheel,      { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend",   onTouchEnd,   { passive: true });

    // Bridge for React nav handlers
    containerRef.current._navigate = goTo;

    return () => {
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, []);

  function handleNav(i) {
    containerRef.current?._navigate?.(i);
  }

  return (
    <>
      <NavBar onNav={handleNav} />
      <Dots active={active} onNav={handleNav} />

      <div className="scroll-hint" style={{ opacity: hint ? 1 : 0 }}>
        <span className="scroll-hint-text">Scroll</span>
        <div className="scroll-hint-line" />
      </div>

      {kilnPct > 0 && (
        <div className="kiln-progress" style={{ width: `${kilnPct}%` }} />
      )}

      <div ref={containerRef} className="fullpage-wrapper">
        <div ref={stripRef} className="section-strip">

          {/* 1 — THE ORIGIN */}
          <section className="section-panel section-origin" aria-label="The Origin">
            <div className="section-bg" style={{ backgroundImage: "url('/assets/a1.png')" }} />
            <div className="section-content">
              <h1 className="origin-heading">POWERED<br />BY EARTH.</h1>
              <p className="origin-sub">MITTORA-1</p>
            </div>
          </section>

          {/* 2 — THE CRAFT */}
          <section className="section-panel section-craft" aria-label="The Craft">
            <div className="section-bg" style={{ backgroundImage: "url('/assets/a2.png')" }} />
            <div className="section-content">
              <p className="craft-text">
                Pure clay, human hands,<br />fire, and time.
              </p>
            </div>
          </section>

          {/* 3 — THE CATALYST */}
          <section className="section-panel section-catalyst" aria-label="The Catalyst">
            <div className="section-bg" style={{ backgroundImage: "url('/assets/a3.png')" }} />
            <div className="section-content">
              <p className="catalyst-text">
                Return to the earth,<br />refined for modern living.
              </p>
            </div>
          </section>

          {/* 4 — THE INTEGRATION */}
          <section className="section-panel section-integration" aria-label="The Integration">
            <div
              className="section-bg section-bg-integration"
              style={{ backgroundImage: "url('/assets/a5.png')" }}
            />
            <div className="crossfade-overlay" />
            <div className="section-content">
              <span className="integration-label">The Collection</span>
              <h2 className="integration-title">The Kalindi<br />Edition.</h2>
              <p className="integration-spec">1.2L · Handcrafted Clay</p>
              <button className="btn-explore" id="btn-explore-collection">
                <span>Explore Collection</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
