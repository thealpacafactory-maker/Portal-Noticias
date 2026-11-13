/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        guinda: {
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F8CAD1',
          300: '#EE98A7',
          400: '#DF5C75',
          500: '#B82343',
          600: '#8A2038',
          700: '#6B1D2F',
          800: '#531524',
          900: '#3D0E19',
        },
      },
    },
  },
  plugins: [],
};
