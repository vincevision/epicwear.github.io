const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const products = JSON.parse(read('assets/data/flash-sale.json'));
const generatedImages = JSON.parse(read('assets/data/generated-images.json'));
const suppliedImages = JSON.parse(read('assets/data/supplied-images.json'));
const additionalOutfits = JSON.parse(read('assets/data/additional-outfits.json'));
const totalListings = 120 + additionalOutfits.length;

test('The Cute Edit contains 135 distinct designs, not separate colour cards', () => {
  assert.equal(products.length, totalListings);
  assert.equal(new Set(products.map(p => p.id)).size, totalListings);
  assert.equal(new Set(products.map(p => p.name.toLowerCase())).size, totalListings);
  assert.equal(new Set(products.map(p => p.subtitle.toLowerCase())).size, totalListings);
  assert.equal(new Set(products.map(p => p.image)).size, totalListings);
});
test('All proposed prices are whole Kenyan shillings between 500 and 1,000', () => {
  for (const product of products) {
    assert.ok(Number.isInteger(product.price));
    assert.ok(product.price >= 500 && product.price <= 1000, product.id);
  }
  assert.equal(Math.min(...products.map(p => p.price)), 500);
  assert.equal(Math.max(...products.map(p => p.price)), 1000);
});
test('Colour variants stay within a style, not in the catalogue grid', () => {
  const photos = products.filter(p => p.imageKind === 'photo');
  const drawings = products.filter(p => p.imageKind === 'illustration');
  assert.equal(photos.length, 12);
  assert.equal(drawings.length + Object.keys(generatedImages).length + Object.keys(suppliedImages).length, 108);
  assert.equal(products.filter(p => p.imageKind === 'ai-generated').length, Object.keys(generatedImages).length);
  assert.equal(new Set(photos.flatMap(p => p.variants.map(v => v.id))).size, 120);
  for (const p of photos) {
    assert.equal(p.variants.length, 10);
    assert.equal(new Set(p.variants.map(v => v.colour)).size, 10);
    assert.ok(p.variants.some(v => v.colour === p.colour));
  }
  for (const p of products) {
    assert.deepEqual(p.sizes, ['XS', 'S', 'M', 'L', 'XL', 'XXL']);
    assert.match(p.swatch, /^#[a-f0-9]{6}$/i);
    assert.ok(p.description && p.subtitle && p.category);
  }
});
test('Original illustrations contain 108 distinct garment drawings, not renamed files', () => {
  const artwork = products.filter(p => p.id.startsWith('EW-D')).map(p => {
    // Keep original drawing sources even when generated imagery is shown instead.
    const svg = read(`assets/img/sale/designs/design-${p.id.slice(4)}.svg`);
    assert.match(svg, /original garment illustration/);
    assert.match(svg, /not a product photograph/);
    // Compare garment shapes only: exclude names, IDs, backgrounds and palette.
    const drawing = svg.match(/<g filter="url\(#shadow\)">(.*)<\/g>/)[1];
    return createHash('sha256').update(drawing).digest('hex');
  });
  assert.equal(new Set(artwork).size, 108);
});
test('Generated replacements retain stable IDs, unique images and honest provenance', () => {
  assert.ok(Object.keys(generatedImages).length >= 10);
  for (const [id, image] of Object.entries(generatedImages)) {
    const p = products.find(p => p.id === id);
    assert.ok(p, id);
    assert.equal(p.imageKind, 'ai-generated');
    assert.equal(p.image, image);
    assert.match(p.image, /^assets\/img\/sale\/generated\/design-\d{3}\.webp$/);
    assert.match(p.description, /AI-generated/);
    assert.match(p.description, /not a photograph of an existing item/);
    assert.ok(fs.statSync(path.join(root, image)).size < 180 * 1024);
  }
  const js = read('assets/js/flash-sale.js');
  assert.match(js, /AI-GENERATED INSPIRATION/);
  assert.match(js, /AI-generated fashion image, not a real product photograph/);
  assert.match(read('flash-sale.html'), /not photos of actual inventory/);
});
test('First eight replacements use supplied photos and matching garment details', () => {
  const ids = ['EW-D001','EW-D019','EW-D037','EW-D055','EW-D073','EW-D091','EW-D002','EW-D020'];
  assert.deepEqual(Object.keys(suppliedImages), ids);
  const firstEight = products.filter(p => p.imageKind === 'supplied-photo').slice(0,8);
  assert.deepEqual(firstEight.map(p => p.id), ids);
  for (const id of ids) {
    const p = products.find(p => p.id === id);
    assert.equal(generatedImages[id], undefined);
    for (const [key,value] of Object.entries(suppliedImages[id])) assert.deepEqual(p[key], value, `${id}: ${key}`);
    assert.equal(p.imageKind, 'supplied-photo');
    assert.match(p.description, /Supplied photo reference/);
    assert.doesNotMatch(p.description, /AI-generated/);
    assert.ok(p.image.startsWith('assets/img/sale/supplied/'));
  }
  assert.equal(firstEight[0].subtitle, 'Drawstring wide-leg lounge trousers');
  assert.equal(firstEight[7].subtitle, 'Boat-neck crop & tie-wrap mini skirt');
  assert.match(read('assets/js/flash-sale.js'), /SUPPLIED PHOTO REFERENCE/);
});
test('Fifteen new uploads are added in attachment order with matching outfit details', () => {
  assert.equal(additionalOutfits.length, 15);
  assert.deepEqual(products.slice(20,35), additionalOutfits);
  const garmentNames = [
    'Ruched halter top & floral mini skirt',
    'Lace cowl halter & ruffle mini skirt',
    'Ruched halter bandeau & tiered mini skirt',
    'Sleeveless pearl-back draped mini dress',
    'One-shoulder bell-sleeve tie-front mini dress',
    'Draped cape-style mini dress',
    'Cross-halter cut-out ruched mini dress',
    'Velvet cross-wrap crop & cut-out mini skirt',
    'Contrast triangle bikini & lace-up wrap skirt',
    'Floral bikini & sheer off-shoulder crop',
    'Printed halter bikini & tie-side swim skirt',
    'Shell-trim halter top & tie-side bikini brief',
    'Draped mesh halter & ruched cover-up skirt set',
    'Striped crochet bell-sleeve mini dress',
    'Bardot bell-sleeve knit playsuit',
  ];
  additionalOutfits.forEach((outfit, i) => {
    assert.equal(outfit.id, `EW-U${String(i+1).padStart(3,'0')}`);
    assert.equal(outfit.subtitle, garmentNames[i]);
    assert.equal(outfit.imageKind, 'supplied-photo');
    assert.match(outfit.image, /^assets\/img\/sale\/supplied\/ew-u\d{3}\.webp$/);
    assert.match(outfit.description, /not included/);
    assert.match(outfit.description, /Supplied outfit reference/);
    assert.doesNotMatch(outfit.description, /AI-generated/);
    assert.ok(['Matching sets','Dresses','Swim & resort','Playsuits'].includes(outfit.category));
  });
  assert.equal(products.filter(p => p.imageKind === 'supplied-photo').length, 23);
  assert.match(read('index.html'), /135 distinct style ideas/);
  assert.match(read('flash-sale.html'), /35 photo references/);
});
test('All catalogue images exist locally, have unique content and remain lightweight', () => {
  const images = new Set(products.map(p => p.image));
  assert.equal(images.size, totalListings);
  const hashes = new Set();
  let total = 0;
  for (const image of images) {
    assert.ok(image.startsWith('assets/img/sale/'));
    const size = fs.statSync(path.join(root, image)).size;
    assert.ok(size > 0);
    total += size;
    hashes.add(createHash('sha256').update(fs.readFileSync(path.join(root, image))).digest('hex'));
  }
  assert.equal(hashes.size, totalListings);
  assert.ok(total < 3 * 1024 * 1024, `Reference image payload: ${total} bytes`);
});
test('Sale is reachable from the existing homepage and shares its design system', () => {
  assert.match(read('index.html'), /href="flash-sale\.html"/);
  const sale = read('flash-sale.html');
  assert.match(sale, /href="assets\/css\/style\.css"/);
  assert.match(sale, /No payment is taken here/);
  assert.match(sale, /Photos are style references/);
  for (const match of sale.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g)) {
    assert.ok(fs.existsSync(path.join(root, match[1])), match[1]);
  }
});
