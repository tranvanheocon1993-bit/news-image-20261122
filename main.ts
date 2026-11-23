// MILO News 22 Nov — one-page world news image, SUNDAY 22 NOVEMBER 2026.
// 36 verified stories, 7 regions. Pure TypeScript, Node stdlib only.
// Draws a 1024x1024 PNG with a hand-rolled 5x7 bitmap font and PNG encoder.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1024;
const H = 1024;

// ---------- 5x7 bitmap font ----------
// Each glyph: 7 rows, each a 5-bit number (bit 4 = leftmost pixel).
const FONT: Record<string, number[]> = {
  " ": [0, 0, 0, 0, 0, 0, 0],
  "0": [14, 17, 17, 17, 17, 17, 14],
  "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 6, 8, 16, 31],
  "3": [31, 2, 4, 2, 1, 17, 14],
  "4": [2, 6, 10, 18, 31, 2, 2],
  "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14],
  "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14],
  "9": [14, 17, 17, 15, 1, 2, 12],
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 28, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  a: [0, 0, 14, 1, 15, 17, 15],
  b: [16, 16, 22, 25, 17, 17, 30],
  c: [0, 0, 14, 16, 16, 17, 14],
  d: [1, 1, 13, 19, 17, 17, 15],
  e: [0, 0, 14, 17, 31, 16, 14],
  f: [6, 8, 8, 30, 8, 8, 8],
  g: [0, 15, 17, 17, 15, 1, 14],
  h: [16, 16, 22, 25, 17, 17, 17],
  i: [4, 0, 12, 4, 4, 4, 14],
  j: [2, 0, 6, 2, 2, 18, 12],
  k: [16, 16, 18, 20, 28, 20, 18],
  l: [12, 4, 4, 4, 4, 4, 14],
  m: [0, 0, 26, 21, 21, 21, 21],
  n: [0, 0, 22, 25, 17, 17, 17],
  o: [0, 0, 14, 17, 17, 17, 14],
  p: [0, 0, 30, 17, 30, 16, 16],
  q: [0, 0, 13, 19, 15, 1, 1],
  r: [0, 0, 22, 28, 16, 16, 16],
  s: [0, 0, 15, 16, 14, 1, 30],
  t: [8, 8, 30, 8, 8, 9, 6],
  u: [0, 0, 17, 17, 17, 19, 13],
  v: [0, 0, 17, 17, 17, 10, 4],
  w: [0, 0, 17, 21, 21, 21, 10],
  x: [0, 0, 17, 10, 4, 10, 17],
  y: [0, 0, 17, 17, 15, 1, 14],
  z: [0, 0, 31, 2, 4, 8, 31],
  ".": [0, 0, 0, 0, 0, 12, 12],
  ",": [0, 0, 0, 0, 12, 4, 8],
  ":": [0, 12, 0, 0, 0, 12, 0],
  ";": [0, 12, 0, 0, 12, 4, 8],
  "!": [4, 4, 4, 4, 4, 0, 4],
  "?": [14, 17, 1, 6, 4, 0, 4],
  "-": [0, 0, 0, 31, 0, 0, 0],
  "/": [1, 1, 2, 4, 8, 16, 16],
  "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8],
  "%": [25, 25, 2, 4, 8, 19, 19],
  "+": [0, 4, 4, 31, 4, 4, 0],
  "=": [0, 0, 31, 0, 31, 0, 0],
  "&": [12, 18, 20, 8, 21, 18, 13],
  "'": [4, 4, 8, 0, 0, 0, 0],
  '"': [10, 10, 0, 0, 0, 0, 0],
  "\u2022": [0, 0, 4, 14, 14, 4, 0],
  "\u2014": [0, 0, 0, 31, 0, 0, 0],
  "\u2019": [4, 4, 8, 0, 0, 0, 0],
  "\u00e9": [0, 2, 14, 17, 31, 16, 14],
  $: [4, 14, 21, 14, 21, 14, 4],
  "\u20ac": [14, 17, 30, 16, 30, 17, 14],
};
const GLYPH_W = 5;
const GLYPH_H = 7;

