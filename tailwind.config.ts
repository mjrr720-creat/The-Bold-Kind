import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E0672E', // primary orange accent
          light: '#F2A57C',
          dark: '#B84E1F',
          darker: '#7A3413',
          tint: '#FDF3EE', // faint background wash
          soft: '#FBE4D8' // slightly stronger wash for badges/rings
        },
        ink: '#211B18',
        success: {
          DEFAULT: '#15803D', // positive values ONLY
          bg: '#EAF7EE'
        },
        danger: {
          DEFAULT: '#DC2626', // negative values ONLY
          bg: '#FDECEC'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunken: '#FAF8F6', // page background
          muted: '#F4F1ED', // subtle fills (chips, table header)
          border: '#EBE5DF' // hairline borders
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }]
      },
      boxShadow: {
        card: '0 1px 2px rgba(33,27,24,0.04), 0 1px 3px rgba(33,27,24,0.06)',
        'card-hover': '0 2px 4px rgba(33,27,24,0.05), 0 8px 20px -6px rgba(33,27,24,0.10)',
        pop: '0 8px 24px -8px rgba(224,103,46,0.35)'
      },
      borderRadius: {
        card: '18px',
        control: '10px',
        chip: '999px'
      }
    }
  },
  plugins: []
};

export default config;
