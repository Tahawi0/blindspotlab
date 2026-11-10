// Shared stage map: each stage unlocks the next, and stars are saved on the device (and synced to the account).
// Also "challenge a friend on this stage": a link carrying the stage number and your score.
(function () {
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function starsFor(sc) { return sc == null ? 0 : sc >= 9 ? 3 : sc >= 6 ? 2 : 1; }
  function stars(n) { return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n); }
  function gameOf(key) { return String(key).replace(/^bsl-/, "").replace(/-stages$/, ""); }
  function track(key, ev, st) { if (window.MizanTrack) window.MizanTrack(gameOf(key), ev, st); }
  function share(text, btn) {
    if (navigator.share) navigator.share({ text: text }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { btn.textContent = "Copied ✓"; });
  }
  function myName() { try { return localStorage.getItem("bsl-duel-name") || ""; } catch (e) { return ""; } }

  // Challenge from a link: ?ch=stage number&cs=score&cn=name
  var CH = (function () {
    var q = new URLSearchParams(location.search), k = parseInt(q.get("ch"), 10), s = parseInt(q.get("cs"), 10);
    if (!(k >= 0 && k < 50 && s >= 0 && s <= 10)) return null;
    return { k: k, s: s, n: String(q.get("cn") || "A friend").replace(/[<>]/g, "").slice(0, 20) || "A friend", used: false };
  })();

  window.MizanStages = {
    stars: stars, starsFor: starsFor,
    get: function (key) { return load(key); },
    challenge: function () { return CH; },
    record: function (key, id, score) { var d = load(key); d[id] = Math.max(d[id] || 0, score); save(key, d); track(key, "done"); return d; },
    // opts: key, intro, items:[{id,title,sub,icon}], bossLabel, onPlay(k)
    render: function (box, o) {
      box.innerHTML = "";
      function go(k) {
        track(o.key, "start"); track(o.key, "stage", k);
        o.onPlay(k);
        var r = box.getBoundingClientRect();
        if (r.top < 0 || r.top > innerHeight * .35) box.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      }
      // Coming from a challenge link: open that stage right away, even if it is still locked for you
      if (CH && !CH.used && o.items[CH.k]) {
        CH.used = true;
        var ban = el("p", "note ch-ban", "⚔ Challenge from " + CH.n + ": " + CH.s + " / 10 on “" + o.items[CH.k].title + "”. Can you beat it?");
        box.parentNode.insertBefore(ban, box);
        go(CH.k); return;
      }
      var done = load(o.key), total = 0;
      o.items.forEach(function (it) { total += starsFor(done[it.id]); });
      var top = el("div", "map-head");
      top.appendChild(el("p", "lead", o.intro));
      top.appendChild(el("p", "map-stars", "★ " + total + " of " + o.items.length * 3));
      box.appendChild(top);
      var map = el("ol", "stage-map");
      o.items.forEach(function (it, k) {
        var open = k === 0 || done[o.items[k - 1].id] != null, st = starsFor(done[it.id]), boss = k === o.items.length - 1;
        var li = el("li", "stage" + (open ? "" : " locked") + (st ? " won" : "") + (boss ? " boss" : "") + (open && !st ? " next" : ""));
        var b = el("button", "stage-btn"); b.type = "button"; b.disabled = !open;
        var no = el("span", "stage-no");
        if (it.icon && open) { var im = el("img"); im.src = it.icon; im.alt = ""; no.appendChild(im); no.classList.add("has-icon"); }
        else no.textContent = boss ? "👑" : String(k + 1);
        b.appendChild(no);
        var info = el("span", "stage-info");
        info.appendChild(el("b", null, open ? it.title : "Locked stage"));
        info.appendChild(el("small", null, open ? (st ? stars(st) + " · " + done[it.id] + " / 10" : (boss ? (o.bossLabel || "Boss stage") : (it.sub || "New stage"))) : "Finish the one before it to unlock"));
        b.appendChild(info);
        b.onclick = function () { go(k); };
        li.appendChild(b); map.appendChild(li);
      });
      box.appendChild(map);
    },
    // End-of-stage buttons: next, map, share, and challenge a friend
    endBar: function (o) {
      var wrap = el("div", "end-bar"), last = o.k === o.count - 1;
      if (CH && CH.k === o.k && o.score != null) {
        var res = o.score > CH.s ? "You won! " : o.score < CH.s ? CH.n + " takes this one. " : "It's a tie! ";
        wrap.appendChild(el("p", "ch-res " + (o.score > CH.s ? "win" : o.score < CH.s ? "lose" : "tie"), res + "You: " + o.score + " / 10 · " + CH.n + ": " + CH.s + " / 10."));
      }
      var p = el("p");
      var nx = el("button", "btn", last ? "Stage map" : "Next stage"), mp = el("button", "btn ghost", "Map"), sh = el("button", "btn ghost", "Share");
      nx.onclick = function () { if (last) o.map(); else o.play(o.k + 1); };
      mp.onclick = o.map;
      sh.onclick = function () { share(o.share, sh); };
      [mp, nx, sh].forEach(function (b) { p.appendChild(b); p.appendChild(document.createTextNode(" ")); });
      if (o.score != null) {
        var ch = el("button", "btn ghost ch-btn", "⚔ Challenge a friend on this stage");
        // In-page name field instead of prompt(), which the Facebook and Instagram in-app browsers block
        var nm = el("input", "ch-name"); nm.type = "text"; nm.maxLength = 20; nm.placeholder = "Your name, shown to your friend (optional)";
        nm.setAttribute("aria-label", "Your name, shown to your friend"); nm.value = myName();
        ch.onclick = function () {
          var n = String(nm.value || "").replace(/[<>]/g, "").trim().slice(0, 20);
          if (n) try { localStorage.setItem("bsl-duel-name", n); } catch (e) {}
          var url = location.origin + location.pathname + "?ch=" + o.k + "&cs=" + o.score + (n ? "&cn=" + encodeURIComponent(n) : "");
          share((n ? n + " scored " : "I scored ") + o.score + " / 10 on this stage on Blind Spot Lab ⚔\nThink you can beat " + (n ? "that" : "me") + "?\n" + url, ch);
        };
        var chRow = el("span", "ch-row"); chRow.appendChild(nm); chRow.appendChild(ch);
        p.appendChild(chRow);
      }
      wrap.appendChild(p);
      return wrap;
    }
  };
})();
