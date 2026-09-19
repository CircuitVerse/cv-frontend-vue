<template>
    <!---issue reporting-system----->
    <ReportIssueButton @open-report-modal="openReportModal" />
    <!---MODAL - issue reporting system---->
    <div
        v-if="reportIssueOpen"
        class="report-overlay"
        @click.self="closeReportModal"
        @keydown.esc="closeReportModal"
    >
        <div
            ref="dialogRef"
            class="report-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-issue-title"
            tabindex="-1"
        >
            <button
                type="button"
                class="report-close"
                aria-label="Close"
                @click="closeReportModal"
            >
                <span aria-hidden="true">&times;</span>
            </button>
            <h4 id="report-issue-title" class="text-center">
                {{ $t('simulator.report_issue') }}
            </h4>
            <hr />
            <p id="report-label" class="report-message">
                {{ $t('simulator.panel_body.report_issue.forum_message') }}
            </p>
            <section class="action-buttons">
                <button
                    type="button"
                    class="btn btn-primary forum-btn"
                    @click="goToForum"
                >
                    {{ $t('simulator.panel_body.report_issue.forum_btn') }}
                </button>
                <button
                    type="button"
                    class="btn close-btn"
                    aria-label="Close"
                    @click="closeReportModal"
                >
                    {{ $t('simulator.panel_body.report_issue.close_btn') }}
                </button>
            </section>
        </div>
    </div>
</template>
<script lang="ts" setup>
import ReportIssueButton from './ReportIssueButton.vue'
import { nextTick, ref, Ref } from 'vue'

const reportIssueOpen: Ref<boolean> = ref(false)
const dialogRef: Ref<HTMLElement | null> = ref(null)

function openReportModal(): void {
    reportIssueOpen.value = true
    nextTick(() => dialogRef.value?.focus())
}

function closeReportModal(): void {
    reportIssueOpen.value = false
}

function goToForum(): void {
    window.open('https://circuitverse.org/forum', '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.report-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 1.75rem 16px 16px;
    background: rgba(0, 0, 0, 0.5);
}

.report-dialog {
    position: relative;
    width: 100%;
    max-width: 380px;
    max-height: 100%;
    overflow-y: auto;
    padding: 1.25rem;
    border-radius: 0.5rem;
    background: #fff;
    color: #212529;
    outline: none;
}

.report-close {
    position: absolute;
    top: 0.5rem;
    right: 0.75rem;
    border: 0;
    background: none;
    color: inherit;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
}

.report-message {
    font-size: 0.95rem;
    line-height: 1.5;
    text-align: center;
    word-break: break-word;
    margin-bottom: 1rem;
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 0.5rem;
}

.action-buttons .btn {
    flex: 1 1 140px;
    max-width: 100%;
    white-space: normal;
}

.forum-btn {
    font-weight: 500;
}

.close-btn {
    background-color: var(--btn-danger);
    border: 1px solid var(--btn-danger);
    color: #fff;
}
.close-btn:hover,
.close-btn:active {
    background-color: var(--btn-danger-darken);
    border: 1px solid var(--btn-danger-darken);
}
</style>
