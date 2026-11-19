/** Farben laufen über CSS-Variablen (siehe src/index.css), damit Dark & Light
 *  Mode dieselben Utility-Klassen nutzen (bg-card, border-line, text-muted …). */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        card: v('card'),
        elev: v('elev'),
        line: v('line'),
        fg: v('fg'),
        muted: v('muted'),
        subtle: v('subtle'),
        accent: v('accent'),
        'accent-fg': v('accent-fg'),
        danger: v('danger'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        pop: '0 12px 32px -8px rgb(0 0 0 / 0.45), 0 0 0 1px rgb(var(--line))',
      },
    },
  },
  plugins: [],
};
