// 合成音效生成脚本 - 为游戏生成所有音效和音乐
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = 'd:/qn/html5/html5f/assets/audio';
const SAMPLE_RATE = 44100;
const BITS = 16;
const MAX_AMP = 32767;

// ============== WAV 文件写入 ==============
function writeWav(filename, samples) {
  const numChannels = 1;
  const byteRate = SAMPLE_RATE * numChannels * (BITS / 8);
  const blockAlign = numChannels * (BITS / 8);
  const dataSize = samples.length * (BITS / 8);
  const fileSize = 44 + dataSize;

  const buf = Buffer.alloc(fileSize);
  let off = 0;
  buf.write('RIFF', off); off += 4;
  buf.writeUInt32LE(fileSize - 8, off); off += 4;
  buf.write('WAVE', off); off += 4;
  buf.write('fmt ', off); off += 4;
  buf.writeUInt32LE(16, off); off += 4;
  buf.writeUInt16LE(1, off); off += 2; // PCM
  buf.writeUInt16LE(numChannels, off); off += 2;
  buf.writeUInt32LE(SAMPLE_RATE, off); off += 4;
  buf.writeUInt32LE(byteRate, off); off += 4;
  buf.writeUInt16LE(blockAlign, off); off += 2;
  buf.writeUInt16LE(BITS, off); off += 2;
  buf.write('data', off); off += 4;
  buf.writeUInt32LE(dataSize, off); off += 4;

  for (let i = 0; i < samples.length; i++) {
    let v = Math.max(-1, Math.min(1, samples[i]));
    v = v < 0 ? v * 32768 : v * 32767;
    buf.writeInt16LE(Math.round(v), off);
    off += 2;
  }
  fs.writeFileSync(path.join(AUDIO_DIR, filename), buf);
}

// ============== 工具函数 ==============
function genSamples(duration, fn) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const arr = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    arr[i] = fn(t, i, len);
  }
  return arr;
}

function envelope(samples, attack, decay, sustainLevel, release) {
  const total = samples.length;
  const aEnd = Math.floor(attack * SAMPLE_RATE);
  const dEnd = aEnd + Math.floor(decay * SAMPLE_RATE);
  const rStart = total - Math.floor(release * SAMPLE_RATE);
  for (let i = 0; i < total; i++) {
    let env = 0;
    if (i < aEnd) env = i / aEnd;
    else if (i < dEnd) env = 1 - (1 - sustainLevel) * ((i - aEnd) / (dEnd - aEnd));
    else if (i < rStart) env = sustainLevel;
    else env = sustainLevel * (1 - (i - rStart) / (total - rStart));
    samples[i] *= env;
  }
  return samples;
}

function noise() { return Math.random() * 2 - 1; }

// ============== 音效生成 ==============

// --- UI 按钮点击 (短促高频) ---
function makeUIClick(variant) {
  const freq = 800 + variant * 200;
  const dur = 0.04 + variant * 0.02;
  let s = genSamples(dur, t => Math.sin(2 * Math.PI * freq * t) * 0.6 + noise() * 0.15);
  return envelope(s, 0.002, 0.005, 0.3, dur - 0.01);
}

// --- UI 悬停 (轻柔) ---
function makeUIHover() {
  let s = genSamples(0.06, t => Math.sin(2 * Math.PI * 600 * t) * 0.3);
  return envelope(s, 0.003, 0.01, 0.2, 0.04);
}

// --- 通知提示音 (双音) ---
function makeNotifyBeep() {
  let s1 = genSamples(0.08, t => Math.sin(2 * Math.PI * 1000 * t) * 0.5);
  s1 = envelope(s1, 0.003, 0.02, 0.4, 0.05);
  let s2 = genSamples(0.08, t => Math.sin(2 * Math.PI * 1400 * t) * 0.5);
  s2 = envelope(s2, 0.003, 0.02, 0.4, 0.05);
  const result = new Float32Array(s1.length + s2.length);
  result.set(s1, 0);
  result.set(s2, s1.length);
  return result;
}

// --- 打字机音效 ---
function makeUILetters() {
  let s = genSamples(0.03, t => Math.sin(2 * Math.PI * 2000 * t) * 0.3 + noise() * 0.2);
  return envelope(s, 0.001, 0.003, 0.1, 0.02);
}

