<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.open_project_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">Open Offline</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="closeDialog"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div id="openProjectDialog" title="Open Project">
                    <label
                        v-for="(projectName, projectId) in projectList"
                        :key="projectId"
                        class="option custom-radio"
                    >
                        <input
                            type="radio"
                            name="projectId"
                            :value="projectId"
                            v-model="selectedProjectId"
                        />
                        {{ projectName }}<span></span>
                        <i
                            class="fa fa-trash deleteOfflineProject"
                            @click.stop.prevent="deleteOfflineProject(projectId)"
                        ></i>
                    </label>
                    <p v-if="Object.keys(projectList).length === 0">
                        Looks like no circuit has been saved yet. Create a new
                        one and save it!
                    </p>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn
                    v-if="Object.keys(projectList).length > 0"
                    :disabled="!selectedProjectId"
                    class="messageBtn"
                    block
                    @click="openProjectOffline()"
                >
                    open project
                </v-btn>
                <v-btn
                    v-else
                    class="messageBtn"
                    block
                    @click.stop="OpenImportProjectDialog"
                >
                    open CV file
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import load from '#/simulator/src/data/load'
import { useState } from '#/store/SimulatorStore/state'
import { confirmOption } from '../helpers/confirmComponent/ConfirmComponent.vue'
const SimulatorState = useState()
const projectList = ref<{ [key: string]: string }>({})
const selectedProjectId = ref<string | null>(null)

watch(
    () => SimulatorState.dialogBox.open_project_dialog,
    (isOpen) => {
        if (isOpen) {
            selectedProjectId.value = null
            try {
                const data = localStorage.getItem('projectList')
                const parsed = data ? JSON.parse(data) : {}
                projectList.value =
                    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                        ? parsed
                        : {}
            } catch {
                projectList.value = {}
            }
        }
    }
)

function closeDialog() {
    selectedProjectId.value = null
    SimulatorState.dialogBox.open_project_dialog = false
}

async function deleteOfflineProject(id: string) {
    const projectName = projectList.value[id] || 'this project'
    if (!(await confirmOption(`Are you sure you want to delete "${projectName}"?`))) {
        return
    }
    localStorage.removeItem(id)
    const data = localStorage.getItem('projectList')
    let temp: { [key: string]: string } = {}
    try {
        const parsed = data ? JSON.parse(data) : {}
        temp =
            parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                ? parsed
                : {}
    } catch {
        temp = {}
    }
    delete temp[id]
    projectList.value = temp
    localStorage.setItem('projectList', JSON.stringify(temp))
    if (selectedProjectId.value === id) {
        selectedProjectId.value = null
    }
}

function openProjectOffline() {
    if (!selectedProjectId.value) return
    const projectData = localStorage.getItem(selectedProjectId.value)
    if (projectData) {
        try {
            load(JSON.parse(projectData))
            window.projectId = selectedProjectId.value
        } catch (e) {
            console.error('Failed to load project:', e)
        }
    }
    closeDialog()
}

function OpenImportProjectDialog() {
    closeDialog()
    SimulatorState.dialogBox.import_project_dialog = true
}
</script>
