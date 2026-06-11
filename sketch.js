const PALETTES = [
  ["#ef2c25", "#0864c8", "#07942b", "#ffd11a", "#ff9411", "#f4a7a1", "#5c2117"],
  ["#fb3b34", "#4454c9", "#078832", "#ffc917", "#ff8a00", "#ff8f80", "#6c170f"],
  ["#e62822", "#0a57bd", "#0a9d31", "#f6c900", "#f27b16", "#f6b8b2", "#65261b"],
];

const BASE_TUBES = [
  {
    weight: 0.118,
    phase: 0.11,
    colors: [3, 2, 3, 1],
    cuts: [0, 0.28, 0.5, 0.74, 1],
    points: [
      [-0.1, 0.19],
      [0.09, 0.18],
      [0.2, 0.41],
      [0.34, 0.4],
      [0.44, 0.17],
      [0.62, 0.18],
      [0.74, 0.39],
      [1.1, 0.34],
    ],
  },
  {
    weight: 0.134,
    phase: 0.32,
    colors: [0, 5, 0, 4, 2],
    cuts: [0, 0.18, 0.39, 0.58, 0.82, 1],
    points: [
      [-0.12, 0.44],
      [0.07, 0.42],
      [0.16, 0.7],
      [0.34, 0.7],
      [0.43, 0.33],
      [0.57, 0.28],
      [0.68, 0.58],
      [0.88, 0.54],
      [1.12, 0.57],
    ],
  },
  {
    weight: 0.108,
    phase: 0.5,
    colors: [2, 1, 6, 3],
    cuts: [0, 0.25, 0.52, 0.68, 1],
    points: [
      [-0.13, 0.08],
      [0.04, 0.33],
      [0.22, 0.3],
      [0.28, 0.07],
      [0.45, 0.08],
      [0.5, 0.36],
      [0.67, 0.34],
      [0.8, 0.08],
      [1.12, 0.12],
    ],
  },
  {
    weight: 0.129,
    phase: 0.7,
    colors: [1, 1, 2, 4, 0],
    cuts: [0, 0.22, 0.46, 0.63, 0.8, 1],
    points: [
      [-0.11, 0.84],
      [0.05, 0.83],
      [0.12, 0.58],
      [0.3, 0.62],
      [0.37, 0.9],
      [0.55, 0.88],
      [0.66, 0.62],
      [0.83, 0.75],
      [1.12, 0.72],
    ],
  },
  {
    weight: 0.103,
    phase: 0.87,
    colors: [5, 0, 3],
    cuts: [0, 0.42, 0.66, 1],
    points: [
      [-0.1, 0.66],
      [0.08, 0.66],
      [0.13, 0.91],
      [0.29, 0.94],
      [0.4, 0.78],
      [0.54, 0.78],
      [0.58, 1.08],
    ],
  },
  {
    weight: 0.111,
    phase: 0.22,
    colors: [4, 3, 5, 2],
    cuts: [0, 0.2, 0.48, 0.77, 1],
    points: [
      [1.1, 0.2],
      [0.92, 0.19],
      [0.85, 0.45],
      [0.69, 0.43],
      [0.59, 0.69],
      [0.76, 0.92],
      [1.12, 0.93],
    ],
  },
];

let seed;
let paletteIndex;
let colorOffset = 0;
let animated = false;
let layerOrder = [2, 0, 5, 1, 4, 3];
let bendMode;
let cutOffset;
let portraitMode = true;

// Variables para control de audio e interacción
let audioDetector;
let transitionGrave = 0;
let lastState = 0;


function setup() {
  randomizeComposition();
  createCanvasForWindow();
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  cursor("default");

  // Conectar el boton de microfono del panel de control
  const btn = document.getElementById("mic-btn");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Evitar propagar click al canvas
      toggleAudio();
    });
  }
}

function draw() {
  randomSeed(seed);
  background("#e1e1e1");
  const t = animated ? frameCount * 0.0025 : 0;

  // Determinar el estado de interacción del micrófono
  let currentState = 0;
  if (audioDetector) {
    audioDetector.update();
    currentState = audioDetector.state;
  }

  // Interpolar suavemente la transición al estado grave (horizontal plano)
  if (currentState === 2) { // Grave: estirar
    transitionGrave = lerp(transitionGrave, 1.0, 0.1);
  } else { // Silencio / curvas originales (o chasquido que ya se procesó de forma discreta)
    transitionGrave = lerp(transitionGrave, 0.0, 0.12);
  }

  // Cambiar colores cuando hay sonido agudo
  if (currentState === 3) {
    // Si acaba de empezar a silbar, cambiar de color de forma instantánea
    if (lastState !== 3) {
      changeTubeColors();
    }
    // Si sostiene el silbido, cambiar de color de forma cíclica cada 30 fotogramas
    if (frameCount % 30 === 0) {
      changeTubeColors();
    }
  }
  lastState = currentState;


  for (const index of layerOrder) {
    drawTube(BASE_TUBES[index], index, t);
  }
}

