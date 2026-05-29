import { defineStore } from "pinia";
import { ref } from "vue";

export interface SynthesisMessage {
  text: string;
  type: "info" | "error" | "success";
  timestamp: Date;
}

export const useSynthesisStore = defineStore("synthesisStore", () => {
  const messages = ref<SynthesisMessage[]>([]);

  const addMessage = (text: string, type: "info" | "error" | "success" = "info") => {
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
