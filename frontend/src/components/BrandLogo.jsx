import { APP_NAME } from '../config/app';

const BrandLogo = ({ className = 'text-2xl', iconClass = 'h-7 w-7' }) => (
  <span className={`inline-flex items-center gap-2 font-bold bg-linear-to-r from-pink-500 to-indigo-600 bg-clip-text text-transparent ${className}`}>
    <svg className={`${iconClass} text-pink-500 shrink-0`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10c0-3.3 2.7-6 6-6 2.1 0 4 1.1 5 2.8C16 5.1 17.9 4 20 4c3.3 0 6 2.7 6 6 0 5.5-6 10-11 14C10 20 4 15.5 4 10Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path d="M12 4c-2.5 0-4.5 2-4.5 4.5 0 4 4.5 8.5 4.5 8.5S16.5 12.5 16.5 8.5C16.5 6 14.5 4 12 4Z" fill="currentColor" />
      <path d="M3 14h18M8 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    {APP_NAME}
  </span>
);

export default BrandLogo;
