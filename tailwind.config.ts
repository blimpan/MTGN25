import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'portrait': {'raw': '(orientation: portrait)'},
        'landscape': {'raw': '(orientation: landscape)'}
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "homeGradientImg": "url('/home-gradient.jpg')",
      },
      dropShadow: {
        // 'name': 'x-offset y-offset blur-radius color'
        'homeShadow': '0 4px 2px rgba(0, 0, 0, 0.3)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: "0" },
          '100%': { opacity: "1" },
        },
        fadeInFromBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' }, // Start from bottom and invisible
          '100%': { transform: 'translateY(0)', opacity: '1' },  // End in original position and fully visible
        },
        pulse: {
          '0%, 100%': { opacity: "1" },
          '50%': { opacity: "0.7" },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-in-out',
        fadeInFast: 'fadeIn 0.15s ease-in-out',
        fadeInFromBottom: 'fadeInFromBottom 0.5s ease-out forwards',
        pulseInfinite: 'pulse 4s cubic-bezier(0, 0, 1, 1) infinite',
      },

    },
  },
  plugins: [],
};

export default config;
