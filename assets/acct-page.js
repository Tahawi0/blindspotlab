(function () {
  var M = window.MizanAuth, root = document.body.getAttribute("data-root") || "./";
  var $ = function (id) { return document.getElementById(id); };
  var out = $("ac-out"), st = $("ac-status");
  function msg(t) { st.textContent = t || ""; }
  function err(e) {
    var c = (e && e.code) || "", m = {
      "auth/popup-closed-by-user": "The Google window closed before you finished. Try again.",
      "auth/invalid-email": "That email address doesn't look right.",
      "auth/invalid-action-code": "That link was already used or has expired. Request a new one.",
      "auth/network-request-failed": "You're offline. Check your connection.",
      "auth/too-many-requests": "Too many attempts. Wait a bit and try again."
    };
    msg(m[c] || "Something went wrong. Try again.");
  }
  function show(id) { ["ac-login", "ac-me", "ac-need-email"].forEach(function (x) { $(x).hidden = x !== id; }); }
  function stats(p) {
    var s = {}; try { s = JSON.parse(p["bsl-stats"] || "{}"); } catch (e) {}
    var paths = 0; for (var k in p) if (k.indexOf("bsl-path-") === 0) { try { if (JSON.parse(p[k]).length >= 7) paths++; } catch (e) {} }
    var lab = 0; for (k in p) if (k.indexOf("bsl-lab-") === 0) lab++;
    return [[s.streak || 0, "Current streak"], [s.best || 0, "Best streak"], [s.played || 0, "Puzzles played"], [p["bsl-quiz-best"] || 0, "Best quiz score"], [paths, "Courses finished"], [lab, "Lab experiments"]];
  }
  function render(me) {
    show("ac-me");
    var u = M.user();
    $("ac-name").value = (me && me.name) || (u && u.displayName) || "";
    $("ac-email").textContent = (u && u.email) || "";
    $("ac-plan").textContent = me && me.plan === "pro" ? "Blind Spot Lab Plus" : "Free";
    var a = (me && me.analyze) || { used: 0, limit: 10 };
    $("ac-quota").textContent = Math.max(0, a.limit - a.used) + " of " + a.limit;
    var g = $("ac-stats"); g.innerHTML = "";
    stats((me && me.progress) || {}).forEach(function (x) { var d = document.createElement("div"), b = document.createElement("b"); b.textContent = x[0]; d.appendChild(b); d.appendChild(document.createTextNode(x[1])); g.appendChild(d); });
  }
  $("ac-google").onclick = function () { msg("Opening Google…"); M.google().then(function () { msg(""); }, err); };
  $("ac-mail-form").onsubmit = function (e) {
    e.preventDefault(); var em = $("ac-mail").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { msg("Enter a valid email address."); return; }
    msg("Sending the link…");
    M.emailLink(em).then(function () { msg("We sent a link to " + em + ". Open it on this same device and you'll be signed in. Can't find it? Check your spam folder."); }, err);
  };
  $("ac-need-form").onsubmit = function (e) {
    e.preventDefault(); msg("Signing you in…");
    M.finishLink($("ac-need-mail").value.trim()).then(function () { msg(""); }, err);
  };
  $("ac-save").onclick = function () {
    var b = this; b.disabled = true;
    M.save({ name: $("ac-name").value }).then(function () { b.textContent = "Saved ✓"; setTimeout(function () { b.textContent = "Save"; b.disabled = false; }, 1500); }, function () { b.disabled = false; });
  };
  $("ac-out").onclick = function () { M.signOut().then(function () { show("ac-login"); msg("You're signed out. Your progress is still saved on this device and in your account."); }); };
  $("ac-del").onclick = function () {
    var c = $("ac-del-confirm"); if (c.hidden) { c.hidden = false; return; }
  };
  $("ac-del-yes").onclick = function () {
    msg("Deleting…");
    M.remove().then(function () { show("ac-login"); $("ac-del-confirm").hidden = true; msg("Your account and all its data have been deleted."); }, err);
  };
  $("ac-del-no").onclick = function () { $("ac-del-confirm").hidden = true; };

  msg("One moment…");
  M.ready().then(function () {
    if (M.isLink()) {
      return M.finishLink().then(function (r) { if (r === "need-email") { show("ac-need-email"); msg("Enter the email address you requested the link with."); } });
    }
  }).then(function () {
    if (!M.user()) { if ($("ac-need-email").hidden) show("ac-login"); if (st.textContent === "One moment…") msg(""); }
  }, err);
  M.onChange(function (u) {
    if (u) { msg("Loading your data…"); M.refresh().then(function (me) { render(me); msg(""); }, function () { render(null); msg("We can't reach the server right now. Your progress is saved on this device."); }); }
  });
})();
