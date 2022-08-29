import { defineStore } from 'pinia'
import { actions } from './actions'
import { getters } from './getters'
import { states } from './states'

export const SimulationareaStore = defineStore({
    id: 'SimulationareaStore',
    state: () => states,
    getters,
    actions,
})
