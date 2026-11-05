
const LAPS = 10,
  DR = [
    ["Alyssa Edwards", "Backrolls", 8, 0.9],
    ["Jimin Opa", "Saranghae", 8, 0.8],
    ["Lewis Litt", "Mikado", 5, 0.55],
    ["Perry The Platypus", "O.W.C.A.", 7, 0.75],
    ["Dwight Schrute", "Battlestar Galactica", 8, 0.85],
    ["Michael Jackson", "The Jackson 5", 6, 0.9],
    ["Philomena Cunk", "CunkOnEarth", 6, 0.6],
    ["Beka", "FOOD", 9, 0.91],
    ["Elizabeth II", "Crown", 4, 0.5],
    ["Djuliana [unknown]", "individual", 4, 0.4],
  ];

const T = {
  Меки: { n: "Меки", off: -0.8, w: 0.35 },
  Тврди: { n: "Тврди", off: 0.5, w: 0.1 },
};

// ===== Race state =====
let S,
  timer = null;

// ===== Helpers: get element by id, format seconds as m:ss.mmm =====
const $ = (id) => document.getElementById(id),
  fmt = (t) => Math.floor(t / 60) + ":" + (t % 60).toFixed(3).padStart(6, "0");

// Create a fresh race: drivers, grid order and empty history
function init() {
  clearInterval(timer);
  timer = null;
  $("auto").textContent = "Цела трка";
  S = {
    lap: 0,
    sc: false,
    d: DR.map((r, i) => ({
      id: i,
      name: r[0],
      team: r[1],
      speed: r[2],
      skill: r[3],
      tyre: Math.random() < 0.5 ? "Меки" : "Тврди",
      wear: 0,
      total: 0,
      last: 0,
      pitted: false,
      plan: 3 + Math.floor(Math.random() * 6),
      queue: false,
      out: false,
      outLap: 0,
      status: "Grid",
      ev: [],
      pos: i + 1,
      pen: false,
    })),
    hist: [],
  };
  order();
  S.hist.push(S.d.map((d) => ({ pos: d.pos, ev: "" })));
  render();
}

// Sort drivers by total time (retired drivers go last) and set positions
function order() {
  const a = [...S.d].sort((x, y) =>
    x.out !== y.out
      ? x.out - y.out
      : x.out
        ? y.outLap - x.outLap
        : x.total - y.total || x.id - y.id,
  );
  a.forEach((d, i) => (d.pos = i + 1));
  return a;
}

// Simulate one lap for every driver
function lap() {
  if (S.lap >= LAPS) return;
  S.lap++;
  const L = S.lap;
  S.sc = L > 1 && L < LAPS && Math.random() < 0.12;
  S.d.forEach((d) => {
    if (d.out) {
      d.ev = ["X"];
      return;
    }
    d.ev = [];
    const st = [],
      ty = T[d.tyre];
    let t = 88 - d.speed * 0.7 + ty.off + d.wear * ty.w + Math.random() * (3.2 * (1 - d.skill) + 0.4);
    d.wear++;
    if (S.sc) {
      t += 22;
      st.push("Safety car");
      d.ev.push("SC");
    }
    if (d.queue || (!d.pitted && L === d.plan)) {
      t += S.sc ? 10 : 20;
      d.tyre = d.tyre === "Меки" ? "Тврди" : "Меки";
      d.wear = 0;
      d.pitted = true;
      d.queue = false;
      st.push("Пит стоп -> " + d.tyre);
      d.ev.push("P");
    }
    const r = Math.random();
    if (r < 0.025 && L < LAPS) {
      d.out = true;
      d.outLap = L;
      st.push("Судар");
      d.ev = ["X"];
    } else if (r < 0.1) {
      t += 8;
      st.push("Излетан од стаза +8s");
      d.ev.push("S");
    }
    if (L === LAPS && !d.pitted && !d.out) {
      d.total += 30;
      st.push("+30s без промена на гуми");
    }
    d.last = t;
    d.total += t;
    d.status = st.join(", ") || "Во трка";
  });
  order();
  S.hist.push(S.d.map((d) => ({ pos: d.pos, ev: d.ev.join("") })));
  render();
  if (S.lap >= LAPS) {
    clearInterval(timer);
    timer = null;
    $("auto").textContent = "Цела трка";
  }
}

// Redraw all three tables and the winner banner
function render() {
  const a = order(),
    fin = S.lap >= LAPS,
    L = S.lap;
  $("lapl").textContent = fin ? "Завршен" : "Круг " + L + " / " + LAPS;
  $("next").disabled = $("auto").disabled = fin;
  $("sc").textContent = S.sc
    ? "Круг со Safety car."
    : "";
  $("base").innerHTML =
    "<tr><th>Возач</th><th>Тим</th><th>Брзина</th><th>Вештини</th></tr>" +
    DR.map(
      (r) =>
        `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}/10</td><td>${Math.round(r[3] * 100)}%</td></tr>`,
    ).join("");
  const lead = a.find((d) => !d.out);
  $("race").innerHTML =
    "<tr><th>Поз</th><th>Возач</th><th>Тим</th><th>Гуми</th><th>Носи</th><th>Последен круг</th><th>Вкупно</th><th>Раз</th><th>Статус</th><th>Пит</th></tr>" +
    a
      .map(
        (d) =>
          `<tr class="${d.out ? "out" : ""} ${fin && d === lead ? "win" : ""}"><td>${d.out ? "OUT" : d.pos}</td><td>${d.name}${fin && d === lead ? " " : ""}</td><td>${d.team}</td><td><span class="tag">${d.tyre}</span></td><td>${d.wear}</td><td>${L && !d.out ? fmt(d.last) : "-"}</td><td>${L && !d.out ? fmt(d.total) : "-"}</td><td>${d.out || !L || d === lead ? "-" : "+" + (d.total - lead.total).toFixed(3)}</td><td>${d.status}</td><td>${d.out || fin ? "" : `<button class="alt" style="padding:3px 10px" onclick="S.d[${d.id}].queue=!S.d[${d.id}].queue;render()">${d.queue ? "На ред" : "Пит"}</button>`}</td></tr>`,
      )
      .join("");
  let h =
    "<tr><th>Возач</th>" +
    S.hist.map((_, i) => `<th>${i ? "К" + i : "Почетна"}</th>`).join("") +
    "</tr>";
  DR.forEach((r, i) => {
    h +=
      `<tr><td>${r[0]}</td>` +
      S.hist
        .map((x) => `<td>${x[i].pos}${x[i].ev ? ` <small>${x[i].ev}</small>` : ""}</td>`)
        .join("") +
      "</tr>";
  });
  $("hist").innerHTML = h;
  $("banner").innerHTML = fin
    ? `<div class="banner"> ПОБЕДНИК: ${lead.name} (${lead.team}) - ${fmt(lead.total)}</div>`
    : "";
}

// ===== Button events =====
$("next").onclick = lap;
$("reset").onclick = init;
$("auto").onclick = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    $("auto").textContent = "Цела трка";
  } else {
    $("auto").textContent = "Паузирај";
    timer = setInterval(lap, 1200);
  }
};
init();