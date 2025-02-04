import jQuery from 'jquery'
import ArrayHelpers from './simulator/src/arrayHelpers.js'
import type { Window as CustomWindow } from '../../types/window'

declare global {
    interface Window extends CustomWindow {}
}

window.$ = window.jQuery = jQuery

window.Array = ArrayHelpers
window.isUserLoggedIn = false
window.logixProjectId = undefined
window.restrictedElements = []
window.globalScope = undefined
window.lightMode = false
window.projectId = undefined
window.id = undefined
window.loading = false
window.embed = false
window.width = undefined
window.height = undefined
window.DPR = window.devicePixelRatio || 1
window.elementHierarchy = []
