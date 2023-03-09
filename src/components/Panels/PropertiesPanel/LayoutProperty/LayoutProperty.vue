<template>
    <div id="layoutDialog" class="draggable-panel draggable-panel-css">
        <PanelHeader :header-title="$t('simulator.panel_header.layout')" />
        <div id="layout-body" class="layout-body panel-body">
            <div class="">
                <v-btn
                    id="decreaseLayoutWidth"
                    title="Decrease Width"
                    variant="text"
                    icon="mdi-minus"
                />
                <span>{{ $t('simulator.panel_body.layout.width') }}</span>
                <v-btn
                    id="increaseLayoutWidth"
                    title="Increase Width"
                    variant="text"
                    icon="mdi-plus"
                />
            </div>
            <div class="">
                <v-btn
                    id="decreaseLayoutHeight"
                    title="Decrease Height"
                    variant="text"
                    icon="mdi-minus"
                />
                <span>{{ $t('simulator.panel_body.layout.height') }}</span>
                <v-btn
                    id="increaseLayoutHeight"
                    title="Increase Height"
                    variant="text"
                    icon="mdi-plus"
                />
            </div>
            <div class="">
                <span>{{
                    $t('simulator.panel_body.layout.reset_all_nodes')
                }}</span>
                <v-btn id="layoutResetNodes" variant="text" icon="mdi-sync" />
            </div>
            <div class="layout-title">
                <span>{{ $t('simulator.panel_body.layout.title') }}</span>
                <div class="layout--btn-group">
                    <v-btn
                        id="layoutTitleUp"
                        class="layoutBtn"
                        active-class="no-active"
                        variant="outlined"
                        icon="mdi-chevron-up"
                    />
                    <v-btn
                        id="layoutTitleDown"
                        class="layoutBtn"
                        variant="outlined"
                        icon="mdi-chevron-down"
                    />
                    <v-btn
                        id="layoutTitleLeft"
                        class="layoutBtn"
                        variant="outlined"
                        icon="mdi-chevron-left"
                    />
                    <v-btn
                        id="layoutTitleRight"
                        class="layoutBtn"
                        variant="outlined"
                        icon="mdi-chevron-right"
                    />
                </div>
            </div>
            <div class="layout-title--enable">
                <span>{{
                    $t('simulator.panel_body.layout.title_enabled')
                }}</span>
                <label class="switch">
                    <input id="toggleLayoutTitle" type="checkbox" checked />
                    <span class="slider"></span>
                </label>
            </div>
            <div class="">
                <button id="saveLayout" class="Layout-btn custom-btn--primary">
                    {{ $t('simulator.panel_body.layout.save') }}
                </button>

                <button
                    id="cancelLayout"
                    class="Layout-btn custom-btn--tertiary"
                >
                    {{ $t('simulator.panel_body.layout.cancel') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { setupLayoutModePanelListeners } from '#/simulator/src/layoutMode'
import PanelHeader from '#/components/Panels/Shared/PanelHeader.vue'
import { onMounted } from '@vue/runtime-core'

onMounted(() => {
    setupLayoutModePanelListeners()
})
</script>

<style scoped>
.v-btn.layoutBtn {
    margin: 7px 5px 0px 5px;
    width: 30px;
    height: 30px;
    border: 2px solid white;
    border-radius: 0.6rem;
}

.v-btn.layoutBtn:active {
    border: 2px solid white;
}

.layout--btn-group {
    margin-right: 0;
}
</style>