function textWidth(text: string, scale: number): number {
  return text.length * (GLYPH_W + 1) * scale - scale;
}

// ---------- pixel canvas ----------
type RGB = [number, number, number];
const NAVY: RGB = [22, 35, 63];
const NAVY2: RGB = [30, 48, 84];
const AMBER: RGB = [232, 163, 61];
const PAPER: RGB = [250, 247, 240];
const INK: RGB = [26, 26, 26];
const GRAY: RGB = [90, 100, 114];
const LIGHT: RGB = [234, 240, 246];
const WHITE: RGB = [255, 255, 255];
const MAPLAND: RGB = [185, 201, 220];
const MAPLINE: RGB = [140, 160, 185];

const REGION_COLORS: Record<string, RGB> = {
  Europe: [46, 111, 183],
  "N. America": [192, 57, 43],
  "S. America": [39, 174, 96],
  "Middle East": [211, 84, 0],
  Asia: [142, 68, 173],
  Africa: [183, 149, 11],
  Global: [22, 160, 133],
};

const buf = new Uint8Array(W * H * 4);

function setPixel(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
  buf[i + 3] = 255;
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(xx, yy, c);
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let yy = cy - r; yy <= cy + r; yy++) {
    for (let xx = cx - r; xx <= cx + r; xx++) {
      if ((xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) <= r * r) setPixel(xx, yy, c);
    }
  }
}

function drawText(x: number, y: number, text: string, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of text) {
    const glyph = FONT[ch] ?? FONT["?"];
    for (let row = 0; row < GLYPH_H; row++) {
      const bits = glyph[row];
      for (let col = 0; col < GLYPH_W; col++) {
        if (bits & (1 << (GLYPH_W - 1 - col))) {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              setPixel(cx + col * scale + dx, y + row * scale + dy, c);
            }
          }
        }
      }
    }
    cx += (GLYPH_W + 1) * scale;
  }
}

function drawTextCentered(y: number, text: string, scale: number, c: RGB): void {
  drawText(Math.floor((W - textWidth(text, scale)) / 2), y, text, scale, c);
}

