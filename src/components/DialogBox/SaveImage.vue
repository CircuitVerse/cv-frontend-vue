<template>
    <v-dialog v-model="dialogState.saveimage_dialog" :persistent="false">
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">Render Image</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="dialogState.saveimage_dialog = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div id="saveImageDialog" class="noSelect" title="Render Image">
                    <div class="download-dialog-section-1">
                        <label
                            v-for="imageType in imgTypeList"
                            :key="imageType"
                            class="option custom-radio inline"
                        >
                            <input
                                type="radio"
                                name="imgType"
                                :value="imageType.toLowerCase()"
                                v-model="selectedImageType"
                                @change="checkImgType(imageType)"
                            />
                            {{ imageType }}
                            <span></span>
                        </label>
                    </div>
                    <div class="download-dialog-section-2">
                        <div
                            v-if="toShow"
                            class="option inline btn-group btn-group-toggle"
                            style="border: none"
                            data-toggle="buttons"
                        >
                            <div
                                id="radio-full"
                                class="btn"
                                :class="fullImg ? 'active-btn' : 'inactive-btn'"
                                role="button"
                                @click="updateView(true)"
                            >
                                <input type="radio" name="view" value="full" />
                                Full Circuit View
                            </div>
                            <div
                                id="radio-current"
                                class="btn"
                                :class="!fullImg ? 'active-btn' : 'inactive-btn'"
                                role="button"
                                @click="updateView(false)"
                            >
                                <input
                                    type="radio"
                                    name="view"
                                    value="current"
                                />Current View
                            </div>
                        </div>
                        <div v-if="toShow1" class="download-dialog-section-2_2">
                            <label class="cb-checkbox">
                                <input
                                    type="checkbox"
                                    name="transparent"
                                    value="transparent"
                                    v-model="transparent"
                                />
                                Transparent Background
                            </label>
                        </div>
                    </div>
                    <div v-if="toShow" class="download-dialog-section-3">
                        <span>Resolution:</span>
                        <label class="option custom-radio inline"
                            ><input
                                type="radio"
                                name="resolution"
                                value="1"

                                v-model="resolution"
                            />1x<span></span
                        ></label>
                        <label class="option custom-radio inline"
                            ><input
                                type="radio"
                                name="resolution"
                                value="2"
                                v-model="resolution"
                            />2x<span></span
                        ></label>
                        <label class="option custom-radio inline"
                            ><input
                                type="radio"
                                name="resolution"
                                value="4"
                                v-model="resolution"
                            />4x<span></span
                        ></label>
                    </div>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn class="messageBtn" block @click="renderCircuit">
                    Render Circuit Image
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { generateImage } from '#/simulator/src/data/save'
import { useState } from '#/store/SimulatorStore/state'
import { ref, computed, Ref } from '@vue/runtime-core'

const SimulatorState = useState()

const dialogState = computed(() => SimulatorState.dialogBox)

const imgTypeList: Ref<string[]> = ref(['PNG', 'JPEG', 'SVG', 'BMP', 'GIF', 'TIFF'])
const toShow: Ref<boolean> = ref(true)
const toShow1: Ref<boolean> = ref(true)
const fullImg: Ref<boolean> = ref(false)
const resolution: Ref<number> = ref(1)
const transparent: Ref<boolean> = ref(false)
const selectedImageType: Ref<string> = ref('png')

function checkImgType(imageType: string) {
    const isDisabled = imageType.toLowerCase() === 'svg'
    toShow.value = !isDisabled
    toShow1.value = imageType.toLowerCase() === 'png'

    if (isDisabled) {
        resolution.value = 1
        fullImg.value = true
    } else if (imageType.toLowerCase() !== 'png') {
        transparent.value = false
    }
}

function updateView(isFullImg: boolean) {
    fullImg.value = isFullImg
}

function renderCircuit() {
    SimulatorState.dialogBox.saveimage_dialog = false
    generateImage(
        selectedImageType.value,
        fullImg.value ? 'full' : 'current',
        transparent.value,
        resolution.value
    )
}
</script>

<style scoped>
.download-dialog-section-2 .btn {
    color: var(--text-lite);
}
.download-dialog-section-2 .btn:hover {
    color: var(--text-lite);
}

.download-dialog-section-2 .option {
    background: transparent;
}

#saveImageDialog {
    border-radius: 2px;
    padding: 13px;
    margin: 0;
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    min-height: 188px !important;
}

.download-dialog-section-2 .option {
    padding: 0;
}

.download-dialog-section-1 > label {
    height: 30px;
    width: 85px;
}

.download-dialog-section-2 {
    background: transparent;
    width: 100%;
    display: inline-flex;
    justify-content: space-around;
}

.btn-group-toggle {
    background-color: transparent;
    overflow: hidden;
}
.download-dialog-section-2 .active-btn {
    box-shadow: none;
}

.download-dialog-section-2 .btn input[type='radio']:disabled {
    background: red !important;
    color: red !important;
}

.download-dialog-section-2_2 {
    display: flex;
    align-items: center;
    justify-content: center;
}

.download-dialog-section-3 {
    border-radius: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    width: 320px;
    position: inherit;
}

.download-dialog-section-3 > label {
    width: 60px;
    height: 25px;
    margin-bottom: 0;
}
</style>
