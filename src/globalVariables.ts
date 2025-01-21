declare const window: Window

import jQuery from 'jquery'
window.$ = window.jQuery = jQuery
// This is not needed
// globalThis.$ = jQuery
// globalThis.jQuery = jQuery

window.isUserLoggedIn = false
window.logixProjectId = undefined

window.restrictedElements = []
window.globalScope = undefined
window.lightMode = false // To be deprecated
window.projectId = undefined
window.id = undefined
window.loading = false // Flag - all assets are loaded

window.embed = false

window.width = undefined
window.height = undefined
window.DPR = window.devicePixelRatio || 1 // devicePixelRatio, 2 for retina displays, 1 for low resolution displays

// Copying the global variables to globalThis
globalThis.isUserLoggedIn = window.isUserLoggedIn
globalThis.logixProjectId = window.logixProjectId
globalThis.restrictedElements = window.restrictedElements
globalThis.globalScope = window.globalScope
globalThis.lightMode = window.lightMode
globalThis.projectId = window.projectId
globalThis.id = window.id
globalThis.loading = window.loading
globalThis.embed = window.embed
globalThis.width = window.width
globalThis.height = window.height
globalThis.DPR = window.DPR
