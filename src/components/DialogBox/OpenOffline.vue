<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.open_project_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">{{ $t('simulator.nav.project.open_offline') }}</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="
                        SimulatorState.dialogBox.open_project_dialog = false
                    "
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div id="openProjectDialog" :title="$t('simulator.panel_header.open_project')">
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
                            @click="deleteOfflineProject(projectId.toString())"
                        ></i>
                    </label>
                    <p v-if="JSON.stringify(projectList) == '{}'">
                        {{ $t('simulator.open_offline.no_circuits') }}
                    </p>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn
                    v-if="JSON.stringify(projectList) != '{}'"
                    class="messageBtn"
                    block
                    @click="openProjectOffline()"
                >
                    {{ $t('simulator.open_offline.open_project') }}
                </v-btn>
                <v-btn
                    v-else
                    class="messageBtn"
                    block
                    @click.stop="OpenImportProjectDialog"
                >
                    {{ $t('simulator.open_offline.open_cv_file') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import load from '#/simulator/src/data/load'
import { useState } from '#/store/SimulatorStore/state'
import { onMounted, onUpdated, ref } from '@vue/runtime-core'
const SimulatorState = useState()
const projectList = ref<{ [key: string]: string }>({})
const selectedProjectId = ref<string | null>(null)

onMounted(() => {
    SimulatorState.dialogBox.open_project_dialog = false
})

onUpdated(() => {
    const data = localStorage.getItem('projectList')
    projectList.value = data ? JSON.parse(data) : {}
})

function deleteOfflineProject(id: string) {
    localStorage.removeItem(id)
    const data = localStorage.getItem('projectList')
    const temp = data ? JSON.parse(data) : {}
    delete temp[id]
    projectList.value = temp
    localStorage.setItem('projectList', JSON.stringify(temp))
}

function openProjectOffline() {
    SimulatorState.dialogBox.open_project_dialog = false
    if (!selectedProjectId.value) return
    const projectData = localStorage.getItem(selectedProjectId.value)
    if (projectData) {
        load(JSON.parse(projectData))
        window.projectId = selectedProjectId.value
    }
}

function OpenImportProjectDialog() {
    SimulatorState.dialogBox.open_project_dialog = false
    SimulatorState.dialogBox.import_project_dialog = true
}
</script>
