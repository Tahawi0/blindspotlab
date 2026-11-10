// News Detective: use only the checks you need, then rule on the story.
(function () {
  var G = window.MIZAN_GAME || {}, S = window.MizanStages;
  var box = document.getElementById("game"), KEY = "bsl-verify-stages";
  var ICON = ["👤", "📅", "🖼", "💬", "🔎"];
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

  function map() {
    S.render(box, { key: KEY, intro: G.intro, bossLabel: "Boss case",
      items: G.cases.map(function (c, k) { return { id: "v" + k, title: c.title, sub: c.from }; }), onPlay: play });
  }

  function play(k) {
    var C = G.cases[k], used = 0;
    box.innerHTML = "";
    box.appendChild(el("p", "kicker", "Story " + (k + 1) + " of " + G.cases.length));
    var post = el("div", "vf-post");
    post.appendChild(el("small", null, C.from));
    post.appendChild(el("b", null, C.headline));
    post.appendChild(el("p", "vf-img", "🖼 " + C.img));
    box.appendChild(post);
    var hud = el("p", "vf-hud", "Tools used: 0 of 5"); box.appendChild(hud);
    var tools = el("div", "vf-tools"), notes = el("ol", "vf-notes");
    G.tools.forEach(function (name, j) {
      var b = el("button", "vf-tool"); b.type = "button";
      b.appendChild(el("span", null, ICON[j])); b.appendChild(document.createTextNode(name));
      b.onclick = function () {
        b.disabled = true; b.classList.add("used"); used++;
        hud.textContent = "Tools used: " + used + " of 5" + (used > 3 ? " · each extra tool costs you a star" : "");
        var li = el("li"); li.appendChild(el("b", null, name + ": ")); li.appendChild(document.createTextNode(C.clues[j])); notes.appendChild(li);
      };
      tools.appendChild(b);
    });
    box.appendChild(tools); box.appendChild(notes);
    box.appendChild(el("p", "scene", "Your verdict?"));
    var o = el("div", "opts vf-verdicts"), act = el("div");
    G.verdicts.forEach(function (v, j) {
      var b = el("button", null, v);
      b.onclick = function () {
        o.querySelectorAll("button").forEach(function (x, n) { x.disabled = true; if (n === C.a) x.classList.add("right"); });
        tools.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
        var ok = j === C.a; if (!ok) b.classList.add("wrong");
        // A right verdict with two or three tools scores 10. A verdict with no tools is a guess, so it scores less.
        var score = ok ? (used === 0 ? 6 : 10 - Math.max(0, used - 3)) : 2;
        S.record(KEY, "v" + k, score);
        if (window.MizanAuth && MizanAuth.score) MizanAuth.score("verify", score);
        var fb = el("div", "court-fb"); fb.setAttribute("role", "status"); fb.appendChild(el("b", null, ok ? "Correct: " + G.verdicts[C.a] : "The right verdict: " + G.verdicts[C.a])); fb.appendChild(el("p", null, C.why));
        if (used === 0 && ok) fb.appendChild(el("p", "note", "You got it right, but without checking anything. In real life, guessing is how you get fooled."));
        act.appendChild(fb);
        var w = el("div", "court-end"); w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
        if (!ok) { var again = el("button", "btn ghost", "Investigate again"); again.onclick = function () { play(k); }; w.appendChild(again); }
        w.appendChild(S.endBar({ score: score, k: k, count: G.cases.length, play: play, map: map,
          share: "I investigated \"" + C.title + "\" in News Detective on Blind Spot Lab 🔎\nWould you have believed it? " + location.href.split("?")[0] }));
        act.appendChild(w);
      };
      o.appendChild(b);
    });
    box.appendChild(o); box.appendChild(act);
  }
  map();
})();