function randomizeComposition() {
  seed = Math.floor(Math.random() * 1000000);
  paletteIndex = Math.floor(Math.random() * PALETTES.length);
  colorOffset = Math.floor(Math.random() * 7); // 7 colores por paleta
  bendMode = Math.floor(Math.random() * 3);
  cutOffset = Math.random();

  // Barajar el orden inicial de las capas (tubos)
  layerOrder = [2, 0, 5, 1, 4, 3];
  for (let i = layerOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [layerOrder[i], layerOrder[j]] = [layerOrder[j], layerOrder[i]];
  }
}

function createCanvasForWindow() {
  const margin = 0.94;
  const ratio = portraitMode ? 0.76 : 1;
  let h = Math.floor(windowHeight * margin);
  let w = Math.floor(h * ratio);
  if (w > windowWidth * margin) {
    w = Math.floor(windowWidth * margin);
    h = Math.floor(w / ratio);
  }
  createCanvas(w, h);
}

function windowResized() {
  const margin = 0.94;
  const ratio = portraitMode ? 0.76 : 1;
  let h = Math.floor(windowHeight * margin);
  let w = Math.floor(h * ratio);
  if (w > windowWidth * margin) {
    w = Math.floor(windowWidth * margin);
    h = Math.floor(w / ratio);
  }
  resizeCanvas(w, h);
}

function drawTube(tube, tubeIndex, t) {
  const pts = deformedPoints(tube, tubeIndex, t);
  const sampled = resampleCatmull(pts, 42);
  const pal = PALETTES[paletteIndex];
  const weight = Math.min(width, height) * tube.weight;
  const cuts = buildCuts(sampled, tube, tubeIndex);
  const seamOverlap = 0;

  drawingContext.lineCap = "butt";
  drawingContext.lineJoin = "round";
  noFill();
  strokeWeight(weight);

  for (let i = 0; i < cuts.length - 1; i++) {
    const start = Math.max(0, cuts[i] - (i > 0 ? seamOverlap : 0));
    const end = Math.min(sampled.length - 1, cuts[i + 1] + (i < cuts.length - 2 ? seamOverlap : 0));
    stroke(pal[(tube.colors[i % tube.colors.length] + paletteIndex + colorOffset) % pal.length]);
    beginShape();
    for (let j = start; j <= end; j++) {
      vertex(sampled[j].x, sampled[j].y);
    }
    endShape();
  }
}

function deformedPoints(tube, tubeIndex, t) {
  return tube.points.map(([x, y], pointIndex) => {
    const local = createVector(x, y);
    const wave = sin(t + tubeIndex * 1.9 + pointIndex * 0.83) * 0.012;
    const secondary = cos(t * 0.7 + pointIndex * 1.4 + tube.phase * 8) * 0.007;

    if (bendMode === 0) {
      local.y += wave;
      local.x += secondary * 0.5;
    } else if (bendMode === 1) {
      local.x += wave;
      local.y += secondary;
    } else {
      local.y += wave * (pointIndex % 2 === 0 ? 1 : -1);
      local.x += secondary * (tubeIndex % 2 === 0 ? 1 : -1);
    }

    // 1. Posición normal (curvas animadas)
    const posNormal = createVector(local.x * width, local.y * height);

    // 2. Posición horizontal grave: estirados rectos horizontalmente
    const avgY = tube.points.reduce((acc, pt) => acc + pt[1], 0) / tube.points.length;
    const graveX = map(pointIndex, 0, tube.points.length - 1, -0.1, 1.1);
    const posGrave = createVector(graveX * width, avgY * height);

    // Mezclar curvas normales y horizontales
    return p5.Vector.lerp(posNormal, posGrave, transitionGrave);
  });
}

function resampleCatmull(points, steps) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let s = 0; s < steps; s++) {
      const u = s / steps;
      out.push(catmullPoint(p0, p1, p2, p3, u));
    }
  }
  out.push(points[points.length - 1].copy());
  return out;
}

function catmullPoint(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return createVector(x, y);
}

function buildCuts(sampled, tube, tubeIndex) {
  const total = sampled.length;
  const cuts = tube.cuts.map((cut, i) => {
    if (i === 0) return 0;
    if (i === tube.cuts.length - 1) return total - 1;
    const drift = sin((cutOffset + tube.phase + i * 0.17) * TWO_PI) * 0.018;
    return findHorizontalCut(sampled, constrain(cut + drift, 0.06, 0.94));
  });
  return cleanCuts(cuts, total);
}

