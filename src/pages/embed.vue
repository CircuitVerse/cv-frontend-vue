<template>
    <div style="height: 100%; width: 100%">
        <div
            id="simulation"
            class="simulation"
            style="height: 100%; width: 100%"
        >
            <div
                class="noSelect pointerCursor"
                style="position: absolute; left: 0; top: 0; z-index: 4"
                v-if="!isEmbed"
            >
                <TabsBar />
            </div>

            <div id="code-window" class="code-window-embed">
                <textarea id="codeTextArea"></textarea>
            </div>

            <div id="MessageDiv"></div>

            <div
                id="canvasArea"
                class="canvasArea"
                style="height: 100%; width: 100%"
            >
                <canvas
                    id="backgroundArea"
                    style="position: absolute; left: 0; top: 0; z-index: 0"
                ></canvas>
                <canvas
                    id="simulationArea"
                    style="
                        position: absolute;
                        left: 0;
                        top: 0;
                        z-index: 1;
                        width: 100%;
                        height: 100%;
                    "
                ></canvas>
            </div>

            <div id="elementName"></div>

            <div
                v-if="(!isEmbed && hasZoomInOut) || (isEmbed && route.query.zoom_in_out === 'true')"
                id="zoom-in-out-embed"
                class="zoom-wrapper"
            >
                <div class="noSelect">
                    <button
                        id="zoom-in-embed"
                        type="button"
                        style="font-size: 25px"
                        @click="zoomInEmbed"
                    >
                        <span
                            class="fa fa-search-plus"
                            aria-hidden="true"
                            title="Zoom In"
                        ></span>
                    </button>
                </div>
                <div class="noSelect">
                    <button
                        id="zoom-out-embed"
                        type="button"
                        style="font-size: 25px"
                        @click="zoomOutEmbed"
                    >
                        <span
                            class="fa fa-search-minus"
                            aria-hidden="true"
                            title="Zoom Out"
                        ></span>
                    </button>
                </div>
            </div>

            <div
                v-if="!isEmbed"
                style="position: absolute; right: 10px; top: 25px; z-index: 100"
                class="clockPropertyHeader noSelect"
            >
                <div id="clockProperty">
                    <input
                        v-if="hasFullscreen"
                        type="button"
                        class="objectPropertyAttributeEmbed custom-btn--secondary embed-fullscreen-btn"
                        name="toggleFullScreen"
                        value="Full Screen"
                        @click="toggleFullScreen"
                    />
                    <div v-if="hasClockTime">
                        Time:
                        <input
                            v-model="timePeriod"
                            class="objectPropertyAttributeEmbed embed-time-input"
                            min="50"
                            type="number"
                            style="width: 48px"
                            step="10"
                            name="changeClockTime"
                        />
                    </div>
                    <div v-if="hasClockTime">
                        Clock:
                        <label class="switch">
                            <input
                                v-model="clockEnabled"
                                type="checkbox"
                                class="objectPropertyAttributeEmbedChecked"
                                name="changeClockEnable"
                            />
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <div
                class="sk-folding-cube loadingIcon"
                style="
                    display: inline-block;
                    position: absolute;
                    right: 50%;
                    bottom: 50%;
                    z-index: 100;
                "
            >
                <div class="sk-cube1 sk-cube"></div>
                <div class="sk-cube2 sk-cube"></div>
                <div class="sk-cube4 sk-cube"></div>
                <div class="sk-cube3 sk-cube"></div>
            </div>

            <div
               v-if="isEmbed ? hasDisplayTitle : true"
                id="bottom_right_circuit_heading"
            >
                project Name
            </div>

            <div id="bottom_right_watermark">
                <a
                    style="
                        text-decoration: none;
                        position: fixed;
                        bottom: 0px;
                        right: 25px;
                        padding: 8px;
                        font-family: Verdana;
                        font-size: 12px;
                        color: grey;
                        z-index: 2;
                    "
                    href="https://circuitverse.org/"
                    target="_blank"
                >
                    Made With CircuitVerse
                </a>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeMount, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { simulationArea, changeClockTime } from '#/simulator/src/simulationArea'
