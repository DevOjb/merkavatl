/**
 * BOOKING VIEWS
 * Search results, seat selection, passenger details, booking summary and confirmation.
 * Rendering only: availability, validation and payment actions belong in /js/actions/booking.js.
 */
/* Booking flow views: results -> seats -> passenger -> summary -> confirmation */
V.results = function () {
  const rs = DB.routes.filter((r) => {
    const veh = vh(r.vid);
    const kind = veh.name.startsWith("SUREMOVE") ? "SUREMOVE" : veh.name.startsWith("SUPERLITE") ? "SUPERLITE" : "SUPERMAX";
    return (!S.q.from || r.from == S.q.from) && (!S.q.to || r.to == S.q.to) && (!S.q.vehicle || S.q.vehicle == "all" || S.q.vehicle == kind);
  });
  const rows = rs
    .map((r) => {
      const veh = vh(r.vid);
      const kind = veh.name.startsWith("SUREMOVE") ? "SUREMOVE" : veh.name.startsWith("SUPERLITE") ? "SUPERLITE" : "SUPERMAX";
      const climate = veh.name.includes("Non-AC") ? "Non-AC" : veh.name.includes("AC") ? "AC" : "AC";
      return r.times
        .map((t) => {
          const gone = departed(S.q.date, t),
            full = false;
          return `<article class="card dep dep-${kind.toLowerCase()}" data-vehicle="${E(kind)}"><div class="dep-media"><img src="${vimg(r.vid)}" alt="${E(veh.name)}" loading="lazy"></div><div class="dep-i"><div class="dep-tags"><span class="tag c">${E(kind)}</span>${kind == "SUREMOVE" ? `<span class="tag">${E(climate)}</span>` : ""}</div><h3 class="dep-name">${E(veh.name)}</h3><div class="dep-route">${E(r.from)} → ${E(r.to)} <span class="mu">· ${r.dur || "Scheduled service"}</span></div><div class="mu">${veh.seats} passenger seats · seat availability is confirmed during selection</div></div><div class="dep-a"><span class="pr">${M(r.price)}</span><span class="mu">per seat</span><button class="btn" ${full || gone ? "disabled" : ""} onclick="choose('${r.id}','${t}')">${gone ? "Departed" : full ? "Full" : "Select"}</button></div></article>`;
        })
        .join("");
    })
    .join("");
  return `<div class="pg"><h2>${S.q.from && S.q.to ? `${E(S.q.from)} → ${E(S.q.to)}` : "All routes"} <span class="mu">${fmtDate(S.q.date)}</span></h2>${searchForm()}<div class="booking-choice-head"><div><div class="eb">Vehicle options</div><p class="mu">Choose your preferred vehicle family. All available services are shown for the selected route.</p></div><div class="vehicle-legend"><span>SUREMOVE</span><span>SUPERLITE</span><span>SUPERMAX</span></div></div><p class="booking-note"><b>Seat availability</b> is checked when you select your seats. We do not show “seats left” numbers until a live booking backend is connected. Fares are subject to review.</p>${rs.length ? `<div class="stack">${rows}</div>` : `<div class="card" style="margin-top:16px">No trips on this route yet. Try another route or <a href="https://wa.me/${WA}" target="_blank">ask us on WhatsApp</a>.</div>`}</div>`;
};
V.seats = function () {
  const r = rt(S.sel.rid),
    veh = vh(r.vid),
    n = veh.seats,
    tk = taken(r.id, S.q.date, S.sel.time);
  const btn = (i) =>
    `<button class="seat ${tk.has(i) ? "x" : S.seats.includes(i) ? "on" : ""}" ${tk.has(i) ? "disabled" : ""} onclick="tog(${i})" aria-label="Seat ${i}" aria-pressed="${S.seats.includes(i)}">${i}</button>`;
  let g = '<div class="seat drv">Driver</div><span></span>' + btn(1);
  for (let i = 2; i <= n; i++) g += btn(i);
  const sel = S.seats.sort((a, b) => a - b).join(", ") || "none";
  return `<div class="pg"><h2>Select your seat${S.q.pax > 1 ? "s" : ""}</h2><p class="mu">${E(r.from)} → ${E(r.to)} · ${fmtDate(S.q.date)} · ${S.sel.time} · choose ${S.q.pax} seat${S.q.pax > 1 ? "s" : ""}</p>
<div class="vm"><div class="card"><img src="${vimg(r.vid)}" alt="${E(veh.name)}"><h3>${E(veh.name)}</h3><p class="mu">${n} passenger seats · ${r.dur || "Scheduled service"}</p><div class="pr">${M(r.price)} <span class="mu">per seat</span></div><p class="mu">${FARE_NOTE}</p></div>
<div class="card"><div class="bus">${g}</div><p class="mu">Selected seats: <b>${sel}</b></p><p class="mu lg"><i class="d0"></i>Available<i class="d1"></i>Selected<i class="d2"></i>Taken</p><button class="btn" style="width:100%" ${S.seats.length != S.q.pax ? "disabled" : ""} onclick="toPass()">Continue · ${M(r.price * S.q.pax)}</button></div></div></div>`;
};
V.passenger = function () {
  return `<div class="pg"><div class="flow"><span class="done">1 Journey</span><span class="done">2 Seats</span><span class="active">3 Passenger</span><span>4 Review</span><span>5 Payment</span></div><h2>Passenger information</h2><div class="guest-banner"><b>Booking as a guest</b><span>No account is required. We'll use your phone number and booking reference to help you manage the trip.</span><a href="#register">Create an account instead</a></div><form class="card" onsubmit="return savePass(event)">${S.seats.map((s, i) => `<h3>Seat ${s}</h3><div class="fg" style="margin-bottom:14px"><div><label>Full name</label><input id="pn${i}" required autocomplete="name" value="${E((S.pass || [])[i]?.name || (i == 0 && me() ? me().name : ""))}"></div><div><label>Phone</label><input id="pp${i}" type="tel" required autocomplete="tel" value="${E((S.pass || [])[i]?.phone || (i == 0 && me() ? me().phone : ""))}"></div></div>`).join("")}<div style="margin-bottom:14px"><label>Contact email</label><input id="pe" type="email" required autocomplete="email" value="${E(S.email || me()?.email || "")}"></div><button class="btn">Review booking →</button></form></div>`;
};
V.summary = function () {
  const r = rt(S.sel.rid),
    tot = r.price * S.seats.length;
  return `<div class="pg"><h2>Booking summary</h2><div class="card"><div class="row"><b>${E(r.from)} → ${E(r.to)}</b><span>${fmtDate(S.q.date)} · ${S.sel.time}</span></div><table>${S.pass.map((p) => `<tr><td>Seat ${p.seat}</td><td>${E(p.name)}</td><td>${E(p.phone)}</td><td>${M(r.price)}</td></tr>`).join("")}</table><div class="row" style="margin-top:16px"><div><div class="mu">Total to pay</div><div class="pr" style="font-size:28px">${M(tot)}</div></div><button class="btn" ${S.paying ? "disabled" : ""} onclick="pay()">${S.paying ? "Processing payment…" : "Pay securely"}</button></div><p class="mu">Merkava policy: no refund of money after payment. Demo checkout: payment is simulated until Paystack or Flutterwave keys are connected.</p></div></div>`;
};
V.confirm = function () {
  const b = S.done,
    r = rt(b.rid) || {};
  return `<div class="pg"><h2>🎉 Booking confirmed</h2><div class="tk"><div>MERKAVA · ${b.ref}</div><div><h3>${E(b.from)} → ${E(b.to)}</h3><p>${fmtDate(b.date)} at ${b.time}<br>${b.from == "Abuja" || b.to == "Abuja" ? `Abuja stop: ${E(ABUJA_ADDR || "to be confirmed, ask us on WhatsApp")}<br>` : ""}Seats: ${b.seats.join(", ")}<br>${b.pass.map((p) => E(p.name)).join(", ")}</p><b class="pr">${M(b.total)} paid</b>${boardingHtml()}</div></div><div class="row np" style="margin-top:16px"><button class="btn o" onclick="print()">Print ticket</button><a class="btn g" target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${encodeURIComponent("Hello Merkava, my booking reference is " + b.ref)}">Send reference on WhatsApp</a>${S.q.ret && b.from == S.q.from ? `<button class="btn o" onclick="retTrip()">Book return · ${S.q.ret}</button>` : ""}<a class="btn" href="#manage">Manage this booking</a></div></div>`;
};
