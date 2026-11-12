/* Shared, testable WhatsApp order formatting. No payments or automatic sending. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EpicOrder = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WHATSAPP_NUMBER = '254742850266';
  const CONTACT_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
  const money = value => `KSh ${value.toLocaleString('en-KE')}`;

  function buildOrderMessage({bag, products, details = {}, storeUrl}) {
    const lookup = new Map(products.map(product => [product.id, product]));
    const rows = bag.map(row => ({...row, product: lookup.get(row.id)}));
    if (!rows.length) return '';
    if (rows.some(row => !row.product || !Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 10)) {
      throw new Error('Invalid order item');
    }
    const subtotal = rows.reduce((total, row) => total + row.product.price * row.quantity, 0);
    const quantity = rows.reduce((total, row) => total + row.quantity, 0);
    return [
      'EPIC WEAR — WHATSAPP ORDER REQUEST',
      'Hello! I would like to order the following:',
      '',
      ...rows.map((row, index) => {
        const product = row.product;
        return [
          `${index + 1}. ${product.name} — ${product.subtitle}`,
          `Item code: ${product.id}`,
          `Colour: ${row.colour} | Size: ${row.size} | Quantity: ${row.quantity}`,
          `Unit price: ${money(product.price)} | Line total: ${money(product.price * row.quantity)}`,
          ...(storeUrl ? [`Outfit reference: ${new URL(product.image, storeUrl).href}`] : []),
          '',
        ].join('\n');
      }),
      `Items: ${quantity} across ${rows.length} bag selections`,
      `Items subtotal: ${money(subtotal)}`,
      'Delivery fee: please confirm for my location (not included).',
      'Final total: items subtotal + confirmed delivery fee; please confirm before payment.',
      '',
      'CUSTOMER & DELIVERY DETAILS',
      `Name: ${String(details.name || '').trim() || 'To provide in chat'}`,
      `Contact phone: ${String(details.phone || '').trim() || 'Use this WhatsApp chat'}`,
      `Delivery location / pickup preference: ${String(details.delivery || '').trim() || 'To confirm in chat'}`,
      `Notes: ${String(details.notes || '').trim() || 'None'}`,
      '',
      'Please confirm stock, sizing, colours, final pricing, delivery and payment arrangements.',
      'This is an order request, not a confirmed purchase. No payment has been made on the website.',
      ...(storeUrl ? [`Store: ${storeUrl}`] : []),
    ].join('\n');
  }

  function buildWhatsAppUrl(order) {
    const message = buildOrderMessage(order);
    return message ? `${CONTACT_URL}?text=${encodeURIComponent(message)}` : null;
  }
  return {WHATSAPP_NUMBER, CONTACT_URL, buildOrderMessage, buildWhatsAppUrl};
});
