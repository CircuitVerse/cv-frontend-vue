import { defineStore } from 'pinia'
import { actions } from './actions'
import { getters } from './getters'
import { state } from './state'

export const BackgroundareaStore = defineStore({
    id: 'backgroundareaStore',
    state: () => state,
    getters,
    // optional actions
    actions,
})
