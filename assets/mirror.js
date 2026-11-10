// The Crowd Mirror: a live board of vote and lab results.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var box = document.getElementById("game");
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function pct(a, n) { return n ? Math.round(100 * a / n) : 0; }
  function stat(n, label) { var d = el("div", "mstat"); d.appendChild(el("b", null, n.toLocaleString("en-US"))); d.appendChild(el("span", null, label)); return d; }
  function hbar(label, p, txt) {
    var w = el("div", "res"), top = el("div", "res-top"); top.appendChild(el("span", null, label)); top.appendChild(el("b", null, txt));
    var b = el("div", "bar"), i = el("i"); i.style.width = Math.max(2, Math.min(100, p)) + "%"; b.appendChild(i); w.appendChild(top); w.appendChild(b); return w;
  }
  function split(it, c) {
    var n = c[0] + c[1], a = pct(c[0], n), card = el("a", "split"); card.href = root + it.url;
    card.appendChild(el("b", null, it.title));
    var bar = el("div", "split-bar"), x = el("i", "sa"), y = el("i", "sb");
    x.style.width = (n ? a : 50) + "%"; y.style.width = (n ? 100 - a : 50) + "%"; bar.appendChild(x); bar.appendChild(y); card.appendChild(bar);
    var lg = el("div", "split-legend");
    lg.appendChild(el("span", "sa", (n ? a + "% " : "") + it.opts[0]));
    lg.appendChild(el("span", "sb", (n ? (100 - a) + "% " : "") + it.opts[1]));
    card.appendChild(lg); card.appendChild(el("small", null, n ? n.toLocaleString("en-US") + (n === 1 ? " vote" : " votes") : "No votes yet"));
    return card;
  }
  box.appendChild(el("p", "lead", "Fetching the latest results…"));
  fetch(window.MIZAN_API + "/mirror").then(function (r) { return r.json(); }).then(function (d) {
    box.innerHTML = "";
    var items = G.items.map(function (it) { var c = d.votes[it.id] || [0, 0]; return { it: it, c: c, n: c[0] + c[1] }; });
    var totalVotes = items.reduce(function (s, x) { return s + x.n; }, 0), labN = 0;
    Object.keys(d.lab).forEach(function (e) { Object.keys(d.lab[e]).forEach(function (g) { labN += d.lab[e][g].n; }); });
    var st = el("div", "mstats"); st.appendChild(stat(totalVotes, totalVotes === 1 ? "vote on dilemmas and questions" : "votes on dilemmas and questions")); st.appendChild(stat(labN, labN === 1 ? "experiment run in the Lab" : "experiments run in the Lab")); box.appendChild(st);
    if (totalVotes + labN < 50) box.appendChild(el("p", "note", "It's early days. The more people take part, the clearer the mirror gets. Go first: vote on a dilemma, or try the Lab."));

    // The Lab
    box.appendChild(el("h2", null, "The crowd's brain in the Lab"));
    G.lab.forEach(function (x) {
      var data = d.lab[x.id] || {}, sec = el("div", "sheet mlab"), any = false;
      sec.appendChild(el("h3", null, x.title));
      x.groupNames.forEach(function (name, k) {
        var s = data[k] || { n: 0, sum: 0, c: [0, 0, 0] }; if (s.n) any = true;
        if (x.num) { var m = s.n ? Math.round(s.sum / s.n) : 0; sec.appendChild(hbar(name, m / 1.2, s.n ? "average " + m + " (" + s.n.toLocaleString("en-US") + ")" : "No one yet")); }
        else { var p = pct(s.c[x.metric] || 0, s.n); sec.appendChild(hbar(name, p, s.n ? p + "% " + x.metricLabel + " (" + s.n.toLocaleString("en-US") + ")" : "No one yet")); }
      });
      sec.appendChild(el("p", "note", any ? x.insight : "No one has tried this yet. Be the first."));
      var a = el("a", "btn ghost", "Try it on yourself"); a.href = root + "games/lab/#exp-" + x.id; sec.appendChild(a);
      box.appendChild(sec);
    });

    // Dilemmas
    var voted = items.filter(function (x) { return x.n >= 5; });
    if (voted.length >= 2) {
      var div = voted.slice().sort(function (a, b) { return Math.abs(a.c[0] / a.n - .5) - Math.abs(b.c[0] / b.n - .5); })[0];
      var agree = voted.slice().sort(function (a, b) { return Math.abs(b.c[0] / b.n - .5) - Math.abs(a.c[0] / a.n - .5); })[0];
      box.appendChild(el("h2", null, "The question that split people most"));
      box.appendChild(split(div.it, div.c));
      box.appendChild(el("h2", null, "The question people agreed on most"));
      box.appendChild(split(agree.it, agree.c));
    }
    box.appendChild(el("h2", null, "All questions"));
    var g = el("div", "splits");
    items.sort(function (a, b) { return b.n - a.n; }).forEach(function (x) { g.appendChild(split(x.it, x.c)); });
    box.appendChild(g);
    box.appendChild(el("p", "note", "Results are fully anonymous and update every 5 minutes. This is what Blind Spot Lab visitors think, not a scientific sample of the public."));
    // Most-played games this week
    var gs = el("section"); box.appendChild(gs);
    fetch(window.MIZAN_API + "/evt?days=7").then(function (r) { return r.json(); }).then(function (ev) {
      var GN = G.gameNames || {}, list = Object.keys(ev.games || {}).map(function (k) { return { k: k, s: ev.games[k].start || 0, d: ev.games[k].done || 0 }; }).filter(function (x) { return x.s >= 3 && GN[x.k]; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
      if (!list.length) return;
      gs.appendChild(el("h2", null, "Most-played games this week"));
      var mx = list[0].s;
      list.forEach(function (x) { var row = hbar(GN[x.k], x.s / mx * 100, x.s.toLocaleString("en-US") + (x.s === 1 ? " play" : " plays")); gs.appendChild(row); });
    }).catch(function () {});
  }).catch(function () { box.innerHTML = ""; box.appendChild(el("p", "lead", "We can't load the results right now. Try again in a bit.")); });
})();
