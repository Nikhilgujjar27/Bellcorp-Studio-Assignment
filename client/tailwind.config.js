/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#F5F8FF',
          card: '#FFFFFF',
          border: '#E5EAF3',
          'border-subtle': '#EEF2F8',
          text: '#172033',
          muted: '#667085',
          subtle: '#98A2B3',
          
          // Primary Blue
          blue: '#2563EB',
          'blue-hover': '#1D4ED8',
          'blue-soft': '#EAF2FF',
          'blue-border': '#D0E1FD',
          
          // Purple (History/Analytics)
          purple: '#7C3AED',
          'purple-hover': '#6D28D9',
          'purple-soft': '#F2EBFF',
          'purple-border': '#E0D0FB',
          
          // Teal/Green (Success/Operational)
          green: '#10B981',
          'green-hover': '#059669',
          'green-soft': '#EAFBF4',
          'green-border': '#C3F3E1',
          
          // Orange/Amber (Concurrency Lab / Attention)
          orange: '#F59E0B',
          'orange-hover': '#D97706',
          'orange-soft': '#FFF6DF',
          'orange-border': '#FDE68A',
          
          // Red/Pink (Failed/Error)
          red: '#EF4444',
          'red-hover': '#DC2626',
          'red-soft': '#FFF0F0',
          'red-border': '#FED7D7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'fintech-subtle': '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'fintech-card': '0 2px 8px -2px rgba(16, 24, 40, 0.06), 0 1px 3px 0 rgba(16, 24, 40, 0.04)',
        'fintech-card-hover': '0 12px 24px -4px rgba(16, 24, 40, 0.08), 0 4px 8px -2px rgba(16, 24, 40, 0.03)',
        'fintech-elevated': '0 20px 32px -8px rgba(37, 99, 235, 0.08), 0 8px 16px -4px rgba(16, 24, 40, 0.04)',
        'fintech-primary-btn': '0 4px 14px 0 rgba(37, 99, 235, 0.35)',
        'fintech-orange-btn': '0 4px 14px 0 rgba(245, 158, 11, 0.35)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-mesh': 'radial-gradient(at 0% 0%, #EAF2FF 0px, transparent 50%), radial-gradient(at 100% 0%, #F2EBFF 0px, transparent 50%), radial-gradient(at 50% 100%, #EAFBF4 0px, transparent 50%)',
      }
    },
  },
  plugins: [],
}
