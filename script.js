/* PhonePe Invest — interactions (no dependencies)
   - Investment-solutions carousel: 5 pill slides, tabs, autoplay with progress, peek-to-navigate
   - Sign-up form formatting/validation */
(function () {
  "use strict";

  /* ---------- Carousel ---------- */
  var SLIDE_W = 1280, PEEK_W = 1216, GAP = 24, ACTIVE_X = 79; // Figma: active pill at x 80 inside the 1438 viewport (left 1)
  var INTERVAL = 6000;
  var AUTO = !/[?&]motion=0/.test(location.search); // static QA mode: no autoplay
  var track = document.getElementById("carousel-track");
  var pills = track ? Array.prototype.slice.call(track.querySelectorAll(".pill--slide")) : [];
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab[data-slide]"));
  var dashes = Array.prototype.slice.call(document.querySelectorAll(".progress__dash"));
  var N = pills.length;
  var current = 0, timer = null, paused = false, lastD = [];

  function offsetX(d) {
    if (d === 0) return ACTIVE_X;
    if (d > 0) return ACTIVE_X + SLIDE_W + GAP + (d - 1) * (PEEK_W + GAP);
    return ACTIVE_X - (-d) * (PEEK_W + GAP);
  }
  function layout(i, instant) {
    pills.forEach(function (pill, j) {
      var d = ((j - i) % N + N) % N; if (d > 2) d -= N;           // -2 … 2
      var jump = instant || (Math.abs(lastD[j]) >= 2 && Math.abs(d) >= 2); // offscreen → offscreen: no tween
      pill.style.transition = jump ? "none" : "";
      pill.style.width = (d === 0 ? SLIDE_W : PEEK_W) + "px";
      pill.style.transform = "translate3d(" + offsetX(d) + "px,0,0)";
      pill.classList.toggle("is-active", d === 0);
      pill.setAttribute("aria-hidden", d === 0 ? "false" : "true");
      lastD[j] = d;
      if (jump) { void pill.offsetWidth; pill.style.transition = ""; }
    });
  }
  function paint(i) {
    tabs.forEach(function (t) { var on = +t.dataset.slide === i; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
    dashes.forEach(function (d, k) {
      d.classList.toggle("is-active", k === i);
      var fill = d.firstElementChild; if (!fill) return;
      fill.style.transition = "none"; fill.style.width = "0px"; void fill.offsetWidth;
      if (k === i) { fill.style.transition = "width " + INTERVAL + "ms linear"; fill.style.width = "48px"; }
    });
  }
  function go(i, instant) {
    current = ((i % N) + N) % N;
    layout(current, instant);
    paint(current);
    restart();
    document.dispatchEvent(new CustomEvent("carousel:change", { detail: { index: current } }));
  }
  function restart() { clearInterval(timer); if (AUTO) timer = setInterval(function () { if (!paused) go(current + 1); }, INTERVAL); }

  if (N) {
    pills.forEach(function (p) { lastD.push(0); });
    go(0, true);
    tabs.forEach(function (t) { t.addEventListener("click", function () { go(+t.dataset.slide); }); });
    pills.forEach(function (p, j) { p.addEventListener("click", function (e) { if (!p.classList.contains("is-active")) { e.preventDefault(); go(j); } }); });
    var box = track.closest(".carousel");
    var hover = false, inView = false;
    function sync() { paused = hover || !inView; }
    box.addEventListener("mouseenter", function () { hover = true; sync(); });
    box.addEventListener("mouseleave", function () { hover = false; sync(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; sync(); if (inView) restart(); }, { threshold: 0.4 }).observe(box);
    } else { inView = true; sync(); }
    document.addEventListener("keydown", function (e) {
      if (!document.activeElement || !document.activeElement.classList.contains("tab")) return;
      if (e.key === "ArrowRight") go(current + 1); else if (e.key === "ArrowLeft") go(current - 1);
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) paused = true; else sync(); });
  }
  window.carouselGo = go;

  /* ---------- Sign-up form ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".form"), function (form) {
    var input = form.querySelector('input[type="tel"]');
    input.addEventListener("input", function () {
      var digits = input.value.replace(/\D/g, "").slice(0, 10);
      input.value = digits.length > 5 ? digits.slice(0, 5) + " " + digits.slice(5) : digits;
      form.classList.remove("is-invalid");
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var valid = input.value.replace(/\D/g, "").length === 10;
      form.classList.toggle("is-invalid", !valid);
      if (!valid) { input.focus(); return; }
      form.classList.add("is-sent");
      var btn = form.querySelector(".pill-field__btn span"); if (btn) btn.textContent = "Sent ";
    });
  });
})();
