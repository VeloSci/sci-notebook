# 07 — AI Agent Integration

## Overview

The AI integration layer provides a protocol for connecting external AI agents
(LLMs, code assistants, custom models) to the notebook editor. It enables:

1. **Inline completions** — Ghost text predictions as the user types (VSCode-style).
2. **Cell rewriting** — Select text → ask AI to rewrite/improve/translate.
3. **Cell generation** — Generate new cells from a prompt.
4. **Chat sidebar** — Conversational AI panel for Q&A about notebook content.

All AI features are provided by the `plugin-ai` package and are entirely
opt-in. The core has zero AI dependencies.

---

## AI Provider Interface

The plugin accepts one or more **providers**. A provider is an adapter to a
specific AI service (OpenAI, Anthropic, Ollama, custom endpoint, etc.).

```typescript
interface AICompletionProvider {
  /** Unique provider ID */
  id: string;

  /** Human-readable name */
  name: string;

  /** Whether this provider supports streaming */
  supportsStreaming: boolean;

  /** Get inline completion suggestions */
  getCompletions(request: CompletionRequest): Promise<CompletionResponse>;

  /** Get a streaming completion (for chat / rewrite) */
  getStreamingCompletion?(request: CompletionRequest): AsyncIterable<CompletionChunk>;

  /** Cancel an in-flight request */
  cancel?(requestId: string): void;

  /** Check if the provider is available (API key set, server reachable) */
  isAvailable(): Promise<boolean>;
}
```

---

## Request / Response Types

```typescript
interface CompletionRequest {
  /** Unique request ID for cancellation */
  requestId: string;

  /** The type of completion requested */
  type: "inline" | "rewrite" | "generate" | "chat";

  /** Current cell source (for inline/rewrite) */
  source?: string;

  /** Cursor position within the source */
  cursorOffset?: number;

  /** Selected text range (for rewrite) */
  selection?: { start: number; end: number };

  /** User prompt (for generate/chat/rewrite) */
  prompt?: string;

  /** Surrounding context: previous and next cells */
  context: CompletionContext;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Temperature (0-2) */
  temperature?: number;

  /** Stop sequences */
  stop?: string[];
}

interface CompletionContext {
  /** Full notebook title */
  notebookTitle: string;

  /** Sources of cells before the current cell (last N) */
  cellsBefore: Array<{ type: CellType; source: string }>;

  /** Sources of cells after the current cell (next N) */
  cellsAfter: Array<{ type: CellType; source: string }>;

  /** Notebook-level metadata (tags, language hints, etc.) */
  metadata: NotebookMetadata;

  /** Number of context cells to include (default: 5 before, 2 after) */
  contextWindow?: { before: number; after: number };
}

interface CompletionResponse {
  requestId: string;

  /** Completion suggestions (may be multiple) */
  completions: CompletionSuggestion[];

  /** Provider-specific metadata (token usage, model name, etc.) */
  meta?: Record<string, unknown>;
}

interface CompletionSuggestion {
  /** The suggested text */
  text: string;

  /** Where to insert (for inline: after cursor; for rewrite: replaces selection) */
  insertMode: "insert" | "replace";

  /** Confidence score (0-1, optional) */
  confidence?: number;

  /** Display label (e.g., "GPT-4o", "Claude 3.5") */
  label?: string;
}

interface CompletionChunk {
  /** Incremental text chunk */
  text: string;

  /** Whether this is the final chunk */
  done: boolean;

  /** Accumulated full text so far */
  fullText?: string;
}
```

---

## Inline Completions (Ghost Text)

### Trigger Conditions

Inline completions are triggered when:

1. The user pauses typing for a configurable debounce period (default: 500ms).
2. The cursor is at the end of a line or after whitespace.
3. The current cell is in edit mode.
4. No other completion is currently displayed.

### Ghost Text Rendering

The completion is rendered as semi-transparent "ghost text" after the cursor:

```
The integral of f(x) from 0 to 1 is|  approximately 0.693 for f(x) = 1/x
                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                     ghost text (gray, italic)
```

### Accept / Reject

| Action          | Key           | Effect                           |
|-----------------|---------------|----------------------------------|
| Accept all      | `Tab`         | Insert full ghost text            |
| Accept word     | `Cmd+→`       | Insert next word of ghost text    |
| Reject          | `Escape`      | Dismiss ghost text                |
| Ignore          | Keep typing   | Ghost text dismissed, new request |

### Debounce & Cancellation

```typescript
class InlineCompletionManager {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentRequestId: string | null = null;
  private provider: AICompletionProvider;
  private debounceMs: number;

  constructor(provider: AICompletionProvider, debounceMs?: number);

  /** Called on every keystroke */
  onInput(source: string, cursorOffset: number, cell: Cell, context: CompletionContext): void;

  /** Accept the current ghost text (full or partial) */
  accept(mode: "all" | "word"): string | null;

  /** Dismiss the current ghost text */
  dismiss(): void;

  /** Get current ghost text (if any) */
  getGhostText(): string | null;

  /** Destroy and cancel pending requests */
  destroy(): void;
}
```

