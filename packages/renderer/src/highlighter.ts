/**
 * Token-based syntax highlighting for code cells.
 * Uses a three-pass approach to highlight code without corrupting strings/comments.
 */

const JS_KW = "\\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|void|delete|null|undefined|true|false|NaN|Infinity)\\b";

const TS_KW = "\\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|void|delete|null|undefined|true|false|NaN|Infinity|type|interface|enum|implements|declare|readonly|abstract|as|is|keyof|never|unknown|any|string|number|boolean|symbol|bigint|object)\\b";

const PY_KW = "\\b(def|class|return|if|elif|else|for|while|break|continue|import|from|as|try|except|finally|raise|with|yield|lambda|pass|del|global|nonlocal|assert|True|False|None|and|or|not|in|is)\\b";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Three-pass syntax highlighter:
 * 1. Extract strings/comments into Unicode PUA placeholders
 * 2. Highlight keywords, numbers, functions, types, decorators
 * 3. Restore placeholders with highlighted strings/comments
 */
function tokenHighlight(escaped: string, lang: string): string {
  const placeholders: string[] = [];
  let idx = 0;
  // Unicode Private Use Area chars — invisible to \b, \w, [a-zA-Z], \d
  const mkKey = (n: number) =>
    `\uE000\uE001${String.fromCharCode(0xE100 + n)}\uE001\uE000`;

  const ph = (html: string): string => {
    const key = mkKey(idx++);
    placeholders.push(html);
    return key;
  };

  let result = escaped;

  // Pass 1: Extract strings
  result = result.replace(
    /(&quot;(?:[^&]|&(?!quot;))*?&quot;|&#39;(?:[^&]|&(?!#39;))*?&#39;|`(?:[^`\\]|\\.)*`)/g,
    (m) => ph(`<span class="sci-nb-hl-string">${m}</span>`)
  );

  // Extract // comments
  result = result.replace(/(\/\/.*)$/gm,
    (m) => ph(`<span class="sci-nb-hl-comment">${m}</span>`));

  // Extract # comments (Python)
  if (lang === "python" || lang === "py") {
    result = result.replace(/(#.*)$/gm,
      (m) => ph(`<span class="sci-nb-hl-comment">${m}</span>`));
  }

  // Pass 2: Highlight remaining code
  let kw: string;
  switch (lang) {
    case "typescript": case "tsx": case "ts": kw = TS_KW; break;
    case "python": case "py": kw = PY_KW; break;
    default: kw = JS_KW;
  }

  result = result.replace(new RegExp(kw, "g"),
    '<span class="sci-nb-hl-keyword">$&</span>');
  result = result.replace(/\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/gi,
    '<span class="sci-nb-hl-number">$1</span>');
  result = result.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
    '<span class="sci-nb-hl-function">$1</span>');
  result = result.replace(/(?<!")(?<!')(?<!;)\b([A-Z][a-zA-Z0-9_]*)\b/g,
    '<span class="sci-nb-hl-type">$1</span>');
  result = result.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)/g,
    '<span class="sci-nb-hl-decorator">@$1</span>');

  // Pass 3: Restore placeholders
  for (let i = 0; i < placeholders.length; i++) {
    result = result.replace(mkKey(i), placeholders[i]);
  }

  return result;
}

/**
 * Highlights source code and wraps in a <pre><code> block.
 */
export function highlightCodeTokens(source: string, lang: string): string {
  const escaped = escapeHtml(source);
  const highlighted = tokenHighlight(escaped, lang);
  return `<pre class="sci-nb-code sci-nb-code--highlighted"><code class="language-${lang}">${highlighted}</code></pre>`;
}
