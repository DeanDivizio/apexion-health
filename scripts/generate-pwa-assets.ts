import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const root = process.cwd();
const publicDir = path.join(root, "public");

const iconSource = path.join(publicDir, "icon-source.png");
const splashSource = path.join(publicDir, "splash-source.png");

const iconVariants = [
  { file: "favicon-32x32.png", width: 32, height: 32 },
  { file: "icon-192x192.png", width: 192, height: 192 },
  { file: "icon-512x512.png", width: 512, height: 512 },
  { file: "apple-touch-icon.png", width: 180, height: 180 },
];

const splashVariants = [
  { file: "apple-splash-640-1136.png", width: 640, height: 1136 },
  { file: "apple-splash-750-1334.png", width: 750, height: 1334 },
  { file: "apple-splash-828-1792.png", width: 828, height: 1792 },
  { file: "apple-splash-1125-2436.png", width: 1125, height: 2436 },
  { file: "apple-splash-1242-2208.png", width: 1242, height: 2208 },
  { file: "apple-splash-1242-2688.png", width: 1242, height: 2688 },
  { file: "apple-splash-1536-2048.png", width: 1536, height: 2048 },
  { file: "apple-splash-1668-2224.png", width: 1668, height: 2224 },
  { file: "apple-splash-1668-2388.png", width: 1668, height: 2388 },
  { file: "apple-splash-2048-2732.png", width: 2048, height: 2732 },
];

const splashDir = path.join(publicDir, "splash");

async function generateResizedImage(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number,
) {
  await sharp(inputPath)
    .resize(width, height, { fit: "cover", position: "center" })
    .toFile(outputPath);
}

async function ensureSourceExists(filePath: string, label: string) {
  const sourceName = path.basename(filePath);
  if (!existsSync(filePath)) {
    throw new Error(
      `Missing ${label} source file: /public/${sourceName}. Add it first and re-run this script.`,
    );
  }
}

async function main() {
  await Promise.all([
    ensureSourceExists(iconSource, "icon"),
    ensureSourceExists(splashSource, "splash"),
  ]);

  for (const variant of iconVariants) {
    const outputPath = path.join(publicDir, variant.file);
    await generateResizedImage(
      iconSource,
      outputPath,
      variant.width,
      variant.height,
    );
  }

  mkdirSync(splashDir, { recursive: true });
  for (const variant of splashVariants) {
    const outputPath = path.join(splashDir, variant.file);
    await generateResizedImage(
      splashSource,
      outputPath,
      variant.width,
      variant.height,
    );
  }

  console.log("Generated PWA icon and splash assets successfully.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
