declare global {
    var $: typeof import('jquery')
    var jQuery: typeof import('jquery')
    var isUserLoggedIn: boolean
    var logixProjectId: any
    var restrictedElements: any[]
    var globalScope: any
    var lightMode: boolean
    var projectId: any
    var id: any
    var loading: boolean
    var embed: boolean
    var width: any
    var height: any
    var DPR: number

    interface Window {
        $: typeof import('jquery')
        jQuery: typeof import('jquery')
        isUserLoggedIn: boolean
        logixProjectId: any
        restrictedElements: any[]
        globalScope: any
        lightMode: boolean
        projectId: any
        id: any
        loading: boolean
        embed: boolean
        width: any
        height: any
        DPR: number
    }
}

export {}
