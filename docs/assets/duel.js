// Challenge a Friend: 5 questions and a link with your score. Your friend plays the same questions and you compare answer by answer.
// All the data lives in the link itself; nothing is stored on the server.
(function () {
  var all = window.MIZAN_PUZZLES || [], root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {}, box = document.getElementById("game"), N = 5;
  var byId = {}; all.forEach(function (p) { byId[p.id] = p; });
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function dec(s) { try { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; } }
  function nick(s) { return String(s || "").replace(/[<>]/g, "").trim().slice(0, 20); }
  function bits(a) { return Array.isArray(a) && a.length === N && a.every(function (x) { return x === 0 || x === 1; }); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function link(o) { return location.origin + location.pathname + "?d=" + enc(o); }
  function share(text, btn) {
    if (navigator.share) navigator.share({ text: text }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { btn.textContent = "Link copied ✓"; });
  }

  var d = dec(new URLSearchParams(location.search).get("d") || "");
  if (d && !(Array.isArray(d.q) && d.q.length === N && d.q.every(function (x) { return byId[x]; }) && bits(d.a) && nick(d.n))) d = null;
  if (d && d.a2 && !(bits(d.a2) && nick(d.n2))) d.a2 = null;
  var myName = ""; try { myName = localStorage.getItem("bsl-duel-name") || ""; } catch (e) {}

  function nameForm(lead, cb) {
    box.innerHTML = "";
    var s = el("div", "today");
    s.appendChild(el("p", "lead", lead));
    var f = el("form", "nick-form"), inp = el("input"); inp.maxLength = 20; inp.placeholder = "Your name (your friend will see it)"; inp.value = myName; inp.required = true;
    var b = el("button", "btn", "Let's go"); b.type = "submit"; f.appendChild(inp); f.appendChild(b); s.appendChild(f);
    f.onsubmit = function (e) { e.preventDefault(); var v = nick(inp.value); if (!v) return; myName = v; try { localStorage.setItem("bsl-duel-name", v); } catch (x) {} cb(); };
    box.appendChild(s);
  }

  function quiz(qs, rival, done) {
    if (window.MizanTrack) MizanTrack("duel", "start");
    var i = 0, ans = [];
    function ask() {
      box.innerHTML = "";
      var p = byId[qs[i]];
      box.appendChild(el("p", "kicker", "Question " + (i + 1) + " of " + N + (rival ? " · " + rival.n + " got it " + (rival.a[i] ? "right ✓" : "wrong ✗") : "")));
      var bar = el("div", "bar"), bi = el("i"); bi.style.width = (i / N * 100) + "%"; bar.appendChild(bi); box.appendChild(bar);
      box.appendChild(el("p", "scene", p.scene));
      box.appendChild(el("p", "lead", "What's the fallacy here?"));
      var o = el("div", "opts"), why = el("p", "note");
      p.options.forEach(function (t, k) {
        var b = el("button", null, t);
        b.onclick = function () {
          o.querySelectorAll("button").forEach(function (x, j) { x.disabled = true; if (j === p.answer) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
          ans.push(k === p.answer ? 1 : 0);
          if (p.why) { why.textContent = p.why; box.appendChild(why); }
          var nx = el("button", "btn", i < N - 1 ? "Next" : "See results"); nx.onclick = function () { i++; if (i < N) ask(); else { if (window.MizanTrack) MizanTrack("duel", "done"); done(ans); } };
          box.appendChild(nx);
        };
        o.appendChild(b);
      });
      box.appendChild(o);
    }
    ask();
  }

  function table(o) {
    var t = el("table", "duel-table"), h = el("tr");
    ["", o.n, o.n2].forEach(function (x) { h.appendChild(el("th", null, x)); }); t.appendChild(h);
    o.q.forEach(function (id, i) {
      var r = el("tr"), p = byId[id];
      var c0 = el("td"), a = el("a", null, NAMES[p.entry] || ("Question " + (i + 1))); a.href = root + "atlas/" + p.entry + "/"; c0.appendChild(a); r.appendChild(c0);
      r.appendChild(el("td", o.a[i] ? "ok" : "no", o.a[i] ? "✓" : "✗")); r.appendChild(el("td", o.a2[i] ? "ok" : "no", o.a2[i] ? "✓" : "✗"));
      t.appendChild(r);
    });
    var f = el("tr", "duel-sum"); f.appendChild(el("td", null, "Total")); f.appendChild(el("td", null, sum(o.a) + " / " + N)); f.appendChild(el("td", null, sum(o.a2) + " / " + N)); t.appendChild(f);
    return t;
  }
  // me: "b" if you accepted the challenge, null if you are just viewing a result
  function verdict(o, me) {
    var a = sum(o.a), b = sum(o.a2);
    if (a === b) return "It's a tie, " + a + " to " + b + "! Time for a rematch.";
    var bWins = b > a, txt = me === "b" ? (bWins ? "You win" : o.n + " wins") : (bWins ? o.n2 : o.n) + " wins";
    return txt + ", " + Math.max(a, b) + " to " + Math.min(a, b) + "!";
  }

  function fresh() {
    nameForm("Challenge a friend to 5 fallacy questions. You play first, then send them a link with your score. They get the exact same questions and see how you answered each one.", function () {
      var qs = shuffle(all.map(function (p) { return p.id; })).slice(0, N);
      quiz(qs, null, function (ans) {
        box.innerHTML = "";
        var w = el("div", "today");
        w.appendChild(el("p", "big-score", sum(ans) + " / " + N));
        w.appendChild(el("p", "lead", "Now send the challenge. Your friend will see your answers question by question as they play."));
        var url = link({ n: myName, q: qs, a: ans }), b = el("button", "btn", "Send the challenge");
        b.onclick = function () { share(myName + " spotted " + sum(ans) + " / " + N + " fallacies on Blind Spot Lab. Think you can do better? ⚔\n" + url, b); };
        w.appendChild(b); box.appendChild(w);
        try { localStorage.setItem("bsl-duel", JSON.stringify({ sent: 1 })); } catch (e) {}
      });
    });
  }

  function accept() {
    nameForm(d.n + " is challenging you! They scored " + sum(d.a) + " / " + N + " on these exact questions. As you play, you'll see how they answered each one.", function () {
      quiz(d.q, d, function (ans) {
        var o = { n: d.n, q: d.q, a: d.a, n2: myName, a2: ans };
        box.innerHTML = "";
        var w = el("div", "today");
        w.appendChild(el("p", "kicker", "Results"));
        w.appendChild(el("h2", null, verdict(o, "b")));
        w.appendChild(table(o));
        var b = el("button", "btn", "Send them the results"), nw = el("button", "btn ghost", "New challenge");
        b.onclick = function () { share("Challenge results on Blind Spot Lab: " + o.n + " vs. " + o.n2 + " ⚔\n" + o.n2 + " scored " + sum(o.a2) + " / " + N + ", " + o.n + " scored " + sum(o.a) + " / " + N + ".\nSee the breakdown:\n" + link(o), b); };
        nw.onclick = function () { history.replaceState(null, "", location.pathname); d = null; fresh(); };
        var p = el("p"); p.appendChild(b); p.appendChild(document.createTextNode(" ")); p.appendChild(nw); w.appendChild(p);
        box.appendChild(w);
        if (window.MizanAuth && MizanAuth.score) MizanAuth.score("duel", sum(ans) * 2);
        try { var r = JSON.parse(localStorage.getItem("bsl-duel") || "{}"); r.played = (r.played || 0) + 1; if (sum(ans) > sum(d.a)) r.won = (r.won || 0) + 1; localStorage.setItem("bsl-duel", JSON.stringify(r)); } catch (e) {}
      });
    });
  }

  function view() {
    box.innerHTML = "";
    var w = el("div", "today");
    w.appendChild(el("p", "kicker", "Challenge results"));
    w.appendChild(el("h2", null, verdict(d, null)));
    w.appendChild(table(d));
    var nw = el("button", "btn", "New match"); nw.onclick = function () { history.replaceState(null, "", location.pathname); d = null; fresh(); };
    w.appendChild(nw); box.appendChild(w);
  }

  if (!d) fresh(); else if (d.a2) view(); else accept();
})();
