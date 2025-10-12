// Function to initialize and play videos with delayed fade-in
function loadVideos() {
  // Handle js-video containers with delayed autoplay and fade-in
  const delayedVideoContainers = document.querySelectorAll('.js-video');
  delayedVideoContainers.forEach(container => {
    const video = container.querySelector('video');
    if (video) {
      setTimeout(() => {
        video.play().then(() => {
          // Add is-playing class to container to trigger fade-in
          container.classList.add('is-playing');
        }).catch(error => {
          console.log('Video autoplay prevented:', error);
          // Even if autoplay fails, show the container
          container.classList.add('is-playing');
        });
      }, 500); // 0.5 second delay
    }
  });
  
  // Handle regular autoplay videos (without delay)
  const regularVideos = document.querySelectorAll('video[autoplay]:not(.js-video video)');
  regularVideos.forEach(video => {
    video.play().catch(error => {
      console.log('Video autoplay prevented:', error);
    });
  });
}

// Initialize videos on page load
document.addEventListener('DOMContentLoaded', () => {
  loadVideos();
});

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
