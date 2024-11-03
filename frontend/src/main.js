window.prerenderReady = false
/**
 * Setup global functions & variables in window
 */
window.setCookie = function (name, value, days) {
  var expires = ''
  if (days) {
    var date = new Date()
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
    expires = '; expires=' + date.toUTCString()
  }
  if (window.location.hostname.match(/wago\.io/)) {
    document.cookie = name + '=' + value + expires + '; domain=.wago.io; path=/'
  }
  // if testing locally
  else {
    document.cookie = name + '=' + value + expires + '; path=/'
  }
}

window.readCookie = function (name) {
  var nameEQ = name + '='
  var ca = document.cookie.split(';')
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

window.clearCookie = function (name) {
  window.setCookie(name, '', -1)
}

window.locales = require('../../i18nLocaleConfig').locales

// if (window.readCookie('theme')==='classic') {
//   document.body.classList.add('theme-classic')
//   document.body.classList.remove('theme-dark')
// }
// else if (window.readCookie('theme') === 'waluigi') {
//   document.body.classList.add('theme-dark')
// }

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'

// setup Vuex state
import Vuex from 'vuex'
Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    isMaintenance: false,
    isTest: process.env.NODE_ENV === 'development' || document.getElementById('test-content'),
    locale: window.readCookie('locale') || 'en-US',
    advertSetup: false,
    advertBlocked: false,
    streambuffVideo: true,
    user: {
      config: {
        searchOptions: {}
      }
    },
    loggedIn: false,
    wotm: {},
    wago: {},
    addons: {},
    snackBarText: 'alert',
    loginRedirect: '/',
    theme: 'dark',
    editorTheme: window.readCookie('editorTheme') || 'tomorrow',
    MDTTable: false,
    MDTWeek: 0,
    pageInfo: {
      title: 'Import',
      description: 'Database of sharable World of Warcraft addon elements',
      image: 'https://wago.io/media/favicon/apple-touch-icon-180x180.png',
      layout: 'default'
    },
    siteSearch: '',
    searchMode: '',
    searchGame: '',
    searchExpansion: '',
    searchType: '',
    searchVersion: '',
    execSearch: 0,
    domain: window.localStorage.getItem('domain') || '0',
    firstAd: false,
    linkApp: false,

    socket: {
      cid: null,
      isConnected: false,
      reconnectError: false
    }
  },
  mutations: {
    // store.commit('setLocale', 'en-US')
    setLocale(state, locale) {
      if (locale.indexOf('-') === 2) {
        // locale already in lang-region format
      }
      else if (locale === locale.toUpperCase()) {
        // locale is a region
        locale = state.locale.split('-')[0] + '-' + locale
      }
      else if (locale === locale.toLowerCase()) {
        // locale is a language
        locale = locale + '-' + state.locale.split('-')[1]
      }
      else {
        // what is this!
        var e = { name: 'UnknownLocale', message: locale }
        throw e
      }

      // is this a supported locale?
      var supported
      window.locales.forEach((item) => {
        if (item.code === locale) {
          supported = true
        }
      })

      // if not then keep the language but discard the user's region for i8n purposes
      var setLocale
      if (!supported) {
        var lng = locale.split('-')[0]
        window.locales.forEach((item) => {
          if (setLocale) return

          // if match found use this
          if (item.code.split('-')[0] === lng) {
            setLocale = item.code
            return
          }
        })
      }
      else {
        setLocale = locale
      }
      state.locale = setLocale
      window.i18next.changeLanguage(setLocale)
      window.setCookie('locale', setLocale, 365)
      location.reload()
    },

    // store.commit('setUser', {JSON user object from API...})
    setUser(state, user) {
      if (!user.hideAds) {
        store.commit('loadAds')
      }
      if (user && user.UID) {
        state.loggedIn = true
      }
      else {
        state.loggedIn = false
      }
      state.user = JSON.parse(JSON.stringify(user))
      if (state.user.config && state.user.config.editor) {
        window.setCookie('editor', state.user.config.editor, 365)
      }
    },

    loadAds(state) {
      if (state.isMaintenance) {
        return
      }
      const body = document.querySelector('body')
      if (0 && process.env.NODE_ENV === 'development') {
        state.advertSetup = true
        state.advertBlocked = false
        body.classList.add('ads-enabled')

        window.streambuff = {
          test: true,
          debug: false,
          hostElement: '#embed-streambuff',
          showCloseButton: true,
          width: 350,
          height: 191.25,
          onEmbedServed: () => {
            console.log('streambuff TRUE')
            state.streambuffVideo = true
          },
          onEmbedMissing: () => {
            console.log('streambuff FALSE')
            state.streambuffVideo = false
          },
        };
        const streambuffScript = document.createElement('script')
        streambuffScript.setAttribute('src', 'https://streambuff.gg/js/init.js')
        // body.appendChild(streambuffScript)
      }
      else if (!state.advertSetup) {
        body.classList.add('ads-enabled')

        //**** Nitropay
        window.nitroAds = window.nitroAds || {
          createAd: function () {
            return new Promise(e => { window.nitroAds.queue.push(["createAd", arguments, e]) })
          },
          addUserToken: function () { window.nitroAds.queue.push(["addUserToken", arguments]) },
          queue: []
        }
        const nitropay = document.createElement('script')
        nitropay.setAttribute('src', 'https://s.nitropay.com/ads-437.js')
        const sideRail = {
          demo: !!(process.env.NODE_ENV === 'development' || window.location.hostname.match(/test/)),
          refreshLimit: 0,
          refreshTime: 30,
          format: 'rail',
          railOffsetTop: 150,
          railOffsetBottom: 40,
          railSpacing: 6,
          railCollisionWhitelist: ['*'],
          sizes: [
            ['160', '600'],
            ['300', '600'],
            ['300', '250'],
          ],
          mediaQuery: '(min-width: 1908px)'
        }
        nitropay.onload = () => {
          state.advertSetup = true
          state.advertBlocked = false
          window.advertRails.make()
        }
        nitropay.onerror = () => {
          state.advertSetup = true
          state.advertBlocked = true
        }
        body.appendChild(nitropay)

        window.advertRails = {
          ads: [],
          makeRails: () => {
            window.advertRails.ads.push(window.nitroAds.createAd('rail-left', Object.assign({ rail: 'left' }, sideRail)))
            window.advertRails.ads.push(window.nitroAds.createAd('rail-right', Object.assign({ rail: 'right' }, sideRail)))
          },
          destroyRails: () => {
            document.getElementById('rail-left') && document.getElementById('rail-left').remove()
            document.getElementById('rail-right') && document.getElementById('rail-right').remove()
          },
          make: () => {
            window.advertRails.makeRails()
            window.advertRails.ads.push(window.nitroAds.createAd('bottom-anchor', {
              demo: false,//!!(process.env.NODE_ENV === 'development' || window.location.hostname.match(/test/)),
              refreshLimit: 0,
              refreshTime: 30,
              format: "anchor",
              anchor: "bottom",
              anchorBgColor: 'rgb(51 51 51 / 50%)',
              anchorPersistClose: true,
              mediaQuery: "(min-width: 0px)",
              report: {
                enabled: true,
                icon: true,
                wording: "Report Ad",
                position: "top-right"
              }
            }))
          },
          refresh: () => {
            window.advertRails.ads.map(x => x && x.onNavigate && x.onNavigate())
          }
        }

        window.streambuff = {
          test: process.env.NODE_ENV === 'development' || window.location.hostname.match(/test/),
          debug: false,
          hostElement: '#embed-streambuff',
          showCloseButton: false,
          width: 350,
          height: 191.25,
          onEmbedServed: () => {
            state.streambuffVideo = true
          },
          onEmbedMissing: () => {
            state.streambuffVideo = false
          },
        }
        const streambuffScript = document.createElement('script')
        streambuffScript.setAttribute('src', 'https://streambuff.gg/js/init.js')
        body.appendChild(streambuffScript)


      }
    },

    setStreamEmbed(state, streamEmbed) {
      if (state.streamEmbed !== '__streamspread' && streamEmbed) {
        Vue.set(state, 'streamEmbed', streamEmbed)
      }
    },

    userClearMention(state, commentID) {
      if (!state.user || !state.user.UID) {
        return
      }
      for (var i = 0; i < state.user.unreadMentions.length; i++) {
        if (state.user.unreadMentions[i]._id === commentID) {
          state.user.unreadMentions.splice(i, 1)
        }
      }
    },

    userSearchOption(state, data) {
      if (!state.user) {
        return
      }
      state.user.config.searchOptions[data.field] = data.value
    },

    setSearchText(state, text) {
      Vue.set(state, 'siteSearch', '')
      Vue.nextTick(() => {
        let q = text.replace(/\s{2,}/g, ' ').trim()
        const m = q.match(/^!(\w+)!/)
        if (m && m[1]) {
          q = q.replace(m[0], '')
          Vue.set(state, 'searchMode', m[1])
          window.localStorage.setItem('search.mode', m[1])
        }
        Vue.set(state, 'siteSearch', q.trim())
        state.execSearch++
      })
    },

    setSearchGame(state, data) {
      Vue.set(state, 'searchGame', data.game + '')
      window.localStorage.setItem(`search.game`, data.game)
    },

    setDomain(state, domain) {
      Vue.set(state, 'domain', domain + '')
      window.localStorage.setItem('domain', domain + '')
    },

    setSearchMode(state, mode) {
      Vue.set(state, 'searchMode', mode + '')
      window.localStorage.setItem('search.mode', mode + '')
    },

    setSearchExpansion(state, data) {
      Vue.set(state, 'searchExpansion', data.expansion + '')
      window.localStorage.setItem(`search.expansion.${data.game}`, data.expansion)
    },

    setSearchType(state, data) {
      Vue.set(state, 'searchType', type + '')
      window.localStorage.setItem(`search.type.${data.game}`, data.type)
    },

    setSearchToggles(state, data) {
      console.log('set toggles', data)
      Vue.set(state, 'searchMode', data.mode + '')
      window.localStorage.setItem('search.mode', data.mode + '')
      Vue.set(state, 'searchGame', data.game + '')
      window.localStorage.setItem(`search.game`, data.game)
      Vue.set(state, 'searchExpansion', data.expansion + '')
      window.localStorage.setItem(`search.expansion.${data.game}`, data.expansion)
      Vue.set(state, 'searchType', data.type + '')
      window.localStorage.setItem(`search.type.${data.game}`, data.type)
    },

    setSearchOpts(state, opts) {
      Vue.set(state, 'searchMode', opts.mode || '')
      window.localStorage.setItem('search.mode', opts.mode || '')
      Vue.set(state, 'siteSearch', (opts.query || '').trim())
      state.execSearch++
    },

    setPageInfo(state, page) {
      if (!page.title) {
        page.title = state.pageInfo.title
      }
      if (page.description) {
        // remove bbcode
        var plaintext = page.description.replace(/\[\/?(?:b|center|code|color|face|font|i|justify|large|left|li|noparse|ol|php|quote|right|s|size|small|sub|sup|taggeduser|table|tbody|tfoot|td|th|tr|u|url|\*)*?.*?\]/g, '').replace(/\n/g, ' ')

        // if shortening the text
        if (plaintext.length > 160) {
          // truncate to length
          plaintext = plaintext.substr(0, 160)
          // truncate to last word
          plaintext = plaintext.substr(0, Math.min(plaintext.length, plaintext.lastIndexOf(' ')))
        }
        page.description = plaintext
      }
      else {
        page.description = 'Database of sharable World of Warcraft addon elements'
      }
      if (!page.image) {
        page.image = 'https://wago.io/media/favicon/apple-touch-icon-180x180.png'
      }
      if (page.unlisted) {
        page.robots = 'noindex,nofollow'
      }
      else {
        page.robots = 'index,follow'
      }
      if (!page.layout) {
        page.layout = state.pageInfo.layout || 'default'
      }
      state.pageInfo = Object.assign({}, page)
      window.prerenderReady = true
    },

    setWotm(state, wotm) {
      state.wotm = JSON.parse(decodeURIComponent(wotm))
    },
    setWago(state, wago) {
      state.wago = wago
    },
    setAddons(state, addons) {
      state.addons = addons
    },
    setWagoJSON(state, json) {
      state.wago.code.json = json
    },
    setMDTWeek(state, week) {
      state.MDTWeek = week
    },
    setLoginRedirect(state, path) {
      state.loginRedirect = path
    },
    setEditorTheme(state, theme) {
      window.setCookie('editorTheme', theme, 365)
      state.editorTheme = theme
      Vue.set(state.user.config, 'editor', theme)
    },
    saveMDT(state, table) {
      state.mdtDungeonTable = table
    },

    showAd(state) {
      state.firstAd = true
    },

    linkApp(state) {
      state.linkApp = true
    },

    SOCKET_OPEN(state, socket) {

    },
    SOCKET_DATA(state, data) {
      if (data.setStream) {
        store.commit('setStreamEmbed', data.setStream)
      }
      else if (data.setCID) {
        state.socket.cid = data.setCID
      }
    }
  },
  getters: {
    i18nLanguage(state) {
      return state.locale.split('-')[0]
    },
    i18nRegion(state) {
      return state.locale.split('-')[1]
    }
  }
})

