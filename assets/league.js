// The League: a weekly leaderboard under a nickname the player picks.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var box = document.getElementById("game");
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function signedFlag() { try { return localStorage.getItem("bsl-signed-in") === "1"; } catch (e) { return false; } }
  function token() {
    if (!signedFlag() || !window.MizanAuth) return Promise.resolve(null);
    return MizanAuth.ready().then(function () { return MizanAuth.token(); }).catch(function () { return null; });
  }
  function call(method, path, body) {
    return token().then(function (t) {
      var h = { "Content-Type": "application/json" }; if (t) h.Authorization = "Bearer " + t;
      return fetch(window.MIZAN_API + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json().then(function (j) { j._status = r.status; return j; }); });
    });
  }
  var MEDAL = ["1", "2", "3"];
  function ptsTxt(n) { return n + (n === 1 ? " point" : " points"); }

  function render(d) {
    box.innerHTML = "";
    var me = d.me, myNick = me && me.member ? me.nick : null;
    // My box
    var mine = el("div", "today league-me");
    if (!me) {
      mine.appendChild(el("h2", null, "Join The League"));
      mine.appendChild(el("p", null, "The League is for account holders only, so points are counted fairly. Sign in with Google or email, then pick a nickname."));
      var a = el("a", "btn", "Sign in"); a.href = root + "account/"; mine.appendChild(a);
    } else if (!me.member) {
      mine.appendChild(el("h2", null, "Pick your nickname"));
      mine.appendChild(el("p", null, "Your nickname is what shows on the leaderboard. Your real name and email are never shown to anyone."));
      mine.appendChild(nickForm("Join The League"));
    } else {
      mine.appendChild(el("p", "kicker", "Your League nickname"));
      mine.appendChild(el("h2", "prof-title", me.nick));
      var s = el("div", "mstats");
      [[me.pts, me.pts === 1 ? "point this week" : "points this week"], [me.rank, "your rank"]].forEach(function (x) { var dv = el("div", "mstat"); dv.appendChild(el("b", null, String(x[0]))); dv.appendChild(el("span", null, x[1])); s.appendChild(dv); });
      mine.appendChild(s);
      var played = {}; (me.today || []).forEach(function (r) { played[r.game] = r.pts; });
      var ul = el("ul", "league-today");
      G.games.forEach(function (g) {
        var li = el("li", played[g.id] != null ? "done" : ""), a2 = el("a", null, g.name); a2.href = root + g.url;
        li.appendChild(a2); li.appendChild(el("span", null, played[g.id] != null ? played[g.id] + " / 10 today" : "Not yet"));
        ul.appendChild(li);
      });
      mine.appendChild(el("h3", "sub", "Today's games"));
      mine.appendChild(ul);
      var tools = el("p", "league-tools"), ch = el("button", "btn ghost", "Change nickname"), lv = el("button", "btn ghost", "Leave The League");
      ch.onclick = function () { ch.replaceWith(nickForm("Save new nickname", me.nick)); };
      lv.onclick = function () {
        if (lv.dataset.sure !== "1") { lv.dataset.sure = "1"; lv.textContent = "Sure? Your points will be erased. Tap again"; return; }
        lv.disabled = true; call("DELETE", "/league/join").then(refresh);
      };
      tools.appendChild(ch); tools.appendChild(document.createTextNode(" ")); tools.appendChild(lv); mine.appendChild(tools);
    }
    box.appendChild(mine);

    // Leaderboard
    box.appendChild(el("h2", null, "This week's leaderboard"));
    box.appendChild(el("p", "lead", "Each week runs Saturday through Friday and resets at midnight Cairo time (Friday afternoon in the US). " + d.members + (d.members === 1 ? " player" : " players") + " so far."));
    if (!d.top.length) box.appendChild(el("p", "note", "No one has scored this week yet. Play any game below and grab first place."));
    else {
      var pod = el("div", "podium");
      [1, 0, 2].forEach(function (k) { var r = d.top[k]; if (!r) return; var c = el("div", "pod p" + (k + 1) + (r.nick === myNick ? " mine" : "")); c.appendChild(el("b", null, r.nick)); c.appendChild(el("small", null, ptsTxt(r.pts))); var st = el("div", "step"); st.appendChild(el("span", null, MEDAL[k])); c.appendChild(st); pod.appendChild(c); });
      box.appendChild(pod);
      if (me && me.member && me.rank === 1 && me.pts > 0 && window.MizanFX) MizanFX.confetti();
      var ol = el("ol", "board");
      d.top.forEach(function (r, i) {
        var li = el("li", (i < 3 ? "top top" + (i + 1) : "") + (r.nick === myNick ? " mine" : ""));
        li.appendChild(el("span", "pos", i < 3 ? MEDAL[i] : String(i + 1)));
        li.appendChild(el("b", null, r.nick)); li.appendChild(el("span", "pts", ptsTxt(r.pts)));
        ol.appendChild(li);
      });
      box.appendChild(ol);
    }
    if (d.last && d.last.length) {
      box.appendChild(el("h2", null, "Last week's champions"));
      var p = el("div", "champs");
      d.last.forEach(function (r, i) { var c = el("div", "champ c" + (i + 1)); c.appendChild(el("span", null, MEDAL[i])); c.appendChild(el("b", null, r.nick)); c.appendChild(el("small", null, ptsTxt(r.pts))); p.appendChild(c); });
      box.appendChild(p);
    }
    // Rules
    box.appendChild(el("h2", null, "How to earn points"));
    var rl = el("ul", "index");
    G.games.forEach(function (g) { var li = el("li"), a3 = el("a"); a3.href = root + g.url; a3.appendChild(el("b", null, g.name)); a3.appendChild(el("em", null, "Up to 10 points")); a3.appendChild(el("span", null, g.rule)); li.appendChild(a3); rl.appendChild(li); });
    box.appendChild(rl);
    box.appendChild(el("p", "note", "Each game counts once a day, and we keep your best score. That means 60 points a day, max. The League is just for fun: the point is to play every day and learn something."));
  }

  function nickForm(label, val) {
    var f = el("form", "num-form nick-form"), inp = el("input"); inp.type = "text"; inp.maxLength = 20; inp.placeholder = "Nickname"; inp.required = true; inp.value = val || ""; inp.setAttribute("aria-label", "Your League nickname");
    var b = el("button", "btn", label); b.type = "submit";
    var msg = el("p", "esc-msg bad");
    f.appendChild(inp); f.appendChild(b);
    var w = el("div"); w.appendChild(f); w.appendChild(msg);
    f.onsubmit = function (e) {
      e.preventDefault(); b.disabled = true; msg.textContent = "";
      call("POST", "/league/join", { nick: inp.value }).then(function (j) {
        if (j.ok) refresh(); else { msg.textContent = j.error || "Something went wrong. Try again."; b.disabled = false; }
      }).catch(function () { msg.textContent = "Connection problem. Try again."; b.disabled = false; });
    };
    return w;
  }

  function refresh() {
    call("GET", "/league").then(render).catch(function () { box.innerHTML = ""; box.appendChild(el("p", "lead", "We can't load the leaderboard right now. Try again in a bit.")); });
  }
  box.appendChild(el("p", "lead", "Loading the leaderboard…"));
  refresh();
})();
