const soundToggle = document.getElementById('soundToggle');
const heroVideo = document.querySelector('.hero-video');
const topbar = document.querySelector('.topbar');
const volumeDown = document.getElementById('volumeDown');
const volumeUp = document.getElementById('volumeUp');
const volumeValue = document.getElementById('volumeValue');
const warmToggle = document.getElementById('warmToggle');
const topListenLink = document.querySelector('.topnav a[href="#listen"]');

const TRACK_TITLE = 'Big Black Puppet';
const BANDCAMP_URL = 'https://sashapersholja.bandcamp.com/track/sasha-persholja-big-black-puppet';
const VOLUME_STEP = 10;
const INITIAL_VOLUME = 60;
let selectedVolume = INITIAL_VOLUME;
let rememberedNonZeroVolume = INITIAL_VOLUME;
let warmEnabled = false;
let audioContext = null;
let mediaSource = null;
let lowShelf = null;
let highShelf = null;

const OUTBOUND_EVENTS = [
  { selector: '.buy-track-button', eventName: 'buy_track_click', params: { track_title: TRACK_TITLE, platform: 'Bandcamp', destination_url: BANDCAMP_URL } },
  { selector: '.platform-card.bandcamp', eventName: 'platform_click', params: { track_title: TRACK_TITLE, platform: 'Bandcamp' } },
  { selector: '.platform-card.apple', eventName: 'platform_click', params: { track_title: TRACK_TITLE, platform: 'Apple Music' } },
  { selector: '.platform-card.amazon', eventName: 'platform_click', params: { track_title: TRACK_TITLE, platform: 'Amazon Music' } },
  { selector: '.platform-card.spotify', eventName: 'platform_click', params: { track_title: TRACK_TITLE, platform: 'Spotify' } },
  { selector: '.platform-card.youtube', eventName: 'platform_click', params: { track_title: TRACK_TITLE, platform: 'YouTube Music' } },
  { selector: 'a[href="mailto:sasha.persholja@gmail.com"]', eventName: 'contact', params: { method: 'email' } },
  { selector: 'a[href="https://www.facebook.com/SashaPersholja/"]', eventName: 'social_click', params: { network: 'facebook' } },
  { selector: 'a[href="https://www.instagram.com/sasha.persholja/"]', eventName: 'social_click', params: { network: 'instagram' } },
  { selector: 'a[href="https://www.youtube.com/@mkudmkud"]', eventName: 'social_click', params: { network: 'youtube' } }
];

function sendGAEvent(eventName, params = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, { ...params, transport_type: 'beacon' });
}

function updateSoundAndVolumeUI() {
  if (!soundToggle || !heroVideo) return;
  const soundIsOn = !heroVideo.muted && selectedVolume > 0;
  soundToggle.textContent = soundIsOn ? '🔊 Song On' : '🔇 Song Off';
  soundToggle.setAttribute('aria-label', soundIsOn ? 'Turn song off for the Big Black Puppet video' : 'Turn song on for the Big Black Puppet video');
  soundToggle.setAttribute('aria-pressed', String(soundIsOn));
  if (volumeValue) {
    volumeValue.textContent = `${selectedVolume}%`;
    volumeValue.setAttribute('aria-label', `Current song volume: ${selectedVolume} percent`);
  }
}

function applySelectedVolume() {
  if (!heroVideo) return;
  heroVideo.volume = selectedVolume / 100;
  heroVideo.muted = selectedVolume === 0;
  if (selectedVolume > 0) rememberedNonZeroVolume = selectedVolume;
  updateSoundAndVolumeUI();
}

function turnSongOn(source) {
  if (!heroVideo) return;
  resumeWarmAudioContext();
  selectedVolume = rememberedNonZeroVolume > 0 ? rememberedNonZeroVolume : INITIAL_VOLUME;
  applySelectedVolume();
  heroVideo.play().catch(() => {});
  sendGAEvent('song_on', { track_title: TRACK_TITLE, ...(source ? { source } : {}) });
}

