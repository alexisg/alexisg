// Video loader - MP4 is supported in all modern browsers
function loadVideos() {
  const mediaContainers = document.querySelectorAll('.js-media-hold');
  
  mediaContainers.forEach(container => {
    const videoUrl = container.getAttribute('data-video');
    const imageUrl = container.getAttribute('data-img');
    const title = container.getAttribute('data-title');
    const id = container.getAttribute('data-id');

    if (videoUrl) {
      // Create video element
      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.className = 'hide';
      label.textContent = `Video of ${title}`;

      const videoElement = document.createElement('video');
      videoElement.id = id;
      videoElement.className = 'bd-rad';
      videoElement.muted = true;
      videoElement.autoplay = true;
      videoElement.loop = true;
      videoElement.playsInline = true;
      
      const source = document.createElement('source');
      source.src = videoUrl;
      source.type = 'video/mp4';
      
      videoElement.appendChild(source);
      container.appendChild(label);
      container.appendChild(videoElement);
      
      // Fallback to image if video fails to load
      if (imageUrl) {
        videoElement.addEventListener('error', () => {
          videoElement.remove();
          label.remove();
          const img = document.createElement('img');
          img.className = 'aspect__fill bd-rad shadow';
          img.src = imageUrl;
          img.alt = title;
          container.appendChild(img);
        });
      }
    } else if (imageUrl) {
      // No video URL, just use image
      const img = document.createElement('img');
      img.className = 'aspect__fill bd-rad shadow';
      img.src = imageUrl;
      img.alt = title;
      container.appendChild(img);
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
