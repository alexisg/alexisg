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
