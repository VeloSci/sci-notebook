import { UNSUPPORTED_COLOR_RE, sanitizeColorValue } from "./common";
import html2canvas from "html2canvas";

export function patchGetComputedStyle(): () => void {
  const original = window.getComputedStyle;
  window.getComputedStyle = function(elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const cs = original.call(this, elt, pseudoElt);
    return new Proxy(cs, {
      get(target, prop) {
        const val = Reflect.get(target, prop, target);
        if (typeof prop === "string" && typeof val === "string" && UNSUPPORTED_COLOR_RE.test(val)) {
          UNSUPPORTED_COLOR_RE.lastIndex = 0;
          return sanitizeColorValue(val, prop);
        }
        if (typeof val === "function") return val.bind(target);
        return val;
      },
    });
  };
  return () => { window.getComputedStyle = original; };
}

export async function safeHtml2Canvas(el: HTMLElement, opts: Parameters<typeof html2canvas>[1]): Promise<HTMLCanvasElement> {
  const restore = patchGetComputedStyle();
  try {
    return await html2canvas(el, opts);
  } finally {
    restore();
  }
}
