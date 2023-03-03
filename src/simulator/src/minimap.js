var lastMiniMapShown
export function updatelastMinimapShown() {
    lastMiniMapShown = new Date().getTime()
}
export function removeMiniMap() {
    if (lightMode) return

    if (
        simulationArea.lastSelected == globalScope.root &&
        simulationArea.mouseDown
    )
        return
    if (lastMiniMapShown + 2000 >= new Date().getTime()) {
        setTimeout(
            removeMiniMap,
            lastMiniMapShown + 2000 - new Date().getTime()
        )
        return
    }
    $('#miniMap').fadeOut('fast')
}
