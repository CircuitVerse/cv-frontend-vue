import { extractStore } from '../extractStore'
import { defineStore } from 'pinia'
import { useActions } from './actions'
import { useGetters } from './getters'
import { useState } from './state'

export const SimulationareaStore = defineStore('simulationareaStore', () => {
    return {
        ...extractStore(useState()),
        ...extractStore(useGetters()),
        ...extractStore(useActions()),
    }
})
