const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const products = JSON.parse(read('assets/data/flash-sale.json'));

test('The Cute Edit contains 120 distinct designs, not separate colour cards', () => {
  assert.equal(products.length, 120);
  assert.equal(new Set(products.map(p => p.id)).size, 120);
  assert.equal(new Set(products.map(p => p.name.toLowerCase())).size, 120);
  assert.equal(new Set(products.map(p => p.subtitle.toLowerCase())).size, 120);
  assert.equal(new Set(products.map(p => p.image)).size, 120);
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
  assert.equal(drawings.length, 108);
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
  const artwork = products.filter(p => p.imageKind === 'illustration').map(p => {
    const svg = read(p.image);
    assert.match(svg, /original garment illustration/);
    assert.match(svg, /not a product photograph/);
    // Compare garment shapes only: exclude names, IDs, backgrounds and palette.
    const drawing = svg.match(/<g filter="url\(#shadow\)">(.*)<\/g>/)[1];
    return createHash('sha256').update(drawing).digest('hex');
  });
  assert.equal(new Set(artwork).size, 108);
});
test('All catalogue images exist locally, have unique content and remain lightweight', () => {
  const images = new Set(products.map(p => p.image));
  assert.equal(images.size, 120);
  const hashes = new Set();
  let total = 0;
  for (const image of images) {
    assert.ok(image.startsWith('assets/img/sale/'));
    const size = fs.statSync(path.join(root, image)).size;
    assert.ok(size > 0);
    total += size;
    hashes.add(createHash('sha256').update(fs.readFileSync(path.join(root, image))).digest('hex'));
  }
  assert.equal(hashes.size, 120);
  assert.ok(total < 2 * 1024 * 1024, `Reference image payload: ${total} bytes`);
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
