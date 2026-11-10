(function () {
  var root = document.body.getAttribute("data-root") || "./";
  var input = document.getElementById("s-q"), out = document.getElementById("s-out"), idx = null;
  // Case-insensitive and accent-insensitive; punctuation becomes spaces.
  function norm(s) {
    s = (s || "").toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return s.replace(/[\u2018\u2019']/g, "").replace(/[^a-z0-9]+/g, " ");
  }
  function score(d, terms) {
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i], hit = 0;
      if (d.nt.indexOf(t) > -1) hit = 10; else if (d.nk.indexOf(t) > -1) hit = 4; else if (d.nx.indexOf(t) > -1) hit = 1;
      if (!hit) return 0; s += hit;
    }
    return s;
  }
  function render(q) {
    out.innerHTML = "";
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) { out.innerHTML = '<p class="lead">Try a word: "straw man", "Kant", "ads", "anchoring"…</p>'; return; }
    var res = idx.map(function (d) { return { d: d, s: score(d, terms) }; }).filter(function (r) { return r.s; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 30);
    var meta = document.createElement("p"); meta.className = "kicker";
    meta.textContent = res.length ? res.length + (res.length === 1 ? " result" : " results") : "Nothing found. Try a different or shorter word.";
    out.appendChild(meta);
    var ul = document.createElement("ul"); ul.className = "index";
    res.forEach(function (r) {
      var li = document.createElement("li"), a = document.createElement("a"), b = document.createElement("b"), em = document.createElement("em"), sp = document.createElement("span");
      a.href = root + r.d.u; b.textContent = r.d.t; em.textContent = r.d.k; sp.textContent = r.d.d;
      a.appendChild(b); a.appendChild(em); a.appendChild(sp); li.appendChild(a); ul.appendChild(li);
    });
    out.appendChild(ul);
  }
  fetch(root + "search.json").then(function (r) { return r.json(); }).then(function (data) {
    idx = data.map(function (d) { d.nt = norm(d.t); d.nk = norm(d.k + " " + d.d); d.nx = norm(d.x); return d; });
    var q = new URLSearchParams(location.search).get("q") || "";
    input.value = q; render(q); input.focus();
    var tm; input.oninput = function () { clearTimeout(tm); tm = setTimeout(function () {
      render(input.value); history.replaceState(null, "", input.value ? "?q=" + encodeURIComponent(input.value) : location.pathname); }, 120); };
  });
})();
