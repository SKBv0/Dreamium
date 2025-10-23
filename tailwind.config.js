/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // Premium Black Theme Colors
        'premium': {
          'black': '#000000',
          'charcoal': '#0F0F0F', 
          'obsidian': '#1A1A1A',
          'gunmetal': '#252525',
          'ash': '#333333',
          'silver': '#888888',
          'platinum': '#C4C4C4',
          'pearl': '#E8E8E8',
          'accent-gold': '#D4AF37',
          'accent-electric': '#00D9FF',
          'accent-neon': '#39FF14',
          'accent-purple': '#8B5CF6',
          'accent-pink': '#EC4899'
        },
        // Semantic Premium Colors
        'dark': {
          '900': '#000000',
          '850': '#0A0A0A',
          '800': '#111111',
          '750': '#171717',
          '700': '#1F1F1F',
          '650': '#262626',
          '600': '#2D2D2D',
          '550': '#343434',
          '500': '#404040',
          '450': '#4D4D4D',
          '400': '#5A5A5A',
          '350': '#666666',
          '300': '#737373',
          '250': '#808080',
          '200': '#8C8C8C',
          '150': '#999999',
          '100': '#A6A6A6',
          '50': '#B3B3B3'
        }
        ,
        // Brand palette (kept minimal): purple + orange
        brand: {
          purple: '#8B5CF6',
          orange: '#F59E0B'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'premium-pulse': {
          '0%, 100%': {
            opacity: '1'
          },
          '50%': {
            opacity: '0.7'
          }
        },
        'premium-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(212, 175, 55, 0.5)'
          },
          '50%': {
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.8), 0 0 30px rgba(212, 175, 55, 0.4)'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'premium-pulse': 'premium-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'premium-glow': 'premium-glow 2s ease-in-out infinite alternate'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}

