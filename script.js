const soundToggle = document.getElementById('soundToggle');
const heroVideo = document.querySelector('.hero-video');
const topbar = document.querySelector('.topbar');

const GA_EVENT_LINKS = [
  {
    selector: 'a[href="https://sashapersholja.bandcamp.com/track/sasha-persholja-big-black-puppet"]',
    eventName: 'select_platform',
    params: { platform: 'bandcamp' }
  },
  {
    selector: 'a[href="https://open.spotify.com/track/2pIdN8tXCmOSbnNmYLfQDe"]',
    eventName: 'select_platform',
    params: { platform: 'spotify' }
  },
  {
    selector: 'a[href="https://music.apple.com/si/song/big-black-puppet/982227462"]',
    eventName: 'select_platform',
    params: { platform: 'apple_music' }
  },
  {
    selector: 'a[href="https://music.amazon.co.uk/tracks/B00VNAROZU"]',
    eventName: 'select_platform',
    params: { platform: 'amazon_music' }
  },
  {
    selector: 'a[href^="https://music.youtube.com/watch?v=3VD7p3k7EPQ"]',
    eventName: 'select_platform',
    params: { platform: 'youtube_music' }
  },
  {
    selector: 'a[href="mailto:sasha.persholja@gmail.com"]',
    eventName: 'contact',
    params: { method: 'email' }
  },
  {
    selector: 'a[href="https://www.facebook.com/SashaPersholja/"]',
    eventName: 'social_click',
    params: { network: 'facebook' }
  },
  {
    selector: 'a[href="https://www.instagram.com/sasha.persholja/"]',
    eventName: 'social_click',
    params: { network: 'instagram' }
  },
  {
    selector: 'a[href="https://www.youtube.com/@mkudmkud"]',
    eventName: 'social_click',
    params: { network: 'youtube' }
  }
];

function updateSoundButton() {
  if (!soundToggle || !heroVideo) return;

  const soundIsOn = !heroVideo.muted;
  soundToggle.textContent = soundIsOn ? '🔊 Sound On' : '🔇 Sound Off';
  soundToggle.setAttribute('aria-label', soundIsOn ? 'Turn sound off for the Big Black Puppet video' : 'Turn sound on for the Big Black Puppet video');
  soundToggle.setAttribute('aria-pressed', String(soundIsOn));
}

function updateHeaderScrollState() {
  if (!topbar) return;
  topbar.classList.toggle('scrolled', window.scrollY > 24);
}

function openTrackedLink(link) {
  const target = link.getAttribute('target');
  const href = link.href;

  if (target === '_blank') {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }

  window.location.href = href;
}

function sendGAEventBeforeNavigation(event, link, eventName, params) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  if (typeof window.gtag !== 'function') {
    return;
  }

  event.preventDefault();

  let navigationStarted = false;
  const navigateOnce = () => {
    if (navigationStarted) return;
    navigationStarted = true;
    openTrackedLink(link);
  };

  window.gtag('event', eventName, {
    ...params,
    link_url: link.href,
    outbound: link.hostname !== window.location.hostname,
    transport_type: 'beacon',
    event_callback: navigateOnce,
    event_timeout: 1000
  });

  window.setTimeout(navigateOnce, 1200);
}

function attachGAEventTracking() {
  GA_EVENT_LINKS.forEach(({ selector, eventName, params }) => {
    document.querySelectorAll(selector).forEach((link) => {
      link.addEventListener('click', (event) => {
        sendGAEventBeforeNavigation(event, link, eventName, params);
      });
    });
  });
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

attachGAEventTracking();
