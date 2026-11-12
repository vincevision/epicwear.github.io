const {test} = require('node:test');
const assert = require('node:assert/strict');
const {WHATSAPP_NUMBER, CONTACT_URL, buildOrderMessage, buildWhatsAppUrl} = require('../assets/js/order.js');
const products = require('../assets/data/flash-sale.json');
const fs = require('node:fs');
const path = require('node:path');
const storeUrl = 'https://vincevision.github.io/epicwear.github.io/flash-sale.html';
const bag = [
  {id:'EW-U014', colour:'Ivory', size:'M', quantity:2},
  {id:'EW-U015', colour:'Scarlet', size:'L', quantity:1},
];
const details = {name:'Amina & Zoe', phone:'+254 700 123 456', delivery:'Westlands, Nairobi / pickup?', notes:'Size & fit? + gift 🎁\nPlease call first.'};

test('WhatsApp checkout goes to the supplied Kenyan number with a lossless encoded message', () => {
  assert.equal(WHATSAPP_NUMBER, '254742850266');
  assert.equal(CONTACT_URL, 'https://wa.me/254742850266');
  const order = {bag, products, details, storeUrl};
  const url = new URL(buildWhatsAppUrl(order));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/254742850266');
  assert.equal(url.searchParams.get('text'), buildOrderMessage(order));
  assert.equal(url.searchParams.size, 1);
  for (const value of Object.values(details)) assert.ok(url.searchParams.get('text').includes(value));
});
test('Every item, size, colour, quantity, unit price, line total and reference is included', () => {
  const message = buildOrderMessage({bag, products, details, storeUrl});
  for (const row of bag) {
    const p = products.find(p => p.id === row.id);
    for (const value of [p.id,p.name,p.subtitle,row.size,row.colour]) assert.ok(message.includes(value));
    assert.ok(message.includes(`Quantity: ${row.quantity}`));
    assert.ok(message.includes(new URL(p.image, storeUrl).href));
  }
  assert.match(message, /Unit price: KSh 950 \| Line total: KSh 1,900/);
  assert.match(message, /Items: 3 across 2 bag selections/);
  assert.match(message, /Items subtotal: KSh 2,900/);
  assert.match(message, /Delivery fee: please confirm/);
  assert.match(message, /not a confirmed purchase/);
  assert.match(message, /No payment has been made/);
});
test('Empty bags cannot produce checkout URLs, and missing details can be supplied in chat', () => {
  assert.equal(buildWhatsAppUrl({bag:[], products}), null);
  const message = buildOrderMessage({bag, products});
  assert.match(message, /Name: To provide in chat/);
  assert.match(message, /Contact phone: Use this WhatsApp chat/);
  assert.match(message, /Delivery location \/ pickup preference: To confirm in chat/);
});
test('Large bags are not silently truncated and invalid rows are rejected', () => {
  const largeBag = products.map(p => ({id:p.id, colour:p.colour, size:'M', quantity:1}));
  const message = new URL(buildWhatsAppUrl({bag:largeBag, products, storeUrl})).searchParams.get('text');
  for (const p of products) assert.ok(message.includes(`Item code: ${p.id}\n`));
  assert.throws(() => buildOrderMessage({bag:[{id:'missing',quantity:1}], products}));
  assert.throws(() => buildOrderMessage({bag:[{...bag[0],quantity:0}], products}));
});
test('Contact links use WhatsApp and order helper loads before the shop', () => {
  const home = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const sale = fs.readFileSync(path.join(__dirname,'../flash-sale.html'),'utf8');
  assert.match(home, /href="https:\/\/wa.me\/254742850266"/);
  assert.match(home, /\+254 742 850 266/);
  assert.doesNotMatch(home, /15550142026|\+1 \(555\)/);
  assert.match(sale, /href="https:\/\/wa.me\/254742850266"/);
  assert.ok(sale.indexOf('src="assets/js/order.js"') < sale.indexOf('src="assets/js/flash-sale.js"'));
});
