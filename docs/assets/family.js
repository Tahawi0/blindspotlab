// The Family Group Chat: 10 stages, each a bad message that needs a smart reply without upsetting anyone.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {}, S = window.MizanStages;
  var box = document.getElementById("game"), KEY = "bsl-family-stages";
  var KIND = { attack: "Went on the attack", quiet: "Stayed silent", smart: "Calm, smart reply" };
  var SCORE = { smart: 10, quiet: 4, attack: 3 };
  var REACT = { smart: ["❤️", "👏", "😊"], attack: ["😠", "💢"], quiet: ["😐"] };
  var fast = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function clamp(v) { return Math.max(0, Math.min(10, v)); }
  function avatar(who) { var i = el("img", "ava"); i.src = root + "assets/family/" + who + ".webp"; i.alt = ""; return i; }

  function map() {
    S.render(box, {
      key: KEY, bossLabel: "Boss stage: the scam message",
      intro: "10 moments in the family group chat, each harder than the last. Your goal: don't let the bad take slide, and don't start a family feud. A calm, smart reply earns 3 stars.",
      items: G.rounds.map(function (R, k) { return { id: "f" + k, title: R.title, sub: G.people[R.msgs[0].who], icon: root + "assets/family/" + R.msgs[0].who + ".webp" }; }),
      onPlay: play
    });
  }

  function play(k) {
    var R = G.rounds[k], warm = 5, conv = 3;
    box.innerHTML = "";
    var meters = el("div", "meters");
    function meter(name) { var w = el("div", "meter"), l = el("span", null, name), b = el("div", "bar"), i = el("i"); b.appendChild(i); w.appendChild(l); w.appendChild(b); return { w: w, i: i }; }
    var mw = meter("Goodwill"), mc = meter("Persuasion"); meters.appendChild(mw.w); meters.appendChild(mc.w);
    function upd() { mw.i.style.width = clamp(warm) * 10 + "%"; mc.i.style.width = clamp(conv) * 10 + "%"; }
    var phone = el("div", "chat"), top = el("div", "chat-top");
    top.appendChild(el("b", null, G.group + " · Stage " + (k + 1)));
    top.appendChild(el("span", null, Object.keys(G.people).map(function (x) { return G.people[x]; }).join(", ") + ", and you"));
    phone.appendChild(top);
    var feed = el("div", "chat-feed"); phone.appendChild(feed);
    var act = el("div", "chat-act");
    box.appendChild(meters); box.appendChild(phone); box.appendChild(act); upd();

    function bubble(who, text, mine) {
      var row = el("div", "msg-row" + (mine ? " me" : "")), b = el("div", "msg" + (mine ? " me" : ""));
      if (!mine) { row.appendChild(avatar(who)); b.appendChild(el("small", null, G.people[who])); }
      b.appendChild(el("p", null, text)); row.appendChild(b); feed.appendChild(row); feed.scrollTop = feed.scrollHeight;
      return b;
    }
    function say(list, then) {
      var j = 0;
      (function next() {
        if (j >= list.length) return then();
        var m = list[j++], typing = el("div", "typing"); typing.appendChild(avatar(m.who)); typing.appendChild(el("span", null, G.people[m.who] + " is typing"));
        var dots = el("i", "dots"); dots.innerHTML = "<b></b><b></b><b></b>"; typing.appendChild(dots);
        feed.appendChild(typing); feed.scrollTop = feed.scrollHeight;
        setTimeout(function () { typing.remove(); bubble(m.who, m.text); next(); }, fast ? 150 : 1000);
      })();
    }
    say(R.msgs, function () {
      act.appendChild(el("p", "kicker", "What do you say?"));
      var o = el("div", "opts");
      shuffle(R.replies).forEach(function (rep) {
        var b = el("button", null, rep.text);
        b.onclick = function () {
          act.innerHTML = ""; var mine = bubble(null, rep.text, true);
          warm += rep.warm; conv += rep.conv; upd();
          say(rep.back, function () {
            var rx = el("div", "reacts"); (REACT[rep.kind] || []).forEach(function (e, i) { var s = el("span", null, e); s.style.animationDelay = (i * 0.15) + "s"; rx.appendChild(s); }); mine.appendChild(rx);
            if (window.MizanFX && MizanFX.zina) MizanFX.zina(rep.kind === "smart" ? "right" : "wrong");
            var score = SCORE[rep.kind];
            S.record(KEY, "f" + k, score);
            if (window.MizanAuth && MizanAuth.score) MizanAuth.score("family", score);
            var fb = el("div", "chat-fb " + rep.kind);
            fb.appendChild(el("b", null, KIND[rep.kind]));
            var p = el("p", null, R.lesson + " "), a = el("a", null, "Read about " + (NAMES[R.f] || R.f)); a.href = root + "atlas/" + R.f + "/"; p.appendChild(a);
            fb.appendChild(p); act.appendChild(fb);
            var w = el("div", "court-end");
            w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
            if (rep.kind !== "smart") {
              var again = el("button", "btn ghost", "Try another reply"); again.onclick = function () { play(k); }; w.appendChild(again);
            }
            w.appendChild(S.endBar({ score: score, k: k, count: G.rounds.length, play: play, map: map,
              share: "I handled \"" + R.title + "\" in The Family Group Chat on Blind Spot Lab.\nHow would you reply? " + location.href.split("?")[0] }));
            act.appendChild(w);
          });
        };
        o.appendChild(b);
      });
      act.appendChild(o);
    });
  }
  map();
})();
