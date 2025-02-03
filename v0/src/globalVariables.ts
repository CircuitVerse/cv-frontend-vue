/*global ...*/
/*eslint no-undef: "error"*/

import jQuery from 'jquery'
import Array from './simulator/src/arrayHelpers.js'

declare global {
    interface Window {
        restrictedElements: any[]
        jQuery: typeof jQuery
        $: typeof jQuery
        globalScope: any
        lightMode: boolean
        projectId: any
        id: any
        loading: boolean
        embed: boolean
        width: any
        height: any
        DPR: number
        isUserLoggedIn: boolean
        logixProjectId: any
        elementHierarchy: any[]
    }
}

window.$ = window.jQuery = jQuery

window.Array = Array
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
