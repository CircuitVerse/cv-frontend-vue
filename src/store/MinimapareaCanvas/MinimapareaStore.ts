import { defineStore } from 'pinia'
import { actions } from './actions'
import { getters } from './getters'
import { states } from './states'

export const MinimapareaStore = defineStore({
    id: 'MinimapareaStore',
    state: () => states,
    getters,
    actions,
})
