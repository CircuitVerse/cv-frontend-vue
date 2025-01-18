<template>
    <div class="report-sidebar">
        <a
            type="button"
            class="btn btn-primary text-light"
            data-bs-toggle="modal"
            data-bs-target=".issue"
            :style="{ bottom: simulatorMobileStore.showElementsPanel ? '250px' : '120px' }"
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

const simulatorMobileStore = useSimulatorMobileStore();

const emit = defineEmits(['openReportModal'])

function openReportingModal() {
    emit('openReportModal', openReportingModal)
}
</script>
