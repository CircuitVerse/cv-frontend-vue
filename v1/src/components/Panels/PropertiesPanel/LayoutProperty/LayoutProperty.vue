<template>
    <div id="layoutDialog" ref="layoutDialogRef" class="draggable-panel draggable-panel-css">
        <PanelHeader :header-title="$t('simulator.panel_header.layout')" />
        <div id="layout-body" class="layout-body panel-body">
            <div class="">
                <v-btn
                    id="decreaseLayoutWidth"
                    :title="$t('simulator.tooltip.decrease_width')"
                    variant="text"
                    icon="mdi-minus"
                    @click.prevent="layoutFunction('decreaseLayoutWidth')"
                />
                <span>{{ $t('simulator.panel_body.layout.width') }}</span>
                <v-btn
                    id="increaseLayoutWidth"
                    :title="$t('simulator.tooltip.increase_width')"
                    variant="text"
                    icon="mdi-plus"
                    @click.prevent="layoutFunction('increaseLayoutWidth')"
                />
            </div>
            <div class="">
                <v-btn
                    id="decreaseLayoutHeight"
                    :title="$t('simulator.tooltip.decrease_height')"
                    variant="text"
                    icon="mdi-minus"
                    @click.prevent="layoutFunction('decreaseLayoutHeight')"
                />
                <span>{{ $t('simulator.panel_body.layout.height') }}</span>
                <v-btn
                    id="increaseLayoutHeight"
                    :title="$t('simulator.tooltip.increase_height')"
                    variant="text"
                    icon="mdi-plus"
                    @click.prevent="layoutFunction('increaseLayoutHeight')"
                />
            </div>
            <div class="">
                <span>{{ $t('simulator.panel_body.layout.reset_all_nodes') }}</span>
                <v-btn
                    id="layoutResetNodes"
                    variant="text"
                    icon="mdi-sync"
                    @click.prevent="layoutFunction('layoutResetNodes')"
                />
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
                <span>{{ $t('simulator.panel_body.layout.title_enabled') }}</span>
                <label class="switch">
                    <input
                        id="toggleLayoutTitle"
                        v-model="propertiesPanelStore.titleEnable"
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
                    {{ $t('simulator.panel_body.layout.save') }}
                </button>

                <button
                    id="cancelLayout"
                    class="Layout-btn custom-btn--tertiary"
                    @click.prevent="layoutFunction('cancelLayout')"
                >
                    {{ $t('simulator.panel_body.layout.cancel') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue'
import PanelHeader from '#/components/Panels/Shared/PanelHeader.vue'
import { layoutFunction } from '../PropertiesPanel'
import { useLayoutStore } from '#/store/layoutStore'
import { usePropertiesPanelStore } from '#/store/propertiesPanelStore'

const layoutStore = useLayoutStore()
const propertiesPanelStore = usePropertiesPanelStore()

onMounted(() => {
    layoutStore.layoutDialogRef = propertiesPanelStore.layoutDialogRef;
})

watch(
    () => propertiesPanelStore.titleEnable,
    () => {
        layoutFunction('toggleLayoutTitle')
    }
)
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
