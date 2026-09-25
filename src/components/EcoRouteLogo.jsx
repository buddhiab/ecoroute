/**
 * EcoRoute Logo Component
 * Inline SVG — leaf with a route arrow inside.
 * Props:
 *   size  — width/height in px (default: 32)
 *   className — extra Tailwind classes
 */
export default function EcoRouteLogo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="EcoRoute logo"
    >
      <defs>
        <linearGradient id="eco-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2" />
        </filter>
      </defs>
      
      {/* Background Rounded Square */}
      <rect width="24" height="24" rx="6" fill="url(#eco-grad)" />
      
      {/* Map Pin (White cutout) */}
      <path
        d="M12 3.5C8.134 3.5 5 6.634 5 10.5C5 15.5 12 20.5 12 20.5C12 20.5 19 15.5 19 10.5C19 6.634 15.866 3.5 12 3.5Z"
        fill="white"
        filter="url(#shadow)"
      />
      
      {/* Leaf inside Map Pin */}
      <path
        d="M12 6C12 6 8.5 8.5 8.5 10.5C8.5 12.433 10.067 14 12 14C13.933 14 15.5 12.433 15.5 10.5C15.5 8.5 12 6 12 6Z"
        fill="url(#eco-grad)"
      />
    </svg>
  )
}
