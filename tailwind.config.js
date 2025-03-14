module.exports = {
    content: [
      "./src/*.{html,js,css} ",
      "./views/homepage.ejs",
    ],
    theme: {
      extend: {},
    },
    plugins: [
      {
        tailwindcss: {},
        autoprefixer: {},
      },
    ],
  };