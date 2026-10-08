/* PhonePe Invest — motion layer (GSAP 3 + ScrollTrigger)
   Everything animates TO its Figma position, so the settled page is the design 1:1.
   Disabled for prefers-reduced-motion and with ?motion=0 (used for pixel-diff QA). */
(function () {
  "use strict";
  var root = document.documentElement;
  var off = window.matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]motion=0/.test(location.search);
  function release() { root.classList.remove("motion-pending"); }
  if (off || !window.gsap || !window.ScrollTrigger) { release(); return; }

  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "expo.out", duration: 1.1 });
  root.classList.add("motion");

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Wrap an element's content in a clipping mask so it can rise into view. */
  function mask(el) {
    if (!el || el.dataset.masked) return el;
    var inner = document.createElement("span");
    inner.className = "mask__inner";
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
    el.classList.add("mask");
    el.dataset.masked = "1";
    return inner;
  }
  /* Split a heading's lines (separated by <br>) into masked rows. */
  function lines(el) {
    if (!el) return [];
    var parts = [], cur = document.createElement("span");
    cur.className = "mask";
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeName === "BR") { parts.push(cur); cur = document.createElement("span"); cur.className = "mask"; }
      else cur.appendChild(n);
    });
    parts.push(cur);
    el.innerHTML = "";
    return parts.map(function (p) {
      var inner = document.createElement("span"); inner.className = "mask__inner";
      while (p.firstChild) inner.appendChild(p.firstChild);
      p.appendChild(inner); el.appendChild(p);
      return inner;
    });
  }
  function reveal(trigger, build, start) {
    ScrollTrigger.create({
      trigger: trigger, start: start || "top 78%", once: true,
      onEnter: function () { build(); }
    });
  }

  /* ---------- Initial states (set before the pending class is removed → no flash) ---------- */
  var heroL = lines($(".hero__title"));
  var analyserL = lines($(".analyser__title"));
  var signupL = lines($(".signup__title"));
  var solL = lines($(".solutions__title"));
  var bannerL = lines($(".banner__title"));
  var offersT = mask($(".offers__title"));
  var stepT = $$(".step__title").map(mask);
  var pillT = $$(".pill--slide.is-active .pill__title").map(mask);

  gsap.set([".nav", ".hero__sub", ".hero__ctas .btn", ".trust li"], { autoAlpha: 0 });
  gsap.set(heroL, { yPercent: 110 });

  var revealSets = [
    [".chip-new", { autoAlpha: 0, scale: 0.6 }],
    [analyserL, { yPercent: 110 }],
    [".analyser__lead, .analyser__note, .analyser__right .text-link", { autoAlpha: 0, y: 28 }],
    [".rule-light", { scaleX: 0, transformOrigin: "0 50%" }],
    [".step__label, .step__desc", { autoAlpha: 0, y: 24 }],
    [stepT, { yPercent: 110 }],
    [".panel", { autoAlpha: 0, y: 70, scale: 0.96 }],
    [".panel img", { scale: 1.1 }],
    [".signup__card", { autoAlpha: 0, y: 80 }],
    [".signup__copy .chip-dark, .signup__sub", { autoAlpha: 0, y: 24 }],
    [signupL, { yPercent: 110 }],
    [".form", { autoAlpha: 0, x: 48 }],
    [".form__col li", { autoAlpha: 0, x: -16 }],
    [offersT, { yPercent: 110 }],
    [".offer", { autoAlpha: 0, y: 60 }],
    [".offers__footnote", { autoAlpha: 0 }],
    [".tag--lime", { scale: 0.6, autoAlpha: 0 }],
    [".solutions__intro .chip-light, .solutions__sub, .tabs", { autoAlpha: 0, y: 24 }],
    [solL, { yPercent: 110 }],
    [".carousel__viewport", { autoAlpha: 0, y: 80, scale: 0.97, transformOrigin: "50% 100%" }],
    [".progress", { autoAlpha: 0 }],
    [".banner__card", { autoAlpha: 0, y: 60 }],
    [".banner__phone", { autoAlpha: 0, y: 160 }],
    [".banner__copy .chip-dark, .banner__sub, .banner__badges", { autoAlpha: 0, y: 24 }],
    [bannerL, { yPercent: 110 }],
    [".footer__brand, .footer__col", { autoAlpha: 0, y: 32 }],
    [".footer__legal", { autoAlpha: 0 }],
    [".footer__wordmark", { autoAlpha: 0, y: 40 }],
    [".footer__hands", { autoAlpha: 0, y: 140 }]
  ];
  revealSets.forEach(function (s) { gsap.set(s[0], s[1]); });
  release();


  /* ---------- Hero illustration: every Figma layer animates on its own, forever ----------
     Layers are separate SVG/PNG exports (assets/hero/<node>.*) stacked in Figma paint order.
     Layers sharing data-g move as one rigid object (same tween, same pivot) so z-order is untouched. */
  function heroIllustration() {
    var layers = $$(".illus .l");
    if (!layers.length) return;
    var G = {};
    layers.forEach(function (el) {
      var g = el.dataset.g;
      var r = { el: el, x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: parseFloat(el.style.width), h: parseFloat(el.style.height) };
      (G[g] = G[g] || { k: el.dataset.k, items: [] }).items.push(r);
    });
    Object.keys(G).forEach(function (g) {
      var s = G[g], x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      s.items.forEach(function (r) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); });
      s.cx = (x0 + x1) / 2; s.cy = (y0 + y1) / 2; s.w = x1 - x0; s.h = y1 - y0;
      s.els = s.items.map(function (r) { return r.el; });
      // shared pivot: group centre (bars pivot on their own bottom edge)
      s.items.forEach(function (r) { r.el.style.transformOrigin = s.k === "bar" || s.k === "line" ? "50% 100%" : (s.cx - r.x) + "px " + (s.cy - r.y) + "px"; });
    });
    var byK = function (k) { return Object.keys(G).filter(function (g) { return G[g].k === k; }).map(function (g) { return G[g]; }); };
    var rnd = gsap.utils.random;
    var els = function (s) { return s.els; };

    /* ---- entrance (plays once, then the loops take over) ---- */
    var tl = gsap.timeline();
    tl.from(byK("bar").map(els).reduce(function (a, b) { return a.concat(b); }, []), { scaleY: 0, duration: 1.4, ease: "expo.out", stagger: 0.07 }, 0)
      .from(byK("line").map(els).reduce(function (a, b) { return a.concat(b); }, []), { scaleY: 0, autoAlpha: 0, duration: 1.4, stagger: 0.08 }, 0.2)
      .from(byK("coin").map(function (s) { return s.els; }).reduce(function (a, b) { return a.concat(b); }, []), { y: 220, autoAlpha: 0, scale: 0.7, duration: 1.7, ease: "back.out(1.4)", stagger: { each: 0.03 } }, 0.15)
      .from(byK("blob").map(els).reduce(function (a, b) { return a.concat(b); }, []), { autoAlpha: 0, scale: 0.4, duration: 1.2, stagger: 0.1 }, 0.8)
      .from(byK("arrow").map(els).reduce(function (a, b) { return a.concat(b); }, []), { autoAlpha: 0, duration: 1 }, 0.9)
      .from(byK("spark").map(els).reduce(function (a, b) { return a.concat(b); }, []), { scale: 0, rotation: -90, autoAlpha: 0, duration: 1.1, ease: "back.out(2.4)", stagger: 0.12 }, 1);

    /* ---- perpetual loops ---- */
    function loops() {
      // Bars breathe like a live market: scaleY from the bottom edge, desynchronised.
      byK("bar").forEach(function (s, i) {
        gsap.to(s.els, { scaleY: rnd(0.9, 0.96), duration: rnd(1.8, 3.4), ease: "sine.inOut", yoyo: true, repeat: -1, delay: rnd(0, 2) });
      });
      // Hairlines shimmer.
      byK("line").forEach(function (s) {
        gsap.to(s.els, { autoAlpha: rnd(0.25, 0.5), scaleY: rnd(0.94, 0.99), duration: rnd(1.4, 2.6), ease: "sine.inOut", yoyo: true, repeat: -1, delay: rnd(0, 2) });
      });
      // Orbit rings pulse softly.
      byK("ring").forEach(function (s) { gsap.to(s.els, { autoAlpha: 0.45, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 }); });
      // Coins hover and tilt (each with its own period so they never sync up).
      var coinCfg = {
        big:   { y: 10, r: 1.2, d: 4.6 },
        ipo:   { y: 18, r: 4,   d: 3.8 },
        etf:   { y: 14, r: 4.5, d: 3.4 },
        green: { y: 12, r: 5,   d: 3.1 },
        mini:  { y: 12, r: 9,   d: 2.8 }
      };
      Object.keys(coinCfg).forEach(function (g, i) {
        var s = G[g], c = coinCfg[g]; if (!s) return;
        gsap.to(s.els, { y: -c.y, rotation: c.r, duration: c.d, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.35 });
      });
      // Soft blobs drift and swell.
      byK("blob").forEach(function (s, i) {
        gsap.to(s.els, { y: -14, x: i ? -8 : 8, scale: 1.12, duration: 3.6 + i, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.5 });
      });
      // Arrows keep rising: lift, glow, dissolve, restart.
      byK("arrow").forEach(function (s, i) {
        var t = gsap.timeline({ repeat: -1, delay: i * 1.4 });
        t.fromTo(s.els, { y: 14, autoAlpha: 0 }, { y: -6, autoAlpha: 1, duration: 1.1, ease: "sine.out" })
         .to(s.els, { y: -44, autoAlpha: 0, duration: 1.7, ease: "sine.in" });
      });
      // Sparkles twinkle: scale + spin + opacity.
      byK("spark").forEach(function (s, i) {
        var t = gsap.timeline({ repeat: -1, repeatDelay: rnd(0.2, 1.2), delay: i * 0.55 });
        t.to(s.els, { scale: 1.45, rotation: 90, autoAlpha: 1, duration: 0.7, ease: "sine.out" })
         .to(s.els, { scale: 0.45, rotation: 180, autoAlpha: 0.35, duration: 1.1, ease: "sine.in" })
         .set(s.els, { rotation: 0 });
      });
    }
    tl.add(loops, 2.2);


    /* ---- scroll parallax: nearer layers rise faster as the hero scrolls away (yPercent, so it never fights the float loops) ---- */
    var rise = { mini: -60, ipo: -45, etf: -30, green: -22, big: -12, blobP: -35, blobG: -25, arrow1: -50, arrow2: -50, sp1: -55, sp2: -40, sp3: -55, sp4: -20 };
    Object.keys(rise).forEach(function (g) {
      if (!G[g]) return;
      gsap.to(G[g].els, { yPercent: rise[g], ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 } });
    });

    /* ---- cursor parallax: nearer layers travel further ---- */
    var depth = { big: 22, ipo: 30, etf: 20, green: 14, mini: 34, blobP: 10, blobG: 10, sp1: 26, sp2: 18, sp3: 26, sp4: 12, arrow1: 16, arrow2: 16 };
    var movers = [];
    Object.keys(depth).forEach(function (g) { if (G[g]) movers.push({ s: G[g], d: depth[g], set: gsap.quickTo(G[g].els, "xPercent", { duration: 1.2, ease: "power3" }) }); });
    var hero = $(".hero");
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect(), nx = ((e.clientX - r.left) / r.width - 0.5);
      movers.forEach(function (m) { m.set(nx * -m.d / (m.s.w || 100) * 100); });
    });
    hero.addEventListener("mouseleave", function () { movers.forEach(function (m) { m.set(0); }); });
  }

  /* ---------- Hero intro ---------- */
  function intro() {
    gsap.set([".nav", ".hero__sub", ".hero__ctas .btn", ".trust li"], { y: 24 });
    gsap.set(".nav", { y: -16 });
    var tl = gsap.timeline();
    tl.to(".nav", { autoAlpha: 1, y: 0, duration: 1 }, 0)
      .to(heroL, { yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.1)
      .to(".hero__sub", { autoAlpha: 1, y: 0 }, 0.5)
      .to(".hero__ctas .btn", { autoAlpha: 1, y: 0, stagger: 0.08 }, 0.6)
      .to(".trust li", { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.9 }, 0.75)
      .add(heroIllustration, 0.3);
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(intro);

  /* Hero parallax while scrolling away */
  gsap.to(".hero__copy", { y: -80, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__art-wrap", { y: 120, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Portfolio Analyser ---------- */
  reveal(".analyser__head", function () {
    var tl = gsap.timeline();
    tl.to(".chip-new", { autoAlpha: 1, scale: 1, duration: 0.9, ease: "back.out(2)" }, 0)
      .to(analyserL, { yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.05)
      .to(".analyser__lead, .analyser__note, .analyser__right .text-link", { autoAlpha: 1, y: 0, stagger: 0.1 }, 0.2)
      .to(".rule-light", { scaleX: 1, duration: 1.4 }, 0.4);
  });
  reveal(".steps", function () {
    var tl = gsap.timeline();
    $$(".step").forEach(function (step, i) {
      var t = i * 0.14;
      tl.to($$(".step__label", step), { autoAlpha: 1, y: 0 }, t)
        .to($(".mask__inner", $(".step__title", step)), { yPercent: 0, duration: 1.2 }, t + 0.05)
        .to($$(".step__desc", step), { autoAlpha: 1, y: 0 }, t + 0.15)
        .to($(".panel", step), { autoAlpha: 1, y: 0, scale: 1, duration: 1.4 }, t + 0.2)
        .to($(".panel img", step), { scale: 1, duration: 2 }, t + 0.2);
    });
  }, "top 72%");
  $$(".panel").forEach(function (p) {
    p.addEventListener("mouseenter", function () { gsap.to(p, { y: -6, duration: 0.6, overwrite: "auto" }); });
    p.addEventListener("mouseleave", function () { gsap.to(p, { y: 0, duration: 0.8, overwrite: "auto" }); });
  });

  /* ---------- Sign-up ---------- */
  reveal(".signup", function () {
    var tl = gsap.timeline();
    tl.to(".signup__card", { autoAlpha: 1, y: 0, duration: 1.3 }, 0)
      .to(".signup__copy .chip-dark", { autoAlpha: 1, y: 0 }, 0.3)
      .to(signupL, { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.35)
      .to(".signup__sub", { autoAlpha: 1, y: 0 }, 0.7)
      .to(".form", { autoAlpha: 1, x: 0, duration: 1.3 }, 0.45)
      .to(".form__col li", { autoAlpha: 1, x: 0, stagger: 0.07 }, 0.8);
    gsap.to(".signup__arcs", { rotation: 360, duration: 160, ease: "none", repeat: -1, transformOrigin: "1160px 720px" });
  }, "top 70%");


  /* ---------- Offers: parallax backdrop (gradient + grid drift slower than the content) ---------- */
  gsap.fromTo(".offers__bg", { y: -90 }, { y: 90, ease: "none", scrollTrigger: { trigger: ".signup", start: "bottom bottom", end: "+=2300", scrub: 0.5 } });
  gsap.fromTo(".offers__grid", { y: -40 }, { y: 40, ease: "none", scrollTrigger: { trigger: ".signup", start: "bottom bottom", end: "+=2300", scrub: 0.5 } });

  /* ---------- Offers ---------- */
  reveal(".signup", function () {
    var tl = gsap.timeline();
    tl.to(offersT, { yPercent: 0, duration: 1.3 }, 0)
      .to(".offer", { autoAlpha: 1, y: 0, stagger: 0.12, duration: 1.3 }, 0.2)
      .to(".tag--lime", { autoAlpha: 1, scale: 1, duration: 0.8, ease: "back.out(2)" }, 0.5)
      .to(".offers__footnote", { autoAlpha: 1, duration: 1 }, 0.8);
    $$(".offer__zero").forEach(function (z, i) {
      var o = { v: [99, 499, 300][i] || 99 };
      gsap.to(o, { v: 0, duration: 1.6, ease: "power3.out", delay: 0.35 + i * 0.12, onUpdate: function () { z.textContent = Math.round(o.v); } });
    });
  }, "bottom 90%");

  /* ---------- Investment solutions ---------- */
  reveal(".solutions__head", function () {
    var tl = gsap.timeline();
    tl.to(".solutions__intro .chip-light", { autoAlpha: 1, y: 0 }, 0)
      .to(solL, { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.05)
      .to(".solutions__sub", { autoAlpha: 1, y: 0 }, 0.3)
      .to(".tabs", { autoAlpha: 1, y: 0 }, 0.4)
      .to(".carousel__viewport", { autoAlpha: 1, y: 0, scale: 1, duration: 1.5 }, 0.45)
      .to(pillT, { yPercent: 0, duration: 1.2 }, 0.7)
      .to(".progress", { autoAlpha: 1 }, 0.9);
  });
  /* Card art: every layer floats on its own period, never in sync */
  var FLOAT = {
    "s-bars": { y: 6, d: 3.6 }, "s-arrow": { y: 12, x: 4, d: 3.0 },
    "e-main": { y: 9, r: 1.2, d: 3.8 }, "m-main": { y: 9, r: 1, d: 3.6 },
    "w-basket": { y: 4, d: 4.2 }, "w-cube": { y: 12, r: 3, d: 3.1 }, "w-coins": { y: 8, r: 1.4, d: 3.7 },
    "i-main": { y: 8, r: 1, d: 3.5 }, "i-c1": { y: 5, x: 5, d: 2.6 }, "i-c2": { y: 4, x: -4, d: 2.9 },
    "f-main": { y: 9, r: 1.2, d: 3.4 }
  };
  var DEPTH = { "s-bars": 10, "s-arrow": 22, "e-main": 16, "m-main": 16, "w-basket": 8, "w-cube": 24, "w-coins": 16, "i-main": 14, "i-c1": 26, "i-c2": 20, "f-main": 16 };
  $$(".pill--slide .cl").forEach(function (el, i) {
    var f = FLOAT[el.dataset.c]; if (!f) return;
    gsap.to(el, { y: -f.y, x: f.x || 0, rotation: f.r || 0, duration: f.d, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.25 });
    el._px = gsap.quickTo(el, "xPercent", { duration: 1.2, ease: "power3" });
  });
  $(".carousel").addEventListener("mousemove", function (e) {
    var r = e.currentTarget.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5;
    $$(".pill--slide.is-active .cl").forEach(function (el) { if (el._px) el._px(nx * -(DEPTH[el.dataset.c] || 10) / (el.offsetWidth || 300) * 100); });
  });
  $(".carousel").addEventListener("mouseleave", function () { $$(".pill--slide .cl").forEach(function (el) { if (el._px) el._px(0); }); });
  /* Slide change: re-run the title rise, copy fade and layer entrance on the new active pill */
  document.addEventListener("carousel:change", function (e) {
    var pill = $$(".pill--slide")[e.detail.index]; if (!pill) return;
    var t = mask($(".pill__title", pill));
    gsap.fromTo(t, { yPercent: 110 }, { yPercent: 0, duration: 1.1, delay: 0.25 });
    gsap.fromTo($$(".pill__desc, .pill__link", pill), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.08, delay: 0.4 });
    gsap.fromTo($$(".cl", pill), { yPercent: 16, autoAlpha: 0, scale: 0.9, transformOrigin: "50% 60%" }, { yPercent: 0, autoAlpha: 1, scale: 1, stagger: 0.12, delay: 0.3, duration: 1.4, ease: "expo.out" });
  });

  /* ---------- Get the app ---------- */
  reveal(".banner", function () {
    var tl = gsap.timeline();
    tl.to(".banner__card", { autoAlpha: 1, y: 0, duration: 1.3 }, 0)
      .to(".banner__phone", { autoAlpha: 1, y: 0, duration: 1.6 }, 0.2)
      .to(".banner__copy .chip-dark", { autoAlpha: 1, y: 0 }, 0.35)
      .to(bannerL, { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.4)
      .to(".banner__sub", { autoAlpha: 1, y: 0 }, 0.7)
      .to(".banner__badges", { autoAlpha: 1, y: 0 }, 0.8);
    gsap.to(".banner__halo", { scale: 1.06, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 50%" });
    gsap.to(".banner__phone", { y: -6, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.8 });
  }, "top 70%");

  /* ---------- Footer ---------- */
  reveal(".footer__cols", function () {
    gsap.to(".footer__brand, .footer__col", { autoAlpha: 1, y: 0, stagger: 0.12, duration: 1.3 });
    gsap.to(".footer__legal", { autoAlpha: 1, duration: 1.2, delay: 0.4 });
  });
  reveal(".footer__wordmark", function () {
    gsap.to(".footer__wordmark", { autoAlpha: 1, y: 0, duration: 1.6 });
    gsap.to(".footer__hands", { autoAlpha: 1, y: 0, duration: 1.8, delay: 0.1, onComplete: function () {
      gsap.to(".footer__hands", { y: -8, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    } });
  }, "top 85%");

  /* Buttons: tiny press feedback */
  $$(".btn, .nav__cta, .pill__link, .pill-field__btn, .footer__cta, .text-link").forEach(function (b) {
    b.addEventListener("mouseenter", function () { gsap.to(b, { scale: 1.03, duration: 0.5, transformOrigin: "50% 50%" }); });
    b.addEventListener("mouseleave", function () { gsap.to(b, { scale: 1, duration: 0.7 }); });
  });
})();
