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
                            @click="deleteOfflineProject(projectId)"
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
import { ref, watchEffect } from 'vue';
import load from '#/simulator/src/data/load'
import { useState } from '#/store/SimulatorStore/state'
const SimulatorState = useState()
const projectList = ref<{ [key: string]: string }>({})
const selectedProjectId = ref<string | null>(null)

watchEffect(() => {
    if (SimulatorState.dialogBox.open_project_dialog) {
        const data = localStorage.getItem('projectList');
        projectList.value = data ? JSON.parse(data) : {};
    }
});
function closeDialog() {
    SimulatorState.dialogBox.open_project_dialog = false;
}

function deleteOfflineProject(id: string) {
    localStorage.removeItem(id)
    const data = localStorage.getItem('projectList')
    const temp = data ? JSON.parse(data) : {}
    delete temp[id]
    projectList.value = temp
    localStorage.setItem('projectList', JSON.stringify(temp))
}

function openProjectOffline() {
    closeDialog();  
    if (!selectedProjectId.value) return
    const projectData = localStorage.getItem(selectedProjectId.value)
    if (projectData) {
        load(JSON.parse(projectData))
        window.projectId = selectedProjectId.value
    }
}

function OpenImportProjectDialog() {
    closeDialog();
    SimulatorState.dialogBox.import_project_dialog = true
}
</script>
