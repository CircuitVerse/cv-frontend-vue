import { defineStore } from 'pinia'

interface promptStoreType {
    resolvePromise: Function
    prompt: {
        changeProjectName: boolean
        resolvePromise: null | ((value?: string) => void)
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
}

export const usePromptStore = defineStore({
    id: 'promptStore',
    state: (): promptStoreType => ({
        resolvePromise: (): any => {},
        prompt: {
            changeProjectName: false,
            resolvePromise: null,
            messageText: '',
            isPersistent: false,
            buttonList: [],
            inputList: [],
        },
    }),
    actions: {
        // resolvePromise(): any {},
    },
})