// --- 开箱/治疗音 (上升音) ---
function makeBoxOpen() {
  let s = genSamples(0.3, t => Math.sin(2 * Math.PI * (400 + t * 2400) * t) * 0.5);
  return envelope(s, 0.01, 0.1, 0.6, 0.15);
}

function makeHealthOpen() {
  let s = genSamples(0.4, t => Math.sin(2 * Math.PI * (300 + t * 1800) * t) * 0.5 + Math.sin(2 * Math.PI * (500 + t * 2000) * t) * 0.3);
  return envelope(s, 0.02, 0.1, 0.5, 0.2);
}

// --- R4 机器人音效 (电子音) ---
function makeR4(variant) {
  const freqs = [
    [400, 800, 0.15],
    [600, 1200, 0.2],
    [300, 900, 0.25]
  ];
  const [f1, f2, dur] = freqs[variant % 3];
  let s = genSamples(dur, t => {
    const f = f1 + (f2 - f1) * (t / dur);
    return Math.sin(2 * Math.PI * f * t) * 0.4 + Math.sin(2 * Math.PI * f * 1.5 * t) * 0.2;
  });
  return envelope(s, 0.01, 0.03, 0.5, 0.08);
}

// --- 得分循环 ---
function makeScoreLoop() {
  let s = genSamples(0.5, t => {
    const f = 400 + Math.sin(2 * Math.PI * 8 * t) * 100;
    return Math.sin(2 * Math.PI * f * t) * 0.3;
  });
  return envelope(s, 0.02, 0.05, 0.7, 0.1);
}

// --- 枪声/激光 (噪声爆发 + 频率下降) ---
function makeBlaster(variant) {
  const dur = 0.12 + variant * 0.03;
  const baseFreq = 1200 - variant * 100;
  let s = genSamples(dur, t => {
    const ratio = t / dur;
    const freq = baseFreq * (1 - ratio * 0.7);
    const osc = Math.sin(2 * Math.PI * freq * t) * 0.5;
    const nz = noise() * 0.5 * (1 - ratio);
    return osc + nz;
  });
  return envelope(s, 0.001, 0.01, 0.2, dur - 0.02);
}

// --- 风暴兵枪声 (稍重) ---
function makeStormBlaster(variant) {
  const dur = 0.15 + variant * 0.02;
  let s = genSamples(dur, t => {
    const ratio = t / dur;
    const freq = 800 * (1 - ratio * 0.6);
    return Math.sin(2 * Math.PI * freq * t) * 0.4 + noise() * 0.6 * (1 - ratio);
  });
  return envelope(s, 0.001, 0.01, 0.15, dur - 0.02);
}

// --- 叛军枪声 ---
function makeRebelBlaster(variant) {
  const dur = 0.1 + variant * 0.02;
  let s = genSamples(dur, t => {
    const ratio = t / dur;
    const freq = 1500 * (1 - ratio * 0.5);
    return Math.sin(2 * Math.PI * freq * t) * 0.5 + noise() * 0.3 * (1 - ratio);
  });
  return envelope(s, 0.001, 0.008, 0.2, dur - 0.015);
}

// --- 狙击枪 (重击+回响) ---
function makeSniper(variant) {
  const dur = 0.3 + variant * 0.05;
  let s = genSamples(dur, t => {
    const ratio = t / dur;
    const freq = 400 * (1 - ratio * 0.8);
    const main = Math.sin(2 * Math.PI * freq * t) * 0.6 * (1 - ratio);
    const nz = noise() * 0.8 * (1 - ratio);
    const reverb = Math.sin(2 * Math.PI * 200 * t) * 0.15 * ratio;
    return main + nz + reverb;
  });
  return envelope(s, 0.001, 0.02, 0.1, 0.2);
}

// --- 炮塔 ---
function makeTurret() {
  let s = genSamples(0.2, t => {
    const ratio = t / 0.2;
    const freq = 600 * (1 - ratio * 0.6);
    return Math.sin(2 * Math.PI * freq * t) * 0.5 + noise() * 0.6 * (1 - ratio);
  });
  return envelope(s, 0.001, 0.01, 0.15, 0.1);
}

