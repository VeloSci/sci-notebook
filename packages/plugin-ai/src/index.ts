import type { SciNotebookPlugin, PluginContext, Cell, CellType, Notebook } from "@velo-sci/notebook-core";

// --- Types ---

export interface AICompletionProvider {
  id: string;
  name: string;
  supportsStreaming: boolean;
  getCompletions(request: CompletionRequest): Promise<CompletionResponse>;
  getStreamingCompletion?(request: CompletionRequest): AsyncIterable<CompletionChunk>;
  cancel?(requestId: string): void;
  isAvailable(): Promise<boolean>;
}

export interface CompletionRequest {
  requestId: string;
  type: "inline" | "rewrite" | "generate" | "chat";
  source?: string;
  cursorOffset?: number;
  selection?: { start: number; end: number };
  prompt?: string;
  context: CompletionContext;
  maxTokens?: number;
  temperature?: number;
  stop?: string[];
}

export interface CompletionContext {
  notebookTitle: string;
  cellsBefore: Array<{ type: CellType; source: string }>;
  cellsAfter: Array<{ type: CellType; source: string }>;
  metadata?: Record<string, unknown>;
}

export interface CompletionResponse {
  requestId: string;
  completions: CompletionSuggestion[];
  meta?: Record<string, unknown>;
}

export interface CompletionSuggestion {
  text: string;
  insertMode: "insert" | "replace";
  confidence?: number;
  label?: string;
}

export interface CompletionChunk {
  text: string;
  done: boolean;
  fullText?: string;
}

export interface AIPluginOptions {
  providers: AICompletionProvider[];
  defaultProvider?: string;
  inlineDebounceMs?: number;
  contextWindow?: { before: number; after: number };
  enableInline?: boolean;
  enableChat?: boolean;
  enableGeneration?: boolean;
  enableRewrite?: boolean;
  systemPrompt?: string;
}

// --- Context Assembly ---

export function assembleContext(
  notebook: Readonly<Notebook>,
  cellId: string,
  window: { before: number; after: number } = { before: 5, after: 2 }
): CompletionContext {
  const cells = notebook.cells;
  const idx = cells.findIndex(c => c.id === cellId);

  const startBefore = Math.max(0, idx - window.before);
  const endAfter = Math.min(cells.length, idx + 1 + window.after);

  return {
    notebookTitle: notebook.title,
    cellsBefore: cells.slice(startBefore, idx).map(c => ({ type: c.type, source: c.source })),
    cellsAfter: cells.slice(idx + 1, endAfter).map(c => ({ type: c.type, source: c.source })),
    metadata: notebook.metadata,
  };
}

// --- Inline Completion Manager ---

let requestCounter = 0;
function nextRequestId(): string {
  return `req_${++requestCounter}_${Date.now()}`;
}

export class InlineCompletionManager {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentRequestId: string | null = null;
  private ghostText: string | null = null;
  private provider: AICompletionProvider;
  private debounceMs: number;
  private destroyed = false;

  constructor(provider: AICompletionProvider, debounceMs: number = 500) {
    this.provider = provider;
    this.debounceMs = debounceMs;
  }

  onInput(
    source: string,
    cursorOffset: number,
    cell: Readonly<Cell>,
    context: CompletionContext
  ): void {
    if (this.destroyed) return;

    this.dismiss();

    this.debounceTimer = setTimeout(async () => {
      const requestId = nextRequestId();
      this.currentRequestId = requestId;

      try {
        const response = await this.provider.getCompletions({
          requestId,
          type: "inline",
          source,
          cursorOffset,
          context,
        });

        // Check if this request is still current (not superseded)
        if (this.currentRequestId !== requestId || this.destroyed) return;

        if (response.completions.length > 0) {
          this.ghostText = response.completions[0].text;
        }
      } catch {
        // Silently ignore errors (network, cancellation, etc.)
      }
    }, this.debounceMs);
  }

  accept(mode: "all" | "word" = "all"): string | null {
    if (!this.ghostText) return null;

    let accepted: string;
    if (mode === "word") {
      const match = this.ghostText.match(/^\S+\s?/);
      accepted = match ? match[0] : this.ghostText;
      this.ghostText = this.ghostText.slice(accepted.length) || null;
    } else {
      accepted = this.ghostText;
      this.ghostText = null;
    }

    return accepted;
  }

  dismiss(): void {
    this.ghostText = null;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.currentRequestId && this.provider.cancel) {
      this.provider.cancel(this.currentRequestId);
    }
    this.currentRequestId = null;
  }

  getGhostText(): string | null {
    return this.ghostText;
  }

  destroy(): void {
    this.destroyed = true;
    this.dismiss();
  }
}

