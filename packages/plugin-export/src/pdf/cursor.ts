import { jsPDF } from "jspdf";

export const COL = {
  text: [26, 26, 46] as const,
  dim: [100, 116, 139] as const,
  accent: [139, 92, 246] as const,
  codeBg: [241, 245, 249] as const,
  codeFg: [30, 41, 59] as const,
  tblBorder: [203, 213, 225] as const,
  tblHead: [248, 250, 252] as const,
  white: [255, 255, 255] as const,
  rule: [226, 232, 240] as const,
};

export const FZ = { body: 10, h1: 20, h2: 16, h3: 13, code: 8.5, sm: 8 };
export const SP = { ln: 4.5, para: 3, gap: 5, codeLn: 3.5, tblRow: 6 };

export class Cur {
  y: number; pg = 1; total = 0;
  constructor(public doc: jsPDF, public W: number, public H: number,
    public m: { top: number; right: number; bottom: number; left: number },
    public pgNum: boolean) { this.y = m.top; }
  get cw() { return this.W - this.m.left - this.m.right; }
  get maxY() { return this.H - this.m.bottom; }
  get L() { return this.m.left; }
  get R() { return this.W - this.m.right; }
  fit(h: number) { if (this.y + h > this.maxY) this.np(); }
  np() { this.footer(); this.doc.addPage(); this.pg++; this.y = this.m.top; }
  adv(h: number) { this.y += h; }
  footer() {
    if (!this.pgNum) return;
    this.doc.setFontSize(FZ.sm); this.doc.setTextColor(...COL.dim);
    this.doc.text(`${this.pg}`, this.W / 2, this.H - 5, { align: "center" });
  }
  done() { this.footer(); }
}
