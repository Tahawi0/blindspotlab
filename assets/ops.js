// Numbers board (for the site owner): who plays what, who finishes, where they drop off, and today's AI spend.
(function () {
  var G = window.MIZAN_GAME || {}, box = document.getElementById("game");
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function bar(p, cls) { var b = el("div", "bar ops-bar" + (cls ? " " + cls : "")), i = el("i"); i.style.width = Math.max(0, Math.min(100, p)) + "%"; b.appendChild(i); return b; }
  var days = 7;
  function load() {
    box.innerHTML = ""; box.appendChild(el("p", "lead", "One moment…"));
    fetch(window.MIZAN_API + "/evt?days=" + days).then(function (r) { return r.json(); }).then(render, function () { box.innerHTML = ""; box.appendChild(el("p", "lead", "Can't reach the server.")); });
  }
  function render(d) {
    box.innerHTML = "";
    var tf = el("div", "tf");
    [[1, "Today"], [7, "7 days"], [30, "30 days"]].forEach(function (x) { var b = el("button", "btn ghost" + (x[0] === days ? " on" : ""), x[1]); b.type = "button"; b.onclick = function () { days = x[0]; load(); }; tf.appendChild(b); });
    box.appendChild(tf);
    var o = d.ops || {}, st = el("div", "stats");
    [[(o.analyze ? o.analyze.used + " / " + o.analyze.limit : "-"), "analyses today"], [(o.debate ? o.debate.used + " / " + o.debate.limit : "-"), "free-debate replies today"], [o.users || 0, o.users === 1 ? "account" : "accounts"], [o.league || 0, "in the League"]].forEach(function (x) { var c = el("div"); c.appendChild(el("b", null, String(x[0]))); c.appendChild(document.createTextNode(x[1])); st.appendChild(c); });
    box.appendChild(st);
    if (o.debate && o.debate.used / o.debate.limit > .8) box.appendChild(el("p", "note", "⚠ Free debate is close to today's limit. If this keeps happening, consider raising the limit or making it a Blind Spot Lab Plus feature."));
    var names = G.names || {}, list = Object.keys(d.games || {}).map(function (k) { var g = d.games[k]; return { k: k, s: g.start || 0, d: g.done || 0, st: g.stages || [] }; }).sort(function (a, b) { return b.s - a.s; });
    box.appendChild(el("h2", null, "Games (" + d.since + " to today)"));
    if (!list.length) { box.appendChild(el("p", "lead", "No plays in this period yet.")); return; }
    var mx = list[0].s || 1, t = el("table", "duel-table ops-table"), h = el("tr");
    ["Game", "Started", "Finished", "Completion rate", ""].forEach(function (x) { h.appendChild(el("th", null, x)); }); t.appendChild(h);
    list.forEach(function (g) {
      var r = el("tr"), rate = g.s ? Math.round(g.d / g.s * 100) : 0;
      r.appendChild(el("td", null, names[g.k] || g.k)); r.appendChild(el("td", null, String(g.s))); r.appendChild(el("td", null, String(g.d)));
      var c = el("td", null, rate + "%"); c.className = rate >= 60 ? "ok" : rate < 30 ? "no" : ""; r.appendChild(c);
      var bc = el("td"); bc.appendChild(bar(g.s / mx * 100)); r.appendChild(bc); t.appendChild(r);
    });
    box.appendChild(t);
    box.appendChild(el("p", "sub", "\u201cFinished\u201d counts once per completed level, so it can be higher than \u201cStarted\u201d in games with levels."));
    box.appendChild(el("h2", null, "How far people get"));
    box.appendChild(el("p", "lead", "Each bar is how many times a level was opened. A big drop between two levels means the level before the drop may be too hard or too boring."));
    list.filter(function (g) { return g.st.length > 1; }).forEach(function (g) {
      var sec = el("section", "ops-game"); sec.appendChild(el("h3", null, names[g.k] || g.k));
      var m = Math.max.apply(null, g.st) || 1;
      g.st.forEach(function (n, i) {
        var row = el("div", "ops-row"), drop = i > 0 && g.st[i - 1] >= 5 && n < g.st[i - 1] * .5;
        row.appendChild(el("span", null, "L" + (i + 1))); row.appendChild(bar(n / m * 100, drop ? "drop" : "")); row.appendChild(el("b", null, String(n) + (drop ? " ⬇" : "")));
        sec.appendChild(row);
      });
      box.appendChild(sec);
    });
  }
  load();
})();
