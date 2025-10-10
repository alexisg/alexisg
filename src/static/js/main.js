// Video loader - MP4 is supported in all modern browsers
function loadVideos() {
  const isSafari = document.documentElement.classList.contains('is-safari');
  const baseDelay = isSafari ? 400 : 200;
  const mediaContainers = document.querySelectorAll('.js-media-hold');
  
  mediaContainers.forEach(container => {
    // Skip if already hydrated
    if (container.querySelector('video, img')) return;
    
    const videoUrl = container.getAttribute('data-video');
    const imageUrl = container.getAttribute('data-img');
    const title = container.getAttribute('data-title');
    const id = container.getAttribute('data-id');

    if (!videoUrl && imageUrl) {
      // No video URL, just use image; reveal container immediately
      const img = document.createElement('img');
      img.alt = title;
      // Mark visible so container fades (shadows too)
      container.classList.add('is-visible');
      img.src = imageUrl;
      container.appendChild(img);
      return;
    }

    if (!videoUrl) return;

    const injectVideo = () => {
      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.className = 'hide';
      label.textContent = `Video of ${title}`;

      const videoElement = document.createElement('video');
      videoElement.id = id;
      videoElement.muted = true;
      videoElement.autoplay = true;
      videoElement.loop = true;
      videoElement.playsInline = true;
      if (imageUrl) videoElement.poster = imageUrl;

      const source = document.createElement('source');
      source.src = videoUrl;
      source.type = 'video/mp4';

      videoElement.appendChild(source);
      container.appendChild(label);
      container.appendChild(videoElement);

      // Fade in when data available (next frame to ensure transition applies)
      const reveal = () => requestAnimationFrame(() => container.classList.add('is-visible'));
      videoElement.addEventListener('loadeddata', reveal, { once: true });
      setTimeout(() => { try { videoElement.play(); } catch(e){} }, 0);

      // On error, reveal container so poster displays
      videoElement.addEventListener('error', () => {
        container.classList.add('is-visible');
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => setTimeout(injectVideo, baseDelay), { timeout: baseDelay + 300 });
    } else {
      setTimeout(injectVideo, baseDelay);
    }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadVideos);
} else {
  loadVideos();
}

// Andre high-five animation (tracks mouse movement)
const trackValues = ({ mouse }) => {
  if (mouse.changed) {
    const mouseVelocity = mouse.velocity.y;
    const andreIcon = document.getElementById('js-andre');
    
    if (andreIcon) {
      if (mouseVelocity < 0) {
        andreIcon.classList.remove('down');
        andreIcon.classList.add('up');
      } else if (mouseVelocity > 0) {
        andreIcon.classList.remove('up');
        andreIcon.classList.add('down');
      }
    }
  }
};

__TORNIS.watchViewport(trackValues);
