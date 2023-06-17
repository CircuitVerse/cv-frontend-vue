import { useProjectStore, projectStoreType } from '#/store/projectStore'

let resolvePromise: (value?: string) => void // will be used to store the resolve function of the Promise

export const confirmName = (selectedOption: string): void => {
    const projectStore: projectStoreType = useProjectStore()
    projectStore.CreateProjectHelper.changeProjectName = false
    if (selectedOption === 'save') {
        resolvePromise(projectStore.CreateProjectHelper.inputList[0].val)
    } else {
        resolvePromise(undefined)
    }
}

export const provideProjectName = async (): Promise<string | undefined> => {
    const projectStore: projectStoreType = useProjectStore()
    projectStore.CreateProjectHelper.changeProjectName = true
    projectStore.CreateProjectHelper.isPersistent = true
    projectStore.CreateProjectHelper.messageText =
        'Provide a name for the project'
    projectStore.CreateProjectHelper.buttonList = [
        {
            text: 'Save',
            emitOption: 'save',
        },
        {
            text: 'Cancel',
            emitOption: 'cancel',
        },
    ]
    projectStore.CreateProjectHelper.inputList = [
        {
            text: 'Project Name:',
            val: '',
            placeholder: 'Untitled',
            id: 'projectName',
            class: 'inputField',
            style: '',
            type: 'text',
        },
    ]

    const projectName = await new Promise<string | undefined>((resolve) => {
        resolvePromise = resolve
    })

    return projectName
}
