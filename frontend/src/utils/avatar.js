export const BACKEND_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

const DEFAULT_AVATAR = `${BACKEND_URL}/uploads/default-avatar.svg`;
const DEFAULT_BANNER = `${BACKEND_URL}/uploads/default-banner.svg`;

export const avatarSrc = (pic) => {
  if (!pic) return DEFAULT_AVATAR;
  if (pic === '/uploads/default-avatar.png') return DEFAULT_AVATAR;
  if (pic.startsWith('/uploads')) return `${BACKEND_URL}${pic}`;
  if (pic.startsWith('http://') || pic.startsWith('https://')) return pic;
  return DEFAULT_AVATAR;
};

export const bannerSrc = (pic) => {
  if (!pic) return DEFAULT_BANNER;
  if (pic === '/uploads/default-banner.svg') return DEFAULT_BANNER;
  if (pic.startsWith('/uploads')) return `${BACKEND_URL}${pic}`;
  if (pic.startsWith('http://') || pic.startsWith('https://')) return pic;
  return DEFAULT_BANNER;
};