// ---------- PNG encoder ----------
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0;
    Buffer.from(buf.buffer, y * W * 4, W * 4).copy(raw, y * (1 + W * 4) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const idat = deflateSync(raw, { level: 9 });
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---------- 36 verified stories, 22 Nov 2026 ----------
// GOOD's 4 leads first (numbered 1-4), then the rest grouped by region.
// Every story was reported on Sunday 22 November 2026 (AFP / AP / Reuters / Al Jazeera).
type Story = { n: number; region: string; head: string; lead?: string; sub?: string };
const STORIES: Story[] = [
  { n: 1, region: "Europe", head: "Russian missiles fall in Poland", lead: "Russian missiles fall in Poland", sub: "NATO: serious airspace violation  \u2022  Europe" },
  { n: 2, region: "Middle East", head: "Houthis hit Riyadh", lead: "Houthis hit Riyadh", sub: "Saudi intercepts 3 ballistic missiles  \u2022  Middle East" },
  { n: 3, region: "S. America", head: "6.7 quake strikes central Peru", lead: "6.7 quake strikes central Peru", sub: "No deaths recorded  \u2022  South America" },
  { n: 4, region: "N. America", head: "Trump vows 10% credit-card cap", lead: "Trump vows 10% credit-card cap", sub: "With Democratic Congress  \u2022  North America" },
  { n: 5, region: "Europe", head: "COP31 ends with no deal as EU rejects fossil-fuel-free text" },
  { n: 6, region: "Europe", head: "Russian cargo ship ablaze in Baltic after drone strike" },
  { n: 7, region: "Europe", head: "Russian drone collapses Kyiv-region block \u2014 14 missing" },
  { n: 8, region: "Europe", head: "Missile hits Kryvyi Rih \u2014 2 killed, about 60 wounded" },
  { n: 9, region: "Europe", head: "EU and Indonesia sign landmark trade deal" },
  { n: 10, region: "Europe", head: "EU proposes Big Tech tax and \u20ac200bn budget cuts" },
  { n: 11, region: "N. America", head: "Democrats clinch House majority \u2014 258 seats, best since 1992" },
  { n: 12, region: "N. America", head: "Delta glitch delays hundreds of Atlanta flights" },
  { n: 13, region: "N. America", head: "US probes alleged spy tied to ex-Nvidia chief" },
  { n: 14, region: "N. America", head: "US seeks answers on Nvidia chip sales to China" },
  { n: 15, region: "N. America", head: "FBI crime database hacked, records access disrupted" },
  { n: 16, region: "N. America", head: "Mexico captures 'El Chapo Isidro' \u2014 11 killed in raid" },
  { n: 17, region: "S. America", head: "Brazil town clears rubble after deadly storm" },
  { n: 18, region: "S. America", head: "Bolsonaro 'stable' in intensive care" },
  { n: 19, region: "S. America", head: "Argentina approves $50bn LNG project" },
  { n: 20, region: "Middle East", head: "Iran strike wounds two in Bahrain; Riyadh condemns attacks" },
  { n: 21, region: "Middle East", head: "Bahrain: Iranian attack hits industrial site" },
  { n: 22, region: "Middle East", head: "Two tankers struck in Strait of Hormuz" },
  { n: 23, region: "Middle East", head: "Iran unveils new dual-missile launcher" },
  { n: 24, region: "Middle East", head: "Iran: China, Russia oppose nuclear doctrine change" },
  { n: 25, region: "Middle East", head: "Settlers torch West Bank vehicles; Israel opens inquiry" },
  { n: 26, region: "Asia", head: "Indonesia factory fire \u2014 3 dead, 36 missing" },
  { n: 27, region: "Asia", head: "Illicit alcohol kills 11, hospitalises 180+ in India" },
  { n: 28, region: "Asia", head: "Japan's economy shrinks 0.1% in Jul-Sep" },
  { n: 29, region: "Asia", head: "S. Korea minister quits over AI exam-cheating scandal" },
  { n: 30, region: "Asia", head: "N. Korea's Kim: seeks security, not supremacy" },
  { n: 31, region: "Africa", head: "Nigeria boat accident toll rises to 24" },
  { n: 32, region: "Africa", head: "24 civilians killed in fresh South Sudan violence" },
  { n: 33, region: "Africa", head: "35 Fulanis killed in revenge attacks in Nigeria" },
  { n: 34, region: "Africa", head: "Drone strikes hit homes, UN building in Khartoum" },
  { n: 35, region: "Global", head: "BepiColombo probe enters orbit around Mercury" },
  { n: 36, region: "Global", head: "128 nations agree path to 'killer robots' pact" },
];

const REGION_ORDER = ["Europe", "N. America", "S. America", "Middle East", "Asia", "Africa", "Global"];
const REGION_LABEL: Record<string, string> = {
  Europe: "EUROPE",
  "N. America": "N. AMERICA",
  "S. America": "S. AMERICA",
  "Middle East": "MIDDLE EAST",
  Asia: "ASIA",
  Africa: "AFRICA",
  Global: "GLOBAL",
};

// ---------- layout ----------
function draw(): void {
  fillRect(0, 0, W, H, PAPER);

  // Header band
  fillRect(0, 0, W, 96, NAVY);
  fillRect(0, 96, W, 4, AMBER);
  drawText(24, 18, "SUNDAY 22 NOVEMBER 2026", 5, WHITE);
  const ed = "POLAND EDITION";
  drawText(W - 24 - textWidth(ed, 2), 26, ed, 2, AMBER);
  drawText(24, 66, "36 STORIES  \u2022  7 REGIONS  \u2022  ONE PAGE", 2, [200, 210, 225]);

  // Lead stories: 2x2 grid, y 108..296
  const leads = STORIES.slice(0, 4);
  const leadAccents: RGB[] = [[46, 111, 183], [211, 84, 0], [39, 174, 96], [192, 57, 43]];
  for (let i = 0; i < 4; i++) {
    const s = leads[i];
    const lx = 20 + (i % 2) * 502;
    const ly = 108 + Math.floor(i / 2) * 96;
    fillRect(lx, ly, 492, 88, WHITE);
    fillRect(lx, ly, 8, 88, leadAccents[i]);
    fillCircle(lx + 32, ly + 30, 17, leadAccents[i]);
    drawText(lx + 26, ly + 22, String(s.n), 2, WHITE);
    drawText(lx + 58, ly + 16, s.lead!, 2, INK);
    drawText(lx + 58, ly + 46, s.sub!, 1, GRAY);
    fillRect(lx, ly + 87, 492, 1, [220, 224, 230]);
  }

  // Map strip: y 308..462
  fillRect(20, 308, 984, 154, LIGHT);
  drawText(36, 318, "WHERE IT HAPPENED \u2014 22 NOV 2026", 2, NAVY);
  drawText(36, 344, "1 Poland  \u2022  2 Riyadh  \u2022  3 Peru  \u2022  4 Washington", 1, GRAY);
  // Stylised continents (rect blocks) inside the strip
  const cont = (x: number, y: number, w: number, h: number) => fillRect(x, y, w, h, MAPLAND);
  cont(80, 368, 170, 52); // North America
  cont(190, 420, 80, 36); // South America
  cont(470, 368, 70, 38); // Europe
  cont(475, 406, 85, 50); // Africa
  cont(555, 368, 300, 62); // Asia
  cont(830, 424, 70, 28); // Oceania
  drawText(100, 402, "N. AMERICA", 1, [90, 105, 125]);
  drawText(200, 442, "S. AM.", 1, [90, 105, 125]);
  drawText(478, 392, "EUROPE", 1, [90, 105, 125]);
  drawText(490, 440, "AFRICA", 1, [90, 105, 125]);
  drawText(700, 415, "ASIA", 1, [90, 105, 125]);
  drawText(832, 432, "OCEANIA", 1, [90, 105, 125]);
  // Numbered dots for the 4 leads (kept clear of the labels above)
  const dots: [number, number, number][] = [
    [515, 376, 1], // Poland (Europe)
    [620, 390, 2], // Riyadh (Middle East)
    [210, 428, 3], // Peru (S. America)
    [215, 382, 4], // Washington (N. America)
  ];
  for (const [dx, dy, num] of dots) {
    fillCircle(dx, dy, 12, REGION_COLORS[STORIES[num - 1].region]);
    drawText(dx - 3, dy - 4, String(num), 1, WHITE);
  }

  // Region chips row: y 472..506
  let chipX = 20;
  const chipW = [128, 158, 148, 168, 92, 110, 108];
  for (let i = 0; i < REGION_ORDER.length; i++) {
    const r = REGION_ORDER[i];
    const count = STORIES.filter((s) => s.region === r).length;
    const label = `${REGION_LABEL[r]} ${count}`;
    fillRect(chipX, 472, chipW[i], 34, REGION_COLORS[r]);
    drawText(chipX + Math.floor((chipW[i] - textWidth(label, 1)) / 2), 484, label, 1, WHITE);
    chipX += chipW[i] + 6;
  }

  // Story list: heading + 2 columns x 18 rows
  drawText(20, 522, "ALL 36 STORIES \u2014 VERIFIED 22 NOV 2026", 2, NAVY);
  const listY = 556;
  const rowH = 23;
  for (let col = 0; col < 2; col++) {
    for (let row = 0; row < 18; row++) {
      const s = STORIES[col * 18 + row];
      const x = 20 + col * 504;
      const y = listY + row * rowH;
      const numStr = String(s.n).padStart(2, "0");
      drawText(x, y, numStr, 1, REGION_COLORS[s.region]);
      drawText(x + 20, y, s.head, 1, INK);
    }
  }

  // Footer band
  fillRect(0, 958, W, 66, NAVY);
  drawText(24, 974, "DATE CHECK \u2014 Every story above was reported on Sunday 22 November 2026.", 1, WHITE);
  drawText(24, 996, "Sources: AFP  \u2022  AP  \u2022  Reuters  \u2022  Al Jazeera  \u2022  make.fun news-image-20261122", 1, [170, 180, 195]);
}

function main(): void {
  draw();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/entry.png`, encodePNG());
}

main();
