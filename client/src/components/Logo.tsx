import React from "react";

export function Logo({ className = "w-8 h-8 text-primary" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Travel Pin Shape */}
      <path
        d="M12 2C7.5 2 4 5.5 4 10C4 16 12 22 12 22C12 22 20 16 20 10C20 5.5 16.5 2 12 2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Compass Star / Rose (Four Pointed Star) inside the Pin */}
      <path
        d="M12 6L13.5 8.5L16 10L13.5 11.5L12 14L10.5 11.5L8 10L10.5 8.5L12 6Z"
        fill="white"
      />
      {/* Center circle */}
      <circle cx="12" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default Logo;
