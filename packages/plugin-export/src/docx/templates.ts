import { escapeXml, formatBase64 } from "../utils/text";

export const SHAPE_TYPE_DEF = `
<w:p>
  <w:r>
    <w:pict>
      <v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f">
        <v:stroke joinstyle="miter"/>
        <v:formulas>
          <v:f eqn="if lineDrawn pixelLineWidth 0"/>
          <v:f eqn="sum @0 1 0"/>
          <v:f eqn="sum 0 0 @1"/>
          <v:f eqn="prod @2 1 2"/>
          <v:f eqn="prod @3 21600 pixelWidth"/>
          <v:f eqn="prod @3 21600 pixelHeight"/>
          <v:f eqn="sum @0 0 1"/>
          <v:f eqn="prod @6 1 2"/>
          <v:f eqn="prod @7 21600 pixelWidth"/>
          <v:f eqn="sum @8 21600 0"/>
          <v:f eqn="prod @7 21600 pixelHeight"/>
          <v:f eqn="sum @10 21600 0"/>
        </v:formulas>
        <v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/>
        <o:lock v:ext="edit" aspectratio="t"/>
      </v:shapetype>
    </w:pict>
  </w:r>
</w:p>`;

export function wPara(content: string): string { return `<w:p><w:r><w:t>${content}</w:t></w:r></w:p>`; }

export function vmlImage(base64: string, w_mm: number, h_mm: number, center: boolean, counter: { val: number }): string {
  counter.val++;
  const imgId = `img${counter.val}`;
  const imgName = `wordml://${imgId}.png`;
  const maxW_pt = 460;
  let w_pt = w_mm * (72 / 25.4);
  let h_pt = h_mm * (72 / 25.4);
  if (w_pt > maxW_pt) { const r = maxW_pt / w_pt; w_pt = maxW_pt; h_pt *= r; }
  const jc = center ? `<w:jc w:val="center"/>` : "";
  return `<w:p><w:pPr>${jc}</w:pPr><w:r><w:pict>
    <w:binData w:name="${imgName}">${formatBase64(base64)}</w:binData>
    <v:shape id="${imgId}" o:spt="75" coordsize="21600,21600" style="width:${Math.round(w_pt)}pt;height:${Math.round(h_pt)}pt" filled="f" stroked="f">
      <v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/>
      <o:lock v:ext="edit" aspectratio="t"/>
      <v:imagedata src="${imgName}" o:title="${imgId}"/>
    </v:shape>
  </w:pict></w:r></w:p>`;
}

export function vmlImageInline(base64: string, w_mm: number, h_mm: number, counter: { val: number }): string {
  counter.val++;
  const imgId = `img${counter.val}`;
  const imgName = `wordml://${imgId}.png`;
  let w_pt = w_mm * (72 / 25.4);
  let h_pt = h_mm * (72 / 25.4);
  if (h_pt > 16) { const r = 16 / h_pt; h_pt = 16; w_pt *= r; }
  return `<w:r><w:pict>
    <w:binData w:name="${imgName}">${formatBase64(base64)}</w:binData>
    <v:shape id="${imgId}" o:spt="75" coordsize="21600,21600" style="width:${Math.round(w_pt)}pt;height:${Math.round(h_pt)}pt" filled="f" stroked="f">
      <v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/>
      <o:lock v:ext="edit" aspectratio="t"/>
      <v:imagedata src="${imgName}" o:title="${imgId}"/>
    </v:shape>
  </w:pict></w:r>`;
}
