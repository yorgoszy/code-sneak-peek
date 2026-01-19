import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Knee Strike Icon - Muay Thai fighter delivering knee strike (silhouette)
export const KneeStrikeIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Muay Thai knee strike silhouette */}
    <ellipse cx="52" cy="12" rx="8" ry="10" />
    <path d="M44 22 C40 28, 38 35, 42 42 L38 55 L32 70 L28 85 L35 87 L42 72 L48 58 L52 48 L56 55 L54 70 L58 85 L65 83 L62 68 L58 52 C62 45, 65 38, 60 28 L56 22 Z" />
    <path d="M38 32 L25 28 L20 35 L28 38 L40 38 Z" />
    <path d="M60 30 L72 24 L80 28 L75 35 L62 36 Z" />
    <path d="M52 48 L60 42 L75 55 L72 62 L58 52 Z" />
  </svg>
);

// Boxing/Punch Icon - Boxer throwing punch (silhouette)
export const BoxingIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Boxer punching silhouette */}
    <ellipse cx="35" cy="15" rx="9" ry="11" />
    <path d="M28 26 C22 32, 20 40, 22 50 L18 65 L12 82 L20 85 L28 68 L32 52 L45 52 L52 68 L48 82 L56 85 L62 70 L58 52 C60 42, 55 32, 48 26 Z" />
    <path d="M48 35 L65 28 L82 25 L85 32 L70 38 L50 42 Z" />
    <path d="M22 38 L15 45 L10 52 L16 56 L24 48 L28 42 Z" />
  </svg>
);

// Kick Icon - High kick silhouette
export const KickIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* High kick silhouette */}
    <ellipse cx="30" cy="18" rx="8" ry="10" />
    <path d="M24 28 C18 35, 16 45, 20 55 L22 70 L18 88 L26 90 L32 72 L35 55 L38 48 Z" />
    <path d="M38 48 L55 35 L75 18 L82 22 L65 42 L45 58 L38 52 Z" />
    <path d="M20 40 L10 48 L8 55 L15 55 L22 48 L25 42 Z" />
    <path d="M35 40 L45 45 L50 52 L45 55 L38 50 Z" />
  </svg>
);

// Elbow Strike Icon - Fighter delivering elbow
export const ElbowIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Elbow strike silhouette */}
    <ellipse cx="50" cy="14" rx="9" ry="11" />
    <path d="M42 25 C36 32, 34 42, 38 52 L35 68 L30 85 L38 88 L45 70 L48 55 L52 55 L55 70 L62 88 L70 85 L65 68 L62 52 C66 42, 64 32, 58 25 Z" />
    <path d="M58 32 L68 25 L75 22 L80 28 L72 38 L60 40 Z" />
    <path d="M42 35 L32 38 L22 35 L20 42 L30 48 L42 45 Z" />
  </svg>
);

// Clinch Icon - Two fighters grappling (silhouette)
export const ClinchIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Two fighters in clinch silhouette */}
    <ellipse cx="30" cy="15" rx="8" ry="10" />
    <ellipse cx="70" cy="15" rx="8" ry="10" />
    <path d="M24 25 C18 32, 16 42, 20 52 L18 70 L14 88 L22 90 L28 72 L30 55 L35 48 L40 42 L50 38 L60 42 L65 48 L70 55 L72 72 L78 90 L86 88 L82 70 L80 52 C84 42, 82 32, 76 25 Z" />
    <path d="M35 30 L45 25 L55 25 L65 30 L60 38 L50 42 L40 38 Z" />
  </svg>
);

// Muay Thai Fighter Icon - Full stance (silhouette like reference)
export const MuayThaiIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Muay Thai fighter stance silhouette */}
    <ellipse cx="48" cy="12" rx="9" ry="11" />
    <path d="M40 23 C34 30, 32 40, 36 50 L32 65 L28 80 L22 92 L30 94 L38 80 L42 65 L46 52 L50 58 L48 75 L52 92 L60 90 L58 72 L54 55 C58 45, 56 35, 52 25 Z" />
    <path d="M52 30 L62 25 L72 30 L68 38 L58 40 L52 36 Z" />
    <path d="M40 32 L30 28 L22 32 L26 40 L36 42 L42 38 Z" />
    <path d="M46 52 L55 45 L68 52 L72 60 L62 65 L50 58 Z" />
  </svg>
);

// Muay Plam Icon - Thai clinch position
export const MuayPlamIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Muay Plam (Thai clinch) silhouette */}
    <ellipse cx="35" cy="12" rx="7" ry="9" />
    <ellipse cx="65" cy="18" rx="7" ry="9" />
    <path d="M30 21 C24 28, 22 38, 26 48 L24 65 L20 85 L28 88 L34 68 L36 52 L42 45 L50 42 Z" />
    <path d="M60 27 C66 34, 68 44, 64 54 L66 70 L70 88 L78 85 L74 68 L72 52 L65 45 L55 42 Z" />
    <path d="M42 28 L55 25 L62 32 L58 40 L48 42 L40 38 Z" />
    <path d="M36 35 L30 42 L35 50 L45 48 L42 40 Z" />
  </svg>
);

export default {
  KneeStrikeIcon,
  BoxingIcon,
  KickIcon,
  ElbowIcon,
  ClinchIcon,
  MuayThaiIcon,
  MuayPlamIcon
};
