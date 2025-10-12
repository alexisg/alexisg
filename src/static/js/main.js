// Function to initialize and play all videos
function loadVideos() {
  const videos = document.querySelectorAll('video[autoplay]');
  videos.forEach(video => {
    // Reset video to start
    video.currentTime = 0;
    // Play the video
    video.play().catch(error => {
      console.log('Video autoplay prevented:', error);
    });
  });
}

// Function to update active nav state
function updateActiveNav() {
  const nav = document.querySelector('nav');
  
  // Only update if nav exists on current page
  if (!nav) return;
  
  const currentPath = window.location.pathname;
  const navLinks = nav.querySelectorAll('.nav-portfolio__link');
  
  navLinks.forEach(link => {
    const linkUrl = link.getAttribute('data-nav-url');
    // Normalize paths by removing trailing slashes for comparison
    const normalizedLinkUrl = linkUrl?.replace(/\/$/, '') || '';
    const normalizedCurrentPath = currentPath.replace(/\/$/, '');
    
    if (normalizedLinkUrl === normalizedCurrentPath) {
      link.classList.add('nav-portfolio__link--active');
    } else {
      link.classList.remove('nav-portfolio__link--active');
    }
  });
}

// Swup will be available globally from CDN
document.addEventListener('DOMContentLoaded', () => {
  const swup = new Swup({
    containers: ["#swup"],
    plugins: [new SwupPreloadPlugin()]
  });
  
  // Initialize videos and nav on first load
  loadVideos();
  updateActiveNav();
  
  // Reinitialize videos and update nav after each page transition
  swup.hooks.on('page:view', () => {
    loadVideos();
    updateActiveNav();
  });
  
  swup.hooks.on('visit:start', () => {
    console.log('Navigating to:', window.location.href);
  });
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
