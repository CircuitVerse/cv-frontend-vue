<template>
  <div
      ref="elementsPanelRef"
      class="noSelect defaultCursor draggable-panel-mobile draggable-panel-css modules ce-panel elementPanel elementsPanelMobile"
      :style="{bottom: simulatorMobileStore.showElementsPanel ? '0' : '-12rem'}"
  >
      <div class="panel-body" style="padding: 0;">
          <div style="position: relative" class="search-container">
              <input
                  v-model="elementInput"
                  type="text"
                  class="search-input mobile-search"
                  :placeholder="
                      $t('simulator.panel_body.circuit_elements.search')
                  "
              />
              <span
                  ><i
                      v-if="elementInput"
                      class="fas search-close fa-times-circle"
                      @click="elementInput = ''"
                  ></i
              ></span>
          </div>

          <div class="element-category-tabs">
            <div
              v-for="category in panelData" :key="category[0]"
              class="element-category-tab" @mousedown="selectCategory(category[1], category[0])"
              :style="{backgroundColor: selectedCategoryName === category[0] ? 'var(--primary)' : '#eee', color: selectedCategoryName === category[0] ? 'white' : 'black'}"
            >
              {{ category[0] }}
            </div>
          </div>

          <div class="mobile-icons">
            <div>
            <div
              v-for="element in filteredElements"
              :id="element.name"
              :key="element.name"
              :title="element.label"
              class="icon logixModules"
              @click="createElement(element.name)"
              @mousedown="createElement(element.name)"
              @mouseover="getTooltipText(element.name)"
              @mouseleave="tooltipText = ''"
            >
              <img
                :src="element.imgURL"
                :alt="element.name"
              />
            </div>
            </div>
          </div>

          <!-- <div
              id="Help"
              lines="one"
              :class="tooltipText != 'null' ? 'show' : ''"
          >
              {{ tooltipText }}
          </div> -->
      </div>
  </div>
</template>

<script lang="ts" setup>
import { elementHierarchy } from '#/simulator/src/metadata'
import { simulationArea } from '#/simulator/src/simulationArea'
import { uxvar } from '#/simulator/src/ux'
import modules from '#/simulator/src/modules'
import { onBeforeMount, onMounted, ref, computed } from 'vue'
import { useLayoutStore } from '#/store/layoutStore'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'
var panelData = []
window.elementPanelList = []
const layoutStore = useLayoutStore()
const simulatorMobileStore = useSimulatorMobileStore()

const elementsPanelRef = ref<HTMLElement | null>(null);
const selectedCategory = ref(null)
const selectedCategoryName = ref('Input')


const filteredElements = computed(() => {
  const elements = selectedCategory.value ? selectedCategory.value : panelData[0][1]
  return elements.filter(element => {
    const elementNameLower = element.name.toLowerCase()
    const elementInputLower = elementInput.value.toLowerCase()
    return elementNameLower.includes(elementInputLower)
  })
})

onBeforeMount(() => {
  for (const category in elementHierarchy) {
      var categoryData = []
      for (let i = 0; i < elementHierarchy[category].length; i++) {
          const element = elementHierarchy[category][i]
          if (!element.name.startsWith('verilog')) {
              window.elementPanelList.push(element.label)
              element['imgURL'] = getImgUrl(element.name)
              categoryData.push(element)
          }
      }
      panelData.push([category, categoryData])
  }
})

onMounted(() => {
  layoutStore.elementsPanelRef = elementsPanelRef.value
})

function selectCategory(categoryData, categoryName) {
  selectedCategory.value = categoryData
    selectedCategoryName.value = categoryName
}

function getImgUrl(elementName) {
  const elementImg = new URL(
      `../../../assets/img/${elementName}.svg`,
      import.meta.url
  ).href
  return elementImg
}

var elementInput = ref('')

function createElement(elementName) {
  if (simulationArea.lastSelected && simulationArea.lastSelected.newElement)
      simulationArea.lastSelected.delete()
  var obj = new modules[elementName]()
  simulationArea.lastSelected = obj
  uxvar.smartDropXX += 70
  if (uxvar.smartDropXX / globalScope.scale > width) {
      uxvar.smartDropXX = 50
      uxvar.smartDropYY += 80
  }
}

const tooltipText = ref('null')
function getTooltipText(elementName) {
  tooltipText.value = modules[elementName].prototype.tooltipText
}
</script>

<style scoped>
.v-expansion-panel-title {
  min-height: 36px;
}

.elementsPanelMobile{
  top: unset !important;
  left: 0;
  width: 100%;
  transition: all 0.3s;
}

.element-category-tabs {
    display: flex;
    padding: 0 10px;
    overflow-x: scroll;
    white-space: nowrap;
    justify-content: space-between;
    gap: 0.5rem;
}

.element-category-tabs::-webkit-scrollbar, .mobile-icons::-webkit-scrollbar {
    height: 0px;
}

.element-category-tabs::-webkit-scrollbar-thumb, .mobile-icons::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 4px;
}

.element-category-tabs::-webkit-scrollbar-track, .mobile-icons::-webkit-scrollbar-track {
    background-color: transparent;
}

.element-category-tabs, .mobile-icons {
    scrollbar-width: none;
    scrollbar-color: transparent transparent;
}

.element-category-tab {
    padding: 10px 0;
    cursor: pointer;
    width: 7.5rem;
    font-size: 0.75rem;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.mobile-icons{
    display: flex;
    justify-content: space-between;
    gap: 0.1rem;
    overflow-x: auto;
    white-space: nowrap;
}

.mobile-icons .icon{
    width: 50px;
    height: 50px;
    margin: 10px;
    cursor: pointer;
    flex-shrink: 0;
}

.mobile-search {
    width: 98vw;
    margin: 0;
    color: black;
}

.search-container {
    padding: 0.5rem;
    color: black;
}
</style>