import App from './Main.vue'

// load router
import VueRouter from 'vue-router'
Vue.use(VueRouter)
import routes from './router.js'
const router = new VueRouter(
  routes
)
Vue.router = router
// called before any route changes
router.beforeEach((to, from, next) => {
  // close mobile nav
  if (Vue.$refs && Vue.$refs['mobile-sidebar']) {
    Vue.$refs['mobile-sidebar'].close()
  }

  document.getElementById('full-navbar')?.classList.add('transition')
  setTimeout(() => {
    document.getElementById('full-navbar')?.classList.remove('transition')  
  }, 100)
    

  // hide any open menus on navigation
  var needClick = document.querySelectorAll('.md-menu-backdrop')
  needClick.forEach((el) => {
    el.click()
  })

  // beta server require login (if JS does not know user is logged in when visiting the page then wait for whoami request handled in App.vue)
  if (window.requireBetaAccess && (!store.state.user.access || !store.state.user.access.beta) && !to.path.match(/^\/(login|auth)/)) {
    router.replace('/')
    return next(false)
  }

  // allow route change
  next()

  // disallow route change
  // next(false)
})

router.afterEach((to, from) => {
  if (!window.preventScroll) {
    window.scrollTo(0, 0)
    if (!to.path.match(/^\/(login|account)/)) {
      // eslint-disable-next-line
      // load new ad
    }
  }

  if (!from.matched.length || !to.matched.length || (to.matched[0].path === from.matched[0].path && to.matched[0].path === '/:wagoID')) {
    return
  }
  if (!from.matched.length || (to.matched[0].path !== from.matched[0].path || to.matched[0].path !== '/:wagoID')) {
    if (window.advertRails) {
      window.advertRails.refresh()
    }

    gtag('config', 'G-WYTP0LZWS6', {
      'page_title': document.title,
      'page_path': to.fullPath
    });
  }
})

