import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Knee Strike Icon - Muay Thai style knee
export const KneeStrikeIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Fighter delivering knee strike - silhouette style */}
    <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4.5 7.5L14 8l-2-1-2 1-2.5 1.5L6 11v3l2-1 1-1v3l-2 5.5L8.5 22l2-4 1.5 2 1.5-2 2 4 1.5-1.5L15 15v-3l1 1 2 1v-3l-1.5-1.5z" />
  </svg>
);

// Boxing/Punch Icon - Fist
export const BoxingIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Boxing glove / fist */}
    <path d="M5 11c0-1.1.9-2 2-2h1V7c0-1.1.9-2 2-2h1V4c0-.55.45-1 1-1s1 .45 1 1v1h1c1.1 0 2 .9 2 2v2h1c1.1 0 2 .9 2 2v5c0 2.21-1.79 4-4 4h-1l-1 2H9l-1-2H7c-1.1 0-2-.9-2-2v-7zm4 0h6v-2h-1c-.55 0-1-.45-1-1V7h-2v1c0 .55-.45 1-1 1H9v2z" />
  </svg>
);

// Kick Icon - High kick silhouette
export const KickIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Kicking leg */}
    <path d="M13.5 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 7l-3.5 8.5L9 22l3-6 2.5 2V22h2v-5l-3-3v-2l4 1 1.5 4h2l-2-6-4-2-1-1c-.5-.5-1.5-.5-2 0l-2 2-3 1v2l4-1z" />
  </svg>
);

// Elbow Strike Icon
export const ElbowIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Arm with elbow strike */}
    <path d="M12 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm7 8l-3-1.5-1.5-2.5c-.3-.5-.8-.8-1.4-.9L10 7c-.8-.1-1.6.3-2 1L6 11l-2 1v3l3-1.5L9 11l1 1-2 7h2.5l1.5-5 2 1v6h2v-7l-2-2 1-1 2 1 3 1v-3l-3-2z" />
  </svg>
);

// Clinch Icon - Two fighters grappling
export const ClinchIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Two figures in clinch */}
    <path d="M7.5 3c.83 0 1.5.67 1.5 1.5S8.33 6 7.5 6 6 5.33 6 4.5 6.67 3 7.5 3zm9 0c.83 0 1.5.67 1.5 1.5S17.33 6 16.5 6 15 5.33 15 4.5 15.67 3 16.5 3zM6 8.5l2 .5 1 1 2-1 2 1 1-1 2-.5v3l-1 1v2l1 4.5L13.5 20l-1.5-3-1.5 3L9 18.5l1-4.5v-2l-1-1-1 .5-1-.5-1 1v2l1 4.5L5.5 20 4 17l1-4.5v-2l-1-1V8l2 .5z" />
  </svg>
);

// Muay Thai Fighter Icon (full silhouette like the reference image)
export const MuayThaiIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Full Muay Thai fighter in knee strike pose */}
    <path d="M14 3.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm3.5 5L15 7l-1.5-.5c-.5-.2-1-.2-1.5 0L9 7 6.5 8.5 5 10v2l2-.5 1.5-1L9 12v2l-1.5 4L6 22h2l2-4.5L11 20l1-2.5 1 2.5 1 2.5h2l-1.5-4L13 14v-2l.5-1.5 1.5 1 2 .5v-2l-1.5-1.5 2-1z" />
  </svg>
);

export default {
  KneeStrikeIcon,
  BoxingIcon,
  KickIcon,
  ElbowIcon,
  ClinchIcon,
  MuayThaiIcon
};
