/* Type-only global augmentations for window properties used across the app.
   This file adds declarations only — no runtime changes. */
export {}

declare global {
  interface Window {
    $?: any
    jQuery?: any
    isUserLoggedIn?: boolean
    logixProjectId?: number | string | undefined
    restrictedElements?: any[]
    globalScope?: any
    lightMode?: boolean
    projectId?: number | string | undefined
    id?: number | string | undefined
    loading?: boolean
    embed?: boolean
    width?: number | undefined
    height?: number | undefined
    DPR?: number
}
}


