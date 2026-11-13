const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s) => document.querySelector(s);

// Corazón 8 bits (7x6) como SVG; el color sale de `color` en CSS.
const PIXELES = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
const CORAZON = `<svg viewBox="0 0 7 6" shape-rendering="crispEdges" aria-hidden="true">${PIXELES.flatMap((fila, y) =>
  [...fila].map((c, x) => (c === "X" ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : ""))
).join("")}</svg>`;
const COLORES = ["#D4537A", "#E8B4B8", "#C9A227", "#E0446A"];

// ---------- Fondo ----------
for (let i = 0; i < 12; i++) {
  const s = document.createElement("span");
  s.innerHTML = CORAZON;
  s.style.cssText = `left:${Math.random() * 100}%;--s:${8 + Math.random() * 14}px;--d:${18 + Math.random() * 16}s;--delay:${-Math.random() * 30}s;--x:${Math.random() * 80 - 40}px`;
  $("#fondo").append(s);
}

// ---------- Entrada ----------
$("#sprite").addEventListener("click", () => {
  const escena = $(".escena");
  for (let i = 0; i < 16; i++) {
    const h = document.createElement("span");
    h.className = "burst";
    h.innerHTML = CORAZON;
    h.style.color = COLORES[i % COLORES.length];
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 140;
    h.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
    h.style.setProperty("--dy", `${Math.sin(ang) * dist - 80}px`);
    h.addEventListener("animationend", () => h.remove());
    escena.append(h);
  }
});

$("#abrir").addEventListener("click", () => {
  const entrada = $("#entrada");
  entrada.classList.add("salir");
  setTimeout(() => { entrada.hidden = true; }, reduce ? 0 : 900);
  $("#principal").hidden = false;
  iniciar();
});

// ---------- Carrusel ----------
const slides = [...document.querySelectorAll(".slide")];
let actual = 0, indice = -1, timer;

function mostrar(src, ms = 4000) {
  clearTimeout(timer);
  const sig = slides[1 - actual];
  const [bg, fg] = sig.querySelectorAll("img");
  bg.src = fg.src = src;
  fg.decode().catch(() => {}).then(() => {
    slides[actual].classList.remove("on");
    sig.classList.add("on");
    actual = 1 - actual;
  });
  timer = setTimeout(() => {
    indice = (indice + 1) % FOTOS.length;
    mostrar("fotos/" + FOTOS[indice]);
  }, ms);
}

// ---------- Motivos ----------
const resaltar = (t) => t.replace(/\b(Paula|Pau|papoi)\b/g, '<span class="nombre">$1</span>');

function copia() {
  const div = document.createElement("div");
  div.className = "copia";
  let seccion;
  MOTIVOS.forEach((m, i) => {
    if (m.seccion !== seccion) {
      seccion = m.seccion;
      const h = document.createElement("h3");
      h.className = "sep";
      h.textContent = seccion;
      div.append(h);
    }
    const p = document.createElement("p");
    p.className = "motivo";
    p.dataset.i = i;
    p.innerHTML = resaltar(m.texto);
    div.append(p);
  });
  return div;
}

const scroller = $("#scroller"), track = $("#track");
let motivoActual = -1;

// El motivo más cercano al centro manda en el contador (y en la foto, si tiene).
function actualizarContador() {
  const r = scroller.getBoundingClientRect(), centro = r.top + r.height / 2;
  let mejor, dist = Infinity;
  for (const p of track.querySelectorAll(".motivo")) {
    const b = p.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - centro);
    if (d < dist) { dist = d; mejor = +p.dataset.i; }
  }
  if (mejor === undefined || mejor === motivoActual) return;
  motivoActual = mejor;
  $("#contador").textContent = `Motivo ${mejor + 1} de ${MOTIVOS.length}`;
  const foto = MOTIVOS[mejor].foto;
  if (foto) mostrar("fotos/" + foto, 9000);
}

function iniciar() {
  $("#titulo-motivos").textContent = TITULO;
  $("#mensaje-texto").textContent = MENSAJE_FINAL;
  mostrar("fotos/papoi.jpg", 5000);

  track.append(copia());
  if (reduce) { // sin movimiento: se lee con scroll normal
    scroller.addEventListener("scroll", actualizarContador, { passive: true });
    actualizarContador();
    return;
  }
  track.append(copia()); // segunda copia para el loop sin cortes

  let y = 0, antes = performance.now(), pausa = false, ultimo = 0;
  const VELOCIDAD = 24; // px por segundo
  scroller.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pausa = true; });
  scroller.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") pausa = false; });
  scroller.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") pausa = !pausa; });

  (function paso(t) {
    const dt = Math.min(t - antes, 100) / 1000;
    antes = t;
    if (!pausa) {
      y -= VELOCIDAD * dt;
      const alto = track.firstElementChild.offsetHeight;
      if (-y >= alto) y += alto;
      track.style.transform = `translateY(${y}px)`;
    }
    if (t - ultimo > 250) { ultimo = t; actualizarContador(); }
    requestAnimationFrame(paso);
  })(antes);
}

// ---------- Mensaje y música ----------
$("#btn-mensaje").addEventListener("click", () => $("#mensaje").showModal());

const audio = $("#musica"), btnMusica = $("#btn-musica");
fetch("musica.mp3", { method: "HEAD" }).then((r) => { if (r.ok) btnMusica.hidden = false; }).catch(() => {});
btnMusica.addEventListener("click", () => {
  if (audio.paused) audio.play(); else audio.pause();
  const on = !audio.paused;
  btnMusica.setAttribute("aria-pressed", on);
  btnMusica.textContent = on ? "♪ Pausar música" : "♪ Música";
});
