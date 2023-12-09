<template>
  <div ref="ElementsPanel"
    class="noSelect defaultCursor draggable-panel draggable-panel-css modules ce-panel elementPanel">
    <PanelHeader :header-title="$t('simulator.panel_header.circuit_elements')" />
    <div class="panel-body">
      <div style="position: relative">
        <input v-model="elementInput" type="text" class="search-input" :placeholder="$t('simulator.panel_body.circuit_elements.search')
          ">
        <span><i v-if="elementInput" class="fas search-close fa-times-circle" @click="elementInput = ''" /></span>
      </div>
      <div v-if="elementInput && searchElements().length" class="search-results">
        <div v-for="element in searchElements()" :id="element.name" :key="element.name" :title="element.label"
          class="icon logixModules" @click="createElement(element.name)" @mouseover="getTooltipText(element.name)"
          @mouseleave="tooltipText = 'null'">
          <img :src="element.imgURL" :alt="element.name">
        </div>
      </div>
      <div v-if="elementInput && !searchElements().length" class="search-results">
        {{ $t('simulator.panel_body.circuit_elements.search_result') }}
      </div>
      <v-expansion-panels v-if="!elementInput" id="menu" class="accordion" variant="accordion">
        <v-expansion-panel v-for="category in panelData" :key="category[0]">
          <v-expansion-panel-title>
            {{
              $t(
                'simulator.panel_body.circuit_elements.expansion_panel_title.' +
                category[0]
              )
            }}
          </v-expansion-panel-title>
          <v-expansion-panel-text eager>
            <div class="panel customScroll">
              <div v-for="element in category[1]" :id="element.name" :key="element" :title="element.label"
                class="icon logixModules" @click="createElement(element.name)" @mouseover="getTooltipText(element.name)"
                @mouseleave="tooltipText = 'null'">
                <img :src="element.imgURL" :alt="element.name">
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <div id="Help" lines="one" :class="tooltipText != 'null' ? 'show' : ''">
        {{ tooltipText }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import PanelHeader from '../Shared/PanelHeader.vue';
import { metadata } from '#/simulator/src/metadata';
import { simulationArea } from '#/simulator/src/simulation_area';
import { uxvar } from '#/simulator/src/ux';
import { modules } from '#/simulator/src/modules';
import { onBeforeMount, ref } from 'vue';
const panelData = [];
window.elementHierarchy = metadata.elementHierarchy;
window.elementPanelList = [];

onBeforeMount(() => {
  for (const [key, value] of elementHierarchy) {
    const categoryData = [];
    for (let i = 0; i < value.length; i++) {
      const element = value[i];
      if (!element.name.startsWith('verilog')) {
        window.elementPanelList.push(element.label);
        element['imgURL'] = getImgUrl(element.name);
        categoryData.push(element);
      }
    }
    panelData.push([key, categoryData]);
  }
});

function getImgUrl(elementName: string) {
  const elementImg = new URL(
    `../../../assets/img/${elementName}.svg`,
    import.meta.url,
  ).href;
  return elementImg;
}

const elementInput = ref('');
function searchElements() {
  if (!elementInput.value) {
    return [];
  }
  // logic imported from listener.js
  const result = elementPanelList.filter((ele) =>
    ele.toLowerCase().includes(elementInput.value.toLowerCase()),
  );
  const finalResult = [];
  for (const j in result) {
    if (Object.prototype.hasOwnProperty.call(result, j)) {
      for (const [key, value] of elementHierarchy) {
        for (let i = 0; i < value.length; i++) {
          if (result[j] == value[i].label) {
            finalResult.push(value[i]);
          }
        }
      }
    }
  }
  return finalResult;
}

function createElement(elementName: string) {
  if (simulationArea.lastSelected && simulationArea.lastSelected.newElement) {
    simulationArea.lastSelected.delete();
  }
  const obj = new modules[elementName]();
  simulationArea.lastSelected = obj;
  uxvar.smartDropXX += 70;
  if (uxvar.smartDropXX / globalScope.scale > width) {
    uxvar.smartDropXX = 50;
    uxvar.smartDropYY += 80;
  }
}

const tooltipText = ref('null');
function getTooltipText(elementName: string) {
  tooltipText.value = modules[elementName].prototype.tooltipText;
}
</script>

<style scoped></style>
