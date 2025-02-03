import jQuery from 'jquery'

type Window = {
    $: typeof jQuery
    jQuery: typeof jQuery
    isUserLoggedIn: boolean
    logixProjectId?: string | string[]
    restrictedElements: any[]
    globalScope: any
    lightMode: boolean
    projectId?: string
    id?: string
    loading: boolean
    embed: boolean
    width?: number
    height?: number
    DPR: number
    elementHierarchy: any[]
}