// --- 爆炸 (低频噪声) ---
function makeExplosion(variant) {
  const dur = 0.3 + variant * 0.15;
  let s = genSamples(dur, t => {
    const ratio = t / dur;
    const lowFreq = 40 + Math.random() * 30;
    const nz = noise() * (1 - ratio * ratio);
    const rumble = Math.sin(2 * Math.PI * lowFreq * t) * 0.5 * (1 - ratio);
    return nz * 0.7 + rumble;
  });
  return envelope(s, 0.002, 0.05, 0.3, dur - 0.05);
}

// --- 大爆炸 (坦克/ATAT) ---
function makeBigExplosion(variant) {
  const dur = 0.5 + variant * 0.2;
  let s = genSamples(dur, t => {
    const ratio = t / dur;
    const nz = noise() * (1 - ratio * ratio);
    const rumble = Math.sin(2 * Math.PI * (25 + Math.random() * 20) * t) * 0.6 * (1 - ratio);
    const crackle = Math.sin(2 * Math.PI * (200 + Math.random() * 100) * t) * 0.3 * (1 - ratio) * (1 - ratio);
    return nz * 0.6 + rumble + crackle;
  });
  return envelope(s, 0.003, 0.08, 0.2, dur - 0.08);
}

// --- 手雷爆炸 ---
function makeGrenadeExplode() {
  let s = genSamples(0.4, t => {
    const ratio = t / 0.4;
    const nz = noise() * (1 - ratio * ratio);
    const rumble = Math.sin(2 * Math.PI * (30 + Math.random() * 20) * t) * 0.5 * (1 - ratio);
    return nz * 0.7 + rumble;
  });
  return envelope(s, 0.001, 0.04, 0.25, 0.3);
}

// --- 手雷计时 ---
function makeGrenadeTimer() {
  let s = genSamples(0.15, t => Math.sin(2 * Math.PI * 1000 * t) * 0.4);
  return envelope(s, 0.002, 0.02, 0.3, 0.1);
}

// --- 手雷警告 ---
function makeGrenadeWarning() {
  let s = genSamples(0.25, t => Math.sin(2 * Math.PI * 800 * t) * 0.5);
  return envelope(s, 0.003, 0.03, 0.4, 0.15);
}

// --- 火箭发射 ---
function makeRocketLaunch() {
  let s = genSamples(0.5, t => {
    const ratio = t / 0.5;
    const freq = 200 + ratio * 800;
    const nz = noise() * 0.5 * (1 - ratio);
    const whoosh = Math.sin(2 * Math.PI * freq * t) * 0.4 * (1 - ratio * 0.5);
    return nz + whoosh;
  });
  return envelope(s, 0.01, 0.1, 0.4, 0.3);
}

// --- 受击音效 ---
function makeHit(variant) {
  const dur = 0.08 + variant * 0.02;
  let s = genSamples(dur, t => {
    const ratio = t / dur;
    const freq = 300 - variant * 50;
    return Math.sin(2 * Math.PI * freq * t) * 0.5 * (1 - ratio) + noise() * 0.3 * (1 - ratio);
  });
  return envelope(s, 0.001, 0.005, 0.1, dur - 0.01);
}

// --- 倒地 ---
function makeFall() {
  let s = genSamples(0.3, t => {
    const ratio = t / 0.3;
    return Math.sin(2 * Math.PI * 150 * t) * 0.5 * (1 - ratio) + noise() * 0.4 * (1 - ratio * ratio);
  });
  return envelope(s, 0.005, 0.03, 0.15, 0.2);
}

// --- 飞行掠过 (多普勒效应) ---
function makeFlyby(variant) {
  const dur = 0.8 + variant * 0.2;
  let s = genSamples(dur, t => {
    const ratio = t / dur;
    const doppler = 1 - 0.6 * Math.sin(ratio * Math.PI);
    const freq = 200 * doppler;
    const nz = noise() * 0.4 * (1 - Math.abs(ratio - 0.5) * 2);
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.3 * (1 - Math.abs(ratio - 0.5) * 2);
    return nz + tone;
  });
  return envelope(s, 0.03, 0.1, 0.5, 0.2);
}

