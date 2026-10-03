<template>
  <div
    ref="elementsPanelRef"
    class="noSelect defaultCursor draggable-panel draggable-panel-css modules ce-panel elementPanel"
  >
    <PanelHeader
      :header-title="$t('simulator.panel_header.circuit_elements')"
    />
    <div class="panel-body">
      <div style="position: relative">
        <input
          v-model="elementInput"
          type="text"
          class="search-input"
          :placeholder="$t('simulator.panel_body.circuit_elements.search')"
          id="element-search-input"
          @keydown="handleKeyDown"
        />
        <span
          ><i
            v-if="elementInput"
            class="fas search-close fa-times-circle"
            @click="elementInput = ''"
          ></i
        ></span>
      </div>
      <div
        v-if="elementInput && searchElements().length"
        class="search-results"
      >
        <div
          v-for="element in searchElements()"
          :id="element.name"
          :key="element.name"
          :title="element.label"
          class="icon logixModules"
          :class="{
            'focused-element': getGlobalIndex(element.name) === focusInd,
          }"
          @click="createElement(element.name)"
          @mousedown="createElement(element.name)"
          @mouseover="getTooltipText(element.name)"
          @mouseleave="tooltipText = 'null'"
        >
          <img :src="element.imgURL" :alt="element.name" />
        </div>
      </div>
      <v-expansion-panels
        v-if="elementInput && searchCategories().length"
        id="menu"
        class="accordion"
        variant="accordion"
      >
        <v-expansion-panel
          v-for="category in searchCategories()"
          :key="category[0]"
        >
          <v-expansion-panel-title>
            {{
              $t(
                "simulator.panel_body.circuit_elements.expansion_panel_title." +
                  category[0],
              )
            }}
          </v-expansion-panel-title>
          <v-expansion-panel-text eager>
            <div class="panel customScroll">
              <div
                v-for="element in category[1]"
                :id="element.name"
                :key="element"
                :title="element.label"
                class="icon logixModules"
                @click="createElement(element.name)"
                @mousedown="createElement(element.name)"
                @mouseover="getTooltipText(element.name)"
                @mouseleave="tooltipText = 'null'"
              >
                <img :src="element.imgURL" :alt="element.name" />
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <div
        v-if="
          elementInput && !searchElements().length && !searchCategories().length
        "
        class="search-results"
      >
        {{ $t("simulator.panel_body.circuit_elements.search_result") }}
      </div>
      <v-expansion-panels
        v-if="!elementInput"
        id="menu"
        class="accordion"
        variant="accordion"
      >
        <v-expansion-panel v-for="category in panelData" :key="category[0]">
          <v-expansion-panel-title>
            {{
              $t(
                "simulator.panel_body.circuit_elements.expansion_panel_title." +
                  category[0],
              )
            }}
          </v-expansion-panel-title>
          <v-expansion-panel-text eager>
            <div class="panel customScroll">
              <div
                v-for="element in category[1]"
                :id="element.name"
                :key="element"
                :title="element.label"
                class="icon logixModules"
                @click="createElement(element.name)"
                @mousedown="createElement(element.name)"
                @mouseover="getTooltipText(element.name)"
                @mouseleave="tooltipText = 'null'"
              >
                <img :src="element.imgURL" :alt="element.name" />
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
  <div id="Help" :class="tooltipText !== 'null' ? 'show' : ''">
    {{ tooltipText }}
  </div>
</template>

<script lang="ts" setup>
import PanelHeader from "../Shared/PanelHeader.vue";
import { elementHierarchy } from "#/simulator/src/metadata";
import { createElement, getImgUrl } from "./ElementsPanel";
import modules from "#/simulator/src/modules";
import { onBeforeMount, onMounted, ref, computed, watch } from "vue";
import { useLayoutStore } from "#/store/layoutStore";
import { setupPanelListeners } from "#/simulator/src/ux";
var panelData = [];
window.elementPanelList = [];
const layoutStore = useLayoutStore();

const elementsPanelRef = ref<HTMLElement | null>(null);

onBeforeMount(() => {
  for (const category in elementHierarchy) {
    var categoryData = [];
    for (let i = 0; i < elementHierarchy[category].length; i++) {
      const element = elementHierarchy[category][i];
      if (!element.name.startsWith("verilog")) {
        window.elementPanelList.push(element.label);
        element["imgURL"] = getImgUrl(element.name);
        categoryData.push(element);
      }
    }
    panelData.push([category, categoryData]);
  }
});

onMounted(() => {
  layoutStore.elementsPanelRef = elementsPanelRef.value;
  setupPanelListeners(".elementPanel");
});

var elementInput = ref("");
function searchElements() {
  if (!elementInput.value) return [];
  // logic imported from listener.js
  const result = elementPanelList.filter((ele) =>
    ele.toLowerCase().includes(elementInput.value.toLowerCase()),
  );
  var finalResult = [];
  for (const j in result) {
    if (Object.prototype.hasOwnProperty.call(result, j)) {
      for (const category in elementHierarchy) {
        if (Object.prototype.hasOwnProperty.call(elementHierarchy, category)) {
          const categoryData = elementHierarchy[category];
          for (let i = 0; i < categoryData.length; i++) {
            if (result[j] == categoryData[i].label) {
              finalResult.push(categoryData[i]);
            }
          }
        }
      }
    }
  }
  return finalResult;
}

function searchCategories() {
  const result = panelData.filter((category) => {
    const categoryName = category[0];
    const categoryNameWords = categoryName.split(" ");

    return categoryNameWords.some((word) =>
      word.toLowerCase().startsWith(elementInput.value.toLowerCase()),
    );
  });
  return result;
}

const tooltipText = ref("null");
function getTooltipText(elementName: string) {
  tooltipText.value = modules[elementName].prototype.tooltipText;
}

const focusInd = ref(0);

const searchResults = computed(() => {
  if (!elementInput.value) return [];
  const elements = searchElements();
  const categories = searchCategories();
  // Combine top-level element matches and all elements within category matches
  const categoryElements = categories.flatMap((c) => c[1]);

  // Remove duplicates (e.g. if an element is both a direct match and in a matched category)
  const combined = [...elements, ...categoryElements];
  const seen = new Set();
  return combined.filter((el) => {
    if (seen.has(el.name)) return false;
    seen.add(el.name);
    return true;
  });
});

watch(elementInput, () => {
  focusInd.value = 0;
});

function handleKeyDown(e: KeyboardEvent) {
  if (!searchResults.value.length) return;

  if (e.key === "Tab") {
    e.preventDefault();
    if (e.shiftKey) {
      focusInd.value =
        (focusInd.value - 1 + searchResults.value.length) %
        searchResults.value.length;
    } else {
      focusInd.value = (focusInd.value + 1) % searchResults.value.length;
    }
  } else if (e.key === "Enter") {
    const selectedEle = searchResults.value[focusInd.value];
    if (selectedEle) {
      createElement(selectedEle.name);
      elementInput.value = ""; // Clear search after spawning
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    focusInd.value = (focusInd.value + 1) % searchResults.value.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    focusInd.value =
      (focusInd.value - 1 + searchResults.value.length) %
      searchResults.value.length;
  }
}

// Helper to get index across multiple v-for loops
function getGlobalIndex(elementName: string) {
  return searchResults.value.findIndex((el) => el.name === elementName);
}
</script>

<style>
.v-expansion-panel-title {
  min-height: 36px;
}

.focused-element {
  background: var(--bg-icons) !important;
  border-radius: 4px;
  box-shadow: 0 0 10px var(--primary);
  transform: scale(1.1);
  transition: all 0.2s ease;
}
</style>
