<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.import_online_circuit_dialog"
        :persistent="true"
    >
        <v-card class="importOnlineCircuitDialog">
            <v-card-title>
                Import Online Circuit
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="
                        SimulatorState.dialogBox.import_online_circuit_dialog = false
                    "
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-card-text>
                <v-text-field
                    v-model="searchQuery"
                    label="Search your projects..."
                    append-inner-icon="mdi-magnify"
                    @click:append-inner="searchProjects"
                    @keyup.enter="searchProjects"
                    hide-details
                    class="mb-4"
                ></v-text-field>

                <div v-if="loading" class="text-center my-4">
                    <v-progress-circular
                        indeterminate
                        color="primary"
                    ></v-progress-circular>
                </div>

                <v-list v-else class="projectList customScroll" lines="one">
                    <v-list-item
                        v-for="project in projects"
                        :key="project.id"
                        :value="project.id"
                    >
                        <template v-slot:prepend>
                            <v-checkbox
                                v-model="selectedProjects"
                                :value="project.id"
                                density="compact"
                                hide-details
                            ></v-checkbox>
                        </template>
                        <v-list-item-title>{{
                            project.name
                        }}</v-list-item-title>
                        <v-list-item-subtitle class="text-caption">
                            Last updated: {{ formatDate(project.updated_at) }}
                        </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item
                        v-if="projects.length === 0 && !loading"
                        class="text-center"
                    >
                        <v-list-item-title class="text-grey"
                            >No projects found</v-list-item-title
                        >
                    </v-list-item>
                </v-list>
            </v-card-text>

            <v-card-actions>
                <span
                    v-if="selectedProjects.length > 0"
                    class="text-caption ml-4 text-grey"
                >
                    {{ selectedProjects.length }} selected
                </span>
                <v-spacer></v-spacer>
                <v-btn
                    class="messageBtn"
                    @click="
                        SimulatorState.dialogBox.import_online_circuit_dialog = false
                    "
                >
                    Cancel
                </v-btn>
                <v-btn
                    class="messageBtn"
                    color="primary"
                    :disabled="selectedProjects.length === 0 || importing"
                    :loading="importing"
                    @click="importSelectedCircuits"
                >
                    Import
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { useState } from '#/store/SimulatorStore/state'
import load from '#/simulator/src/data/load'
import { useAuthStore } from '#/store/authStore'
import { ref, watch } from 'vue'

export function ImportOnlineCircuit() {
    const SimulatorState = useState()
    SimulatorState.dialogBox.import_online_circuit_dialog = true
}
</script>

<script lang="ts" setup>
const SimulatorState = useState()
const authStore = useAuthStore()

const searchQuery = ref('')
const projects = ref<any[]>([])
const selectedProjects = ref<string[]>([])
const loading = ref(false)
const importing = ref(false)

// Watch dialog state to fetch projects when opened
watch(
    () => SimulatorState.dialogBox.import_online_circuit_dialog,
    (val) => {
        if (val) {
            searchQuery.value = ''
            selectedProjects.value = []
            fetchProjects()
        }
    }
)

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
}

const fetchProjects = async () => {
    loading.value = true
    try {
        const userId = authStore.getUserId
        if (!userId) {
            // Handle not logged in - though UI should block this
            loading.value = false
            return
        }

        let url = `/api/v1/users/${userId}/projects?page[number]=1&page[size]=20`
        if (searchQuery.value) {
            url = `/api/v1/projects/search?q=${encodeURIComponent(
                searchQuery.value
            )}&page[number]=1&page[size]=20`
        }

        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch projects')

        const data = await response.json()
        projects.value = data.data.map((p: any) => ({
            id: p.id,
            name: p.attributes.name,
            updated_at: p.attributes.updated_at,
        }))
    } catch (error) {
        console.error('Error fetching projects:', error)
        projects.value = []
    } finally {
        loading.value = false
    }
}

const searchProjects = () => {
    fetchProjects()
}

const importSelectedCircuits = async () => {
    if (selectedProjects.value.length === 0) return

    importing.value = true
    try {
        const allScopes: any[] = []
        let mainProjectData: any = null

        // Fetch all selected projects
        for (const projectId of selectedProjects.value) {
            const response = await fetch(`/simulator/get_data/${projectId}`)
            if (!response.ok) {
                console.error(
                    `Failed to fetch circuit data for project ${projectId}`
                )
                continue
            }
            const data = await response.json()

            // If it's the first project, keep it as the 'base' for metadata
            if (!mainProjectData) {
                mainProjectData = data
            }

            // Collect scopes
            if (data.scopes && Array.isArray(data.scopes)) {
                allScopes.push(...data.scopes)
            }
        }

        if (mainProjectData && allScopes.length > 0) {
            // Combine scopes
            // To ensure verify unique IDs or names is a complex task.
            // For MVP, we concatenate.

            // Construct the final data object
            const combinedData = {
                ...mainProjectData,
                scopes: allScopes,
                // We might want to regenerate orderedTabs
                orderedTabs: allScopes.map((s) => s.id),
            }

            load(combinedData)
            SimulatorState.dialogBox.import_online_circuit_dialog = false
        }
    } catch (error) {
        console.error('Error importing circuits:', error)
    } finally {
        importing.value = false
    }
}
</script>

<style scoped>
.importOnlineCircuitDialog {
    height: 80vh; /* Fixed height for better list scrolling */
    width: 600px;
    margin: auto;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(5px);
    border-radius: 5px;
    border: 0.5px solid var(--br-primary) !important;
    background: var(--bg-primary-moz) !important;
    background-color: var(--bg-primary-chr) !important;
    color: white;
}

.dialogClose {
    position: absolute;
    right: 10px;
    top: 10px;
}

.projectList {
    height: 100%;
    overflow-y: auto;
    background: transparent !important;
}

/* media query */
@media screen and (max-width: 991px) {
    .importOnlineCircuitDialog {
        width: 100%;
        height: 100vh;
    }
}
</style>