import {
    scheduleUpdate,
    updateCanvasSet,
    wireToBeCheckedSet,
    gridUpdateSet,
} from '#/simulator/src/engine'
import { prevPropertyObjSet, prevPropertyObjGet } from '#/simulator/src/ux'
import { circuitProperty, scopeList } from '#/simulator/src/circuit'
import { ZoomIn, ZoomOut } from '#/simulator/src/listeners'
import { setup } from '#/simulator/src/setup'
import startListeners from '#/simulator/src/embedListeners'
import TabsBar from '#/components/TabsBar/TabsBar.vue'
import { updateThemeForStyle } from '#/simulator/src/themer/themer'
import { THEME, ThemeType } from '#/assets/constants/theme'

const route = useRoute()
const timePeriod = ref(simulationArea.timePeriod)
const clockEnabled = ref(simulationArea.clockEnabled)

const isEmbed = computed(() => route.query.embed === 'true')

const theme = computed(() => route.query.theme)
const hasDisplayTitle = computed(() =>
    route.query.display_title ? route.query.display_title === 'true' : false
)
const hasClockTime = computed(() =>
    route.query.clock_time ? route.query.clock_time === 'true' : true
)
const hasFullscreen = computed(() =>
    route.query.fullscreen ? route.query.fullscreen === 'true' : true
)
const hasZoomInOut = computed(() =>
    route.query.zoom_in_out ? route.query.zoom_in_out === 'true' : true
)

watch(timePeriod, (val) => {
    scheduleUpdate()
    updateCanvasSet(true)
    wireToBeCheckedSet(1)
    if (
        simulationArea.lastSelected &&
        simulationArea.lastSelected['changeClockTime']
    ) {
        prevPropertyObjSet('changeClockTime') || prevPropertyObjGet()
    } else {
        if (val < 50) val = 50
        changeClockTime(val)
    }
})

watch(clockEnabled, (val) => {
    scheduleUpdate()
    updateCanvasSet(true)
    wireToBeCheckedSet(1)
    if (
        simulationArea.lastSelected &&
        simulationArea.lastSelected['changeClockEnable']
    ) {
        prevPropertyObjSet('changeClockEnable') || prevPropertyObjGet()
    } else {
        circuitProperty.changeClockEnable(val)
    }
})

onBeforeMount(() => {
    window.embed = true
    window.logixProjectId = route.params.projectId
})

onMounted(() => {
   const themeValue = theme?.value as string | undefined
if (themeValue && THEME[themeValue as keyof ThemeType]) {
    updateThemeForStyle(THEME[themeValue as keyof ThemeType])
}
})

onMounted(() => {
    startListeners()
    setup()
})

function zoomInEmbed() {
    ZoomIn()
}

function zoomOutEmbed() {
    ZoomOut()
}

function exitHandler() {
    setTimeout(() => {
        Object.keys(scopeList).forEach((id) => {
            scopeList[id].centerFocus(true)
        })
        gridUpdateSet(true)
        scheduleUpdate()
    }, 100)
}

function GoInFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen()
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen()
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
    }
}

function GoOutFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen()
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
    }
}

function getfullscreenelement() {
    return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    )
}

function toggleFullScreen() {
    if (!getfullscreenelement()) {
        GoInFullscreen(document.documentElement)
    } else {
        GoOutFullscreen()
    }
}

if (document.addEventListener) {
    document.addEventListener('webkitfullscreenchange', exitHandler, false)
    document.addEventListener('mozfullscreenchange', exitHandler, false)
    document.addEventListener('fullscreenchange', exitHandler, false)
    document.addEventListener('MSFullscreenChange', exitHandler, false)
}
</script>

<style>
#app {
    height: 100%;
}

.embed-time-input {
    background-color: var(--bg-circuit);
    color: var(--text);
}
</style>
