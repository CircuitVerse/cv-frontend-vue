import { defineStore } from 'pinia'

export interface State {
    title: string
    circuit_list: []
}

export const useState = defineStore({
    id: 'simulatorStore.state',

    state: (): State => {
        return {
            title: 'Welcome to CircuitVerse Simulator',
            circuit_list: [],
        }
    },
})
