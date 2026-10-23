/* Unlock native game audio during a real input gesture, before async menus or
 * camera permissions consume that gesture. One context per document. */
(() => {
  'use strict';
  if (window.GameAudio) return;
  let context = null, unlocking = null, lastError = '', noise = null;
  function getContext() {
    if (context && context.state !== 'closed') return context;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      context = new Context({latencyHint: 'interactive'});
      return context;
    } catch (error) { lastError = String(error.message || error); return null; }
  }
  function unlock() {
    const audio = getContext();
    if (!audio || document.hidden) return Promise.resolve(false);
    if (audio.state === 'running') return Promise.resolve(true);
    if (unlocking) return unlocking;
    unlocking = Promise.resolve(audio.resume()).then(() => {
      lastError = '';
      return audio.state === 'running';
    }, error => { lastError = String(error.message || error); return false; })
      .finally(() => { unlocking = null; });
    return unlocking;
  }
  const input = () => { unlock(); };
  // Keep listeners after the first gesture: Android can interrupt audio when
  // permissions, the lock screen, a call, or another application takes focus.
  for (const name of ['pointerdown', 'pointerup', 'keydown', 'touchend'])
    document.addEventListener(name, input, {capture: true, passive: true});
  const restore = () => {
    if (context && !document.hidden) unlock();
  };
  function effect(name, volume = 1, pan = 0) {
    const audio = getContext();
    if (!audio || audio.state !== 'running' || document.hidden) return false;
    const profiles = {
      rifle: [.14, 1700, .19, 95], smg: [.085, 2300, .13, 140],
      marksman: [.32, 1100, .26, 65], explosion: [.75, 550, .28, 42],
      impact: [.16, 460, .13, 78], step: [.085, 240, .055, 90],
      reload: [.19, 2600, .11, 330]
    };
    const profile = profiles[name]; if (!profile) return false;
    const [duration, frequency, level, bass] = profile;
    const gainValue = level * Math.max(0, Math.min(1, volume)) *
      (window.ArcadePlaySettings?.get().effectsVolume ?? .7);
    if (!gainValue) return false;
    if (!noise || noise.sampleRate !== audio.sampleRate) {
      noise = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const t = audio.currentTime, source = audio.createBufferSource(),
      filter = audio.createBiquadFilter(), envelope = audio.createGain(),
      body = audio.createOscillator(), bodyGain = audio.createGain(),
      stereo = audio.createStereoPanner?.();
    source.buffer = noise; filter.type = name === 'reload' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(frequency, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(70, frequency * .22), t + duration);
    envelope.gain.setValueAtTime(.0001, t);
    envelope.gain.exponentialRampToValueAtTime(gainValue, t + .004);
    envelope.gain.exponentialRampToValueAtTime(.0001, t + duration);
    source.connect(filter);filter.connect(envelope);
    if (stereo) { stereo.pan.value = Math.max(-1, Math.min(1, pan));envelope.connect(stereo);stereo.connect(audio.destination); }
    else envelope.connect(audio.destination);
    body.type = 'triangle';body.frequency.setValueAtTime(bass * 1.8, t);
    body.frequency.exponentialRampToValueAtTime(bass, t + duration);
    bodyGain.gain.setValueAtTime(gainValue * .5, t);
    bodyGain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    body.connect(bodyGain);bodyGain.connect(stereo || audio.destination);
    source.onended = () => { source.disconnect();filter.disconnect();envelope.disconnect();stereo?.disconnect(); };
    body.onended = () => { body.disconnect();bodyGain.disconnect(); };
    source.start(t);source.stop(t + duration);body.start(t);body.stop(t + duration);
    return true;
  }
  window.addEventListener('focus', restore);
  window.addEventListener('pageshow', restore);
  document.addEventListener('visibilitychange', restore);
  window.GameAudio = Object.freeze({
    context: getContext, unlock, effect,
    diagnostics: () => ({state: context?.state || 'uninitialized', lastError})
  });
})();
