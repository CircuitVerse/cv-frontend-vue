import { usePromptStore } from '#/store/promptStore'

function clearMessageBoxFields(): void {
    const promptStore = usePromptStore()
    promptStore.confirm.activate = false
    promptStore.confirm.isPersistent = false
    promptStore.confirm.messageText = ''
    promptStore.confirm.buttonList = []
}

const promptActivator = async (
    messageText: string,
    buttonList: Array<{ text: string; emitOption: string | boolean }>
): Promise<string | boolean> => {
    clearMessageBoxFields()
    const promptStore = usePromptStore()
    promptStore.confirm.activate = true
    promptStore.confirm.isPersistent = true
    promptStore.confirm.messageText = messageText
    promptStore.confirm.buttonList = buttonList

    return new Promise<string | boolean>((resolve) => {
        promptStore.resolvePromise = resolve
    })
}

export const confirmOption = async (
    messageText: string = 'confirm'
): Promise<string | boolean> => {
    const buttonList: Array<{ text: string; emitOption: boolean }> = [
        { text: 'Cancel', emitOption: false },
        { text: 'Ok', emitOption: true },
    ]
    return promptActivator(messageText, buttonList)
}

export const confirmMultiOption = async (
    messageText: string = 'confirm',
    buttonArray: Array<string>
): Promise<string | boolean> => {
    const buttonList = buttonArray.map((element) => ({
        text: element,
        emitOption: element,
    }))
    return promptActivator(messageText, buttonList)
}

export const confirmSingleOption = async (
    messageText: string = 'confirm'
): Promise<string | boolean> => {
    const buttonList: Array<{ text: string; emitOption: boolean }> = [
        { text: 'Ok', emitOption: true },
    ]
    return promptActivator(messageText, buttonList)
}
