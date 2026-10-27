/**
 * Brasil Force sound design, synthesized live with the Web Audio API: no audio
 * files, nothing licensed, all original. Off by default; it only starts after
 * the visitor turns it on (browsers block autoplay anyway) and it suspends
 * whenever the tab is hidden.
 */
export type Sfx = "click" | "ping" | "whoosh" | "impact";

export const SOUND_STORAGE_KEY = "bf-sound";
export const SFX_EVENT = "bf:sfx";

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  ambient: GainNode;
  noise: AudioBuffer;
  stopAmbient: () => void;
};

let engine: Engine | null = null;
let enabled = false;

function noiseBuffer(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function noiseSource(e: Engine, loop = false) {
  const src = e.ctx.createBufferSource();
  src.buffer = e.noise;
  src.loop = loop;
  return src;
}

/** Low cinematic drone + mountain wind + a soft radar ping every few seconds. */
function startAmbient(e: Engine) {
  const { ctx, ambient } = e;
  const nodes: AudioScheduledSourceNode[] = [];

  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 220;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.22;
  droneFilter.connect(droneGain).connect(ambient);
  for (const [freq, detune] of [
    [55, -6],
    [55, 7],
    [82.4, 0],
  ]) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(droneFilter);
    osc.start();
    nodes.push(osc);
  }
  // Slow breathing on the drone filter.
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 90;
  lfo.connect(lfoGain).connect(droneFilter.frequency);
  lfo.start();
  nodes.push(lfo);

  const wind = noiseSource(e, true);
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 500;
  windFilter.Q.value = 0.6;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.05;
  const gust = ctx.createOscillator();
  const gustGain = ctx.createGain();
  gust.frequency.value = 0.11;
  gustGain.gain.value = 260;
  gust.connect(gustGain).connect(windFilter.frequency);
  wind.connect(windFilter).connect(windGain).connect(ambient);
  wind.start();
  gust.start();
  nodes.push(wind, gust);

  const timer = window.setInterval(() => play("ping", 0.35), 6400);
  return () => {
    window.clearInterval(timer);
    for (const node of nodes) {
      try {
        node.stop();
      } catch {
        // Already stopped.
      }
    }
  };
}

function ensureEngine(): Engine | null {
  if (engine) return engine;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  const compressor = ctx.createDynamicsCompressor();
  master.connect(compressor).connect(ctx.destination);
  const ambient = ctx.createGain();
  ambient.gain.value = 0.5;
  ambient.connect(master);
  engine = { ctx, master, ambient, noise: noiseBuffer(ctx), stopAmbient: () => undefined };
  document.addEventListener("visibilitychange", () => {
    if (!engine) return;
    if (document.hidden) void engine.ctx.suspend();
    else if (enabled) void engine.ctx.resume();
  });
  return engine;
}

export function soundEnabled() {
  return enabled;
}

/** Must be called from a user gesture (click/tap) the first time. */
export async function setSound(on: boolean) {
  enabled = on;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
  const e = on ? ensureEngine() : engine;
  if (!e) return;
  const now = e.ctx.currentTime;
  if (on) {
    await e.ctx.resume();
    e.stopAmbient();
    e.stopAmbient = startAmbient(e);
    e.master.gain.cancelScheduledValues(now);
    e.master.gain.setTargetAtTime(0.8, now, 0.6);
    play("impact");
  } else {
    e.master.gain.cancelScheduledValues(now);
    e.master.gain.setTargetAtTime(0.0001, now, 0.25);
    const stop = e.stopAmbient;
    e.stopAmbient = () => undefined;
    window.setTimeout(() => {
      stop();
      if (!enabled) void e.ctx.suspend();
    }, 900);
  }
}

export function play(name: Sfx, volume = 1) {
  if (!enabled || !engine || engine.ctx.state !== "running") return;
  const { ctx, master } = engine;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.connect(master);

  if (name === "click") {
    // Metallic tick: a short filtered noise burst plus a bright ring.
    const n = noiseSource(engine);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3200;
    bp.Q.value = 6;
    n.connect(bp).connect(out);
    const ring = ctx.createOscillator();
    ring.type = "triangle";
    ring.frequency.setValueAtTime(2400, t);
    ring.frequency.exponentialRampToValueAtTime(1600, t + 0.08);
    ring.connect(out);
    out.gain.setValueAtTime(0.25 * volume, t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    n.start(t, Math.random(), 0.05);
    ring.start(t);
    ring.stop(t + 0.13);
  } else if (name === "ping") {
    // Radar sonar ping with a short echo.
    for (const [delay, level] of [
      [0, 1],
      [0.22, 0.35],
    ]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1320, t + delay);
      osc.frequency.exponentialRampToValueAtTime(1180, t + delay + 0.6);
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(0.18 * level * volume, t + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.7);
      osc.connect(g).connect(out);
      osc.start(t + delay);
      osc.stop(t + delay + 0.75);
    }
    out.gain.value = 1;
  } else if (name === "whoosh") {
    const n = noiseSource(engine);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.35);
    n.connect(bp).connect(out);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.22 * volume, t + 0.12);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    n.start(t, Math.random(), 0.5);
  } else {
    // Deep cinematic impact: sub drop plus a low rumble, no gunfire.
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(90, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 1.2);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.6 * volume, t);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    sub.connect(subGain).connect(out);
    const n = noiseSource(engine);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 1);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.35 * volume, t);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    n.connect(lp).connect(nGain).connect(out);
    out.gain.value = 1;
    sub.start(t);
    sub.stop(t + 1.5);
    n.start(t, Math.random(), 1.2);
  }
}

/** For components that should not import the engine directly (e.g. the cart). */
export function emitSfx(name: Sfx) {
  window.dispatchEvent(new CustomEvent(SFX_EVENT, { detail: name }));
}
