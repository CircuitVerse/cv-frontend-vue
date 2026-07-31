<template>
    <div class="report-sidebar">
        <a
            type="button"
            class="btn btn-primary text-light"
            data-toggle="modal"
            data-target=".issue"
            :style="reportButtonStyle"
            @click="openReportingModal"
        >
            <span class="fa fa-bug"></span>&nbsp;&nbsp;{{
                $t('simulator.report_issue')
            }}</a
        >
    </div>
</template>

<script lang="ts" setup>
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore';
import { computed } from 'vue';

const simulatorMobileStore = useSimulatorMobileStore();

const reportButtonStyle = computed(() => {
    if (simulatorMobileStore.showMobileView) {
        return {
            bottom: simulatorMobileStore.showElementsPanel ? '250px' : '120px',
        };
    }
    return { top: '660px', bottom: 'auto' };
});

const emit = defineEmits(['openReportModal'])

function openReportingModal() {
    emit('openReportModal', openReportingModal)
}
</script>
