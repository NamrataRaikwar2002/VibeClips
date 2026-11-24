
import fs from 'node:fs/promises';
import path from 'node:path';

const FILE_KEY = 'TVrBFTLyhr3goG5haYKEHA';
const PAGE_NODE_ID = '0:1';

const TOKEN = process.env.FIGMA_TOKEN;

const OUTPUT_DIR = path.resolve('src/assets/stickers');
const INDEX_FILE = path.resolve('src/constants/stickers.js');

if (!TOKEN) {
  throw new Error('FIGMA_TOKEN is missing. Add it to your .env file.');
}

const headers = {
  'X-Figma-Token': TOKEN,
};

async function figmaGet(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Figma API error ${response.status}: ${message}`);
  }

  return response.json();
}

// Recursively find the individual sticker frames.
// Their names in your Figma file start with IDs like 9562867_.
function findStickerNodes(node, results = []) {
  if (!node) return results;

  if (
    node.type === 'FRAME' &&
    /^\d{7}_/.test(node.name || '')
  ) {
    results.push({
      id: node.id,
      name: node.name,
    });
  }

  for (const child of node.children || []) {
    findStickerNodes(child, results);
  }

  return results;
}

function makeFileName(name) {
  return name
    .replace(/^\d+_/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function downloadStickerImages(stickers) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const exported = [];

  // Export in batches to avoid excessively long API requests.
  for (let i = 0; i < stickers.length; i += 20) {
    const batch = stickers.slice(i, i + 20);

    const params = new URLSearchParams({
      ids: batch.map(item => item.id).join(','),
      format: 'png',
      scale: '2',
    });

    const result = await figmaGet(
      `https://api.figma.com/v1/images/${FILE_KEY}?${params}`
    );

    for (const sticker of batch) {
      const imageUrl = result.images?.[sticker.id];

      if (!imageUrl) {
        console.warn(`Could not export: ${sticker.name}`);
        continue;
      }

      const fileName =
        `${sticker.id.replace(':', '-')}-${makeFileName(sticker.name)}.png`;

      const imageResponse = await fetch(imageUrl);

      if (!imageResponse.ok) {
        console.warn(`Could not download: ${sticker.name}`);
        continue;
      }

      const imageBuffer = Buffer.from(
        await imageResponse.arrayBuffer()
      );

      await fs.writeFile(
        path.join(OUTPUT_DIR, fileName),
        imageBuffer
      );

      exported.push({
        id: sticker.id,
        name: sticker.name.replace(/^\d+_/, ''),
        fileName,
      });

      console.log(`Downloaded: ${fileName}`);
    }
  }

  return exported;
}

async function generateStickerIndex(stickers) {
  await fs.mkdir(path.dirname(INDEX_FILE), { recursive: true });

  const entries = stickers.map(sticker => {

    return `  {
    id: ${JSON.stringify(sticker.id)},
    name: ${JSON.stringify(sticker.name)},
    image: require('../assets/stickers/${sticker.fileName}'),
  }`;
  });

  const content = `export const STICKERS = [
${entries.join(',\n')}
];

export default STICKERS;
`;

  await fs.writeFile(INDEX_FILE, content, 'utf8');
}

async function main() {
  console.log('Reading sticker layers from Figma...');

  const file = await figmaGet(
    `https://api.figma.com/v1/files/${FILE_KEY}?ids=${encodeURIComponent(PAGE_NODE_ID)}`
  );

  const page = file.document?.children?.find(
    node => node.id === PAGE_NODE_ID
  );

  if (!page) {
    throw new Error('Could not find the Stickers page in this Figma file.');
  }

  const stickers = findStickerNodes(page);

  console.log(`Found ${stickers.length} sticker frames.`);

  if (!stickers.length) {
    throw new Error('No sticker frames were found.');
  }

  const downloaded = await downloadStickerImages(stickers);

  await generateStickerIndex(downloaded);

  console.log('');
  console.log(`Finished! Downloaded ${downloaded.length} stickers.`);
  console.log(`Images: ${OUTPUT_DIR}`);
  console.log(`Index: ${INDEX_FILE}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
