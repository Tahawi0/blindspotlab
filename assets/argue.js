// Build the Argument: pick the premises that prove the conclusion.
(function () {
  var G = window.MIZAN_GAME || {};
  var box = document.getElementById("game"), KEY = "bsl-argue";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  var lv = 0, first = 0, S = window.MizanStages, SKEY = "bsl-argue-stages";
  function map() {
    S.render(box, { key: SKEY, bossLabel: "Boss level: 3 premises",
      intro: "10 levels, each one teaches a new kind of reasoning. Pick the premises that, if true, make the conclusion impossible to deny. Get it on your first try for 3 stars.",
      items: G.levels.map(function (L, k) { return { id: "a" + k, title: L.c, sub: (L.n || 2) + " premises" }; }),
      onPlay: function (k) { lv = k; level(); } });
  }
  function level() {
    box.innerHTML = "";
    var L = G.levels[lv], picked = [], tries = 0;
    box.appendChild(el("p", "kicker", "Level " + (lv + 1) + " of " + G.levels.length));
    var bar = el("div", "bar"), bi = el("i"); bi.style.width = (lv / G.levels.length * 100) + "%"; bar.appendChild(bi); box.appendChild(bar);
    var proof = el("div", "proof");
    var N = L.n || 2, slots = []; for (var q = 0; q < N; q++) slots.push(el("button", "slot", "Premise " + (q + 1)));
    slots.forEach(function (s, k) { s.type = "button"; s.onclick = function () { if (picked[k] != null) unpick(k); }; proof.appendChild(s); });
    proof.appendChild(el("div", "therefore", "Therefore"));
    proof.appendChild(el("div", "concl", L.c));
    box.appendChild(proof);
    box.appendChild(el("p", "lead", "Drag the cards into the premise slots, or just tap them. Pick the " + (N === 2 ? "two premises" : N + " premises") + " that, if true, force the conclusion to be true."));
    var deck = el("div", "deck"), order = shuffle(L.cards.map(function (c, i) { return i; })), btns = {};
    order.forEach(function (i) { var b = el("button", "pcard", L.cards[i].t); b.type = "button"; b.onclick = function () { if (b.dataset.dragged) { delete b.dataset.dragged; return; } pick(i); }; drag(b, i); btns[i] = b; deck.appendChild(b); });
    box.appendChild(deck);
    var msg = el("div", "argue-msg"); box.appendChild(msg);
    var check = el("button", "btn", "Check the argument"); check.disabled = true; box.appendChild(check);
    function draw() {
      slots.forEach(function (s, k) { var i = picked[k]; s.textContent = i != null ? L.cards[i].t : "Premise " + (k + 1); s.classList.toggle("full", i != null); });
      Object.keys(btns).forEach(function (i) { btns[i].classList.toggle("used", picked.indexOf(+i) >= 0); });
      check.disabled = picked.filter(function (x) { return x != null; }).length < N;
    }
    function pick(i) {
      if (picked.indexOf(i) >= 0) return unpick(picked.indexOf(i));
      var k = -1; for (var q = 0; q < N; q++) if (picked[q] == null) { k = q; break; } if (k < 0) return;
      picked[k] = i; msg.innerHTML = ""; draw();
    }
    function unpick(k) { picked[k] = null; draw(); }
    function put(i, k) { var was = picked.indexOf(i); if (was >= 0) picked[was] = null; picked[k] = i; msg.innerHTML = ""; draw(); slots[k].classList.add("drop"); setTimeout(function () { slots[k].classList.remove("drop"); }, 400); }
    // Drag a card into a premise slot (plain tapping still works too)
    function drag(b, i) {
      b.addEventListener("pointerdown", function (e) {
        if (b.disabled || e.button > 0) return;
        var sx = e.clientX, sy = e.clientY, ghost = null, over = -1;
        function mv(ev) {
          var dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (!ghost && Math.hypot(dx, dy) < 8) return;
          if (!ghost) { ghost = b.cloneNode(true); ghost.className = "pcard ghost"; ghost.style.width = b.offsetWidth + "px"; document.body.appendChild(ghost); b.classList.add("lifted"); }
          ghost.style.transform = "translate(" + (ev.clientX - b.offsetWidth / 2) + "px," + (ev.clientY - 24) + "px) rotate(-3deg)";
          over = -1; slots.forEach(function (s, k) { var r = s.getBoundingClientRect(), hit = ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom; s.classList.toggle("hover", hit); if (hit) over = k; });
          ev.preventDefault();
        }
        function up() {
          document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
          slots.forEach(function (s) { s.classList.remove("hover"); });
          if (ghost) { ghost.remove(); b.classList.remove("lifted"); b.dataset.dragged = "1"; if (over >= 0) put(i, over); }
        }
        document.addEventListener("pointermove", mv, { passive: false }); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
      });
    }
    check.onclick = function () {
      tries++; msg.innerHTML = "";
      var bad = picked.filter(function (i) { return !L.cards[i].ok; });
      if (!bad.length) {
        if (tries === 1) first++;
        var score = tries === 1 ? 10 : tries === 2 ? 7 : 4;
        S.record(SKEY, "a" + lv, score);
        if (window.MizanAuth && MizanAuth.score) MizanAuth.score("argue", score);
        proof.classList.add("valid");
        msg.className = "argue-msg ok"; msg.appendChild(el("b", null, "Valid argument!")); msg.appendChild(el("p", null, L.win));
        Object.keys(btns).forEach(function (i) { btns[i].disabled = true; }); slots.forEach(function (s) { s.disabled = true; });
        check.remove();
        var go = el("div", "court-end"); go.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
        go.appendChild(S.endBar({ score: score, k: lv, count: G.levels.length, map: map, play: function (k) { lv = k; level(); },
          share: "I built a valid argument in Build the Argument on Blind Spot Lab.\nYour turn: " + location.href.split("?")[0] }));
        box.appendChild(go);
      } else {
        msg.className = "argue-msg bad"; msg.appendChild(el("b", null, "That argument doesn't prove the conclusion."));
        bad.forEach(function (i) { msg.appendChild(el("p", null, "\u201c" + L.cards[i].t + "\u201d: " + L.cards[i].why)); });
        proof.classList.remove("shake"); void proof.offsetWidth; proof.classList.add("shake");
      }
    };
  }
  function end() {
    var d = load(); d.best = Math.max(d.best || 0, first); save(d);
    window.MizanAuth && MizanAuth.score && MizanAuth.score("argue", first / G.levels.length * 10);
    var w = el("div", "today");
    w.appendChild(el("p", "kicker", "You finished every level"));
    w.appendChild(el("p", "big-score", first + " / " + G.levels.length));
    w.appendChild(el("p", "lead", "That's how many arguments you built right on the first try."));
    w.appendChild(el("p", null, "What you learned: a valid argument isn't the one that sounds good. It's the one where, if the premises are true, the conclusion has to be true. After that, check whether the premises themselves are true."));
    var p = el("p"), again = el("button", "btn", "Play again"), sh = el("button", "btn ghost", "Share");
    again.onclick = function () { lv = 0; first = 0; level(); };
    sh.onclick = function () {
      var t = "I built " + first + " of " + G.levels.length + " valid arguments on the first try in Build the Argument on Blind Spot Lab.\nYour turn: " + location.href.split("?")[0];
      if (navigator.share) navigator.share({ text: t }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { sh.textContent = "Copied ✓"; });
    };
    p.appendChild(again); p.appendChild(document.createTextNode(" ")); p.appendChild(sh); w.appendChild(p);
    box.appendChild(w);
  }
  map();
})();
