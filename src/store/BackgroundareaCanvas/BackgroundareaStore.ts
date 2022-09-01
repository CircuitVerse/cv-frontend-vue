import { defineStore } from 'pinia'
import { actions } from './actions'
import { getters } from './getters'
import { states } from './states'

export const BackgroundareaStore = defineStore({
    id: 'backgroundareaStore',
    state: () => states,
    getters,
    actions,
})
