import React from 'react';

// LogoIcon now uses the original `public/logo.svg` file so the rendered
// logo matches the original artwork exactly. If you prefer an inline SVG
// copy (to recolor via `currentColor`) or a separate white variant, I can
// replace this implementation with the raw SVG paths.

const LogoIcon = ({ className = '', width = 48, height = 48, variant = 'default', ariaLabel = 'Icono La Cazuela Chapina', title = 'La Cazuela Chapina', style = {}, ...props }) => {
  // Accept numeric width/height (treated as px) or any CSS value
  const cssWidth = typeof width === 'number' ? `${width}px` : width;
  const cssHeight = typeof height === 'number' ? `${height}px` : height;

  // Variant support: 'default' shows the original colored SVG; 'white' renders
  // a white silhouette using CSS filters (works well on solid backgrounds).
  const filterStyle = variant === 'white' ? { filter: 'brightness(0) invert(1)' } : {};

  return (
    <img
      src="/logo.svg"
      alt={ariaLabel}
      title={title}
      className={className}
      style={{ width: cssWidth, height: cssHeight, objectFit: 'contain', ...filterStyle, ...style }}
      {...props}
    />
  );
};

export default LogoIcon;
