/**
 * View Transitions API for smooth page navigation
 * Provides native browser transitions without any libraries
 * Gracefully degrades in browsers that don't support it
 */

// Check if browser supports View Transitions API
if (!document.startViewTransition) {
  console.log('View Transitions API not supported');
} else {
  // Intercept same-origin navigation clicks
  document.addEventListener('click', (e) => {
    // Find the closest anchor tag
    const link = e.target.closest('a');
    
    // Skip if:
    // - Not a link
    // - External link
    // - Modified click (ctrl, shift, etc)
    // - Link has target attribute
    // - Link has download attribute
    if (
      !link ||
      link.origin !== location.origin ||
      e.ctrlKey || e.shiftKey || e.altKey || e.metaKey ||
      link.hasAttribute('target') ||
      link.hasAttribute('download')
    ) {
      return;
    }

    e.preventDefault();
    
    const url = link.href;
    
    // Start the view transition
    const transition = document.startViewTransition(async () => {
      // Fetch the new page
      const response = await fetch(url);
      const html = await response.text();
      
      // Parse the HTML
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(html, 'text/html');
      
      // Update the page title
      document.title = newDoc.title;
      
      // Update the main content
      const oldMain = document.getElementById('js-main');
      const newMain = newDoc.getElementById('js-main');
      
      if (oldMain && newMain) {
        oldMain.replaceWith(newMain);
        
        // Restart any autoplay videos that might have been paused during transition
        const videos = newMain.querySelectorAll('video[autoplay]');
        videos.forEach(video => {
          video.play().catch(() => {
            // Autoplay prevented, which is fine (muted videos should work)
          });
        });
      }
      
      // Update the browser history
      window.history.pushState({}, '', url);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    
    // Handle transition errors gracefully
    transition.catch((error) => {
      console.error('View transition failed:', error);
      // Fall back to regular navigation
      window.location.href = url;
    });
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    document.startViewTransition(async () => {
      const response = await fetch(location.href);
      const html = await response.text();
      
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(html, 'text/html');
      
      document.title = newDoc.title;
      
      const oldMain = document.getElementById('js-main');
      const newMain = newDoc.getElementById('js-main');
      
      if (oldMain && newMain) {
        oldMain.replaceWith(newMain);
        
        // Restart any autoplay videos that might have been paused during transition
        const videos = newMain.querySelectorAll('video[autoplay]');
        videos.forEach(video => {
          video.play().catch(() => {
            // Autoplay prevented, which is fine (muted videos should work)
          });
        });
      }
      
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  });
}

