import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _5231770a = () => interopDefault(import('..\\pages\\Cancelar.vue' /* webpackChunkName: "pages/Cancelar" */))
const _2ff67374 = () => interopDefault(import('..\\pages\\Catalogo.vue' /* webpackChunkName: "pages/Catalogo" */))
const _165af9ee = () => interopDefault(import('..\\pages\\Clientes.vue' /* webpackChunkName: "pages/Clientes" */))
const _2f0a460d = () => interopDefault(import('..\\pages\\consulta-compras.vue' /* webpackChunkName: "pages/consulta-compras" */))
const _77872bb0 = () => interopDefault(import('..\\pages\\envios.vue' /* webpackChunkName: "pages/envios" */))
const _0dcaa7aa = () => interopDefault(import('..\\pages\\facturas.vue' /* webpackChunkName: "pages/facturas" */))
const _143cc96d = () => interopDefault(import('..\\pages\\facturas - Copy.vue' /* webpackChunkName: "pages/facturas - Copy" */))
const _22a5a6fd = () => interopDefault(import('..\\pages\\formulas.vue' /* webpackChunkName: "pages/formulas" */))
const _54524c5a = () => interopDefault(import('..\\pages\\global.vue' /* webpackChunkName: "pages/global" */))
const _a9cfc34c = () => interopDefault(import('..\\pages\\inspire.vue' /* webpackChunkName: "pages/inspire" */))
const _61f5a6a1 = () => interopDefault(import('..\\pages\\inventario.vue' /* webpackChunkName: "pages/inventario" */))
const _f91c72da = () => interopDefault(import('..\\pages\\inventario-lotes.vue' /* webpackChunkName: "pages/inventario-lotes" */))
const _3328e5a6 = () => interopDefault(import('..\\pages\\invoice.vue' /* webpackChunkName: "pages/invoice" */))
const _adfd2e0c = () => interopDefault(import('..\\pages\\lectura.vue' /* webpackChunkName: "pages/lectura" */))
const _4069aa82 = () => interopDefault(import('..\\pages\\lotes.vue' /* webpackChunkName: "pages/lotes" */))
const _0b54f3e7 = () => interopDefault(import('..\\pages\\nota-credito.vue' /* webpackChunkName: "pages/nota-credito" */))
const _510dadae = () => interopDefault(import('..\\pages\\Recuperar.vue' /* webpackChunkName: "pages/Recuperar" */))
const _134552af = () => interopDefault(import('..\\pages\\Recuperar - Copy.vue' /* webpackChunkName: "pages/Recuperar - Copy" */))
const _7282fdaa = () => interopDefault(import('..\\pages\\refacturacion.vue' /* webpackChunkName: "pages/refacturacion" */))
const _43dee00c = () => interopDefault(import('..\\pages\\refacturacion4.vue' /* webpackChunkName: "pages/refacturacion4" */))
const _f846c754 = () => interopDefault(import('..\\pages\\traspasos.vue' /* webpackChunkName: "pages/traspasos" */))
const _6cff7252 = () => interopDefault(import('..\\pages\\index.vue' /* webpackChunkName: "pages/index" */))

const emptyFn = () => {}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/Cancelar",
    component: _5231770a,
    name: "Cancelar"
  }, {
    path: "/Catalogo",
    component: _2ff67374,
    name: "Catalogo"
  }, {
    path: "/Clientes",
    component: _165af9ee,
    name: "Clientes"
  }, {
    path: "/consulta-compras",
    component: _2f0a460d,
    name: "consulta-compras"
  }, {
    path: "/envios",
    component: _77872bb0,
    name: "envios"
  }, {
    path: "/facturas",
    component: _0dcaa7aa,
    name: "facturas"
  }, {
    path: "/facturas%20-%20Copy",
    component: _143cc96d,
    name: "facturas - Copy"
  }, {
    path: "/formulas",
    component: _22a5a6fd,
    name: "formulas"
  }, {
    path: "/global",
    component: _54524c5a,
    name: "global"
  }, {
    path: "/inspire",
    component: _a9cfc34c,
    name: "inspire"
  }, {
    path: "/inventario",
    component: _61f5a6a1,
    name: "inventario"
  }, {
    path: "/inventario-lotes",
    component: _f91c72da,
    name: "inventario-lotes"
  }, {
    path: "/invoice",
    component: _3328e5a6,
    name: "invoice"
  }, {
    path: "/lectura",
    component: _adfd2e0c,
    name: "lectura"
  }, {
    path: "/lotes",
    component: _4069aa82,
    name: "lotes"
  }, {
    path: "/nota-credito",
    component: _0b54f3e7,
    name: "nota-credito"
  }, {
    path: "/Recuperar",
    component: _510dadae,
    name: "Recuperar"
  }, {
    path: "/Recuperar%20-%20Copy",
    component: _134552af,
    name: "Recuperar - Copy"
  }, {
    path: "/refacturacion",
    component: _7282fdaa,
    name: "refacturacion"
  }, {
    path: "/refacturacion4",
    component: _43dee00c,
    name: "refacturacion4"
  }, {
    path: "/traspasos",
    component: _f846c754,
    name: "traspasos"
  }, {
    path: "/",
    component: _6cff7252,
    name: "index"
  }],

  fallback: false
}

export function createRouter (ssrContext, config) {
  const base = (config._app && config._app.basePath) || routerOptions.base
  const router = new Router({ ...routerOptions, base  })

  // TODO: remove in Nuxt 3
  const originalPush = router.push
  router.push = function push (location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort)
  }

  const resolve = router.resolve.bind(router)
  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to)
    }
    return resolve(to, current, append)
  }

  return router
}
