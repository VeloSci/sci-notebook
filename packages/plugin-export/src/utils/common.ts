export const DPI = 300;
export const MM2PX = DPI / 25.4;

export const UNSUPPORTED_COLOR_RE = /oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|lch\([^)]*\)/gi;

export function sanitizeColorValue(value: string, prop: string): string {
  if (!UNSUPPORTED_COLOR_RE.test(value)) return value;
  UNSUPPORTED_COLOR_RE.lastIndex = 0;
  if (prop === "box-shadow" || prop === "text-shadow") return "none";
  if (prop === "color" || prop === "caret-color" || prop === "fill") {
    return value.replace(UNSUPPORTED_COLOR_RE, "#1a1a2e");
  }
  return value.replace(UNSUPPORTED_COLOR_RE, "transparent");
}
