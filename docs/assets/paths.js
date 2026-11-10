(function () {
  var el = document.getElementById("path");
  if (!el) return;
  var key = "bsl-path-" + el.getAttribute("data-id");
  var days = el.querySelectorAll(".day");
  var done = [];
  try { done = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}

  function render() {
    var n = 0;
    days.forEach(function (d, k) {
      var on = done.indexOf(k) > -1; if (on) n++;
      d.classList.toggle("done", on);
      var b = d.querySelector(".mark");
      b.textContent = on ? "Done ✓" : "Mark this day done";
    });
    document.getElementById("p-bar").style.width = (n / days.length * 100) + "%";
    document.getElementById("p-count").textContent = n + " of " + days.length;
    document.getElementById("p-done").style.display = n === days.length ? "" : "none";
  }

  days.forEach(function (d, k) {
    d.querySelector(".mark").onclick = function () {
      var at = done.indexOf(k);
      if (at > -1) done.splice(at, 1); else done.push(k);
      try { localStorage.setItem(key, JSON.stringify(done)); } catch (e) {}
      render();
    };
  });
  render();
})();

// Course certificate: drawn on the device; nothing is sent to a server.
(function () {
  var el = document.getElementById("path"), btn = document.getElementById("cert-make");
  if (!el || !btn) return;
  var C = { paper: "#E9E1CC", leaf: "#F3EDDD", ink: "#221C14", muted: "#6B604E", gold: "#A47E2E", lapis: "#1F3B73" };
  function wrap(ctx, text, max) {
    var words = text.split(" "), lines = [], cur = "";
    words.forEach(function (w) { var t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  function scale(ctx, cx, cy, s) {
    ctx.strokeStyle = C.gold; ctx.lineWidth = s / 14; ctx.lineCap = "round"; ctx.beginPath();
    ctx.moveTo(cx, cy - s * .55); ctx.lineTo(cx, cy + s * .5); ctx.moveTo(cx - s * .35, cy + s * .5); ctx.lineTo(cx + s * .35, cy + s * .5);
    ctx.moveTo(cx - s * .6, cy - s * .35); ctx.lineTo(cx + s * .6, cy - s * .35);
    [-1, 1].forEach(function (k) { var px = cx + k * s * .6; ctx.moveTo(px, cy - s * .35); ctx.lineTo(px - s * .18, cy + s * .05); ctx.moveTo(px, cy - s * .35); ctx.lineTo(px + s * .18, cy + s * .05);
      ctx.moveTo(px - s * .2, cy + s * .05); ctx.arc(px, cy + s * .05, s * .2, Math.PI, 0, true); });
    ctx.stroke();
  }
  function draw(name) {
    var W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var x = cv.getContext("2d"); x.direction = "ltr";
    x.fillStyle = C.paper; x.fillRect(0, 0, W, H);
    x.fillStyle = C.leaf; x.strokeStyle = C.gold; x.lineWidth = 3; x.fillRect(40, 40, W - 80, H - 80); x.strokeRect(40, 40, W - 80, H - 80);
    x.lineWidth = 1; x.strokeRect(56, 56, W - 112, H - 112);
    [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].forEach(function (p) {
      x.beginPath(); x.moveTo(p[0], p[1] - 13); x.lineTo(p[0] + 13, p[1]); x.lineTo(p[0], p[1] + 13); x.lineTo(p[0] - 13, p[1]); x.closePath();
      x.fillStyle = C.paper; x.fill(); x.lineWidth = 2; x.stroke(); });
    x.textAlign = "center";
    scale(x, W / 2, 230, 150);
    x.fillStyle = C.gold; x.font = '700 40px Fraunces'; x.fillText("Certificate of Completion", W / 2, 400);
    x.fillStyle = C.muted; x.font = '400 40px Inter'; x.fillText("Blind Spot Lab certifies that", W / 2, 500);
    var fs = 104; x.font = '700 ' + fs + 'px Fraunces';
    while (x.measureText(name).width > W - 260 && fs > 50) { fs -= 6; x.font = '700 ' + fs + 'px Fraunces'; }
    x.fillStyle = C.ink; x.fillText(name, W / 2, 640);
    x.strokeStyle = C.gold; x.lineWidth = 3; x.beginPath(); x.moveTo(W / 2 - 160, 690); x.lineTo(W / 2 + 160, 690); x.stroke();
    x.fillStyle = C.muted; x.font = '400 40px Inter'; x.fillText("has completed the course", W / 2, 790);
    x.fillStyle = C.lapis; x.font = '700 50px Fraunces';
    wrap(x, el.getAttribute("data-title"), W - 220).forEach(function (l, i) { x.fillText(l, W / 2, 880 + i * 72); });
    x.fillStyle = C.muted; x.font = '400 34px Inter';
    x.fillText("7 days, 7 tricks, and a sharper eye.", W / 2, 1090);
    var d = new Date(); x.fillText(d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), W / 2, 1150);
    x.fillStyle = C.ink; x.font = '700 38px Fraunces'; x.fillText("Blind Spot Lab — See what your mind misses.", W / 2, 1235);
    x.fillStyle = C.gold; x.font = '400 26px Inter'; x.fillText("tahawi0.github.io/blindspotlab", W / 2, 1280);
    return cv;
  }
  btn.onclick = function () {
    var name = document.getElementById("cert-name").value.trim().slice(0, 40);
    if (!name) { document.getElementById("cert-name").focus(); return; }
    btn.disabled = true;
    Promise.all([document.fonts.load('700 60px Fraunces'), document.fonts.load('400 40px Inter')]).catch(function () {}).then(function () {
      var cv = draw(name), out = document.getElementById("cert-out");
      cv.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        out.innerHTML = "";
        var img = new Image(); img.src = url; img.alt = "Course completion certificate"; img.className = "cert-img"; out.appendChild(img);
        var p = document.createElement("p"), a = document.createElement("a");
        a.className = "btn"; a.href = url; a.download = "blind-spot-lab-certificate.png"; a.textContent = "Download certificate"; p.appendChild(a);
        var file = new File([blob], "blind-spot-lab-certificate.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          var s = document.createElement("button"); s.className = "btn ghost"; s.textContent = "Share it"; s.style.marginInlineStart = "8px";
          s.onclick = function () { navigator.share({ files: [file], text: "I finished a course on Blind Spot Lab. " + location.href }).catch(function () {}); };
          p.appendChild(s);
        }
        out.appendChild(p); btn.disabled = false;
      }, "image/png");
    });
  };
})();
