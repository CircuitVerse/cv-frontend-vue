import { defineStore } from 'pinia'

export interface projectStoreType {
    project: {
        // id: number //use later if needed
        name: string
        nameDefined: boolean
    }
    CreateProjectHelper: {
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

export const useProjectStore = defineStore({
    id: 'projectStore',
    state: () => ({
        project: {
            // id: 0, //use later if needed
            name: 'Untitled',
            nameDefined: false,
        },
        CreateProjectHelper: {
            changeProjectName: false,
            resolvePromise: null,
            messageText: '',
            isPersistent: false,
            buttonList: [],
            inputList: [],
        },
    }),
    actions: {
        setProjectName(projectName: string): void {
            this.project.name = projectName
            this.project.nameDefined = true
        },
        setProjectNameDefined(defined: boolean = true): void {
            this.project.nameDefined = defined
        },
    },
    getters: {
        getProjectName(): string {
            return this.project.name
        },
        getProjectNameDefined(): boolean {
            return this.project.nameDefined
        },
    },
})
