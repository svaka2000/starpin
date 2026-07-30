/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#06070c',
        panel: 'rgba(20, 19, 24, 0.82)',
        // single warm accent (was blue #8ab4ff) — flows through every text/bg/ring-stardust usage
        stardust: '#f1b85e',
        gold: '#f8cd86',
        // de-violeted: nova was #a78bfa; now a warm neutral so legacy usages read calm, not purple
        nova: '#b0a89c',
        ember: '#ff7f5e',
        // warm editorial neutrals
        parchment: '#f3f1ea',
        hush: '#a9a49b',
        faint: '#77726a',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        twinkle: 'twinkle 3s ease-in-out infinite',
        floaty: 'floaty 4s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
}
