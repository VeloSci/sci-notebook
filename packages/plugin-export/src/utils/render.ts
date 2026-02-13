import { safeHtml2Canvas } from "./dom";
import { MM2PX } from "./common";
import html2canvas from "html2canvas";

export interface RenderResult {
  url: string;
  w: number; // width in mm
  h: number; // height in mm
}

export async function renderKatex(tex: string, maxMm: number, display: boolean): Promise<RenderResult | null> {
  const katex = (globalThis as any).katex;
  if (!katex?.renderToString || typeof document === "undefined") return null;
  
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:auto;height:auto;overflow:visible;z-index:99999;pointer-events:none;`;
  const el = document.createElement("div");
  
  try {
    const html = katex.renderToString(tex, { displayMode: display, throwOnError: false });
    // Font size adjustments for print readability
    const fs = display ? 22 : 16;
    el.style.cssText = `background:#fff;color:#1a1a2e;padding:${display ? "12px 16px" : "4px 6px"};font-size:${fs}px;line-height:1.5;display:inline-block;`;
    el.innerHTML = html;
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);
    
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise(r => setTimeout(r, 60));
    
    // Scale for high resolution (3.125 * 96 = 300 DPI)
    const scale = 3.2; 
    const canvas = await safeHtml2Canvas(el, {
      scale,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });
    
    document.body.removeChild(wrapper);
    if (canvas.width < 2 || canvas.height < 2) return null;
    
    // Convert px (at ~288dpi) to mm
    // 96 * 3 = 288 dpi.
    const pxToMm = 25.4 / (96 * scale);
    return { 
      url: canvas.toDataURL("image/png"), 
      w: canvas.width * pxToMm, 
      h: canvas.height * pxToMm 
    };
  } catch (e) {
    console.warn('renderKatex failed:', e);
    try { document.body.removeChild(wrapper); } catch {}
    return null;
  }
}

export async function renderMermaid(src: string, maxMm: number): Promise<RenderResult | null> {
  const mm = (globalThis as any).mermaid;
  if (!mm?.render || typeof document === "undefined") return null;
  
  try {
    try { 
      mm.initialize({ 
        theme: 'default', 
        startOnLoad: false,
        themeVariables: { fontSize: '20px', labelFontSize: '20px' } // Increase base font size for higher resolution capture
      }); 
    } catch {}
    const id = `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const r = await mm.render(id, src.trim());
    if (!r?.svg) return null;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;width:5000px;"; // Ultra-wide container
    const el = document.createElement("div");
    el.style.cssText = "background:#fff;display:inline-block;padding:24px;"; // More padding for extreme scaling
    el.innerHTML = r.svg;
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);

    // Force SVG to be very large for 600 DPI capture detail
    const svgEl = el.querySelector("svg");
    if (svgEl) {
      svgEl.style.width = "100%";
      svgEl.style.height = "auto";
      svgEl.style.maxWidth = "4000px"; // Extreme detail
    }

    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise(r => setTimeout(r, 200));

    // Scale 6.25 results in exactly 600 DPI (96 * 6.25 = 600)
    const scale = 6.25;

    const canvas = await safeHtml2Canvas(el, {
      scale,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });
    document.body.removeChild(wrapper);
    
    if (canvas.width < 2 || canvas.height < 2) return null;
    
    const pxToMm = 25.4 / (96 * scale);
    const url = canvas.toDataURL("image/png");
    
    return { 
      url, 
      w: canvas.width * pxToMm, 
      h: canvas.height * pxToMm 
    };
  } catch (e) {
    console.warn('renderMermaid failed:', e);
    return null;
  }
}
