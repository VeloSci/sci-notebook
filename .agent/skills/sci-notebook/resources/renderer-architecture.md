---
description: How the markdown-it AST transforms and renders text
---
# Renderer Architecture

`sci-notebook` is not just a collection of text inputs. The core relies on an intense `markdown-it` parsing engine.

## The AST (Abstract Syntax Tree)
When a user types in a `markdown` cell, the text is fed to `notebook-renderer`.
This parses the plain text into an AST of tokens. We run several plugins over this AST:
1. `math`: Parses `$$` blocks into KaTeX elements.
2. `frontmatter`: Strips out YAML metadata.
3. `custom-containers`: Renders alert blocks like `::: info`.

## Caching Strategy
Rendering 10,000 words on every keystroke freezes the browser. `notebook-renderer` uses an LRU cache mapping the exact `source` string to the generated HTML string.
Do not bypass the renderer to inject manual `dangerouslySetInnerHTML` in React components, as you will break the LRU performance optimizations.