// setup vue-meta for header
import Meta from 'vue-meta'
Vue.use(Meta)

// load vddl (drag drop) component
import Vddl from 'vddl'
Vue.use(Vddl)

// load v-show-slide component
import VShowSlide from 'v-show-slide'
Vue.use(VShowSlide)

// crypto
import VueCryptojs from 'vue-cryptojs'
Vue.use(VueCryptojs)

// setup vue material
import VueMaterial from 'vue-material'
// require('vue-material/dist/vue-material.css')
Vue.use(VueMaterial)
// Vue.material.registerTheme({
//   default: {
//     primary: 'black'
//   }
// })
// Vue.material.registerTheme('dark', {
//   primary: {
//     color: 'grey',
//     hue: '800'
//   },
//   accent: {
//     color: 'grey',
//     hue: 300
//   }
// })


const isEmbedPage = !!(document.getElementById('embed-body'))
Vue.use({
  install: function (v) {
    v.prototype.$env = process.env.NODE_ENV
    if (window.location.hostname.match(/itsmark/)) v.prototype.$env = 'development'
  }
})
var dataServers
var authServer
var socketServer
const socketCID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
if (process.env.NODE_ENV === 'development') {
  dataServers = ['http://localhost:3030']
  authServer = 'http://localhost:3030'
  socketServer = 'ws://localhost:3030/ws'
}
else if (window.location.hostname.match(/test/)) {
  dataServers = ['https://data1.wago.io']
  authServer = 'https://data1.wago.io'
  socketServer = 'wss://data1.wago.io/ws'
}
else if (window.location.hostname.match(/itsmark/)) {
  dataServers = ['https://wagodata.itsmark.me']
  authServer = 'https://wagodata.itsmark.me'
  socketServer = 'wss://wagodata.itsmark.me/ws'
}
else {
  // using round robin client-based load balancing
  // dataServers = getServersByCountry(window.cfCountry) // attempt to detect country by cloudflare and assign regional data servers when available
  dataServers = ['https://data.wago.io']
  authServer = 'https://data.wago.io'
  socketServer = 'wss://data.wago.io/ws'
}