---

## Cell Rewriting

The user selects text in a cell, triggers the rewrite command (toolbar button
or `Cmd+Shift+R`), and enters a prompt:

```
┌──────────────────────────────────────────┐
│ Rewrite: "Make this more concise"        │
│ ┌──────────────────────────────────────┐ │
│ │ Original:                            │ │
│ │ The derivative of x squared with     │ │
│ │ respect to x is equal to 2x.         │ │
│ ├──────────────────────────────────────┤ │
│ │ Suggestion:                          │ │
│ │ d/dx(x²) = 2x                        │ │
│ └──────────────────────────────────────┘ │
│              [Accept]  [Reject]  [Edit]  │
└──────────────────────────────────────────┘
```

### Rewrite Flow

1. User selects text → triggers rewrite.
2. A floating panel appears with the selected text and a prompt input.
3. The AI generates a rewritten version (streamed if supported).
4. User can accept (replaces selection), reject, or edit the suggestion.
5. Accepted rewrites are recorded in undo history as a single operation.

---

## Cell Generation

The user can generate entire new cells from a prompt:

1. Click "Generate with AI" in the toolbar or press `Cmd+Shift+G`.
2. A prompt input appears (inline or modal).
3. The AI generates one or more cells.
4. Cells are inserted after the current cell.
5. The user can accept, reject, or regenerate.

### Generation Request

```typescript
interface GenerateRequest extends CompletionRequest {
  type: "generate";
  prompt: string;

  /** Desired output cell types */
  outputTypes?: CellType[];

  /** Number of cells to generate (hint, not guaranteed) */
  cellCount?: number;
}
```

---

## Chat Sidebar

An optional sidebar panel for conversational interaction:

```typescript
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  /** Cell references mentioned in this message */
  cellRefs?: string[];
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
}
```

The chat sidebar can:
- Answer questions about the notebook content.
- Suggest edits to specific cells (with "Apply" buttons).
- Generate new cells from conversation.
- Explain LaTeX formulas or code blocks.

---

## Plugin Configuration

```typescript
export interface AIPluginOptions {
  /** AI completion providers (at least one required) */
  providers: AICompletionProvider[];

  /** Default provider ID */
  defaultProvider?: string;

  /** Inline completion debounce in ms (default: 500) */
  inlineDebounceMs?: number;

  /** Maximum context cells to send (default: { before: 5, after: 2 }) */
  contextWindow?: { before: number; after: number };

  /** Whether to enable inline completions (default: true) */
  enableInline?: boolean;

  /** Whether to enable the chat sidebar (default: true) */
  enableChat?: boolean;

  /** Whether to enable cell generation (default: true) */
  enableGeneration?: boolean;

  /** Whether to enable rewriting (default: true) */
  enableRewrite?: boolean;

  /** System prompt prepended to all requests */
  systemPrompt?: string;

  /** Custom prompt templates */
  promptTemplates?: {
    inline?: string;
    rewrite?: string;
    generate?: string;
    chat?: string;
  };
}
```

---

## Built-in Provider: OpenAI-Compatible

A generic provider for any OpenAI-compatible API (OpenAI, Azure, Ollama,
LM Studio, vLLM, etc.):

```typescript
export interface OpenAIProviderOptions {
  /** API base URL (default: "https://api.openai.com/v1") */
  baseUrl?: string;

  /** API key (can also be set via environment variable) */
  apiKey?: string;

  /** Model name (default: "gpt-4o-mini") */
  model?: string;

  /** Custom headers */
  headers?: Record<string, string>;

  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

export function createOpenAIProvider(options: OpenAIProviderOptions): AICompletionProvider;
```

### Usage Example

```typescript
import { createNotebook } from "@velo-sci/notebook-core";
import { aiPlugin } from "@velo-sci/notebook-plugin-ai";
import { createOpenAIProvider } from "@velo-sci/notebook-plugin-ai/providers/openai";

const notebook = createNotebook({
  plugins: [
    aiPlugin({
      providers: [
        createOpenAIProvider({
          apiKey: "sk-...",
          model: "gpt-4o-mini",
        }),
      ],
      inlineDebounceMs: 400,
      enableChat: true,
    }),
  ],
});
```

---

## Security & Privacy

- **API keys** are never stored in the notebook document. They are passed
  via plugin configuration at runtime.
- **Context sent to AI** is limited to the configured context window.
  Users can reduce it or disable context entirely.
- **No telemetry** — the plugin never phones home. All requests go directly
  to the configured provider endpoint.
- **Local-first** — works with local models (Ollama, LM Studio) out of the box.

---

## Performance Considerations

- Inline completions use **debouncing** to avoid flooding the API.
- Requests are **cancelled** when the user continues typing.
- Streaming responses render **incrementally** (no waiting for full response).
- The chat sidebar uses **virtual scrolling** for long conversations.
- Provider responses are **not cached** (they depend on dynamic context).
