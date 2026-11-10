// Debate Dot: ready-made debates in stages, plus free-form AI debates for account holders.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {}, S = window.MizanStages;
  var box = document.getElementById("game"), KEY = "bsl-debate-stages", ZINA = root + "assets/zina/";
  var fast = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ava(face) { var i = el("img", "ava"); i.src = ZINA + (face || "explain") + ".webp"; i.alt = ""; return i; }

  function tabs(cur) {
    var t = el("div", "tf db-tabs");
    [["stages", "Ready-made stages"], ["ai", "Free debate ✨"]].forEach(function (x) {
      var b = el("button", "btn ghost" + (x[0] === cur ? " on" : ""), x[1]); b.type = "button";
      b.onclick = function () { x[0] === "ai" ? aiHome() : map(); };
      t.appendChild(b);
    });
    return t;
  }
  function chat(title) {
    var phone = el("div", "chat"), top = el("div", "chat-top");
    top.appendChild(el("b", null, title)); top.appendChild(el("span", null, "Dot argues against you; you defend your side"));
    phone.appendChild(top);
    var feed = el("div", "chat-feed"); phone.appendChild(feed);
    return { phone: phone, feed: feed };
  }
  function bubble(feed, text, mine, face) {
    var row = el("div", "msg-row" + (mine ? " me" : "")), b = el("div", "msg" + (mine ? " me" : ""));
    if (!mine) { row.appendChild(ava(face)); b.appendChild(el("small", null, "Dot")); }
    b.appendChild(el("p", null, text)); row.appendChild(b); feed.appendChild(row); feed.scrollTop = feed.scrollHeight;
    return b;
  }
  function typing(feed) { var t = el("div", "typing"); t.appendChild(ava("think")); t.appendChild(el("span", null, "Dot is thinking")); var d = el("i", "dots"); d.innerHTML = "<b></b><b></b><b></b>"; t.appendChild(d); feed.appendChild(t); feed.scrollTop = feed.scrollHeight; return t; }

  // ───── Ready-made stages ─────
  function map() {
    box.innerHTML = "";
    var wrap = el("div"); box.appendChild(tabs("stages")); box.appendChild(wrap);
    S.render(wrap, { key: KEY, intro: G.intro, bossLabel: "Boss debate",
      items: G.topics.map(function (t, k) { return { id: "d" + k, title: t.title, sub: "3 rounds", icon: ZINA + "explain.webp" }; }), onPlay: play });
  }
  function play(k) {
    var T = G.topics[k], r = 0, pts = 0;
    box.innerHTML = "";
    box.appendChild(el("p", "kicker", "Debate " + (k + 1) + " of " + G.topics.length));
    box.appendChild(el("p", "lead", T.you));
    var c = chat("Debate: " + T.title); box.appendChild(c.phone);
    var act = el("div", "chat-act"); box.appendChild(act);
    function round() {
      if (r >= T.rounds.length) return end();
      var R = T.rounds[r], t = typing(c.feed);
      setTimeout(function () {
        t.remove(); bubble(c.feed, R.z, false, "explain");
        act.innerHTML = ""; act.appendChild(el("p", "kicker", "Round " + (r + 1) + " of " + T.rounds.length + ": how do you respond?"));
        var o = el("div", "opts");
        shuffle(R.opts).forEach(function (op) {
          var b = el("button", null, op.t);
          b.onclick = function () {
            act.innerHTML = ""; bubble(c.feed, op.t, true);
            pts += op.k === "strong" ? 10 : op.k === "weak" ? 4 : 1;
            var t2 = typing(c.feed);
            setTimeout(function () {
              t2.remove();
              var bb = bubble(c.feed, op.r, false, op.k === "strong" ? "shock" : op.k === "fallacy" ? "wink" : "think");
              var tag = el("p", "db-tag db-" + op.k, G.kinds[op.k]);
              if (op.f) { tag.appendChild(document.createTextNode(": ")); var a = el("a", null, NAMES[op.f] || op.f); a.href = root + "atlas/" + op.f + "/"; tag.appendChild(a); }
              bb.appendChild(tag);
              if (window.MizanFX && MizanFX.zina) MizanFX.zina(op.k === "strong" ? "right" : "wrong");
              r++; var nx = el("button", "btn", r < T.rounds.length ? "Next round" : "See results"); nx.onclick = round; act.appendChild(nx);
            }, fast ? 100 : 900);
          };
          o.appendChild(b);
        });
        act.appendChild(o);
      }, fast ? 100 : 900);
    }
    function end() {
      var score = Math.round(pts / T.rounds.length);
      S.record(KEY, "d" + k, score);
      if (window.MizanAuth && MizanAuth.score) MizanAuth.score("debate", score);
      act.innerHTML = "";
      var w = el("div", "court-end");
      w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
      w.appendChild(el("p", "lead", score >= 9 ? "You won the debate! You answered the actual argument every round." : score >= 6 ? "Good debate, but in at least one round you went after the person or dodged the point." : "Dot wins this time. Try again, and look for the reply that tackles the argument itself."));
      if (score < 9) { var again = el("button", "btn ghost", "Rematch"); again.onclick = function () { play(k); }; w.appendChild(again); }
      w.appendChild(S.endBar({ score: score, k: k, count: G.topics.length, play: play, map: map,
        share: "I debated Dot on “" + T.title + "” on Blind Spot Lab and scored " + score + " / 10 🔬\nCan you win the argument? " + location.href.split("?")[0] }));
      act.appendChild(w);
    }
    round();
  }

  // ───── Free debate (AI) ─────
  function api(body) {
    var M = window.MizanAuth;
    body.lang = "en";
    return M.token().then(function (t) {
      return fetch(window.MIZAN_API + "/debate", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + t }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw d; return d; }); });
    });
  }
  function aiHome() {
    var M = window.MizanAuth;
    box.innerHTML = ""; box.appendChild(tabs("ai"));
    var s = el("div", "today");
    s.appendChild(el("h2", null, "Free debate with Dot"));
    s.appendChild(el("p", "lead", "Pick a topic or write your own, then say whether you're for or against. Dot takes the other side and argues back for real. After each reply, Dot flags any fallacy in what you wrote, and at the end gives a verdict on the whole debate."));
    s.appendChild(el("p", "note", "Free debates are for account holders only: 3 debates a day, up to 6 replies from you per debate. What you write is sent to an AI to generate a response. It's never published."));
    box.appendChild(s);
    var stt = el("p", "sub"); s.appendChild(stt);
    if (!M) { stt.textContent = "Accounts aren't available right now."; return; }
    M.ready().then(function () {
      if (!M.user()) {
        stt.textContent = "Sign in first to get started.";
        var a = el("a", "btn", "Sign in"); a.href = root + "account/"; s.appendChild(a); return;
      }
      var f = el("form", "db-form");
      f.appendChild(el("label", null, "Topic"));
      var sel = el("select"); G.ai.topics.forEach(function (t) { var o = el("option", null, t); o.value = t; sel.appendChild(o); });
      var oc = el("option", null, "My own topic…"); oc.value = ""; sel.appendChild(oc); f.appendChild(sel);
      var own = el("input"); own.type = "text"; own.maxLength = 120; own.placeholder = "Write it as a statement, like: “Summer is better than winter”"; own.hidden = true; f.appendChild(own);
      sel.onchange = function () { own.hidden = sel.value !== ""; if (!own.hidden) own.focus(); };
      var side = "pro", sd = el("div", "tf");
      [["pro", "I'm for it"], ["con", "I'm against it"]].forEach(function (x) {
        var b = el("button", "btn ghost" + (x[0] === side ? " on" : ""), x[1]); b.type = "button";
        b.onclick = function () { side = x[0]; sd.querySelectorAll("button").forEach(function (y) { y.classList.remove("on"); }); b.classList.add("on"); };
        sd.appendChild(b);
      });
      f.appendChild(sd);
      var go = el("button", "btn", "Start the debate"); go.type = "submit"; f.appendChild(go);
      f.onsubmit = function (e) {
        e.preventDefault();
        var topic = (sel.value || own.value).trim();
        if (topic.length < 5) { stt.textContent = "Write a clearer topic."; return; }
        go.disabled = true; stt.textContent = "Dot is getting ready…";
        api({ action: "start", topic: topic, side: side }).then(function (d) { aiRun(topic, side, d); }, function (e) { go.disabled = false; stt.textContent = (e && e.error) || "We can't reach the server right now."; });
      };
      s.appendChild(f);
    });
  }
  function aiRun(topic, side, d) {
    var id = d.id, turns = 0, scores = [], MAXT = d.max || 6;
    box.innerHTML = "";
    box.appendChild(el("p", "kicker", "Free debate · " + d.left + (d.left === 1 ? " debate" : " debates") + " left today"));
    box.appendChild(el("p", "lead", "Topic: “" + topic + "”. You're " + (side === "pro" ? "for" : "against") + " it, and Dot is " + (side === "pro" ? "against" : "for") + " it."));
    var c = chat("Free debate"); box.appendChild(c.phone);
    bubble(c.feed, d.reply, false, "explain");
    var meter = el("p", "db-meter"); box.appendChild(meter);
    var f = el("form", "db-input"), ta = el("textarea"); ta.maxLength = 500; ta.rows = 3; ta.placeholder = "Write your reply (up to 500 characters)";
    var send = el("button", "btn", "Send"); send.type = "submit"; f.appendChild(ta); f.appendChild(send); box.appendChild(f);
    var stt = el("p", "sub"); box.appendChild(stt);
    function upd() { meter.textContent = "Your replies: " + turns + " of " + MAXT + (scores.length ? " · Argument strength: " + (scores.reduce(function (a, b) { return a + b; }, 0) / scores.length).toFixed(1) + " / 10" : ""); }
    upd();
    f.onsubmit = function (e) {
      e.preventDefault();
      var text = ta.value.trim(); if (text.length < 5) { stt.textContent = "Write a slightly longer reply."; return; }
      send.disabled = true; ta.disabled = true; stt.textContent = "";
      var mine = bubble(c.feed, text, true), t = typing(c.feed);
      api({ action: "turn", id: id, text: text }).then(function (r) {
        t.remove(); turns++;
        if (typeof r.score === "number") scores.push(r.score);
        if (r.fallacies && r.fallacies.length) r.fallacies.forEach(function (x) {
          var tag = el("p", "db-tag db-fallacy", "Spotted: "); var a = el("a", null, NAMES[x.slug] || x.slug); a.href = root + "atlas/" + x.slug + "/"; tag.appendChild(a); tag.appendChild(document.createTextNode(". " + x.why)); mine.appendChild(tag);
        });
        else mine.appendChild(el("p", "db-tag db-strong", "No obvious fallacy ✓"));
        bubble(c.feed, r.reply, false, r.fallacies && r.fallacies.length ? "wink" : "think");
        upd();
        if (r.done) {
          f.remove();
          var w = el("div", "today");
          w.appendChild(el("p", "kicker", "Dot's verdict"));
          w.appendChild(el("p", "lead", r.final || "The debate is over."));
          var avg = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : 0;
          w.appendChild(el("p", "big-stars", S.stars(S.starsFor(avg))));
          try { var b = JSON.parse(localStorage.getItem("bsl-debate-ai") || "{}"); b.n = (b.n || 0) + 1; b.best = Math.max(b.best || 0, Math.round(avg)); localStorage.setItem("bsl-debate-ai", JSON.stringify(b)); } catch (e2) {}
          var again = el("button", "btn", "New debate"); again.onclick = aiHome; w.appendChild(again);
          box.appendChild(w);
        } else { send.disabled = false; ta.disabled = false; ta.value = ""; ta.focus(); }
      }, function (er) { t.remove(); send.disabled = false; ta.disabled = false; stt.textContent = (er && er.error) || "We can't reach the server. Try again."; });
    };
  }

  document.addEventListener("DOMContentLoaded", function () { if (/[?&]mode=ai/.test(location.search)) aiHome(); else map(); });
})();