// --- 激光 (高频) ---
function makeLaser(variant) {
  const dur = 0.08 + variant * 0.02;
  const freq = 2000 + variant * 400;
  let s = genSamples(dur, t => {
    const ratio = t / dur;
    return Math.sin(2 * Math.PI * freq * t) * 0.5 * (1 - ratio) + noise() * 0.2 * (1 - ratio);
  });
  return envelope(s, 0.001, 0.005, 0.2, dur - 0.01);
}

// --- 移动/走路 ---
function makeWalkSand() {
  let s = genSamples(0.1, t => noise() * 0.3 * (1 - t / 0.1));
  return envelope(s, 0.001, 0.01, 0.1, 0.05);
}

function makeRunSand() {
  let s = genSamples(0.08, t => noise() * 0.25 * (1 - t / 0.08));
  return envelope(s, 0.001, 0.008, 0.08, 0.04);
}

// --- 运输机悬停 ---
function makeTransportHover() {
  let s = genSamples(0.6, t => {
    const freq = 80 + Math.sin(2 * Math.PI * 15 * t) * 20;
    const nz = noise() * 0.3;
    const hum = Math.sin(2 * Math.PI * freq * t) * 0.4;
    return nz + hum;
  });
  return envelope(s, 0.05, 0.1, 0.7, 0.1);
}

function makeTransportFire() {
  let s = genSamples(0.3, t => {
    const ratio = t / 0.3;
    return Math.sin(2 * Math.PI * 500 * t) * 0.4 * (1 - ratio) + noise() * 0.5 * (1 - ratio);
  });
  return envelope(s, 0.002, 0.02, 0.2, 0.2);
}

// --- 雷达音效 ---
function makeRadarLaunch() {
  let s = genSamples(0.3, t => {
    const freq = 200 + t * 1500;
    return Math.sin(2 * Math.PI * freq * t) * 0.4;
  });
  return envelope(s, 0.01, 0.05, 0.5, 0.15);
}

function makeRadarHum() {
  let s = genSamples(1.0, t => {
    const freq = 120 + Math.sin(2 * Math.PI * 3 * t) * 20;
    const hum = Math.sin(2 * Math.PI * freq * t) * 0.2;
    const nz = noise() * 0.05;
    return hum + nz;
  });
  return envelope(s, 0.1, 0.2, 0.8, 0.2);
}

// --- 环境音 (长循环) ---
function makeAmbient(variant) {
  const dur = 2.0 + variant * 0.5;
  let s = genSamples(dur, t => {
    const baseFreq = 60 + variant * 15;
    const hum = Math.sin(2 * Math.PI * baseFreq * t) * 0.15;
    const nz = noise() * 0.1;
    const wind = Math.sin(2 * Math.PI * (baseFreq * 0.5 + Math.sin(2 * Math.PI * 0.5 * t) * 10) * t) * 0.08;
    return hum + nz + wind;
  });
  return envelope(s, 0.2, 0.3, 0.7, 0.3);
}

// --- 街道环境 ---
function makeStreetEnv(variant) {
  const dur = 2.0;
  let s = genSamples(dur, t => {
    const nz = noise() * 0.12;
    const low = Math.sin(2 * Math.PI * (40 + variant * 10) * t) * 0.1;
    return nz + low;
  });
  return envelope(s, 0.3, 0.3, 0.6, 0.3);
}

// --- 燃烧音效 ---
function makeBurning() {
  let s = genSamples(2.0, t => {
    const crackle = noise() * 0.3 * Math.abs(Math.sin(2 * Math.PI * 30 * t));
    const low = Math.sin(2 * Math.PI * (30 + Math.random() * 20) * t) * 0.15;
    return crackle + low;
  });
  return envelope(s, 0.1, 0.2, 0.6, 0.3);
}

