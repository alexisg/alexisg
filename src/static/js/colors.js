let root = document.documentElement;

const trackValues = ({ mouse, size, scroll, position, orientation }) => {
  if (mouse.changed) {

    bodyColorMin = Math.max(86, 100 * (mouse.y/size.y));
    bodyColor = `hsl(` + 256 * (mouse.y/size.y) + `, 20%,` + bodyColorMin + `%)`;
    
    textContrast = chroma.contrast(bodyColor, 'hsla(206, 10%, 100%,1)');
    if (textContrast < 4.52) {
      textColor = 'hsla(206, 10%, 0%,1)';
      hdrColor = 'hsla(206, 10%, 0%,.95)';
      subHdrColor = 'hsla(206, 10%, 0%,.92)';
      linkColor = 'hsla(206, 10%, 0%,1)';
      linkHoverColor = 'hsla(206, 10%, 0%,1)';
    } else {
      textColor = 'hsla(206, 10%, 100%,1)';
      hdrColor = 'hsla(206, 10%, 100%,.95)';
      subHdrColor = 'hsla(206, 10%, 100%,.92)';
      linkColor = 'hsla(206, 10%, 100%,1)';
      linkHoverColor = 'hsla(206, 10%, 100%,1)';
    }
    root.style.setProperty('--color-body', bodyColor);
    root.style.setProperty('--color-text', textColor);
    root.style.setProperty('--color-hdr', hdrColor);
    root.style.setProperty('--color-sub-hdr', subHdrColor);
    // root.style.setProperty('--color-link', linkColor);
    // root.style.setProperty('--color-link-hover', linkHoverColor);
  }


};

__TORNIS.watchViewport(trackValues);
