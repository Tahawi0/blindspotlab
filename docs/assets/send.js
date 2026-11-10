(function () {
  var f = document.getElementById("send-form"), st = document.getElementById("send-status");
  if (!f) return;
  var err = new URLSearchParams(location.search).get("err");
  if (err) {
    err = err.replace(/[^a-z0-9\-\/]/gi, "").slice(0, 50);
    document.querySelector("h1").textContent = "Spot a mistake? Tell us";
    document.querySelector("main .lead").textContent = "Thanks for catching it. Describe the mistake you found, and the fix if you know it. A real person will review it and correct it.";
    document.querySelector('label[for="send-text"]').textContent = "What's wrong?";
    document.getElementById("send-text").placeholder = "For example: this date is wrong, or this example doesn't fit…";
    var w = document.getElementById("send-where"); w.value = "Error: " + err; w.readOnly = true;
    var g = document.getElementById("send-guess"); g.closest ? null : null; document.querySelector('label[for="send-guess"]').hidden = true; g.hidden = true;
  }
  f.onsubmit = function (e) {
    e.preventDefault();
    var text = document.getElementById("send-text").value.trim();
    if (text.length < 15) { st.textContent = "Please write the full sentence (at least 15 characters)."; return; }
    var btn = f.querySelector("button[type=submit]"); btn.disabled = true; st.textContent = "Sending…";
    fetch(window.MIZAN_API + "/submit", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, where: document.getElementById("send-where").value, guess: document.getElementById("send-guess").value, website: document.getElementById("send-hp").value }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (x.ok) { f.reset(); st.textContent = "Got it, thanks! We'll review it, and if it works, you may see it as a Fallacy of the Day puzzle."; }
        else st.textContent = x.j.error || "Something went wrong. Please try again.";
      }).catch(function () { st.textContent = "No connection. Please try again."; }).finally(function () { btn.disabled = false; });
  };
})();
