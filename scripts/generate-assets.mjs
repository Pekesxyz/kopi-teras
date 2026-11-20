/**
 * Membuat aset statis bawaan:
 *  - public/sounds/bell.wav        → bunyi bel notifikasi dashboard kasir/dapur
 *  - public/qris-placeholder.svg   → contoh gambar QRIS (GANTI dengan QRIS asli Kopi Teras)
 *
 * Jalankan: node scripts/generate-assets.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

const root = path.resolve(import.meta.dirname, "..");

// ---------- Bel notifikasi (WAV PCM 16-bit mono) ----------
function createBellWav() {
  const sampleRate = 22050;
  const duration = 1.6;
  const total = Math.floor(sampleRate * duration);
  const samples = new Int16Array(total);

  // Dua nada "ding-dong" dengan harmonik dan peluruhan eksponensial.
  const notes = [
    { start: 0, freq: 1318.5 }, // E6
    { start: 0.28, freq: 987.8 }, // B5
  ];

  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    let v = 0;
    for (const note of notes) {
      const nt = t - note.start;
      if (nt < 0) continue;
      const env = Math.exp(-nt * 3.2) * Math.min(1, nt * 200);
      v +=
        env *
        (Math.sin(2 * Math.PI * note.freq * nt) * 0.6 +
          Math.sin(2 * Math.PI * note.freq * 2.01 * nt) * 0.25 +
          Math.sin(2 * Math.PI * note.freq * 3.02 * nt) * 0.1);
    }
    samples[i] = Math.max(-1, Math.min(1, v * 0.55)) * 32767;
  }

  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) buffer.writeInt16LE(samples[i], 44 + i * 2);
  return buffer;
}

mkdirSync(path.join(root, "public", "sounds"), { recursive: true });
writeFileSync(path.join(root, "public", "sounds", "bell.wav"), createBellWav());
console.log("✓ public/sounds/bell.wav");

// ---------- Placeholder QRIS ----------
const qrSvg = await QRCode.toString("KOPI TERAS - CONTOH QRIS - GANTI DENGAN QRIS ASLI", {
  type: "svg",
  margin: 0,
  errorCorrectionLevel: "M",
  color: { dark: "#1B365D", light: "#ffffff" },
});
const inner = qrSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const viewBox = qrSvg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 33 33";
const qrSize = Number(viewBox.split(" ")[2]);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="400" height="520">
  <rect width="400" height="520" rx="24" fill="#ffffff"/>
  <rect x="0" y="0" width="400" height="80" rx="24" fill="#1B365D"/>
  <rect x="0" y="56" width="400" height="24" fill="#1B365D"/>
  <rect x="0" y="76" width="400" height="6" fill="#60C1E5"/>
  <text x="200" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">QRIS</text>
  <text x="200" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#1B365D">KOPI TERAS</text>
  <text x="200" y="142" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#005A9C">NMID: ID0000000000000 (CONTOH)</text>
  <svg x="70" y="160" width="260" height="260" viewBox="0 0 ${qrSize} ${qrSize}" shape-rendering="crispEdges">${inner}</svg>
  <text x="200" y="456" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#005A9C">GAMBAR CONTOH — GANTI DENGAN QRIS ASLI</text>
  <text x="200" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#466585">Satu QRIS untuk semua e-wallet &amp; m-banking</text>
</svg>
`;
mkdirSync(path.join(root, "public", "qrcodes"), { recursive: true });
writeFileSync(path.join(root, "public", "qrcodes", "qris-kopi-teras.svg"), svg);
writeFileSync(path.join(root, "public", "qris-placeholder.svg"), svg);
console.log("✓ public/qrcodes/qris-kopi-teras.svg");
