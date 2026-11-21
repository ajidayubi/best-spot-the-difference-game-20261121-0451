// Tiny WebAudio synth for Lantern Harbour. No audio files, no
// network: every sound is a few oscillators shaped in code.
// Created lazily on the first user gesture (browsers block audio
// before one), and silent when muted or unavailable.
(function (root) {
  'use strict';

  var ctx = null;
  var muted = false;

  function ensure() {
    if (ctx !== null) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    if (muted) return;
    var ac = ensure();
    if (ac === null) return;
    if (ac.state === 'suspended') {
      ac.resume();
    }
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime + start);
    gain.gain.setValueAtTime(0.0001, ac.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, ac.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + start);
    osc.stop(ac.currentTime + start + dur + 0.05);
  }

  // A bright two-note chime for a found difference.
  function found() {
    tone(660, 0, 0.18, 'sine', 0.14);
    tone(990, 0.09, 0.25, 'sine', 0.12);
  }

  // A low buzz for a wrong click.
  function wrong() {
    tone(140, 0, 0.22, 'square', 0.06);
  }

  // A rising arpeggio for clearing a scene.
  function levelClear() {
    tone(523, 0, 0.16, 'triangle', 0.12);
    tone(659, 0.12, 0.16, 'triangle', 0.12);
    tone(784, 0.24, 0.3, 'triangle', 0.12);
  }

  // A longer fanfare for finishing all three scenes.
  function win() {
    var notes = [523, 659, 784, 1047, 784, 1047];
    for (var i = 0; i < notes.length; i++) {
      tone(notes[i], i * 0.13, 0.22, 'triangle', 0.12);
    }
  }

  // A soft tick when the timer drops under ten seconds.
  function tick() {
    tone(880, 0, 0.06, 'sine', 0.05);
  }

  function setMuted(value) {
    muted = !!value;
  }

  function isMuted() {
    return muted;
  }

  var api = {
    found: found,
    wrong: wrong,
    levelClear: levelClear,
    win: win,
    tick: tick,
    setMuted: setMuted,
    isMuted: isMuted,
  };
  root.SpotAudio = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