dataServers = dataServers.sort(() => {
  return 0.5 - Math.random()
})

// import VueNativeSock from 'vue-native-websocket'
// if (!isEmbedPage) {
//   Vue.use(VueNativeSock, socketServer, {
//     store: store,
//     format: 'json',
//     // reconnection: true,
//     reconnectionDelay: 3000
//   })
// }

import axios from 'axios'
import VueAxios from 'vue-axios'
Vue.use(VueAxios, axios)
// set default options
// TODO: switch axios auth'ing to fetch
Vue.axios.defaults.baseURL = dataServers[0]
Vue.axios.defaults.timeout = 10000
Vue.axios.defaults.withCredentials = true // to use cookies with CORS
if (window.readCookie('token') && window === window.parent) {
  Vue.axios.defaults.headers = { 'x-auth-token': window.readCookie('token') }
}

axios.interceptors.response.use(function (response) {
  // if logging in
  if (response.data.login && response.data.token && response.data.user) {
    window.setCookie('token', response.data.token, 365)
    Vue.axios.defaults.headers = { 'x-auth-token': response.data.token }
    store.commit('setUser', response.data.user)
    router.replace(store.loginRedirect || '/settings')
  }

  return response
})

var refSent = false
// setup http fetch helper
const http = {
  install: function (Vue, options) {
    Vue.prototype.http = {
      config: function (url) {
        var headers = {'Content-Type': 'application/json'}

        // add jwt token
        if (window.readCookie('token') && window === window.parent && url.match(new RegExp('^' + dataServers[0]))) {
          headers['x-auth-token'] = window.readCookie('token')
        }

        return {
          headers: headers,
          credentials: 'include',
          mode: 'cors'
        }
      },

      get: async function (url, params) {
        // add referer for analytics
        if (!refSent && document.referrer && !document.referrer.match(/^https:\/\/wago.io/) && !url.match(/^\/account\//)) {
          params = params || {}
          params._ref = document.referrer
          refSent = true
        }

        if (!url.match(/^http/)) {
          url = dataServers[0] + url
        }
        // append querystring to url
        if (params) {
          if (!url.match(/\?/)) {
            url = url + '?'
          }
          else {
            url = url + '&'
          }
          url = url + Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&')
        }

        // ajax away!
        try {
          var res = await fetch(url, this.config(url))
          if (res.status === 429) {
            console.log('Whoh! Easy on the F5 key!')
            window.eventHub.$emit('showSnackBar', i18next.t('Error rate limit exceeded'))
            return {}
          }
          this.interceptHeaders(res)
          var json = await res.json()
          return json
        }
        catch (err) {
          console.error(err)
          window.eventHub.$emit('showSnackBar', i18next.t('Error could not reach data server'))
        }
      },
      post: async function (url, params) {
        // prepend API server
        if (!url.match(/^http/)) {
          url = dataServers[0] + url
        }

        if (!params) {
          params = {}
        }

        var config = this.config(url)
        config.method = 'post'
        config.headers['Accept'] = 'application/json'
        config.body = JSON.stringify(params)

        // ajax away!
        try {
          var res = await fetch(url, config)
          if (res.status === 429) {
            console.log('Whoh! Easy on the F5 key!')
            window.eventHub.$emit('showSnackBar', i18next.t('Error rate limit exceeded'))
          }
          var type = this.interceptHeaders(res)
          var json
          if (type.json) {
            json = await res.json()
          }
          else if (type.blob) {
            return res.blob()
          }
          this.interceptJSON(json)
          return json
        }
        catch (err) {
        }
      },
      upload: function (url, file, params) {
        // prepend API server
        if (!url.match(/^http/)) {
          url = dataServers[0] + url
        }

        if (!params) {
          params = {}
        }

        var _t = this
        return new Promise((resolve, reject) => {
          var reader = new FileReader()
          reader.onload = function (event) {
            params.file = event.target.result
            resolve(_t.post(url, params))
          }
          reader.readAsDataURL(file)
        })
      },
      dataServer: function () {
        var host = dataServers.shift()
        dataServers.push(host)
        return host
      },
      // PostToWACompanion: function (action, id) {
      //   var e = document.createElement('a')
      //   e.id = 'sendToCompanion'
      //   e.href = `weakauras-companion://wago/${action}/${id}`
      //   document.getElementsByTagName('body')[0].appendChild(e)
      //   e.click()
      //   e.parentNode.removeChild(e)
      //   return fetch(`weakauras-companion://wago/${action}/${id}`, {
      //     mode: 'no-cors',
      //     cache: 'no-cache'
      //   })
      //   .then((res) => {
      //     return res.json()
      //   }).then((json) => {
      //     if (json.success) {
      //       window.eventHub.$emit('showSnackBar', i18next.t('WeakAura successfully sent to Companion App'))
      //     }
      //     else {
      //       window.eventHub.$emit('showSnackBar', i18next.t('An error has occurred'))
      //     }
      //   }).catch((err) => {
      //     console.log(err)
      //     window.eventHub.$emit('showSnackBar', i18next.t('Error could not reach the WeakAura Companion App, are you sure it is running?'))
      //   })
      // },
      interceptHeaders: function (res) {
        var responseType = {}
        for (var pair of res.headers.entries()) {
          switch (pair[0]) {
            case 'wotm':
              store.commit('setWotm', pair[1])
              break
            case 'content-type':
              if (pair[1].match(/json/)) {
                responseType.json = true
              }
              else if (pair[1].match(/zip/)) {
                responseType.blob = true
              }
              break
          }
        }
        return responseType
      },
      interceptJSON: function (json) {
        if (typeof json !== 'object') {
          return
        }
        if (json.login && json.token && json.user) {
          window.setCookie('token', json.token, 365)
          store.commit('setUser', json.user)
          router.replace(store.loginRedirect || '/account')
        }
        else if (json.guest === true) {
          // session expired or no session at all, clear cookies
          window.clearCookie('token')
          window.clearCookie('theme')
          Vue.axios.defaults.headers = {}
        }

        if (json.mdtWeek) {
          store.commit('setMDTWeek', json.mdtWeek)
        }
      }
    }
  }
}
Vue.use(http)

const socket = {
  install: function (Vue) {
    Vue.prototype.$socket = {
      send: function (data, onReceive) {
        if (!this.connected) {
          throw 'Can not send while not connected to socket.'
        }
        if (onReceive) {
          data.ident = Math.random().toString(36).substring(2, 15)
          this.listeners[data.ident] = onReceive
        }
        const json = JSON.stringify(data)
        this.socket.send(json)
      },
      connect: function () {
        if (isEmbedPage) {
          return
        }
        this.listeners = {}
        let connection = new WebSocket(`${socketServer}?cid=${socketCID}`)
        connection.onmessage = (event) => {
          const data = JSON.parse(event.data)
          if (data.ping) {
            Vue.prototype.$socket.send({ pong: 1 })
          }
          else if (data.error) {
            window.eventHub.$emit('showSnackBar', `Socket Error: ${data.error}`)
          }
          else if (data.ident && this.listeners[data.ident]) {
            this.listeners[data.ident](data)
          }
          else {
            store.commit('SOCKET_DATA', data, this)
          }
        }

        connection.onopen = (event) => {
          this.connected = true
          this.socket = event.target
          store.commit('SOCKET_OPEN', this)
          this.reconnect = setTimeout(function () {
            connection.close()
          }, 1000 * 60 * 20)
        }

        connection.onclose = (event) => {
          connection.close()
          this.connected = false
          clearTimeout(this.reconnect)
        }

        connection.onerror = (error, event) => {
          connection.close()
          this.connected = false
          clearTimeout(this.reconnect)
          const that = this
          this.reconnect = setTimeout(function () {
            that.connect()
          }, 5000)
        }
      }
    }
  }
}
Vue.use(socket)

const DBC = {
  install: function (Vue) {
    Vue.prototype.$DBC = {
      items: [],
      cache: {},
      get: null,
      lookup: function (lookup) {
        this.items.push(lookup)
      },
      process: async function () {
        let items = [...this.items]
        this.items = []
        for (const lookup of items) {
          if (this.cache[lookup.id]) {
            lookup.done(this.cache[lookup.id])
          }
          else {
            try {
              let res = await Vue.prototype.http.get('/lookup/dbc', { id: lookup.id })
              if (res) {
                this.cache[lookup.id] = res
                lookup.done(res)
              }
            }
            catch (e) { console.log(e) }
          }
        }
      }
    }
  }
}
Vue.use(DBC)

const isMobile = {
  install: (Vue) => {
    let agent = navigator.userAgent || navigator.vendor || window.opera
    // eslint-disable-next-line
    Vue.prototype.$isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(agent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(agent.substr(0, 4))
  }
}
Vue.use(isMobile)

const testAds = {
  install: (Vue) => {
    var params = new URLSearchParams(window.location.search)
    if (params.get('enable-ads') === 'true') {
      Vue.prototype.$enableAds = true
    }
  }
}
Vue.use(testAds)

const screenWidth = {
  install: (Vue) => {
    Vue.prototype.$screenWidth = window.innerWidth
    window.onresize = function () {
      Vue.prototype.$screenWidth = window.innerWidth
    }
  }
}
Vue.use(screenWidth)
Vue.config.productionTip = false

import VueLazyLoad from 'vue-lazyload'
Vue.use(VueLazyLoad)

// setup momentjs
Vue.use(require('vue-moment'))

// scrollTo
Vue.use(require('vue-scrollto'), {
  offset: -90,
  duration: 350
})

// setup global components
import UIImage from './components/UI/Image.vue'
Vue.component('ui-image', UIImage)

import UILoading from './components/UI/Loading.vue'
Vue.component('ui-loading', UILoading)

import UIWarning from './components/UI/Warning.vue'
Vue.component('ui-warning', UIWarning)

import UIAdvert from './components/UI/Advert.vue'
Vue.component('advert', UIAdvert)

// setup Konva
import VueKonva from 'vue-konva'
Vue.use(VueKonva)

window.Categories = window.Categories = require('./components/libs/categories2')
window.i18next = window.i18next = require('i18next')
import VueI18Next from '@panter/vue-i18next'

import XHR from 'i18next-xhr-backend'
Vue.use(VueI18Next)
i18next.use(XHR)
  .init({
    lng: store.state.locale,
    fallbackLng: 'en-US',
    ns: ['translation', 'warcraft'],
    load: 'currentOnly',
    returnEmptyString: false,
    backend: {
      loadPath: '/static/i18n/[-lng-]/[-ns-].json',
      allowMultiLoading: false,
      crossDomain: false
    },
    interpolation: {
      prefix: '[-',
      suffix: '-]'
    }
  }, () => {
    const i18n = new VueI18Next(i18next)
    window.Categories.init()
    /* eslint-disable no-unused-vars */
    window.eventHub = new Vue()
    new Vue({
      el: '#app',
      i18n,
      router,
      http,
      store,
      template: '<App/>',
      render: h => h(App),
    })
  })

