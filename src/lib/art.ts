/**
 * Locally generated placeholder artwork. This used to live on the server
 * (/api/art/...). It now runs in the browser and returns a data URI, so a
 * static deployment needs no image endpoint at all.
 */

export type ArtKind = "poster" | "backdrop";

export interface ArtOptions {
  title?: string;
  year?: string | number;
  kind?: ArtKind;
  seed?: string | number;
}

const PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ["#150826", "#5b21b6", "#f0a868"],
  ["#03181f", "#0f5c6b", "#e8c07d"],
  ["#1c0606", "#7a1f1f", "#f2c078"],
  ["#050b16", "#1c3f6e", "#b8e0d2"],
  ["#140814", "#5a2a50", "#f2b8a0"],
  ["#08110b", "#2f5b3f", "#e6d5a8"],
  ["#0a0a12", "#33335c", "#cfc6bd"],
  ["#1a0f03", "#7a4a12", "#ffd8a0"],
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return Math.abs(h);
}

function escapeXml(value: string): string {
  return String(value).replace(
    /[<>&"']/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c] as string,
  );
}

function wrap(text: string, perLine: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > perLine && line) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function artworkSvg({ title = "Untitled", year = "", kind = "poster", seed = "0" }: ArtOptions = {}): string {
  const label = String(title || "Untitled");
  const yearText = String(year || "").slice(0, 4);
  const poster = kind !== "backdrop";
  const w = poster ? 500 : 1280;
  const h = poster ? 750 : 720;
  const hx = hash(String(seed) + label);
  const [a, b, c] = PALETTES[hx % PALETTES.length];
  const glowX = 0.66 + (hx % 19) / 100;
  const ringX = w * glowX;
  const ringY = h * (0.1 + (hx % 13) / 100);
  const arcLeft = hx % 2 === 0;
  const arc = arcLeft
    ? `<path d="M${w * 0.42} ${h} A ${w * 0.55} ${w * 0.55} 0 0 1 ${w} ${h * 0.38}" fill="none" stroke="${c}" stroke-opacity=".14" stroke-width="${poster ? 2 : 3}"/>`
    : `<path d="M${w * 0.58} ${h} A ${w * 0.55} ${w * 0.55} 0 0 0 0 ${h * 0.34}" fill="none" stroke="${c}" stroke-opacity=".14" stroke-width="${poster ? 2 : 3}"/>`;
  const lines = wrap(label, poster ? 15 : 26);
  const size = poster ? 44 : 62;
  const baseY = h - (poster ? 124 : 170);
  const tspans = lines
    .map((line, i) => `<tspan x="46" dy="${i === 0 ? 0 : size * 1.04}">${escapeXml(line)}</tspan>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}"/><stop offset="52%" stop-color="${b}"/><stop offset="100%" stop-color="${a}"/>
    </linearGradient>
    <radialGradient id="glow" cx="${glowX * 100}%" cy="16%" r="60%">
      <stop offset="0%" stop-color="${c}" stop-opacity=".55"/>
      <stop offset="45%" stop-color="${c}" stop-opacity=".16"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="38%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".92"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="45%" r="78%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".55"/>
    </radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".12"/></feComponentTransfer></filter>
    <clipPath id="c"><rect width="${w}" height="${h}" rx="${poster ? 18 : 0}"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <rect width="${w}" height="${h}" fill="url(#glow)"/>
    <circle cx="${ringX}" cy="${ringY}" r="${w * 0.2}" fill="none" stroke="${c}" stroke-opacity=".4" stroke-width="1.5"/>
    <circle cx="${ringX}" cy="${ringY}" r="${w * 0.13}" fill="none" stroke="${c}" stroke-opacity=".22" stroke-width="1.5"/>
    ${arc}
    <rect width="${w}" height="${h}" fill="url(#vignette)"/>
    <rect width="${w}" height="${h}" filter="url(#grain)" opacity=".55"/>
    ${poster ? `<rect y="${h * 0.5}" width="${w}" height="${h * 0.5}" fill="url(#scrim)"/>` : ""}
    ${poster ? `<text x="46" y="60" fill="${c}" fill-opacity=".85" font-family="Helvetica, Arial, sans-serif" font-size="15" letter-spacing="6">CINEFLOW</text>` : ""}
    ${
      poster
        ? `<line x1="46" y1="${baseY - size - 26}" x2="86" y2="${baseY - size - 26}" stroke="${c}" stroke-width="2"/>
    <text x="46" y="${baseY}" fill="#fff" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" font-weight="700">${tspans}</text>
    ${yearText ? `<text x="46" y="${h - 56}" fill="#fff" fill-opacity=".55" font-family="Helvetica, Arial, sans-serif" font-size="17" letter-spacing="2">${escapeXml(yearText)}</text>` : ""}`
        : ""
    }
  </g>
</svg>`;
}

/** Data URI for the generated artwork: usable directly in <img src>. */
export function artUrl(options: ArtOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(artworkSvg(options))}`;
}
