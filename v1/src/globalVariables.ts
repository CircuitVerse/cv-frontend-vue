import jQuery from 'jquery'
import Array from './simulator/src/arrayHelpers.js'
import type { Window as CustomWindow } from '../../types/window'

declare global {
    interface Window extends CustomWindow {}
}

window.$ = window.jQuery = jQuery

window.Array = Array
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

window.elementHierarchy = []
