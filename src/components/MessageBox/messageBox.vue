<template>
    <v-dialog :persistent="isPersistent">
        <v-card class="messageBoxContent">
            <v-card-text>
                <!-- NOTE: Add v-ifs -->
                <p v-if="messageText" style="font-weight: bold">
                    {{ messageText }}
                </p>
                <template v-if="tableHeader.length == 0">
                    <div
                        v-for="inputItem in inputList"
                        :id="inputItem.id"
                        :key="inputItem.id"
                        :style="inputItem.style"
                        :class="inputClass"
                    >
                        <p>{{ inputItem.text }}</p>
                        <input
                            v-if="inputItem.type != 'nil'"
                            v-model="inputItem.val"
                            :class="inputItem.class"
                            :placeholder="inputItem.placeholder"
                            :type="inputItem.type"
                        />
                    </div>
                </template>
                <BooleanTable
                    v-if="tableHeader.length > 0"
                    :table-header="tableHeader"
                    :table-body="tableBody"
                />
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
import BooleanTable from '@/DialogBox/BooleanTable.vue'
import { ref, PropType } from 'vue'
import { onUpdated } from '@vue/runtime-core'

export interface MessageBoxInputItem {
  id: string;
  style: Record<string, any>;
  text: string;
  val: string;
  type: string;
  class: string;
  placeholder: string;
}


export interface ButtonItem {
  text: string;
  emitOption: string;
}

const props = defineProps({
    messageText: { type: String, default: '' },
    isPersistent: { type: Boolean, default: false },
    buttonList: { type: Array as PropType<ButtonItem[]>, default: () => [] },
    inputList: { type: Array as PropType<MessageBoxInputItem[]>, default: () => [] },
    inputClass: { type: String, default: '' },
    circuitItem: { type: Object, default: () => ({}) },
    tableHeader: { type: Array, default: () => [] },
    tableBody: { type: Array, default: () => [] },
})
const emit = defineEmits(['buttonClick'])
</script>


<style scoped></style>