function findHorizontalCut(sampled, target) {
  const targetIndex = Math.floor(target * (sampled.length - 1));
  
  // Si los tubos están casi completamente planos horizontalmente, omitir la búsqueda compleja en curvas
  if (transitionGrave > 0.8) {
    return targetIndex;
  }
  
  const searchRadius = Math.floor(sampled.length * 0.22);
  const local = findBestHorizontalCut(sampled, targetIndex, searchRadius);
  if (local.quality < 0.36) return local.index;

  return findBestHorizontalCut(sampled, targetIndex, sampled.length).index;
}

function findBestHorizontalCut(sampled, targetIndex, searchRadius) {
  let best = { index: targetIndex, quality: Infinity, score: Infinity };

  for (let i = Math.max(6, targetIndex - searchRadius); i <= Math.min(sampled.length - 7, targetIndex + searchRadius); i++) {
    const before = sampled[i - 4];
    const current = sampled[i];
    const after = sampled[i + 4];
    const prev = sampled[i - 6];
    const next = sampled[i + 6];

    const dx = Math.abs(after.x - before.x);
    const dy = Math.abs(after.y - before.y);
    const verticalScore = dx / Math.max(1, dy);

    const angleA = atan2(current.y - prev.y, current.x - prev.x);
    const angleB = atan2(next.y - current.y, next.x - current.x);
    const bendScore = Math.abs(atan2(sin(angleB - angleA), cos(angleB - angleA)));
    const distanceScore = Math.abs(i - targetIndex) / Math.max(1, searchRadius);
    const quality = verticalScore + bendScore;

    const straightVerticalBonus = verticalScore < 0.22 && bendScore < 0.16 ? -4 : 0;
    const score = verticalScore * 22 + bendScore * 8 + distanceScore * 0.8 + straightVerticalBonus;
    if (score < best.score) {
      best = { index: i, quality, score };
    }
  }

  return best;
}

function cleanCuts(cuts, total) {
  const minGap = 8;
  const cleaned = [];

  for (const cut of cuts.sort((a, b) => a - b)) {
    const clamped = Math.floor(constrain(cut, 0, total - 1));
    if (cleaned.length === 0 || clamped - cleaned[cleaned.length - 1] >= minGap) {
      cleaned.push(clamped);
    }
  }

  if (cleaned[0] !== 0) cleaned.unshift(0);
  if (cleaned[cleaned.length - 1] !== total - 1) cleaned.push(total - 1);
  return cleaned;
}

// (rotatedOrder removida por desuso)

// ========================================================
// CAPTURA, ANÁLISIS DE AUDIO Y EVENTOS
// ========================================================

function toggleAudio() {
  if (!audioDetector) {
    audioDetector = new AudioDetector();
  }

  if (audioDetector.isActive) {
    audioDetector.stop();
  } else {
    audioDetector.start();
  }
}

function changeTubeColors() {
  // Cambiar de paleta e incrementar el desplazamiento interno de colores
  paletteIndex = (paletteIndex + 1) % PALETTES.length;
  const pal = PALETTES[paletteIndex];
  colorOffset = (colorOffset + 1) % pal.length;
}

class AudioDetector {
  constructor() {
    this.mic = null;
    this.fft = null;
    this.volume = 0;
    this.state = 0; // 0: Silencio, 1: Chasquido, 2: Grave, 3: Agudo
    this.snapHoldTimer = 0;
    this.volumeHistory = [];
    this.historyLength = 30; // ~0.5s a 60fps
    this.isActive = false;
  }

  async start() {
    try {
      // Iniciar el contexto de audio p5 por políticas de seguridad del navegador
      await userStartAudio();

      this.mic = new p5.AudioIn();
      await this.mic.start();

      this.fft = new p5.FFT(0.8, 512);
      this.fft.setInput(this.mic);
      this.isActive = true;

      // Actualizar botón e indicadores en la UI
      const btn = document.getElementById("mic-btn");
      if (btn) {
        btn.textContent = "Desactivar Micrófono";
        btn.classList.add("active");
      }
      const dot = document.getElementById("status-dot");
      if (dot) {
        dot.className = "status-dot active";
      }

      console.log("p5.sound activo y analizando frecuencias.");
    } catch (e) {
      console.error("Error al acceder al micrófono con p5.sound:", e);
      alert("No se pudo iniciar el micrófono con p5.sound. Asegúrate de otorgar permisos de audio.");
      this.isActive = false;
    }
  }

  stop() {
    if (this.mic) {
      this.mic.stop();
    }
    this.isActive = false;
    this.state = 0;
    this.volume = 0;

    // Resetear UI
    const btn = document.getElementById("mic-btn");
    if (btn) {
      btn.textContent = "Activar Micrófono";
      btn.classList.remove("active");
    }
    const dot = document.getElementById("status-dot");
    if (dot) {
      dot.className = "status-dot";
    }
    const modeEl = document.getElementById("status-mode");
    if (modeEl) {
      modeEl.textContent = "Desactivado";
      modeEl.className = "mode-inactive";
    }
    const fill = document.getElementById("meter-fill");
    if (fill) fill.style.width = "0%";
    const valEl = document.getElementById("meter-val");
    if (valEl) valEl.textContent = "0%";
  }

