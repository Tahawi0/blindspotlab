(function () {
  var api = window.MIZAN_API || "";
  var form = document.getElementById("an-form");
  if (!form) return;
  var out = document.getElementById("an-out");
  var root = document.body.getAttribute("data-root") || "./";
  var names = window.MIZAN_NAMES || {};
  if (!api) {
    form.querySelector("button").disabled = true;
    document.getElementById("an-status").textContent = "This feature is coming very soon.";
    return;
  }
  form.onsubmit = function (ev) {
    ev.preventDefault();
    var text = document.getElementById("an-text").value.trim();
    var st = document.getElementById("an-status");
    out.innerHTML = "";
    if (text.length < 15) { st.textContent = "Please write a slightly longer sentence."; return; }
    st.textContent = "Analyzing…";
    form.querySelector("button").disabled = true;
    var tok = window.MizanAuth && window.MizanAuth.user() ? window.MizanAuth.token() : Promise.resolve(null);
    tok.catch(function () { return null; }).then(function (t) {
      var h = { "Content-Type": "application/json" }; if (t) h.Authorization = "Bearer " + t;
      return fetch(api + "/analyze", { method: "POST", headers: h, body: JSON.stringify({ text: text, lang: "en" }) });
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        form.querySelector("button").disabled = false;
        if (!res.ok) {
          st.textContent = res.d.error || "Something went wrong. Please try again.";
          if (res.d.limit && !(window.MizanAuth && window.MizanAuth.user())) { var l = document.createElement("a"); l.href = root + "account/"; l.className = "btn ghost"; l.textContent = "Sign in"; l.style.marginInlineStart = "8px"; st.appendChild(document.createTextNode(" ")); st.appendChild(l); }
          return;
        }
        st.textContent = "";
        var d = res.d;
        var h = document.createElement("h2"); h.textContent = d.summary || ""; out.appendChild(h);
        (d.findings || []).forEach(function (f) {
          var c = document.createElement("div"); c.className = "card"; c.style.marginBottom = "10px";
          var t = document.createElement("b"); t.textContent = names[f.slug] || f.slug; c.appendChild(t);
          var q = document.createElement("p"); q.className = "oneline"; q.textContent = f.quote || ""; c.appendChild(q);
          var w = document.createElement("p"); w.textContent = f.why || ""; c.appendChild(w);
          if (f.reply) { var r = document.createElement("p"); r.textContent = "How to reply: " + f.reply; c.appendChild(r); }
          if (names[f.slug]) { var a = document.createElement("a"); a.href = root + "atlas/" + f.slug + "/"; a.textContent = "Read about it in The Atlas"; c.appendChild(a); }
          out.appendChild(c);
        });
        var n = document.createElement("p"); n.className = "note"; n.textContent = "This analysis is done by AI and can be wrong. Use it as a starting point for thinking, not a final verdict."; out.appendChild(n);
      }, function () { form.querySelector("button").disabled = false; st.textContent = "Couldn't reach the server. Please try again."; });
  };
  var pre = new URLSearchParams(location.search).get("t");
  if (pre) { document.getElementById("an-text").value = pre.slice(0, 1000); history.replaceState(null, "", location.pathname); var go = false; try { go = sessionStorage.getItem("bsl-an-go") === "1"; sessionStorage.removeItem("bsl-an-go"); } catch (e) {} if (go && pre.trim().length >= 15) form.requestSubmit ? form.requestSubmit() : form.onsubmit(new Event("submit")); }
})();
