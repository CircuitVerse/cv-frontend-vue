import { defineStore } from "pinia";
import { ref } from "vue";

export type SynthesisMessageType = "info" | "error" | "success";

export interface SynthesisMessage {
  text: string;
  type: SynthesisMessageType;
  timestamp: Date;
}

export const useSynthesisStore = defineStore("synthesisStore", () => {
  const messages = ref<SynthesisMessage[]>([]);

  const addMessage = (text: string, type: SynthesisMessageType = "info") => {
    messages.value.push({ text, type, timestamp: new Date() });
  };

  const clearMessages = () => {
    messages.value = [];
  };

  return {
    messages,
    addMessage,
    clearMessages,
  };
});
