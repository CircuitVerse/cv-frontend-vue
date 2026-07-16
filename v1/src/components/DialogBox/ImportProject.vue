<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.import_project_dialog"
        :persistent="true"
    >
        <v-card class="importProjectDialog">
            <v-text-field>
                <p>{{ $t('simulator.nav.project.import_project') }}</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="
                        SimulatorState.dialogBox.import_project_dialog = false
                    "
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div
                    v-cloak
                    class="cloak"
                    @drop.prevent="addDropFile($event)"
                    @dragover.prevent
                >
                    <v-file-input
                        :label="$t('simulator.import.file_label')"
                        class="fileInput"
                        id="fileInput"
                        center-affix
                        :error-messages="errorMessage"
                        accept=".cv"
                        v-model="file"
                        prepend-icon="mdi-paperclip"
                    >
                        <template v-slot:selection="{ fileNames }">
                            <template
                                v-for="fileName in fileNames"
                                :key="fileName"
                            >
                                <v-chip size="x-large" class="me-2">
                                    {{ fileName }}
                                </v-chip>
                            </template>
                        </template>
                    </v-file-input>
                </div>
            </v-text-field>
            <v-card-actions>
                <v-btn
                    class="messageBtn"
                    @click="
                        SimulatorState.dialogBox.import_project_dialog = false
                    "
                >
                    {{ $t('simulator.import.cancel_btn') }}
                </v-btn>
                <v-btn class="messageBtn" @click="importDataFromFile">
                    {{ $t('simulator.import.import_btn') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { useState } from '#/store/SimulatorStore/state'

export function ImportProject() {
    const SimulatorState = useState()
    SimulatorState.dialogBox.import_project_dialog = true
}
</script>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { importCanonical } from '#/simulator/src/data/importCanonical'
import { canonicaliseProject } from '#/simulator/src/data/canonical'
import { scopeList } from '#/simulator/src/circuit'
import { useState } from '#/store/SimulatorStore/state'
import { ref, watch } from 'vue'

const SimulatorState = useState()
const { t } = useI18n()

const file = ref(Array<File>())
const errorMessage = ref('')
let fileWatchStop: (() => void) | null = null

function addDropFile(e: DragEvent) {
    if (e.dataTransfer?.files[0]) {
        const droppedFile = e.dataTransfer?.files[0]
        const fileExtension = droppedFile.name.split('.').pop()

        if (fileExtension === 'cv') {
            file.value[0] = droppedFile
            document
                .querySelector('.fileInput')
                ?.classList.remove('error--text')
            errorMessage.value = ''
        } else {
            document.querySelector('.fileInput')?.classList.add('error--text')
            errorMessage.value = t('simulator.import.format_error')
        }
    }
}

// TODO: Add JSON Schema validation for JSON files
function validateData() {
    // Validation will be implemented using JSON Schema
}

async function receivedText(fileContent: string) {
    // receive file content

    // Snapshot current circuit via canonical pipeline for rollback
    let backup: any
    try {
        backup = await canonicaliseProject(Object.values(scopeList ?? {}))
    } catch {
        document.querySelector('.fileInput')?.classList.add('error--text')
        errorMessage.value = t('simulator.import.backup_failed_error')
        return
    }

    try {
        const parsedFileData = JSON.parse(fileContent)
        const activeScope = (window as any).globalScope
        if (!activeScope) {
            document.querySelector('.fileInput')?.classList.add('error--text')
            errorMessage.value = t('simulator.import.active_scope_error')
            return
        }
        const result = await importCanonical(parsedFileData, activeScope)
        if (result.success) {
            SimulatorState.dialogBox.import_project_dialog = false
        } else {
            try {
                await importCanonical(backup, activeScope)
            } catch {
                document.querySelector('.fileInput')?.classList.add('error--text')
                errorMessage.value = t('simulator.import.restore_failed_error')
                return
            }
            document.querySelector('.fileInput')?.classList.add('error--text')
            errorMessage.value = `${t('simulator.import.import_failed')} ${result.errors.join(' • ')}`
        }
    } catch (err) {
        document.querySelector('.fileInput')?.classList.add('error--text')
        errorMessage.value = err instanceof SyntaxError
            ? t('simulator.import.parse_error')
            : `${t('simulator.import.import_error')}${err instanceof Error ? err.message : String(err)}`
    }
}

function getFileInstance(): File | null {
    const f = file.value[0] || file.value
    return f instanceof File ? f : null
}

function readFile() {
    const importFile = getFileInstance()
    if (!importFile) return
    const reader = new FileReader()
    reader.onload = function () {
        receivedText(reader.result as string) // Pass the file content to receivedText
    }
    reader.readAsText(importFile)
}

function importDataFromFile() {
    if (!getFileInstance()) {
        document.getElementById('fileInput')?.click()

        if (fileWatchStop) fileWatchStop()
        fileWatchStop = watch(
            () => file.value,
            () => {
                if (getFileInstance()) {
                    if (fileWatchStop) {
                        fileWatchStop()
                        fileWatchStop = null
                    }
                    readFile()
                }
            }
        )
    } else {
        readFile()
    }
}
</script>

<style scoped>
.importProjectDialog {
    height: auto;
    width: 600px;
    justify-content: center;
    margin: auto;
    backdrop-filter: blur(5px);
    border-radius: 5px;
    border: 0.5px solid var(--br-primary) !important;
    background: var(--bg-primary-moz) !important;
    background-color: var(--bg-primary-chr) !important;
    color: white;
}

/* media query for .messageBoxContent */
@media screen and (max-width: 991px) {
    .importProjectDialog {
        width: 100%;
    }
}

.cloak {
    width: 100%;
    padding: 1rem 1rem 0;
}
</style>

<style>
.fileInput .v-field__field {
    height: 15rem !important;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}

.fileInput .v-field__field .v-field__input {
    justify-content: center;
}

.fileInput .v-field__clearable {
    align-items: center;
    font-size: 1.5rem;
}

.error--text .v-input__details {
    margin-bottom: 0;
    padding-bottom: 0.5rem;
    background-color: #450a0a;
}
</style>

<!-- For any bugs refer to Open.js file in main repo -->
