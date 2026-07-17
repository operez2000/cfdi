const colors = require('vuetify/es5/util/colors').default
const cfg = require("./config.json")

module.exports = {
  //mode: 'spa',
  ssr: false,
  /*
  ** Headers of the page
  */
  head: {
    titleTemplate: 'Gusher Online', //'%s - ' + process.env.npm_package_name,
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' },
      {
        "data-hid": "theme-color", name: "theme-color", content: colors.blue.darken1
      },
      { "data-hid": "apple-mobile-web-app-capable", name: "apple-mobile-web-app-capable", content: "yes" },
      {
        "data-hid": "apple-mobile-web-app-status-bar-style",
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent"
      }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
  },
  serverMiddleware: [
    '~/api/index.js',
  ],
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },
  /*
  ** Global CSS
  */
  css: [
  ],
  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
  ],
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [ //devModules: [
    '@nuxtjs/vuetify',
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/pwa',
  ],
  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
    baseURL: cfg.baseUrl || process.env.API_URL
  },
  /*
  ** vuetify module configuration
  ** https://github.com/nuxt-community/vuetify-module
  */
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    treeShake: true,
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: colors.blue.darken1,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent2,
          success: colors.green.accent3,
          oscuro: colors.grey.darken4,
        }
      }
    }
  },
  pwa: {
    manifest: {
      name: "Gusher PWA...",
      lang: "es"
    }
  },
  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {
    }
  }
}
