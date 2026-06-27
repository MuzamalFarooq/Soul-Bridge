'use client';

import React, { useState } from 'react';
import { avatarSrc } from '../utils/avatar';

const AvatarImage = ({ src, alt = 'User', className = '' }) => {
  const [imgSrc, setImgSrc] = useState(() => avatarSrc(src));

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setImgSrc(avatarSrc(null))}
    />
  );
};

export default AvatarImage;
