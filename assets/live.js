// On Air: you moderate the comments on a livestream. Hide every comment with a fallacy before it scrolls away.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {}, S = window.MizanStages;
  var box = document.getElementById("game"), KEY = "bsl-live-stages", MAXV = 6;
  var slowPick = false; try { slowPick = localStorage.getItem("bsl-live-slow") === "1"; } catch (e) {}
  var slow = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

  function map() {
    S.render(box, { key: KEY, intro: G.intro, bossLabel: "Boss stream: the fastest comments",
      items: G.episodes.map(function (e, k) { return { id: "l" + k, title: e.title.replace(/^.*?: /, ""), sub: (e.speed / 1000).toLocaleString("en-US") + (e.speed === 1000 ? " second" : " seconds") + " per comment" }; }), onPlay: ready });
  }

  function ready(k) {
    var E = G.episodes[k];
    box.innerHTML = "";
    box.appendChild(el("p", "kicker", "Stream " + (k + 1) + " of " + G.episodes.length));
    box.appendChild(el("h2", null, E.title));
    box.appendChild(el("p", "lead", "Tap any comment with a fallacy to hide it. Each comment scrolls away after a moment, and if a bad one gets through, you missed it. Hide a fair comment and you lose half a point."));
    var calm = el("label", "lv-calm"), cb = el("input"); cb.type = "checkbox"; cb.checked = slowPick;
    cb.onchange = function () { slowPick = cb.checked; try { localStorage.setItem("bsl-live-slow", slowPick ? "1" : ""); } catch (e) {} };
    calm.appendChild(cb); calm.appendChild(document.createTextNode(" Calm mode: comments come in at half speed")); box.appendChild(calm);
    var go = el("button", "btn", "🔴 Go live"); go.onclick = function () { play(k); }; box.appendChild(go);
  }

  function play(k) {
    var E = G.episodes[k], list = E.c, i = 0, hits = 0, falses = 0, missed = [], bad = list.filter(function (c) { return c.f; }).length;
    var speed = E.speed * (slow ? 1.8 : 1) * (slowPick ? 2 : 1), timer;
    box.innerHTML = ""; document.body.classList.add("zina-hide");
    var scr = el("div", "lv-screen");
    var top = el("div", "lv-top"); top.appendChild(el("b", null, "🔴 LIVE")); top.appendChild(el("span", null, E.title.replace(/^.*?: /, "")));
    var sc = el("span", "lv-score", "✓ 0"); top.appendChild(sc);
    scr.appendChild(top);
    var feed = el("ol", "lv-feed"); feed.setAttribute("aria-live", "polite"); scr.appendChild(feed);
    var bar = el("div", "bar"), bi = el("i"); bar.appendChild(bi); scr.appendChild(bar);
    box.appendChild(scr); scr.scrollIntoView({ block: "start" });
    function upd() { sc.textContent = "✓ " + hits + (falses ? "  ✗ " + falses : ""); bi.style.width = (i / list.length * 100) + "%"; }
    function push() {
      if (i >= list.length) { setTimeout(end, speed); return; }
      var c = list[i++], li = el("li", "lv-c");
      
      var b = el("button"); b.type = "button";
      b.appendChild(el("b", null, c.w)); b.appendChild(el("span", null, c.t));
      b.onclick = function () {
        if (li.classList.contains("hid")) return;
        li.classList.add("hid"); b.disabled = true;
        if (c.f) { hits++; li.classList.add("good"); if (window.MizanFX && MizanFX.play) MizanFX.play("right"); }
        else { falses++; li.classList.add("oops"); if (window.MizanFX && MizanFX.play) MizanFX.play("wrong"); }
        upd();
      };
      li.appendChild(b); li._c = c;
      feed.insertBefore(li, feed.firstChild);
      while (feed.children.length > MAXV) { var old = feed.lastChild; gone(old); feed.removeChild(old); }
      upd();
      timer = setTimeout(push, speed);
    }
    function gone(li) { if (li._c.f && !li.classList.contains("hid")) missed.push(li._c); }
    function end() {
      clearTimeout(timer); document.body.classList.remove("zina-hide");
      Array.prototype.slice.call(feed.children).forEach(gone);
      // A stream with no bad comments at all: full marks if you didn't hide anything fair
      var score = bad ? Math.max(0, Math.min(10, Math.round(10 * (hits - falses * 0.5) / bad))) : Math.max(0, 10 - falses * 2);
      S.record(KEY, "l" + k, score);
      if (window.MizanAuth && MizanAuth.score) MizanAuth.score("live", score);
      box.innerHTML = "";
      var w = el("div", "today");
      w.appendChild(el("p", "kicker", "Stream over"));
      w.appendChild(el("p", "big-score", hits + " / " + bad));
      w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
      w.appendChild(el("p", "lead", "You caught " + hits + (hits === 1 ? " comment" : " comments") + " with a fallacy" + (falses ? ", and hid " + falses + (falses === 1 ? " fair comment" : " fair comments") + " by mistake." : ".")));
      box.appendChild(w);
      var all = list.filter(function (c) { return c.f; });
      box.appendChild(el("h2", null, "The comments that had a fallacy"));
      var ul = el("ul", "index lv-review");
      all.forEach(function (c) {
        var li = el("li"); li.appendChild(el("span", missed.indexOf(c) >= 0 ? "lv-miss" : "lv-got", missed.indexOf(c) >= 0 ? "Missed" : "Caught"));
        li.appendChild(document.createTextNode(" \u201c" + c.t + "\u201d "));
        var a = el("a", null, NAMES[c.f] || c.f); a.href = root + "atlas/" + c.f + "/"; li.appendChild(a);
        ul.appendChild(li);
      });
      box.appendChild(ul);
      var p = el("p"), again = el("button", "btn ghost", "Replay this stream"); again.onclick = function () { ready(k); }; p.appendChild(again); box.appendChild(p);
      box.appendChild(S.endBar({ score: score, k: k, count: G.episodes.length, play: ready, map: map,
        share: "I hid " + hits + " of " + bad + " fallacy-filled comments in On Air on Blind Spot Lab 🔴\nThink you're faster? " + location.href.split("?")[0] }));
    }
    push();
  }
  map();
})();