// --- 音乐 (简单旋律) ---
function makeMusic(variant, mood) {
  // mood: 'tension', 'stealth', 'menu', 'complete', 'atat'
  const dur = 3.0 + variant * 0.5;
  let s = genSamples(dur, t => {
    let val = 0;
    if (mood === 'tension') {
      const bass = Math.sin(2 * Math.PI * 55 * t) * 0.2;
      const pulse = Math.sin(2 * Math.PI * 110 * t) * 0.1 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t));
      const pad = Math.sin(2 * Math.PI * 220 * t) * 0.05;
      val = bass + pulse + pad;
    } else if (mood === 'stealth') {
      const bass = Math.sin(2 * Math.PI * 40 * t) * 0.15;
      const high = Math.sin(2 * Math.PI * 330 * t) * 0.03 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.5 * t));
      val = bass + high;
    } else if (mood === 'menu') {
      const notes = [262, 330, 392, 330, 294, 349, 440, 349];
      const noteIdx = Math.floor((t / 0.5) % notes.length);
      const freq = notes[noteIdx];
      const phase = (t % 0.5) / 0.5;
      val = Math.sin(2 * Math.PI * freq * t) * 0.15 * (1 - phase) + Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.05;
    } else if (mood === 'complete') {
      const notes = [523, 659, 784, 1047];
      const noteIdx = Math.floor((t / 0.4) % notes.length);
      const freq = notes[noteIdx];
      const phase = (t % 0.4) / 0.4;
      val = Math.sin(2 * Math.PI * freq * t) * 0.2 * (1 - phase) + Math.sin(2 * Math.PI * freq * 2 * t) * 0.08;
    } else if (mood === 'atat') {
      const bass = Math.sin(2 * Math.PI * 40 * t) * 0.25;
      const hit = Math.sin(2 * Math.PI * 80 * t) * 0.15 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * t));
      val = bass + hit;
    }
    return val;
  });
  return envelope(s, 0.3, 0.5, 0.6, 0.5);
}

