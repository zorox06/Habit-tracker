import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
				display: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
			},
			colors: {
				border: 'oklch(var(--border))',
				input: 'oklch(var(--input))',
				ring: 'oklch(var(--ring))',
				background: 'oklch(var(--background))',
				foreground: 'oklch(var(--foreground))',
				primary: {
					DEFAULT: 'oklch(var(--primary))',
					foreground: 'oklch(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'oklch(var(--secondary))',
					foreground: 'oklch(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'oklch(var(--destructive))',
					foreground: 'oklch(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'oklch(var(--muted))',
					foreground: 'oklch(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'oklch(var(--accent))',
					foreground: 'oklch(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'oklch(var(--popover))',
					foreground: 'oklch(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'oklch(var(--card))',
					foreground: 'oklch(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'oklch(var(--sidebar-background))',
					foreground: 'oklch(var(--sidebar-foreground))',
					primary: 'oklch(var(--sidebar-primary))',
					'primary-foreground': 'oklch(var(--sidebar-primary-foreground))',
					accent: 'oklch(var(--sidebar-accent))',
					'accent-foreground': 'oklch(var(--sidebar-accent-foreground))',
					border: 'oklch(var(--sidebar-border))',
					ring: 'oklch(var(--sidebar-ring))'
				},
				surface: {
					1: 'oklch(var(--surface-1))',
					2: 'oklch(var(--surface-2))',
					3: 'oklch(var(--surface-3))',
				},
				progress: {
					bg: 'oklch(var(--progress-bg))',
					cyan: 'oklch(var(--progress-cyan))',
					green: 'oklch(var(--progress-green))',
					orange: 'oklch(var(--progress-orange))',
					purple: 'oklch(var(--progress-purple))'
				},
				habit: {
					terracotta: 'oklch(var(--habit-terracotta))',
					sage: 'oklch(var(--habit-sage))',
					indigo: 'oklch(var(--habit-indigo))',
					ochre: 'oklch(var(--habit-ochre))',
				},
				chart: {
					blue: 'oklch(var(--chart-blue))',
					green: 'oklch(var(--chart-green))',
					orange: 'oklch(var(--chart-orange))',
					red: 'oklch(var(--chart-red))',
					purple: 'oklch(var(--chart-purple))',
					cyan: 'oklch(var(--chart-cyan))',
					yellow: 'oklch(var(--chart-yellow))',
					pink: 'oklch(var(--chart-pink))'
				},
				success: {
					DEFAULT: 'oklch(var(--success))',
					foreground: 'oklch(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'oklch(var(--warning))',
					foreground: 'oklch(var(--warning-foreground))'
				},
				error: {
					DEFAULT: 'oklch(var(--error))',
					foreground: 'oklch(var(--error-foreground))'
				},
				info: {
					DEFAULT: 'oklch(var(--info))',
					foreground: 'oklch(var(--info-foreground))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-up': {
					from: { opacity: '0', transform: 'translateY(12px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-up': 'fade-up 0.4s cubic-bezier(0.25, 1, 0.5, 1) both',
				'fade-in': 'fade-in 0.25s cubic-bezier(0.25, 1, 0.5, 1) both',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
