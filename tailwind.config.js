const { createGlobPatternsForDependencies } = require("@nx/angular/tailwind");
const { join } = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, "src/**/!(*.stories|*.spec).{ts,html}"),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    fontFamily: {
      body: ["Roboto", '"Helvetica Neue"', "sans-serif"],
      mono: ['"Roboto Mono"', "monospace"],
      "7seg": ['"FS Sevegment"', '"Roboto Mono"', "monospace"],
      logos: ["font-logos"],
    },
    extend: {
      colors: {
        chara: {
          50: "#fffde5",
          100: "#fff9c0",
          200: "#fff595",
          300: "#fef167",
          400: "#fcec3f",
          500: "#fae700",
          600: "#ffd900",
          700: "#ffc000",
          800: "#ffa700",
          900: "#fe7a00",
        },
        gray: {
          50: "#e6e6e6",
          100: "#c1c1c1",
          200: "#989898",
          300: "#6e6e6e",
          400: "#4f4f4f",
          450: "#424242",
          500: "#303030",
          600: "#2b2b2b",
          700: "#242424",
          800: "#1e1e1e",
          900: "#131313",
        },
      },
    },
  },
  plugins: [],
};
