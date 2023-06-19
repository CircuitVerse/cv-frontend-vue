// import { usepromptStore } from '#/store/promptStore'
import { usePromptStore } from '#/store/promptStore'

// export let resolvePromise: (value?: string) => void // will be used to store the resolve function of the Promise

export const provideProjectName = async (): Promise<string | undefined> => {
    const promptStore = usePromptStore()
    // const resolvePromise = promptStore.resolvePromise
    promptStore.prompt.changeProjectName = true
    promptStore.prompt.isPersistent = true
    // promptStore.prompt.messageText =
    //     'Provide a name for the project'
    promptStore.prompt.buttonList = [
        {
            text: 'Save',
            emitOption: 'save',
        },
        {
            text: 'Cancel',
            emitOption: 'cancel',
        },
    ]
    promptStore.prompt.inputList = [
        {
            text: 'Enter Project Name:',
            val: '',
            placeholder: 'Untitled',
            id: 'projectName',
            class: 'inputField',
            style: '',
            type: 'text',
        },
    ]

    const projectName = await new Promise<string | undefined>((resolve) => {
        promptStore.resolvePromise = resolve
    })

    return projectName
}
