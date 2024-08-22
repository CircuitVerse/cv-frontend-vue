<template>
  <v-dialog
      v-if="!inLayoutMode"
      v-model="simulatorMobileStore.showPropertiesPanel"
      :persistent="false"
  >
    <div id="moduleProperty-inner" class="messageBoxContent">
        <div id="moduleProperty-header">{{ panelBodyHeader }}</div>
        <ProjectProperty v-if="panelType == 1" />
        <ElementProperty
            v-else-if="panelType == 2"
            :key="objProperties"
            :obj="objProperties"
        />
        <SubcircuitProperty
            v-else-if="panelType == 3"
            :key="objProperties"
            :obj="objProperties"
        />
        <HelpButton :key="objProperties" :obj="objProperties" />
    </div>
  </v-dialog>

  <v-dialog
      v-else
      v-model="simulatorMobileStore.showPropertiesPanel"
      :persistent="false"
  >
    <div id="layout-body" class="layout-body panel-body messageBoxContent">
        <div class="">
            <v-btn
                id="decreaseLayoutWidth"
                title="Decrease Width"
                variant="text"
                icon="mdi-minus"
                @click.prevent="layoutFunction('decreaseLayoutWidth')"
            />
            <span>Width</span>
            <v-btn
                id="increaseLayoutWidth"
                title="Increase Width"
                variant="text"
                icon="mdi-plus"
                @click.prevent="layoutFunction('increaseLayoutWidth')"
            />
        </div>
        <div class="">
            <v-btn
                id="decreaseLayoutHeight"
                title="Decrease Height"
                variant="text"
                icon="mdi-minus"
                @click.prevent="layoutFunction('decreaseLayoutHeight')"
            />
            <span>Height</span>
            <v-btn
                id="increaseLayoutHeight"
                title="Increase Height"
                variant="text"
                icon="mdi-plus"
                @click.prevent="layoutFunction('increaseLayoutHeight')"
            />
        </div>
        <div class="">
            <span>Reset all nodes:</span>
            <v-btn
                id="layoutResetNodes"
                variant="text"
                icon="mdi-sync"
                @click.prevent="layoutFunction('layoutResetNodes')"
            />
        </div>
        <div class="layout-title">
            <span>Title</span>
            <div class="layout--btn-group">
                <v-btn
                    id="layoutTitleUp"
                    class="layoutBtn"
                    active-class="no-active"
                    variant="outlined"
                    icon="mdi-chevron-up"
                    @click.prevent="layoutFunction('layoutTitleUp')"
                />
                <v-btn
                    id="layoutTitleDown"
                    class="layoutBtn"
                    variant="outlined"
                    icon="mdi-chevron-down"
                    @click.prevent="layoutFunction('layoutTitleDown')"
                />
                <v-btn
                    id="layoutTitleLeft"
                    class="layoutBtn"
                    variant="outlined"
                    icon="mdi-chevron-left"
                    @click.prevent="layoutFunction('layoutTitleLeft')"
                />
                <v-btn
                    id="layoutTitleRight"
                    class="layoutBtn"
                    variant="outlined"
                    icon="mdi-chevron-right"
                    @click.prevent="layoutFunction('layoutTitleRight')"
                />
            </div>
        </div>
        <div class="layout-title--enable">
            <span>Title Enabled:</span>
            <label class="switch">
                <input
                    id="toggleLayoutTitle"
                    v-model="titleEnable"
                    type="checkbox"
                />
                <span class="slider"></span>
            </label>
        </div>
        <div class="">
            <button
                id="saveLayout"
                class="Layout-btn custom-btn--primary"
                @click.prevent="layoutFunction('saveLayout')"
            >
                Save
            </button>

            <button
                id="cancelLayout"
                class="Layout-btn custom-btn--tertiary"
                @click.prevent="() => {
                    layoutFunction('cancelLayout')
                    simulatorMobileStore.showPropertiesPanel = false
                    simulatorMobileStore.showCircuits = 'elements'
                }"
            >
                Cancel
            </button>
        </div>
    </div>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, toRaw, onMounted, computed } from 'vue'
import { simulationArea } from '#/simulator/src/simulationArea'
import { checkPropertiesUpdate, prevPropertyObjSet } from '#/simulator/src/ux'
import { layoutModeGet } from '#/simulator/src/layoutMode'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'
import ProjectProperty from './ModuleProperty/ProjectProperty/ProjectProperty.vue'
import ElementProperty from './ModuleProperty/ElementProperty/ElementProperty.vue'
import SubcircuitProperty from './ModuleProperty/SubcircuitProperty/SubcircuitProperty.vue'
import HelpButton from '../Shared/HelpButton.vue'
import { layoutFunctions, tempBuffer } from '#/simulator/src/layoutMode'
import { scheduleUpdate } from '#/simulator/src/engine'
import { watch } from 'vue'
import { useLayoutStore } from '#/store/layoutStore'

const titleEnable = ref(tempBuffer?.layout?.titleEnabled)
const layoutStore = useLayoutStore()
const layoutDialogRef = ref<HTMLElement | null>(null);

onMounted(() => {
    layoutStore.layoutDialogRef = layoutDialogRef.value
})

watch(
    () => titleEnable.value,
    () => {
        layoutFunction('toggleLayoutTitle')
    }
)

const inLayoutMode = ref(false)
const panelBodyHeader = ref('PROJECT PROPERTIES')
const propertiesPanelObj = ref(undefined)
const panelType = ref(1) // default is panel type 2 (project properties)
const simulatorMobileStore = useSimulatorMobileStore()
const objProperties = computed(() => toRaw(propertiesPanelObj.value))

onMounted(() => {
  // checks for which type of properties panel to show
  setInterval(showPropertiesPanel, 100)
})
function showPropertiesPanel() {
  if (inLayoutMode.value != layoutModeGet())
      inLayoutMode.value = layoutModeGet()
  checkPropertiesUpdate()
  if (toRaw(propertiesPanelObj.value) == simulationArea.lastSelected) return
  prevPropertyObjSet(simulationArea.lastSelected)
  propertiesPanelObj.value = simulationArea.lastSelected
  if(simulationArea.lastSelected && simulationArea.lastSelected.newElement) {
      simulationArea.lastSelected.label = ""
  }
  // there are 3 types of panel body for Properties Panel
  // depending upon which is last selected
  // 1. Properties Panel in Layout mode
  // 2. Properties Panel showing Project Properties
  // 3. Properties Panel showing Circiut Element Properties
  if (inLayoutMode.value) {
      // will look into it later !!!
      if (
          simulationArea.lastSelected === undefined ||
          ['Wire', 'CircuitElement', 'Node'].indexOf(
              simulationArea.lastSelected.objectType
          ) !== -1
      ) {
          panelType.value = 1
          // when we cancel layout mode -> show project properties
      } else {
          panelType.value = 3
          panelBodyHeader.value = propertiesPanelObj.value.objectType
      }
  } else {
      if (
          simulationArea.lastSelected === undefined ||
          ['Wire', 'CircuitElement', 'Node'].indexOf(
              simulationArea.lastSelected.objectType
          ) !== -1
      ) {
          panelType.value = 1
          panelBodyHeader.value = 'PROJECT PROPERTIES'
          if (simulationArea.lastSelected === undefined)
              propertiesPanelObj.value = undefined
      } else {
          panelType.value = 2
          panelBodyHeader.value = propertiesPanelObj.value.objectType
      }
  }
}

function layoutFunction(func: string) {
    layoutFunctions[func]()
    scheduleUpdate()
}
</script>
