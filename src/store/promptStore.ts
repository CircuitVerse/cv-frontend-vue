import { defineStore } from 'pinia'

interface promptStoreType {
    resolvePromise: Function
    // resolvePromise: (value?: string | undefined) => void
    prompt: {
        activate: boolean
        messageText: string
        isPersistent: boolean
        buttonList: Array<{
            text: string
            emitOption: string
        }>
        inputList: Array<{
            text: string
            val: string
            placeholder: string
            id: string
            class: string
            style: string
            type: string
        }>
    }
    DeleteCircuit: {
        activate: boolean
        messageText: string
        isPersistent: boolean
        buttonList: Array<{
            text: string
            emitOption: string
        }>
        // inputList: Array<{
        //     text: string
        //     val: string
        //     placeholder: string
        //     id: string
        //     class: string
        //     style: string
        //     type: string
        // }>
        circuitItem: object
    }
}

export const usePromptStore = defineStore({
    id: 'promptStore',
    state: (): promptStoreType => ({
        resolvePromise: (): any => {},
        prompt: {
            activate: false,
            messageText: '',
            isPersistent: false,
            buttonList: [],
            inputList: [],
        },
        DeleteCircuit: {
            activate: false,
            messageText: '',
            isPersistent: false,
            buttonList: [],
            // inputList: [],
            circuitItem: {},
        },
    }),
    actions: {
        // resolvePromise(): any {},
    },
})
