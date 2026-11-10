// Blind Spot Lab games: The Bias Lab, Spot the Trick, Which Philosopher Are You?, Confidence Check, Fix the Argument.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {};
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function link(slug) { var a = el("a", null, NAMES[slug] || slug); a.href = root + "atlas/" + slug + "/"; return a; }
  function shareBtn(getText) {
    var b = el("button", "btn ghost", "Share");
    b.onclick = function () {
      var t = getText();
      if (navigator.share) navigator.share({ text: t }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { b.textContent = "Copied ✓"; });
    };
    return b;
  }
  function bar(label, pct, mine, txt) {
    var w = el("div", "res" + (mine ? " mine" : ""));
    var top = el("div", "res-top"); top.appendChild(el("span", null, label + (mine ? " (your group)" : ""))); top.appendChild(el("b", null, txt));
    var t = el("div", "bar"), i = el("i"); i.style.width = Math.max(2, Math.min(100, pct)) + "%"; t.appendChild(i);
    w.appendChild(top); w.appendChild(t); return w;
  }

  /* ───── The Bias Lab ───── */
  function lab(box) {
    var API = window.MIZAN_API;
    G.lab.forEach(function (x) {
      var card = el("section", "sheet lab"); card.id = "exp-" + x.id;
      card.appendChild(el("h2", null, x.title));
      var body = el("div"); card.appendChild(body); box.appendChild(card);
      var key = "bsl-lab-" + x.id, st = load(key, null);
      var g = st ? st.g : Math.floor(Math.random() * x.groups.length);
      var grp = x.groups[g];
      if (st && st.done) return results(x, body, st);
      body.appendChild(el("p", "lead", x.intro));
      function main() {
        body.innerHTML = "";
        body.appendChild(el("p", "scene", grp.q));
        if (grp.num) {
          var f = el("form", "num-form"), inp = el("input"); inp.type = "number"; inp.min = 0; inp.max = 300; inp.required = true; inp.inputMode = "numeric"; inp.placeholder = "Number";
          var b = el("button", "btn", "Lock in my answer"); b.type = "submit"; f.appendChild(inp); f.appendChild(b); body.appendChild(f); inp.focus();
          f.onsubmit = function (e) { e.preventDefault(); var v = parseInt(inp.value, 10); if (isNaN(v) || v < 0 || v > 300) return; finish(v, v); };
        } else {
          var o = el("div", "opts");
          grp.opts.forEach(function (t, k) { var b = el("button", null, t); b.onclick = function () { finish(grp.map[k], t); }; o.appendChild(b); });
          body.appendChild(o);
        }
      }
      if (grp.pre) {
        body.appendChild(el("p", "scene", grp.pre));
        var o = el("div", "opts");
        grp.preOpts.forEach(function (t) { var b = el("button", null, t); b.onclick = main; o.appendChild(b); });
        body.appendChild(o);
      } else main();
      function finish(v, label) {
        st = { g: g, v: v, label: String(label), done: true }; save(key, st);
        body.innerHTML = ""; body.appendChild(el("p", "lead", "Loading everyone's results…"));
        fetch(API + "/lab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exp: x.id, group: g, value: v }) })
          .catch(function () {}).then(function () { results(x, body, st); });
      }
    });
    function results(x, body, st) {
      body.innerHTML = "";
      body.appendChild(el("p", "kicker", "Your answer: " + st.label));
      var area = el("div"); body.appendChild(area); area.appendChild(el("p", "lead", "Loading everyone's results…"));
      var rev = el("div", "note"); rev.textContent = x.reveal; body.appendChild(rev);
      if (x.entry) { var p = el("p"); p.appendChild(document.createTextNode("Read more: ")); p.appendChild(link(x.entry)); body.appendChild(p); }
      fetch(window.MIZAN_API + "/lab?exp=" + x.id).then(function (r) { return r.json(); }).then(function (d) {
        area.innerHTML = "";
        var total = 0, rows = [];
        x.groupNames.forEach(function (name, k) {
          var s = d[k] || { n: 0, sum: 0, c: [0, 0, 0] }; total += s.n;
          if (x.groups[0].num) { var m = s.n ? Math.round(s.sum / s.n) : 0; rows.push(bar(name, m / 1.2, k === st.g, s.n ? "avg. " + m + " (" + plural(s.n, "person", "people") + ")" : "No answers yet")); }
          else { var pc = s.n ? Math.round(100 * (s.c[x.metric] || 0) / s.n) : 0; rows.push(bar(name, pc, k === st.g, s.n ? pc + "% " + x.metricLabel + " (" + s.n + ")" : "No answers yet")); }
        });
        area.appendChild(el("h3", null, "How did people answer?"));
        rows.forEach(function (r) { area.appendChild(r); });
        if (total < 20) area.appendChild(el("p", "lead small", "There aren't many results yet. The picture gets clearer as more people take part."));
      }).catch(function () { area.innerHTML = ""; area.appendChild(el("p", "lead", "We can't load the results right now. Try again in a bit.")); });
    }
  }

  /* ───── Spot the Trick ───── */
  function spot(box) {
    var S = window.MizanStages, SKEY = "bsl-spot-stages", i = 0;
    function map() {
      S.render(box, { key: SKEY, bossLabel: "Boss ad: 6 tricks",
        intro: "10 ads for made-up brands, each hiding its tricks better than the last. Tap every line that pulls a trick. Find them all with no mistakes and you get 3 stars.",
        items: G.spot.map(function (ad, k) { return { id: "s" + k, title: ad.brand, sub: plural(ad.lines.filter(function (l) { return l.e; }).length, "trick", "tricks") }; }),
        onPlay: function (k) { i = k; show(); } });
    }
    function show() {
      box.innerHTML = "";
      var ad = G.spot[i], picked = {};
      box.appendChild(el("p", "kicker", "Ad " + (i + 1) + " of " + G.spot.length));
      var card = el("div", "ad"); card.appendChild(el("h2", null, ad.brand));
      var para = el("p", "ad-text");
      ad.lines.forEach(function (l, k) {
        var s = el("span", "line", l.t); s.tabIndex = 0; s.setAttribute("role", "button");
        s.onclick = s.onkeydown = function (e) { if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return; if (e.preventDefault) e.preventDefault(); if (card.classList.contains("done")) return; picked[k] = !picked[k]; s.classList.toggle("picked", !!picked[k]); };
        para.appendChild(s); para.appendChild(document.createTextNode(" "));
      });
      card.appendChild(para); box.appendChild(card);
      var n = ad.lines.filter(function (l) { return l.e; }).length;
      box.appendChild(el("p", "lead small", "This ad has " + plural(n, "trick", "tricks") + ". Tap every line that pulls one."));
      var go = el("button", "btn", "Done, show me"); box.appendChild(go);
      go.onclick = function () {
        card.classList.add("done"); go.remove();
        var spans = para.querySelectorAll(".line"), found = 0, wrong = 0, out = el("div", "spot-out");
        ad.lines.forEach(function (l, k) {
          var s = spans[k];
          if (l.e && picked[k]) { s.classList.add("ok"); found++; }
          else if (l.e) s.classList.add("miss");
          else if (picked[k]) { s.classList.add("bad"); wrong++; }
          if (l.e) { var d = el("div", "ex"), sm = el("small"); sm.appendChild(link(l.e)); d.appendChild(sm); d.appendChild(el("div", null, "“" + l.t + "” " + l.why)); out.appendChild(d); }
        });
        var score = Math.max(0, Math.round(10 * found / n) - wrong * 2);
        S.record(SKEY, "s" + i, score);
        var h = el("h2", null, "You found " + found + " of " + n + (wrong ? ", and flagged " + plural(wrong, "clean line", "clean lines") : ""));
        box.appendChild(h); box.appendChild(el("p", "lead small", "Green: you found it. Yellow: you missed it. Red: that line was clean.")); box.appendChild(out);
        var nx = el("div", "court-end"); nx.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
        nx.appendChild(S.endBar({ score: score, k: i, count: G.spot.length, map: map, play: function (k) { i = k; show(); },
          share: "I caught " + found + " of " + n + " sneaky tricks in the “" + ad.brand + "” ad on Blind Spot Lab 🔍\nHow many can you find? " + location.href.split("?")[0] }));
        box.appendChild(nx);
        h.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
    map();
  }

  /* ───── Which Philosopher Are You? ───── */
  function phil(box) {
    var P = G.phil, i = 0, score = {};
    var order = shuffle(P.qs);
    function q() {
      box.innerHTML = "";
      box.appendChild(el("p", "kicker", "Question " + (i + 1) + " of " + order.length));
      var b = el("div", "bar"), bi = el("i"); bi.style.width = (i / order.length * 100) + "%"; b.appendChild(bi); box.appendChild(b);
      box.appendChild(el("p", "scene", order[i].q));
      var o = el("div", "opts");
      shuffle(order[i].a).forEach(function (a) { var bt = el("button", null, a[0]); bt.onclick = function () { score[a[1]] = (score[a[1]] || 0) + 1; i++; i < order.length ? q() : res(); }; o.appendChild(bt); });
      box.appendChild(o);
    }
    function res() {
      var best = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; })[0], info = G.philNames[best];
      box.innerHTML = "";
      var w = el("div", "center"); w.appendChild(el("p", "kicker", "You're most like"));
      w.appendChild(el("p", "big", info.name)); w.appendChild(el("p", "scene", P.results[best])); box.appendChild(w);
      var p = el("p", "center"); var a = el("a", "btn", "Read about " + info.name); a.href = root + "philosophy/" + best + "/"; p.appendChild(a); p.appendChild(document.createTextNode(" "));
      p.appendChild(shareBtn(function () { return "Which philosopher are you? I got " + info.name + " 🏛️\nFind yours on Blind Spot Lab: " + location.href; })); box.appendChild(p);
      var rev = el("div", "today");
      rev.appendChild(el("h2", null, "A small confession"));
      rev.appendChild(el("p", null, "Read your description again. It could fit almost anyone. We wrote it that way on purpose."));
      rev.appendChild(el("p", null, "It's called the Barnum effect. In 1949, psychologist Bertram Forer gave his students a “personality analysis” he said was written for each of them. In fact, they all got the exact same text, and on average they rated its accuracy 4.26 out of 5."));
      rev.appendChild(el("p", null, "The same trick powers horoscopes and plenty of online personality quizzes. This game is just for fun, not a scientific analysis."));
      box.appendChild(rev);
      var r = el("button", "btn ghost", "Play again"); r.onclick = function () { i = 0; score = {}; order = shuffle(P.qs); q(); }; box.appendChild(r);
    }
    q();
  }

  /* ───── Confidence Check ───── */
  function calib(box) {
    var S = window.MizanStages, KEY = "bsl-calib-stages", st, i, ans;
    function map() {
      S.render(box, { key: KEY, bossLabel: "Boss: numbers and myths",
        intro: "10 stages, 5 statements each. Say true or false, then how sure you are. Stars don't come from right answers alone: they come from confidence that matches what you actually know.",
        items: G.calib.map(function (x, k) { return { id: "c" + k, title: x.title, sub: "5 statements" }; }),
        onPlay: function (k) { st = k; i = 0; ans = []; q(); } });
    }
    function q() {
      box.innerHTML = "";
      var qs = G.calib[st].items, c = qs[i], pick = null;
      box.appendChild(el("p", "kicker", G.calib[st].title + " · Statement " + (i + 1) + " of " + qs.length));
      var b = el("div", "bar"), bi = el("i"); bi.style.width = (i / qs.length * 100) + "%"; b.appendChild(bi); box.appendChild(b);
      box.appendChild(el("p", "scene", c.s));
      var o = el("div", "tf"), conf = el("div", "conf"); conf.hidden = true;
      [["True", true], ["False", false]].forEach(function (x) { var bt = el("button", "btn ghost", x[0]); bt.onclick = function () { pick = x[1]; o.querySelectorAll("button").forEach(function (y) { y.classList.remove("on"); }); bt.classList.add("on"); conf.hidden = false; }; o.appendChild(bt); });
      box.appendChild(o);
      conf.appendChild(el("p", "lead small", "How sure are you?"));
      var row = el("div", "conf-row");
      [50, 60, 70, 80, 90, 100].forEach(function (p) { var bt = el("button", null, p + "%"); bt.onclick = function () { ans.push({ c: c, pick: pick, p: p, ok: pick === c.a }); i++; i < qs.length ? q() : end(); }; row.appendChild(bt); });
      conf.appendChild(row); conf.appendChild(el("p", "lead small", "50% means “just guessing.” 100% means “dead certain.”")); box.appendChild(conf);
    }
    function end() {
      var n = ans.length, right = ans.filter(function (a) { return a.ok; }).length, acc = Math.round(right / n * 100);
      var avg = Math.round(ans.reduce(function (s, a) { return s + a.p; }, 0) / n), gap = avg - acc;
      // Calibration score (Brier): high confidence in a wrong answer costs a lot
      var brier = ans.reduce(function (s, a) { var pr = a.ok ? a.p / 100 : 1 - a.p / 100; return s + (1 - pr) * (1 - pr); }, 0) / n;
      var score = Math.max(0, Math.min(10, Math.round(10 * (1 - 2 * brier))));
      S.record(KEY, "c" + st, score);
      var verdict = gap > 10 ? "Your confidence outruns your knowledge" : gap < -10 ? "You know more than you think" : "Your confidence is well calibrated";
      var tip = gap > 10 ? "Totally normal: most people land here. It's called overconfidence. The fix is saying “I'm not sure” more often." : gap < -10 ? "You got more right than you expected. Don't be afraid to speak up." : "Your confidence is close to your accuracy. That's exactly what good calibration looks like.";
      box.innerHTML = "";
      var w = el("div", "center court-end"); w.appendChild(el("p", "kicker", G.calib[st].title));
      var pair = el("div", "stats");
      [["Correct", acc + "%"], ["Avg. confidence", avg + "%"]].forEach(function (x) { var d = el("div"); d.appendChild(el("b", null, x[1])); d.appendChild(document.createTextNode(x[0])); pair.appendChild(d); });
      w.appendChild(pair); w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score)))); w.appendChild(el("h2", null, verdict)); w.appendChild(el("p", "lead", tip));
      w.appendChild(S.endBar({ score: score, k: st, count: G.calib.length, map: map, play: function (k) { st = k; i = 0; ans = []; q(); },
        share: "Confidence Check on Blind Spot Lab, “" + G.calib[st].title + "”: I was right " + acc + "% of the time and " + avg + "% confident.\n" + verdict + " 🎯 How calibrated are you? " + location.href.split("?")[0] }));
      box.appendChild(w);
      var p = el("p", "center"); var a = el("a", "btn ghost", "Read about overconfidence"); a.href = root + "atlas/overconfidence/"; p.appendChild(a); box.appendChild(p);
      box.appendChild(el("h2", null, "The answers"));
      ans.forEach(function (x) { var d = el("div", "ex"); d.appendChild(el("small", null, (x.ok ? "✅ " : "❌ ") + (x.c.a ? "True" : "False") + " · you were " + x.p + "% sure")); d.appendChild(el("div", null, x.c.s + " " + x.c.n)); box.appendChild(d); });
    }
    map();
  }

  /* ───── Fix the Argument ───── */
  function fix(box) {
    var S = window.MizanStages, KEY = "bsl-fix-stages", st, qs, i, score;
    function map() {
      S.render(box, { key: KEY, bossLabel: "Boss: 3 arguments",
        intro: "10 stages. Each statement has a flaw: pick the version that makes the same point without it. Careful: the wrong versions hide fallacies of their own.",
        items: G.fix.map(function (x, k) { return { id: "x" + k, title: x.title, sub: plural(x.items.length, "statement", "statements") }; }),
        onPlay: play });
    }
    function play(k) { st = k; qs = shuffle(G.fix[k].items); i = 0; score = 0; q(); }
    function q() {
      box.innerHTML = "";
      var c = qs[i];
      box.appendChild(el("p", "kicker", G.fix[st].title + " · Statement " + (i + 1) + " of " + qs.length));
      var b = el("div", "bar"), bi = el("i"); bi.style.width = (i / qs.length * 100) + "%"; b.appendChild(bi); box.appendChild(b);
      box.appendChild(el("p", "claim", c.bad));
      var hint = el("p", "lead small"); hint.appendChild(document.createTextNode("This one contains: ")); hint.appendChild(link(c.e)); hint.appendChild(document.createTextNode(". Which version fixes it best?")); box.appendChild(hint);
      var opts = shuffle([[c.good, null]].concat(c.wrong)), o = el("div", "opts");
      opts.forEach(function (x) {
        var bt = el("button", null, x[0]);
        bt.onclick = function () {
          o.querySelectorAll("button").forEach(function (y, k) { y.disabled = true; if (opts[k][1] === null) y.classList.add("right"); });
          var why = el("div", "note");
          if (x[1] === null) { score++; why.appendChild(document.createTextNode("Right! " + c.why)); }
          else { bt.classList.add("wrong"); why.appendChild(document.createTextNode("That version still contains: ")); why.appendChild(link(x[1])); why.appendChild(document.createTextNode(". " + c.why)); }
          box.appendChild(why);
          var nx = el("button", "btn", i < qs.length - 1 ? "Next" : "See results"); nx.onclick = function () { i++; i < qs.length ? q() : end(); }; box.appendChild(nx);
        };
        o.appendChild(bt);
      });
      box.appendChild(o);
    }
    function end() {
      var sc = Math.round(10 * score / qs.length);
      S.record(KEY, "x" + st, sc);
      box.innerHTML = "";
      var w = el("div", "center court-end"); w.appendChild(el("p", "kicker", G.fix[st].title));
      var big = el("p", "big"); big.textContent = score; big.appendChild(el("small", null, " / " + qs.length)); w.appendChild(big);
      w.appendChild(el("p", "big-stars", S.stars(S.starsFor(sc))));
      w.appendChild(el("h2", null, score === qs.length ? "You don't just spot the flaw, you fix it." : "Fixing an argument is harder than spotting the flaw. Give this stage another try."));
      w.appendChild(S.endBar({ score: sc, k: st, count: G.fix.length, map: map, play: play,
        share: "I fixed " + score + " of " + qs.length + " broken arguments in Fix the Argument on Blind Spot Lab ✍️\nYour turn: " + location.href.split("?")[0] }));
      box.appendChild(w);
    }
    map();
  }

  var box = $("game");
  if (!box) return;
  ({ lab: lab, spot: spot, phil: phil, calib: calib, fix: fix })[box.getAttribute("data-game")](box);
})();
