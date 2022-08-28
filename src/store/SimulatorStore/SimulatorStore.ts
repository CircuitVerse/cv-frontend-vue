import { extractStore } from '../extractStore'
import { defineStore } from 'pinia'
import { useActions } from './actions'
import { useGetters } from './getters'
import { useState } from './states'

export const SimulatorStore = defineStore('simulatorStore', () => {
    return {
        ...extractStore(useState()),
        ...extractStore(useGetters()),
        ...extractStore(useActions()),
    }
})
