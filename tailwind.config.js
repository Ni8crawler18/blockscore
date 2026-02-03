/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        solana: '#9945FF',
        'solana-green': '#14F195',
      },
    },
  },
  plugins: [],
}
