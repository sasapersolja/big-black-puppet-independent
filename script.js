const platformButton = document.getElementById('platformButton');
const soundToggle = document.getElementById('soundToggle');
const heroVideo = document.querySelector('.hero-video');
const topbar = document.querySelector('.topbar');

function scrollToPlatformSection() {
  const listenSection = document.getElementById('listen');
  if (listenSection) {
    listenSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateSoundButton() {
  if (!soundToggle || !heroVideo) return;

  const soundIsOn = !heroVideo.muted;
  soundToggle.textContent = soundIsOn ? '🔊 Sound On' : '🔇 Sound Off';
  soundToggle.setAttribute('aria-label', soundIsOn ? 'Turn sound off' : 'Turn sound on');
  soundToggle.setAttribute('aria-pressed', String(soundIsOn));
}

function updateHeaderScrollState() {
  if (!topbar) return;
  topbar.classList.toggle('scrolled', window.scrollY > 24);
}

if (platformButton) {
  platformButton.addEventListener('click', scrollToPlatformSection);
}

if (topbar) {
  updateHeaderScrollState();
  window.addEventListener('scroll', updateHeaderScrollState, { passive: true });
}

if (soundToggle && heroVideo) {
  updateSoundButton();

  soundToggle.addEventListener('click', () => {
    heroVideo.muted = !heroVideo.muted;
    heroVideo.volume = heroVideo.muted ? 0 : 1;
    heroVideo.play().catch(() => {});
    updateSoundButton();
  });
}
