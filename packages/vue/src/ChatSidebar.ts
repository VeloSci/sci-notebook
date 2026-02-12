import { defineComponent, h, ref, onMounted, watch, type PropType } from "vue";
import { useNotebookEngine } from "./composables";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  cellRefs?: string[];
}

export interface ChatSidebarProps {
  onSend?: (message: string, history: ChatMessage[]) => Promise<string>;
  systemPrompt?: string;
  onApply?: (content: string, cellId?: string) => void;
  onClose?: () => void;
}

export const ChatSidebar = defineComponent({
  name: "ChatSidebar",
  props: {
    onSend: { type: Function as PropType<(message: string, history: ChatMessage[]) => Promise<string>>, default: undefined },
    systemPrompt: { type: String, default: undefined },
    onApply: { type: Function as PropType<(content: string, cellId?: string) => void>, default: undefined },
    onClose: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const engine = useNotebookEngine();
    const messages = ref<ChatMessage[]>(
      props.systemPrompt
        ? [{ role: "system" as const, content: props.systemPrompt, timestamp: Date.now() }]
        : []
    );
    const input = ref("");
    const loading = ref(false);
    const messagesEndEl = ref<HTMLDivElement | null>(null);
    const inputEl = ref<HTMLInputElement | null>(null);

    onMounted(() => { inputEl.value?.focus(); });

    watch(messages, () => {
      requestAnimationFrame(() => {
        messagesEndEl.value?.scrollIntoView({ behavior: "smooth" });
      });
    }, { deep: true });

    const handleSend = async () => {
      const text = input.value.trim();
      if (!text || loading.value) return;

      const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
      messages.value = [...messages.value, userMsg];
      input.value = "";
      loading.value = true;

      try {
        if (props.onSend) {
          const response = await props.onSend(text, messages.value);
          messages.value = [
            ...messages.value,
            { role: "assistant", content: response, timestamp: Date.now() },
          ];
        } else {
          messages.value = [
            ...messages.value,
            {
              role: "assistant",
              content: "No AI provider configured. Pass an `onSend` prop to enable AI chat.",
              timestamp: Date.now(),
            },
          ];
        }
      } catch (e: any) {
        messages.value = [
          ...messages.value,
          {
            role: "assistant",
            content: `Error: ${e.message || "Failed to get response"}`,
            timestamp: Date.now(),
          },
        ];
      } finally {
        loading.value = false;
      }
    };

    return () => {
      const visibleMessages = messages.value.filter(m => m.role !== "system");

      const header = h("div", { class: "sci-nb-chat-header" }, [
        h("span", null, "AI Assistant"),
        props.onClose
          ? h("button", {
              onClick: props.onClose,
              style: { border: "none", background: "transparent", cursor: "pointer", fontSize: "16px" },
            }, "✕")
          : null,
      ]);

      const msgNodes = visibleMessages.length === 0
        ? [h("div", { style: { textAlign: "center", color: "#94a3b8", padding: "24px" } },
            "Ask me anything about your notebook...")]
        : visibleMessages.map((msg, i) =>
            h("div", { key: i, class: `sci-nb-chat-msg sci-nb-chat-msg--${msg.role}` }, [
              h("div", null, msg.content),
              msg.role === "assistant" && props.onApply
                ? h("button", {
                    onClick: () => props.onApply!(msg.content),
                    style: {
                      marginTop: "4px", fontSize: "11px", padding: "2px 6px",
                      border: "1px solid #e2e8f0", borderRadius: "4px",
                      background: "transparent", cursor: "pointer",
                    },
                  }, "Apply to cell")
                : null,
            ])
          );

      if (loading.value) {
        msgNodes.push(
          h("div", {
            class: "sci-nb-chat-msg sci-nb-chat-msg--assistant",
            style: { opacity: 0.6 },
          }, "Thinking...")
        );
      }
      msgNodes.push(h("div", { ref: messagesEndEl }));

      const messagesArea = h("div", { class: "sci-nb-chat-messages" }, msgNodes);

      const inputArea = h("div", { class: "sci-nb-chat-input" }, [
        h("input", {
          ref: inputEl,
          type: "text",
          value: input.value,
          onInput: (e: Event) => { input.value = (e.target as HTMLInputElement).value; },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
          },
          placeholder: "Ask something...",
          disabled: loading.value,
        }),
        h("button", {
          onClick: handleSend,
          disabled: loading.value || !input.value.trim(),
        }, "Send"),
      ]);

      return h("div", { class: "sci-nb-chat-sidebar" }, [header, messagesArea, inputArea]);
    };
  },
});