// --- OpenAI-Compatible Provider ---

export interface OpenAIProviderOptions {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  headers?: Record<string, string>;
  timeout?: number;
  systemPrompt?: string;
}

export function createOpenAIProvider(options: OpenAIProviderOptions): AICompletionProvider {
  const baseUrl = (options.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = options.model || "gpt-4o-mini";
  const timeout = options.timeout || 30000;
  const systemPrompt = options.systemPrompt ||
    "You are a helpful assistant for a scientific notebook editor. " +
    "Provide concise, accurate completions for the user's text.";

  const pendingRequests = new Map<string, AbortController>();

  function buildMessages(request: CompletionRequest): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add context cells
    if (request.context.cellsBefore.length > 0) {
      const contextText = request.context.cellsBefore
        .map(c => `[${c.type}]\n${c.source}`)
        .join("\n\n");
      messages.push({ role: "system", content: `Previous cells:\n${contextText}` });
    }

    if (request.type === "inline") {
      messages.push({
        role: "user",
        content: `Continue the following text naturally. Only output the continuation, nothing else.\n\n${request.source?.slice(0, request.cursorOffset)}`,
      });
    } else if (request.type === "rewrite") {
      const selected = request.source?.slice(request.selection?.start, request.selection?.end) || "";
      messages.push({
        role: "user",
        content: `Rewrite the following text: "${selected}"\n\nInstruction: ${request.prompt || "Improve this text"}`,
      });
    } else if (request.type === "generate") {
      messages.push({
        role: "user",
        content: request.prompt || "Generate content for the next cell",
      });
    } else {
      messages.push({
        role: "user",
        content: request.prompt || "",
      });
    }

    return messages;
  }

  return {
    id: "openai-compatible",
    name: `OpenAI (${model})`,
    supportsStreaming: true,

    async getCompletions(request: CompletionRequest): Promise<CompletionResponse> {
      const controller = new AbortController();
      pendingRequests.set(request.requestId, controller);

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
            ...options.headers,
          },
          body: JSON.stringify({
            model,
            messages: buildMessages(request),
            max_tokens: request.maxTokens || (request.type === "inline" ? 50 : 500),
            temperature: request.temperature ?? (request.type === "inline" ? 0.3 : 0.7),
            stop: request.stop,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";

        return {
          requestId: request.requestId,
          completions: text ? [{ text, insertMode: request.type === "rewrite" ? "replace" : "insert" }] : [],
          meta: { model: data.model, usage: data.usage },
        };
      } finally {
        pendingRequests.delete(request.requestId);
      }
    },

    async *getStreamingCompletion(request: CompletionRequest): AsyncIterable<CompletionChunk> {
      const controller = new AbortController();
      pendingRequests.set(request.requestId, controller);

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
            ...options.headers,
          },
          body: JSON.stringify({
            model,
            messages: buildMessages(request),
            max_tokens: request.maxTokens || 500,
            temperature: request.temperature ?? 0.7,
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]") continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                yield { text: delta, done: false, fullText };
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        yield { text: "", done: true, fullText };
      } finally {
        pendingRequests.delete(request.requestId);
      }
    },

    cancel(requestId: string): void {
      const controller = pendingRequests.get(requestId);
      if (controller) {
        controller.abort();
        pendingRequests.delete(requestId);
      }
    },

    async isAvailable(): Promise<boolean> {
      try {
        const response = await fetch(`${baseUrl}/models`, {
          headers: {
            ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
            ...options.headers,
          },
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
  };
}

// --- Plugin ---

export function aiPlugin(options: AIPluginOptions): SciNotebookPlugin {
  const contextWindow = options.contextWindow || { before: 5, after: 2 };
  const enableInline = options.enableInline !== false;
  const defaultProviderId = options.defaultProvider || options.providers[0]?.id;

  let completionManager: InlineCompletionManager | null = null;

  return {
    id: "sci-nb-ai",
    name: "AI Agent",
    version: "1.0.0",

    setup(ctx: PluginContext) {
      const provider = options.providers.find(p => p.id === defaultProviderId) || options.providers[0];
      if (!provider) {
        ctx.log.warn("No AI provider configured");
        return;
      }

      if (enableInline) {
        completionManager = new InlineCompletionManager(
          provider,
          options.inlineDebounceMs || 500
        );
      }

      ctx.log.info(`AI plugin initialized with provider: ${provider.name}`);
    },

    teardown() {
      if (completionManager) {
        completionManager.destroy();
        completionManager = null;
      }
    },
  };
}
