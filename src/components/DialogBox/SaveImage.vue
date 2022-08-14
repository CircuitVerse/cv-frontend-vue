<template>
    <v-dialog
        v-model="SimulatorState.dialogBox.saveimage_dialog"
        :persistent="false"
    >
        <v-card class="messageBoxContent">
            <v-card-text>
                <p class="dialogHeader">Download Image</p>
                <v-btn
                    size="x-small"
                    icon
                    class="dialogClose"
                    @click="SimulatorState.dialogBox.saveimage_dialog = false"
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
                                checked="checked"
                                @click="trying"
                            />
                            {{ imageType }}
                            <span></span>
                        </label>
                    </div>
                    <div class="download-dialog-section-2">
                        <div
                            v-if="toShow == true"
                            class="option inline btn-group btn-group-toggle"
                            style="border: none"
                            data-toggle="buttons"
                        >
                            <div id="radio-full" class="btn" role="button">
                                <input type="radio" name="view" value="full" />
                                Full Circuit View
                            </div>
                            <div
                                id="radio-current"
                                class="btn active-btn"
                                role="button"
                            >
                                <input
                                    type="radio"
                                    name="view"
                                    value="current"
                                    checked="checked"
                                />Current View
                            </div>
                        </div>
                        <div
                            v-if="toShow1 == true"
                            class="download-dialog-section-2_2"
                        >
                            <label class="cb-checkbox">
                                <input
                                    type="checkbox"
                                    name="transparent"
                                    value="transparent"
                                />
                                Transparent Background
                            </label>
                        </div>
                    </div>
                    <div
                        v-if="toShow == true"
                        class="download-dialog-section-3"
                    >
                        <span>Resolution:</span>
                        <label class="option custom-radio inline"
                            ><input
                                type="radio"
                                name="resolution"
                                value="1"
                                checked="checked" />1x<span></span
                        ></label>
                        <label class="option custom-radio inline"
                            ><input
                                type="radio"
                                name="resolution"
                                value="2" />2x<span></span
                        ></label>
                        <label class="option custom-radio inline"
                            ><input
                                type="radio"
                                name="resolution"
                                value="4" />4x<span></span
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
import { onMounted, ref } from '@vue/runtime-core'
const SimulatorState = useState()

const imgTypeList = ref([''])
imgTypeList.value = ['PNG', 'JPEG', 'SVG', 'BMP', 'GIF', 'TIFF']

onMounted(() => {
    SimulatorState.dialogBox.saveimage_dialog = false
})

/* Fix below part */
$('input[name=imgType]').change(() => {})

function renderCircuit() {
    SimulatorState.dialogBox.saveimage_dialog = false
    // console.log(
    //     $('input[name=imgType]:checked').val(),
    //     $('input[name=view]:checked').val(),
    //     $('input[name=transparent]:checked').val(),
    //     $('input[name=resolution]:checked').val()
    // )
    generateImage(
        $('input[name=imgType]:checked').val(),
        $('input[name=view]:checked').val(),
        $('input[name=transparent]:checked').val(),
        $('input[name=resolution]:checked').val()
    )
}
const toShow = ref(true)
const toShow1 = ref(true)

function trying() {
    $('input[name=resolution]').prop('disabled', false)
    $('input[name=transparent]').prop('disabled', false)
    const imgType = $('input[name=imgType]:checked').val()
    console.log('image type : ', imgType)
    imgType == 'svg' ? (toShow.value = false) : (toShow.value = true)
    if (imgType === 'png') {
        toShow1.value = true
    } else {
        toShow1.value = false
    }
    if (imgType === 'svg') {
        $('input[name=resolution][value=1]').trigger('click')
        $('input[name=view][value="full"]').trigger('click')
        $('input[name=resolution]').prop('disabled', true)
        $('input[name=view]').prop('disabled', true)
    } else if (imgType !== 'png') {
        $('input[name=transparent]').attr('checked', false)
        $('input[name=transparent]').prop('disabled', true)
        $('input[name=view]').prop('disabled', false)
        $('.cb-inner').addClass('disable')
    } else {
        $('input[name=view]').prop('disabled', false)
        $('.cb-inner').removeClass('disable')
    }
}
</script>
