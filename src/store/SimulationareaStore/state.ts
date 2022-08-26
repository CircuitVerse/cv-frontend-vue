import { defineStore } from 'pinia'

// use camel case variable names
export interface State {}

export const useState = defineStore({
    id: 'simulationareaStore.state',

    state: (): State => {
        return {
            //... add states
        }
    },
})
