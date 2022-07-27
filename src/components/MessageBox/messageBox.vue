<template>
    <v-dialog :persistent="isPersistent">
        <v-card class="circuitDeletionMessageBox">
            <v-card-text>
                {{ messageText }}
            </v-card-text>
            <v-card-actions>
                <v-btn
                    v-for="buttonItem in buttonList"
                    :key="buttonItem.text"
                    class="messageBtn"
                    block
                    @click="
                        $emit('buttonClick', buttonItem.emitOption, circuitItem)
                    "
                >
                    {{ buttonItem.text }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
const props = defineProps({
    messageText: { type: String, default: '' },
    isPersistent: { type: Boolean, default: false },
    buttonList: { type: Array, default: undefined },
    circuitItem: { type: Object, default: undefined },
})
const emit = defineEmits(['buttonClick'])
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
    width: fit-content;
    border: 1px solid #c5c5c5;
    padding: 5px 5px;
}
.messageBtn:hover {
    background: #c5c5c5;
    color: black;
}

.v-card-actions {
    width: fit-content;
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin: auto;
}
</style>
