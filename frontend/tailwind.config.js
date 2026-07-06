/** @type {import('tailwindcss').Config} */
module.exports = {
  // Add the paths to all of your component files
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#F4F8F5',
        foreground: '#0F2C1E',
        primary: '#1B5E38',
        'primary-light': '#4A7A5E',
        muted: '#9AB5A4',
        secondary: '#E8F2EC',
        accent: '#C9933A',
        'accent-bg': '#FBF3E6',
      },
    },
  },
  plugins: [],
}