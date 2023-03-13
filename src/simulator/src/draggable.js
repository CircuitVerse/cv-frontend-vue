export default function draggableListeners() {
    const wrapper = document.querySelectorAll('.draggable-panel')
    wrapper.forEach((panel) => {
        const header = panel.querySelector('.panel-header')
        function onDrag({ movementX, movementY }) {
            let getStyle = window.getComputedStyle(panel)
            let top = parseInt(getStyle.top)
            let left = parseInt(getStyle.left)
            panel.style.left = `${left + movementX}px`
            panel.style.top = `${top + movementY}px`
        }
        header.addEventListener('mousedown', () => {
            header.addEventListener('mousemove', onDrag)
        })
        header.addEventListener('mouseup', () => {
            header.removeEventListener('mousemove', onDrag)
        })
    })
}