  update() {
    if (!this.isActive) {
      this.state = 0;
      return;
    }

    // Ejecutar análisis de frecuencia y volumen general con p5.sound
    const spectrum = this.fft.analyze();
    const rawVolume = this.mic.getLevel();
    this.volume = lerp(this.volume, rawVolume, 0.25);

    // Actualizar nivel en la barra gráfica de UI
    const volPct = Math.round(this.volume * 100);
    const fill = document.getElementById("meter-fill");
    if (fill) fill.style.width = `${Math.min(volPct * 3.0, 100)}%`;
    const valEl = document.getElementById("meter-val");
    if (valEl) valEl.textContent = `${volPct}%`;

    // Historial de volumen para chasquidos
    this.volumeHistory.push(rawVolume);
    if (this.volumeHistory.length > this.historyLength) {
      this.volumeHistory.shift();
    }

    // 1. Umbral de Silencio (Puerta de ruido)
    if (this.volume < 0.012) {
      if (this.snapHoldTimer > 0) {
        this.snapHoldTimer--;
        this.state = 1;
      } else {
        this.state = 0;
      }
    } else {
      // 2. Detección de Chasquido (transitorio rápido)
      let isSnap = false;
      if (this.volumeHistory.length >= 10) {
        const pastSum = this.volumeHistory.slice(0, -3).reduce((a, b) => a + b, 0);
        const pastAvg = pastSum / (this.volumeHistory.length - 3);
        const currentAvg = this.volumeHistory.slice(-3).reduce((a, b) => a + b, 0) / 3;

        if (currentAvg > pastAvg * 2.2 && currentAvg > 0.04) {
          isSnap = true;
        }
      }

      if (isSnap) {
        this.state = 1;
        
        // CORRECCIÓN: Filtro de rebote (cooldown). Solo cambiamos la superposición si NO estábamos en un cooldown activo.
        // Esto evita que un solo chasquido largo sea interpretado como múltiples chasquidos en fotogramas sucesivos.
        if (this.snapHoldTimer === 0) {
          if (layerOrder.length > 1) {
            const randIdx = Math.floor(Math.random() * (layerOrder.length - 1));
            const chosenTube = layerOrder.splice(randIdx, 1)[0];
            layerOrder.push(chosenTube);
          }
        }
        this.snapHoldTimer = 35; // Cooldown de aprox. 0.6 segundos
      } else if (this.snapHoldTimer > 0) {
        this.snapHoldTimer--;
        this.state = 1;
      } else {
        // 3. CORRECCIÓN: Detección precisa de Frecuencias por Análisis de Pico (Pitch Detection)
        // Buscamos la frecuencia dominante (pico del espectro) en lugar de promediar bandas anchas.
        // Esto previene que un silbido puro se diluya y sea indetectable.
        let maxVal = 0;
        let maxIdx = -1;
        for (let i = 1; i < spectrum.length; i++) { // Omitir el bin 0 (DC offset)
          if (spectrum[i] > maxVal) {
            maxVal = spectrum[i];
            maxIdx = i;
          }
        }

        // Calcular la frecuencia correspondiente en Hz
        const sRate = sampleRate();
        const peakFrequency = maxIdx * sRate / (2 * spectrum.length);

        // Umbral de intensidad del pico
        if (maxVal > 80) {
          if (peakFrequency >= 50 && peakFrequency <= 350) {
            this.state = 2; // Sonido Grave
          } else if (peakFrequency >= 800 && peakFrequency <= 3300) {
            this.state = 3; // Sonido Agudo (Silbido)
          } else {
            this.state = 0; // Frecuencia media (habla o ruido general)
          }
        } else {
          this.state = 0;
        }
      }
    }

    // Actualizar indicador textual de estado en la UI
    const modeEl = document.getElementById("status-mode");
    if (modeEl) {
      if (this.state === 0) {
        modeEl.textContent = "Silencio (Curvas)";
        modeEl.className = "mode-silence";
      } else if (this.state === 1) {
        modeEl.textContent = "Chasquido (Capa Cambiada)";
        modeEl.className = "mode-snap";
      } else if (this.state === 2) {
        modeEl.textContent = "Sonido Grave (Estirado)";
        modeEl.className = "mode-grave";
      } else if (this.state === 3) {
        modeEl.textContent = "Sonido Agudo (Cambio Color)";
        modeEl.className = "mode-high";
      }
    }
  }
}
