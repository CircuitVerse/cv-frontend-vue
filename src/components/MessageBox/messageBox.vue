<template>
    <v-dialog>
        <v-card>
            <v-card-text>
                {{ messageText }}
            </v-card-text>
            <v-card-actions>
                <v-btn color="primary" block @click="$emit('hideMessage')"
                    >Close Dialog</v-btn
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
