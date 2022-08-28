import { dots } from '#/simulator/src/canvasApi'

export const actions = {
    setup() {
        // debugger
        this.canvas = document.getElementById('backgroundArea')
        this.canvas.width = width
        this.canvas.height = height
        this.context = this.canvas.getContext('2d')
        dots(true, false)
    },

    clear() {
        if (!this.context) return
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },
}