function initializeWarmAudio() {
  if (!heroVideo) return false;
  if (audioContext) return true;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  try {
    audioContext = new AudioContextClass();
    mediaSource = audioContext.createMediaElementSource(heroVideo);
    lowShelf = audioContext.createBiquadFilter();
    highShelf = audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 150;
    lowShelf.gain.value = 0;
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 5000;
    highShelf.gain.value = 0;
    mediaSource.connect(lowShelf).connect(highShelf).connect(audioContext.destination);
    return true;
  } catch (error) {
    audioContext = null;
    mediaSource = null;
    lowShelf = null;
    highShelf = null;
    return false;
  }
}

function resumeWarmAudioContext() {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
}

function updateWarmUI() {
  if (!warmToggle) return;
  warmToggle.textContent = warmEnabled ? 'Warm On' : 'Warm Off';
  warmToggle.setAttribute('aria-pressed', String(warmEnabled));
}

function setWarmEffect(enabled) {
  if (!initializeWarmAudio()) return false;
  resumeWarmAudioContext();
  warmEnabled = enabled;
  const now = audioContext.currentTime;
  lowShelf.gain.setTargetAtTime(warmEnabled ? 2 : 0, now, 0.015);
  highShelf.gain.setTargetAtTime(warmEnabled ? -2 : 0, now, 0.015);
  updateWarmUI();
  return true;
}

function changeVolume(delta) {
  if (!heroVideo) return;
  const nextVolume = Math.max(0, Math.min(100, selectedVolume + delta));
  if (nextVolume === selectedVolume) return;
  selectedVolume = nextVolume;
  applySelectedVolume();
  if (selectedVolume > 0) heroVideo.play().catch(() => {});
  sendGAEvent('volume_change', { track_title: TRACK_TITLE, volume_percent: selectedVolume });
}

function updateHeaderScrollState() {
  if (!topbar) return;
  topbar.classList.toggle('scrolled', window.scrollY > 24);
}

function openTrackedLink(link) {
  if (link.getAttribute('target') === '_blank') {
    window.open(link.href, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.href = link.href;
}

function sendGAEventBeforeNavigation(event, link, eventName, params) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (typeof window.gtag !== 'function') return;
  event.preventDefault();
  let navigationStarted = false;
  const navigateOnce = () => {
    if (navigationStarted) return;
    navigationStarted = true;
    openTrackedLink(link);
  };
  window.gtag('event', eventName, {
    ...params,
    destination_url: params.destination_url || link.href,
    link_url: link.href,
    outbound: link.hostname !== window.location.hostname,
    transport_type: 'beacon',
    event_callback: navigateOnce,
    event_timeout: 800
  });
  window.setTimeout(navigateOnce, 900);
}

function attachOutboundTracking() {
  OUTBOUND_EVENTS.forEach(({ selector, eventName, params }) => {
    document.querySelectorAll(selector).forEach((link) => {
      link.addEventListener('click', (event) => sendGAEventBeforeNavigation(event, link, eventName, params));
    });
  });
}

if (topbar) {
  updateHeaderScrollState();
  window.addEventListener('scroll', updateHeaderScrollState, { passive: true });
}

if (soundToggle && heroVideo) {
  heroVideo.volume = INITIAL_VOLUME / 100;
  heroVideo.muted = true;
  updateSoundAndVolumeUI();
  soundToggle.addEventListener('click', () => {
    const turningOn = heroVideo.muted || selectedVolume === 0;
    if (turningOn) {
      turnSongOn();
    } else {
      if (selectedVolume > 0) rememberedNonZeroVolume = selectedVolume;
      heroVideo.muted = true;
      updateSoundAndVolumeUI();
      sendGAEvent('song_off', { track_title: TRACK_TITLE });
    }
  });
}

if (topListenLink && heroVideo) {
  topListenLink.addEventListener('click', () => {
    turnSongOn('top_navigation_listen');
  });
}

if (warmToggle) {
  updateWarmUI();
  warmToggle.addEventListener('click', () => {
    const nextState = !warmEnabled;
    if (!setWarmEffect(nextState)) return;
    sendGAEvent('audio_effect', { effect: 'warm', state: warmEnabled ? 'on' : 'off', track_title: TRACK_TITLE });
  });
}

if (volumeDown) volumeDown.addEventListener('click', () => changeVolume(-VOLUME_STEP));
if (volumeUp) volumeUp.addEventListener('click', () => changeVolume(VOLUME_STEP));
attachOutboundTracking();
