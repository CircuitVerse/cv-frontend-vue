<template>
    <v-dialog>
        <v-card class="circuitDeletionMessageBox">
            <v-card-text>
                {{ messageText }}
            </v-card-text>
            <v-card-actions>
                <v-btn class="messageBtn" block @click="$emit('hideMessage')"
                    >Close</v-btn
                >
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
const props = defineProps({
    messageText: { type: String, default: '' },
})
const emit = defineEmits(['hideMessage'])
</script>

<style scoped>
.circuitDeletionMessageBox {
    width: auto;
    height: auto;
    backdrop-filter: blur(5px);
    border-radius: 5px;
    border: 0.5px solid var(--br-primary) !important;
    background: var(--bg-primary-moz) !important;
    background-color: var(--bg-primary-chr) !important;
    color: white;
}

.messageBtn {
    width: 50px;
    border: 1px solid #c5c5c5;
    padding: 5px 0;
}
.messageBtn:hover {
    background: #c5c5c5;
    color: black;
}
</style>
