import { dots } from '#/simulator/src/canvasApi';
import { defineStore } from 'pinia'
import { useState } from './state'

export const useActions = defineStore('simulatorStore.actions', () => {
    const state = useState()

    function showTitle(): void {
        console.log(state.title)
    }

    function setup() {
        state.canvas = document.getElementById('backgroundArea')
        state.canvas.width = width
        state.canvas.height = height
        state.context = state.canvas.getContext('2d')
        dots(true, false)
    }

    function clear() {
        if (!state.context) return
        state.context.clearRect(0, 0, state.canvas.width, state.canvas.height)
    }
    // Note you are free to define as many internal functions as you want.
    // You only expose the functions that are returned.
    return {
        showTitle,
        setup,
        clear,
    }
})
