const fs = require('fs');
const { PNG } = require('pngjs');

function createSquareIcon(srcPath, outPath, targetSize, bgColor = { r: 0, g: 31, b: 63, a: 255 }) {
  const srcData = fs.readFileSync(srcPath);
  const srcPng = PNG.sync.read(srcData);

  const outPng = new PNG({ width: targetSize, height: targetSize });

  // Fill background (Navy #001f3f)
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const idx = (targetSize * y + x) << 2;
      outPng.data[idx] = bgColor.r;
      outPng.data[idx + 1] = bgColor.g;
      outPng.data[idx + 2] = bgColor.b;
      outPng.data[idx + 3] = bgColor.a;
    }
  }

  // Calculate scaling to fit nicely with some padding (e.g. 80% of targetSize)
  const availableSize = Math.floor(targetSize * 0.82);
  const scale = Math.min(availableSize / srcPng.width, availableSize / srcPng.height);
  const scaledWidth = Math.floor(srcPng.width * scale);
  const scaledHeight = Math.floor(srcPng.height * scale);

  const offsetX = Math.floor((targetSize - scaledWidth) / 2);
  const offsetY = Math.floor((targetSize - scaledHeight) / 2);

  // Nearest-neighbor / bilinear scaling
  for (let y = 0; y < scaledHeight; y++) {
    for (let x = 0; x < scaledWidth; x++) {
      const srcX = Math.min(srcPng.width - 1, Math.floor(x / scale));
      const srcY = Math.min(srcPng.height - 1, Math.floor(y / scale));

      const srcIdx = (srcPng.width * srcY + srcX) << 2;
      const destIdx = (targetSize * (offsetY + y) + (offsetX + x)) << 2;

      const srcA = srcPng.data[srcIdx + 3] / 255;
      if (srcA > 0) {
        // Alpha blend over background
        const invA = 1 - srcA;
        outPng.data[destIdx] = Math.round(srcPng.data[srcIdx] * srcA + bgColor.r * invA);
        outPng.data[destIdx + 1] = Math.round(srcPng.data[srcIdx + 1] * srcA + bgColor.g * invA);
        outPng.data[destIdx + 2] = Math.round(srcPng.data[srcIdx + 2] * srcA + bgColor.b * invA);
        outPng.data[destIdx + 3] = 255;
      }
    }
  }

  const buffer = PNG.sync.write(outPng);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${outPath} (${targetSize}x${targetSize})`);
}

createSquareIcon('public/logo_small.png', 'public/icon-192.png', 192);
createSquareIcon('public/logo_small.png', 'public/icon-512.png', 512);
createSquareIcon('public/logo_small.png', 'public/icon-maskable-192.png', 192);
createSquareIcon('public/logo_small.png', 'public/icon-maskable-512.png', 512);
