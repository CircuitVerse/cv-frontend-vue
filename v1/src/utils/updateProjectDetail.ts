import { usePromptStore } from '#/store/promptStore'
import { useProjectStore } from '#/store/projectStore'

interface ProjectData {
    project: {
        id: number
        name: string
    }
}

export function openUpdateProjectDetail(data: ProjectData): void {
    const promptStore = usePromptStore()
    const projectStore = useProjectStore()
    promptStore.UpdateProjectDetail.activate = true
    projectStore.setProjectName(data.project.name)
    promptStore.setProjectName(data.project.name)
    promptStore.setProjectId(data.project.id)
}
