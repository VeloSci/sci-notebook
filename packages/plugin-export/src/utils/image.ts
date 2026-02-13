import { safeHtml2Canvas } from "./dom";
import { MM2PX } from "./common";

export interface ImageResult {
  url: string; // Base64 data URL
  w: number; // width in mm
  h: number; // height in mm
}

export function loadImg(src: string, useCors = false): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const i = new Image();
    if (useCors) i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = (e) => { console.warn('Image load failed:', src.slice(0, 80), e); fail(e); };
    i.src = src;
  });
}

export function normalizeSvgUrl(src: string): string {
  if (src.includes("/thumb/") && src.includes(".svg/")) {
    const [base, rest] = src.split("/thumb/");
    const parts = rest.split("/");
    const svgIdx = parts.findIndex(p => p.endsWith(".svg"));
    if (svgIdx >= 0) return `${base}/${parts.slice(0, svgIdx + 1).join("/")}`;
  }
  return src;
}

export async function svgToImage(svg: string, maxMm: number, scaleFactor: number = 5): Promise<ImageResult | null> {
  if (typeof document === "undefined") return null;
  try {
    const d = document.createElement("div"); d.innerHTML = svg.trim();
    const el = d.querySelector("svg"); if (!el) return null;
    let sw = parseFloat(el.getAttribute("width") || "0");
    let sh = parseFloat(el.getAttribute("height") || "0");
    const vb = el.getAttribute("viewBox");
    if ((!sw || !sh) && vb) { const p = vb.split(/[\s,]+/).map(Number); if (p.length === 4) { sw = p[2]; sh = p[3]; } }
    if (!sw || !sh) { sw = 400; sh = 300; }
    el.setAttribute("width", String(sw)); el.setAttribute("height", String(sh));
    el.querySelectorAll("foreignObject").forEach(fo => fo.remove());
    
    // Scale calculation
    const currentPx = sw;
    const maxPx = maxMm * MM2PX;
    const scaleToMax = currentPx > 0 ? Math.min(maxPx / currentPx, scaleFactor) : 1; 
    // Simplified scaling logic from original files:
    // PDF used: Math.min((maxMm * MM2PX) / sw, 4)
    // DOCX used: Math.min(maxW / sw, 3)
    
    const cw = Math.round(sw * scaleToMax);
    const ch = Math.round(sh * scaleToMax);
    
    const svgData = new XMLSerializer().serializeToString(el);
    const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    const img = await loadImg(dataUrl);
    
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    
    return { url: c.toDataURL("image/png"), w: cw / MM2PX, h: ch / MM2PX };
  } catch (e) {
    console.warn("svgToImage failed:", e);
    return null;
  }
}

export async function fetchSvgAsData(src: string, maxMm: number): Promise<ImageResult | null> {
  try {
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) return null;
    const svg = await res.text();
    return svgToImage(svg, maxMm);
  } catch (e) {
    console.warn("fetchSvgAsData failed:", e);
    return null;
  }
}

export async function fetchImgAsData(src: string, maxMm: number): Promise<ImageResult | null> {
  if (typeof document === "undefined") return null;
  try {
    const img = await loadImg(src, true);
    // Baseline for "web" size is 96 DPI: 96 / 25.4 = 3.7795 px / mm
    const screenPxPerMm = 3.7795;
    
    // Use original pixel dimensions for the canvas to maintain native resolution
    const cw = img.naturalWidth;
    const ch = img.naturalHeight;
    
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    
    // Calculate physical size in mm at 96 DPI baseline
    return { url: c.toDataURL("image/png"), w: cw / screenPxPerMm, h: ch / screenPxPerMm };
  } catch (e) {
    console.warn("fetchImgAsData failed:", e);
    return null;
  }
}
