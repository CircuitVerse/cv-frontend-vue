<template>
    <!---issue reporting-system----->
    <ReportIssueButton @open-report-modal="openReportModal" />
    <!---MODAL - issue reporting system---->
    <div
        v-if="reportState.reportIssueOpen"
        class="modal fade issue"
        tabindex="-1"
        role="dialog"
        aria-labelledby="mySmallModalLabel"
        aria-hidden="true"
    >
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="container my-2">
                    <button
                        type="button"
                        class="close"
                        data-dismiss="modal"
                        aria-label="Close"
                        @click="closeReportModal"
                    >
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <div class="container text-center">
                        <h4>{{ $t('simulator.report_issue') }}</h4>
                    </div>
                    <hr />
                    <div
                        v-if="resultOpen"
                        id="result"
                        class="container my-2 text-center"
                    ></div>
                    <label
                        v-if="reportLabel"
                        id="report-label"
                        style="font-weight: lighter"
                        ><b>{{
                            $t(
                                'simulator.panel_body.report_issue.describe_issue'
                            )
                        }}</b></label
                    >
                    <div class="form-group">
                        <textarea
                            v-if="issueText"
                            id="issuetext"
                            v-model="issueTextContent"
                            class="form-control border-primary"
                            rows="3"
                        ></textarea>
                    </div>
                    <label
                        v-if="emailLabel"
                        id="email-label"
                        for="emailtext"
                        style="font-weight: lighter"
                        ><b>{{
                            $t('simulator.panel_body.report_issue.email')
                        }}</b>
                        <span>
                            {{
                                $t('simulator.panel_body.report_issue.optional')
                            }}</span
                        >:</label
                    >
                    <div class="form-group">
                        <input
                            v-if="issueEmail"
                            id="emailtext"
                            v-model="issueEmailContent"
                            class="form-control border-primary"
                            type="email"
                            rows="3"
                        />
                    </div>
                    <div class="container center">
                        <button
                            v-if="reportIssueButtonVisible"
                            id="report"
                            type="submit"
                            class="btn btn-primary"
                            @click="reportIssue"
                        >
                            {{
                                $t(
                                    'simulator.panel_body.report_issue.report_btn'
                                )
                            }}
                        </button>
                    </div>
                    <div class="container center">
                        <button
                            type="button"
                            class="btn btn-primary close-btn"
                            data-dismiss="modal"
                            aria-label="Close"
                            @click="closeReportModal"
                        >
                            {{
                                $t(
                                    'simulator.panel_body.report_issue.cancel_btn'
                                )
                            }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { generateSaveData, generateImage } from '#/simulator/src/data/save'
import ReportIssueButton from './ReportIssueButton.vue'
import { ref, Ref } from 'vue'
import { useState } from '#/store/SimulatorStore/state'

const reportState = useState()
const reportLabel: Ref<boolean> = ref(false)
const issueText: Ref<boolean> = ref(false)
const issueTextContent: Ref<string> = ref('')
const emailLabel: Ref<boolean> = ref(false)
const issueEmail: Ref<boolean> = ref(false)
const issueEmailContent: Ref<string> = ref('')
const reportIssueButtonVisible: Ref<boolean> = ref(false)
const resultOpen: Ref<boolean> = ref(false)

function openReportModal(): void {
    if (!reportState.reportIssueOpen) {
        reportState.reportIssueOpen = true
        issueTextContent.value = ''
        issueEmailContent.value = ''
    }
    reportLabel.value = true
    issueText.value = true
    emailLabel.value = true
    issueEmail.value = true
    reportIssueButtonVisible.value = true
    resultOpen.value = false
}

function closeReportModal(): void {
    if (reportState.reportIssueOpen) {
        reportState.reportIssueOpen = false
        reportLabel.value = false
        issueText.value = false
        emailLabel.value = false
        issueEmail.value = false
        reportIssueButtonVisible.value = false
        resultOpen.value = false
    }
}

function reportIssue(): void {
    resultOpen.value = true
    const issuetext = issueTextContent.value
    const emailtext = issueEmailContent.value
    const userId = window.user_id
    const message =
        issuetext +
        '\nEmail:' +
        emailtext +
        '\nURL: ' +
        window.location.href +
        `\nUser Id: ${userId}`
    postUserIssue(message)
    issueText.value = false
    issueTextContent.value = ''
    issueEmail.value = false
    issueEmailContent.value = ''
    reportIssueButtonVisible.value = false
    reportLabel.value = false
    emailLabel.value = false
}
async function postUserIssue(message: any) {
    const img = generateImage('jpeg', 'full', false, 1, false).split(',')[1]

    let result
    try {
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                Authorization: 'Client-ID 9a33b3b370f1054',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `image=${img}`,
        })
        const data = await response.json()
        result = data.data.link
    } catch (err) {
        console.error('Could not generate image, reporting anyway')
    }

    if (result) {
        message += `\n${result}`
    }

    let circuitData
    try {
        circuitData = generateSaveData('Untitled')
    } catch (err) {
        circuitData = `Circuit data generation failed: ${err}`
    }

    // Report issue to server
    try {
        const csrfToken = document.querySelector(
            'meta[name="csrf-token"]'
        ).content
        const response = await fetch('/simulator/post_issue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({
                text: message,
                circuit_data: circuitData,
            }),
        })
        const data = await response.json()
        if (data.success) {
            document.getElementById('result').innerHTML =
                "<i class='fa fa-check' style='color:green'></i> You've successfully submitted the issue. Thanks for improving our platform."
        } else {
            throw new Error(data.error || 'Failed to submit issue')
        }
    } catch (err) {
        document.getElementById('result').innerHTML =
            "<i class='fa fa-minus-circle' style='color:red'></i> There seems to be a network issue. Please reach out to us at support@ciruitverse.org"
        console.error(err)
    }
}
</script>

<style scoped>
.center {
    display: flex;
    justify-content: center;
}
.close-btn {
    background-color: rgba(255, 0, 0, 0.65);
    color: white;
    margin: 8px;
    padding: 8px 16px;
    border: none;
}
.close-btn:hover,
.close-btn:active {
    background-color: rgba(154, 4, 4);
}
</style>
