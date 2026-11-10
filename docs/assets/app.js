(function () {
  // Menu: one section open at a time, plus the ☰ button on mobile
  var dds = document.querySelectorAll("nav .dd"), nav = document.getElementById("mainnav"), bg = document.querySelector(".burger");
  dds.forEach(function (d) { d.addEventListener("toggle", function () { if (d.open && !nav.classList.contains("open")) dds.forEach(function (o) { if (o !== d) o.open = false; }); }); });
  document.addEventListener("click", function (e) { if (!e.target.closest("nav") && !e.target.closest(".burger")) { dds.forEach(function (d) { if (!nav.classList.contains("open")) d.open = false; }); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { dds.forEach(function (d) { d.open = false; }); if (nav.classList.contains("open")) bg.click(); } });
  if (bg) bg.onclick = function () { var o = nav.classList.toggle("open"); bg.setAttribute("aria-expanded", o); document.body.classList.toggle("menu-open", o); dds.forEach(function (d) { d.open = o; }); };
})();
(function () {
  var root = document.body.getAttribute("data-root") || "./";
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register(root + "sw.js").catch(function () {}); });
  }
  var btn = document.getElementById("install"), hint = document.getElementById("install-hint"), ev = null;
  if (!btn) return;
  var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (standalone) return;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); ev = e; btn.hidden = false; });
  btn.onclick = function () { if (!ev) return; ev.prompt(); ev.userChoice.finally(function () { ev = null; btn.hidden = true; }); };
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) { btn.hidden = false; btn.onclick = function () { hint.hidden = !hint.hidden; }; }
})();
// Anonymous game counter: only "started" and "finished", no personal data.
window.MizanTrack = function (g, e, st) {
  try {
    if (!window.MIZAN_API || !/^[a-z]{2,12}$/.test(g) || (e !== "start" && e !== "done" && e !== "stage")) return;
    // "start" and "done" count once per game per visit, and "done" logs a "start" if none was logged.
    // That way finishes never outnumber starts. Stages are throttled to one per 20 seconds.
    if (e === "done" && !sessionStorage.getItem("bsl-t-" + g + "start")) window.MizanTrack(g, "start");
    var k = "bsl-t-" + g + e + (e === "stage" && st >= 0 ? st : ""), now = Date.now(), last = +(sessionStorage.getItem(k) || 0);
    if (e === "stage" ? now - last < 20000 : last) return; sessionStorage.setItem(k, now);
    var body = JSON.stringify(st >= 0 && st < 50 ? { g: g, e: e, s: st } : { g: g, e: e });
    if (navigator.sendBeacon) navigator.sendBeacon(window.MIZAN_API + "/evt", body);
    else fetch(window.MIZAN_API + "/evt", { method: "POST", body: body, keepalive: true }).catch(function () {});
  } catch (x) {}
};
