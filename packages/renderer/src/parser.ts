import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token";

export interface MarkdownParser {
  /** Parse source into a token stream */
  parse(source: string): Token[];

  /** Render a token stream to HTML */
  render(tokens: Token[]): string;

  /** Register a plugin/extension on the parser */
  use(plugin: any, ...args: any[]): void;
}

export class MarkdownItParser implements MarkdownParser {
  private md: MarkdownIt;

  constructor(options: MarkdownIt.Options = {}) {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      ...options,
    });
  }

  parse(source: string): Token[] {
    return this.md.parse(source, {});
  }

  render(tokens: Token[]): string {
    return this.md.renderer.render(tokens, this.md.options, {});
  }

  use(plugin: any, ...args: any[]): void {
    this.md.use(plugin, ...args);
  }

  /** Direct render from source (shortcut) */
  renderSource(source: string): string {
    return this.md.render(source);
  }
}
