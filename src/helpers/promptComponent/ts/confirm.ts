import { usePromptStore } from '#/store/promptStore'

export const confirmName = (selectedOption: string): void => {
    const promptStore = usePromptStore()
    // let resolvePromise = promptStore.resolvePromise
    promptStore.prompt.changeProjectName = false
    if (selectedOption === 'save') {
        promptStore.resolvePromise(promptStore.prompt.inputList[0].val)
    } else {
        promptStore.resolvePromise(undefined)
    }
}