// ============== 音效映射表 ==============
const soundMap = {
  // UI
  'sfx_ui_btn_press_00': () => makeUIClick(0),
  'sfx_ui_btn_press_01': () => makeUIClick(1),
  'sfx_ui_btn_rollover_00': () => makeUIHover(),
  'sfx_notification_beep_00': () => makeNotifyBeep(),
  'sfx_ui_letters_00': () => makeUILetters(),
  'sfx_box_open_03': () => makeBoxOpen(),
  'sfx_health_open_fx_05': () => makeHealthOpen(),
  'sfx_r4_achievement_00': () => makeR4(0),
  'sfx_r4_newmission_00': () => makeR4(1),
  'sfx_r4_upgrade_00': () => makeR4(2),
  'sfx_scoreloop_00': () => makeScoreLoop(),

  // 枪声
  'sfx_trooper_blaster_00': () => makeBlaster(0),
  'sfx_trooper_blaster_01': () => makeBlaster(1),
  'sfx_trooper_blaster_02': () => makeBlaster(2),
  'sfx_stormtrooper_blaster_00': () => makeStormBlaster(0),
  'sfx_stormtrooper_blaster_01': () => makeStormBlaster(1),
  'sfx_rebel_marine_blaster_00': () => makeRebelBlaster(0),
  'sfx_rebel_marine_blaster_01': () => makeRebelBlaster(1),
  'sfx_k2so_blaster_00': () => makeBlaster(3),
  'sfx_cassian_pistol_00': () => makeRebelBlaster(2),
  'sfx_cassian_rifle_short_00': () => makeSniper(0),
  'sfx_sniperrifle_reverb_00': () => makeSniper(0),
  'sfx_sniperrifle_reverb_01': () => makeSniper(1),
  'sfx_sniperrifle_reverb_02': () => makeSniper(2),
  'sfx_sniperrifle_reverb_03': () => makeSniper(3),
  'sfx_sniperrifle_reverb_04': () => makeSniper(4),
  'sfx_gun_turret_0': () => makeTurret(),

  // 激光
  'sfx_xwing_laser_00': () => makeLaser(0),
  'sfx_xwing_laser_04': () => makeLaser(1),
  'sfx_tiefighter_gun_00': () => makeLaser(0),
  'sfx_tiefighter_gun_01': () => makeLaser(1),
  'sfx_tiefighter_gun_02': () => makeLaser(2),
  'sfx_tiefighter_gun_03': () => makeLaser(3),
  'sfx_tiefighter_gun_04': () => makeLaser(4),

  // 爆炸
  'sfx_barrel_explode_00': () => makeExplosion(0),
  'sfx_explosion_atat_01': () => makeBigExplosion(0),
  'sfx_explosion_tank_00': () => makeBigExplosion(1),
  'sfx_explosion_target_00': () => makeExplosion(0),
  'sfx_explosion_target_01': () => makeExplosion(1),
  'sfx_explosion_target_03': () => makeExplosion(2),
  'sfx_explosion_target_04': () => makeExplosion(3),
  'sfx_grenade_explode_00': () => makeGrenadeExplode(),
  'sfx_exp_turret_0': () => makeExplosion(0),
  'sfx_exp_turret_1': () => makeExplosion(1),
  'sfx_exp_turret_2': () => makeExplosion(2),
  'sfx_transport_explode_00': () => makeBigExplosion(0),
  'sfx_rocket_launch_03': () => makeRocketLaunch(),

  // 手雷
  'sfx_grenade_timer_loop_02': () => makeGrenadeTimer(),
  'sfx_grenade_warning_00': () => makeGrenadeWarning(),

  // 受击
  'sfx_marine_hit_00': () => makeHit(0),
  'sfx_marine_hit_01': () => makeHit(1),
  'sfx_marine_hit_02': () => makeHit(2),
  'sfx_marine_hit_03': () => makeHit(3),
  'sfx_marine_fall_03': () => makeFall(),

  // 飞行
  'sfx_tiefighter_flyby_00': () => makeFlyby(0),
  'sfx_tiefighter_flyby_03': () => makeFlyby(1),
  'sfx_xwing_flyby_00': () => makeFlyby(0),
  'sfx_xwing_flyby_01': () => makeFlyby(1),

  // 移动
  'sfx_runsand_00': () => makeRunSand(),
  'sfx_walk_sand_00': () => makeWalkSand(),

  // 运输机
  'sfx_transport_hover_loop_00': () => makeTransportHover(),
  'sfx_transport_fire1_trail_00': () => makeTransportFire(),

  // 雷达
  'sfx_radar_launch_00': () => makeRadarLaunch(),
  'sfx_radar_display_hum_01': () => makeRadarHum(),

  // 环境音
  'sfx_imperial_base_00': () => makeAmbient(0),
  'sfx_ambience_battle_distant_loop_reverb_01': () => makeAmbient(1),
  'sfx_ambience_battle_distant_loop2reverb_01': () => makeAmbient(2),
  'sfx_ambience_xwingbattle_quietreverb_00': () => makeAmbient(3),
  'sfx_ambience_desert_loop_00': () => makeAmbient(4),
  'sfx_ambience_mountaindesert_loop_00': () => makeAmbient(5),
  'sfx_ambience_surf_loop_01': () => makeAmbient(6),
  'sfx_ambience_surf_loop_02': () => makeAmbient(7),
  'sfx_jungle_loop_00': () => makeAmbient(8),
  'sfx_deserted_street_00': () => makeStreetEnv(0),
  'sfx_busy_street_00': () => makeStreetEnv(1),
  'sfx_verybusy_street_00': () => makeStreetEnv(2),
  'sfx_verybusy_street_reverb_00': () => makeStreetEnv(3),
  'sfx_burning_xwing_00': () => makeBurning(),

  // 音乐
  'music_mission_complete_accent_03': () => makeMusic(0, 'complete'),
  'music_bal1-0_tension_02': () => makeMusic(0, 'tension'),
  'music_bal1-1_tension_00': () => makeMusic(1, 'tension'),
  'music_bal2-0_atat_00': () => makeMusic(0, 'atat'),
  'music_bal3-0_tensionlong_02': () => makeMusic(2, 'tension'),
  'music_dal1-0_hightension_00': () => makeMusic(0, 'tension'),
  'music_dal1-1_stealthtension_00': () => makeMusic(0, 'stealth'),
  'music_dal1-2_stealthtension_00': () => makeMusic(1, 'stealth'),
  'music_menu_strings_gentle_00': () => makeMusic(0, 'menu'),
  'music_menu_strings_gentle_01': () => makeMusic(1, 'menu'),
  'music_dal1-4_menu_long_00': () => makeMusic(2, 'menu'),
};

// ============== 生成所有音效 ==============
console.log('开始生成音效...');
let count = 0;
for (const [name, genFn] of Object.entries(soundMap)) {
  try {
    const samples = genFn();
    writeWav(name + '.wav', samples);
    count++;
  } catch (e) {
    console.error(`生成 ${name} 失败:`, e.message);
  }
}
console.log(`完成！共生成 ${count}/${Object.keys(soundMap).length} 个音效文件`);