/* EPIC WEAR — The Cute Edit. Static-site friendly; no payments or stock claims. */
(() => {
  'use strict';
  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => [...scope.querySelectorAll(s)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => `KSh ${n.toLocaleString('en-KE')}`;
  const {CONTACT_URL, buildOrderMessage, buildWhatsAppUrl} = window.EpicOrder;
  // Customer details stay in memory only, never in local storage.
  const customerDetails = {name:'', phone:'', delivery:'', notes:''};
  const orderSnapshot = () => ({bag, products, details:customerDetails, storeUrl:new URL('flash-sale.html', location.href).href});
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  let storageWarning = false;
  const persist = () => {
    try {
      localStorage.setItem('epic-sale-saved', JSON.stringify([...saved]));
      localStorage.setItem('epic-sale-bag', JSON.stringify(bag));
    } catch { storageWarning = true; }
  };
  const savedData = read('epic-sale-saved', []);
  const saved = new Set(Array.isArray(savedData) ? savedData.filter(x => typeof x === 'string') : []);
  const bagData = read('epic-sale-bag', []);
  let bag = Array.isArray(bagData) ? bagData.filter(row => row && typeof row.id === 'string' && typeof row.size === 'string' && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 10) : [];
  let products = [], filtered = [], limit = 24, savedOnly = false, category = 'All';
  let detailId = null, chosenSize = '', chosenColour = '', toastTimer;
  const byId = id => products.find(p => p.id === id);
  const colourOptions = p => p.variants?.length ? p.variants.map(v => v.colour) : [p.colour];
  const imageLabel = p => ({
    'illustration': 'ORIGINAL DESIGN ILLUSTRATION',
    'ai-generated': 'AI-GENERATED INSPIRATION',
    'photo': 'PHOTO STYLE REFERENCE',
    'supplied-photo': 'SUPPLIED PHOTO REFERENCE',
  }[p.imageKind] || 'STYLE INSPIRATION');
  const imageAlt = p => `${p.subtitle} — ${p.imageKind === 'ai-generated' ? 'AI-generated fashion image, not a real product photograph' : p.imageKind === 'illustration' ? 'original design illustration, not a product photo' : 'photo style reference, not an exact colour preview'}`;
  const notify = message => {
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
  };
  function counts() {
    $('#savedCount').textContent = saved.size;
    $('#bagCount').textContent = bag.reduce((n, row) => n + row.quantity, 0);
    $('#savedToggle').setAttribute('aria-pressed', String(savedOnly));
    $('#savedToggle').title = savedOnly ? 'Show all looks' : 'Show saved looks';
  }
  function card(p, index) {
    return `<article class="product" data-id="${p.id}">
      <div class="product__visual"><button class="product__open" data-open="${p.id}" aria-label="View ${escape(p.name)}, ${escape(p.colour)}">
        <img src="${p.image}" alt="${escape(imageAlt(p))}" width="360" height="480" loading="${index < 4 ? 'eager' : 'lazy'}" decoding="async"></button>
        <span class="product__tag">${p.imageKind === 'ai-generated' ? 'AI-GENERATED' : p.imageKind === 'illustration' ? 'DESIGN STUDY' : 'PHOTO INSPO'}</span><button class="product__heart" data-save="${p.id}" aria-label="${saved.has(p.id) ? 'Unsave' : 'Save'} ${escape(p.name)} in ${escape(p.colour)}" aria-pressed="${saved.has(p.id)}">${saved.has(p.id) ? '♥' : '♡'}</button>
        <span class="product__reference">${imageLabel(p)} / ${p.id}</span>
      </div>
      <div class="product__info"><p class="product__category">${escape(p.category)}</p><h3><button data-open="${p.id}">${escape(p.name)}</button></h3><p class="product__subtitle">${escape(p.subtitle)}</p>
        <p class="product__colour"><span class="swatch" style="background:${p.swatch}"></span>${escape(p.colour)} <span> / ${colourOptions(p).length > 1 ? `${colourOptions(p).length} colour requests` : 'design colour'}</span></p>
        <div class="product__bottom"><span class="product__price">${money(p.price)}</span><button class="product__choose" data-open="${p.id}" aria-label="Choose size for ${escape(p.name)} in ${escape(p.colour)}">Choose size <span>↗</span></button></div>
      </div></article>`;
  }
  function render(reset = true) {
    if (reset) limit = 24;
    const term = $('#search').value.trim().toLowerCase();
    const max = Number($('#priceFilter').value);
    filtered = products.filter(p => (category === 'All' || p.category === category) && p.price <= max && (!savedOnly || saved.has(p.id)) && `${p.name} ${p.subtitle} ${p.category} ${colourOptions(p).join(' ')} ${p.id}`.toLowerCase().includes(term));
    const sort = $('#sort').value;
    if (sort === 'price-asc') filtered.sort((a,b) => a.price-b.price);
    if (sort === 'price-desc') filtered.sort((a,b) => b.price-a.price);
    if (sort === 'name') filtered.sort((a,b) => a.name.localeCompare(b.name) || a.colour.localeCompare(b.colour));
    const shown = filtered.slice(0, limit);
    $('#productGrid').innerHTML = shown.map(card).join('');
    $('#productGrid').setAttribute('aria-busy', 'false');
    $('#resultsCount').textContent = `${filtered.length} ${savedOnly ? 'saved' : ''} look${filtered.length === 1 ? '' : 's'}${category !== 'All' ? ` / ${category}` : ' / The full edit'}`;
    $('#emptyState').hidden = filtered.length !== 0;
    $('.load-more').hidden = filtered.length === 0;
    $('#shownCount').textContent = `You’ve seen ${shown.length} of ${filtered.length} looks`;
    $('#loadProgress').style.width = `${filtered.length ? shown.length / filtered.length * 100 : 0}%`;
    $('#loadMore').hidden = shown.length >= filtered.length;
    $('#resetFilters').hidden = !(term || category !== 'All' || max < 1000 || savedOnly || sort !== 'featured');
    counts();
  }
  function resetFilters() {
    category = 'All'; savedOnly = false;
    $('#search').value = ''; $('#priceFilter').value = '1000'; $('#sort').value = 'featured';
    updateTabs(); render();
  }
  function updateTabs() {
    $$('[data-category]').forEach(button => {
      const selected = button.dataset.category === category;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  function toggleSave(id) {
    if (!byId(id)) return;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    persist(); counts();
    if (savedOnly) render(false);
    else $$(`[data-save="${id}"]`).forEach(button => {
      button.textContent = saved.has(id) ? '♥' : '♡';
      button.setAttribute('aria-pressed', String(saved.has(id)));
      const p = byId(id);
      button.setAttribute('aria-label', `${saved.has(id) ? 'Unsave' : 'Save'} ${p.name} in ${p.colour}`);
    });
    notify(storageWarning ? 'Saved for this visit. Browser storage is unavailable.' : saved.has(id) ? 'A little favourite, saved ♡' : 'Removed from your saved looks');
  }
  let previousFocus = null;
  function openDialog(dialog) {
    previousFocus = document.activeElement;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-dismiss]')) dialog.close();
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    });
  });
  function detail(id) {
    const p = byId(id);
    if (!p) return;
    detailId = id;
    chosenSize = '';
    chosenColour = p.colour;
    const colours = colourOptions(p);
    $('#productDetail').innerHTML = `<div class="detail-layout"><div class="detail-photo"><img src="${p.image}" alt="${escape(imageAlt(p))}"><p>${imageLabel(p)} / NOT A CONFIRMED PRODUCT</p></div>
      <div class="detail-copy"><p class="eyebrow">${p.id} / ${escape(p.category)}</p><h2 id="detailName">${escape(p.name)}</h2><p class="product__subtitle">${escape(p.subtitle)}</p><span class="product__price">${money(p.price)}</span><p class="detail-description">${escape(p.description)}</p>
      <label class="product__colour" for="detailColour">Colour option <select id="detailColour">${colours.map(colour => `<option value="${escape(colour)}" ${colour === chosenColour ? 'selected' : ''}>${escape(colour)}</option>`).join('')}</select></label>
      <fieldset class="size-picker"><legend>Choose your size to enquire</legend><div class="size-options">${p.sizes.map(size => `<label><input type="radio" name="size" value="${size}" ${chosenSize === size ? 'checked' : ''}><span>${size}</span></label>`).join('')}</div></fieldset>
      <button id="addToBag" class="sale-button sale-button--primary" ${chosenSize ? '' : 'disabled'}>${chosenSize ? 'Add to bag' : 'Select a size first'} <span>↗</span></button>
      <p class="detail-note">Inspiration only. Selected colours and sizes are requests, not confirmed inventory. Final garment, measurements and price need studio confirmation. No payment or reservation.</p></div></div>`;
    if (!$('#productDialog').open) openDialog($('#productDialog'));
  }
  function addToBag() {
    const p = byId(detailId);
    if (!p || !p.sizes.includes(chosenSize)) return;
    const existing = bag.find(row => row.id === p.id && row.size === chosenSize && row.colour === chosenColour);
    if (existing && existing.quantity >= 10) { notify('Maximum 10 of this option per enquiry.'); return; }
    if (existing) existing.quantity += 1;
    else bag.push({id:p.id, size:chosenSize, colour:chosenColour, quantity:1});
    persist(); counts();
    $('#productDialog').close();
    notify(storageWarning ? 'Added to bag for this visit. Storage is unavailable.' : `${p.name} / ${chosenSize} added to your bag`);
  }
  function renderBag() {
    const items = $('#bagItems');
    if (!bag.length) {
      items.innerHTML = '<div class="bag-empty"><span>♡</span><h3>Your next obsession awaits.</h3><p>Add a look and make this bag yours.</p></div>';
      $('#bagSummary').innerHTML = '<button class="sale-button sale-button--primary" data-dismiss>Explore the cute edit ↗</button>';
      return;
    }
    items.innerHTML = bag.map((row,index) => {
      const p = byId(row.id);
      return `<article class="bag-item"><img src="${p.image}" alt="${escape(imageAlt(p))}" width="70" height="95"><div><h3>${escape(p.name)}</h3><p>${escape(row.colour)} / ${row.size} / ${p.id}</p><p>${money(p.price)} each</p><div class="bag-item__actions"><div class="quantity"><button data-quantity="${index}" data-delta="-1" aria-label="Decrease ${escape(p.name)} quantity" ${row.quantity === 1 ? 'disabled' : ''}>−</button><span>${row.quantity}</span><button data-quantity="${index}" data-delta="1" aria-label="Increase ${escape(p.name)} quantity" ${row.quantity >= 10 ? 'disabled' : ''}>+</button></div><button class="remove-item" data-remove="${index}" aria-label="Remove ${escape(p.name)}, ${escape(row.colour)}, size ${row.size}">Remove</button></div></div></article>`;
    }).join('');
    const subtotal = bag.reduce((sum,row) => sum + byId(row.id).price * row.quantity, 0);
    $('#bagSummary').innerHTML = `<div class="bag-total"><span>Items subtotal</span><strong>${money(subtotal)}</strong></div>
      <p class="detail-note">Delivery is quoted separately. Stock, sizes and the final total are confirmed in WhatsApp before payment.</p>
      <fieldset class="checkout-details"><legend>Delivery details <span>(optional)</span></legend>
        <label for="orderName">Your name<input id="orderName" data-order-field="name" autocomplete="name" maxlength="100" value="${escape(customerDetails.name)}"></label>
        <label for="orderPhone">Contact phone<input id="orderPhone" data-order-field="phone" type="tel" autocomplete="tel" maxlength="40" placeholder="Or use your WhatsApp number" value="${escape(customerDetails.phone)}"></label>
        <label for="orderDelivery">Delivery location or pickup preference<input id="orderDelivery" data-order-field="delivery" autocomplete="street-address" maxlength="250" placeholder="Area, town or preferred pickup" value="${escape(customerDetails.delivery)}"></label>
        <label for="orderNotes">Order notes<textarea id="orderNotes" data-order-field="notes" maxlength="500" rows="3" placeholder="Fit questions or delivery instructions">${escape(customerDetails.notes)}</textarea></label>
      </fieldset>
      <a class="sale-button sale-button--primary" id="whatsappCheckout" href="${escape(buildWhatsAppUrl(orderSnapshot()))}" target="_blank" rel="noopener noreferrer" aria-describedby="checkoutNotice">Checkout on WhatsApp <span>↗</span></a>
      <p class="detail-note" id="checkoutNotice">Opens WhatsApp at +254 742 850 266 with your full bag and the details above. Review and press Send there. Your bag stays saved; opening WhatsApp does not confirm an order or take payment. If WhatsApp cannot open a large message, download or copy it below. Delivery details are not saved in this browser.</p>
      <button class="sale-button" id="downloadEnquiry">Download order details <span>↓</span></button><button class="sale-button" id="copyEnquiry">Copy order details <span>↗</span></button><a href="${CONTACT_URL}" target="_blank" rel="noopener noreferrer" class="sale-button">Ask a question on WhatsApp <span>↗</span></a>`;
  }
  function enquiry() {
    return buildOrderMessage(orderSnapshot());
  }
  $('#bagSummary').addEventListener('input', event => {
    const field = event.target.dataset.orderField;
    if (!Object.hasOwn(customerDetails, field)) return;
    customerDetails[field] = event.target.value;
    const checkout = $('#whatsappCheckout');
    if (checkout) checkout.href = buildWhatsAppUrl(orderSnapshot());
  });
  async function copyEnquiry() {
    try { await navigator.clipboard.writeText(enquiry()); notify('Order details copied. Paste them into WhatsApp.'); }
    catch { notify('Copy unavailable in this browser. Download the order details instead.'); }
  }
  function downloadEnquiry() {
    const url = URL.createObjectURL(new Blob([enquiry()], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'epic-wear-cute-edit-enquiry.txt';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Order details downloaded. Share them on WhatsApp.');
  }
  document.addEventListener('click', event => {
    const save = event.target.closest('[data-save]');
    const open = event.target.closest('[data-open]');
    if (save) toggleSave(save.dataset.save);
    if (open) detail(open.dataset.open);
    if (event.target.closest('#addToBag')) addToBag();
    const quantity = event.target.closest('[data-quantity]');
    if (quantity) {
      const index = Number(quantity.dataset.quantity);
      const value = bag[index].quantity + Number(quantity.dataset.delta);
      if (value < 1 || value > 10) return;
      bag[index].quantity = value;
      persist(); counts(); renderBag();
      $(`[data-quantity="${index}"][data-delta="${quantity.dataset.delta}"]`)?.focus();
    }
    const remove = event.target.closest('[data-remove]');
    if (remove) {
      bag.splice(Number(remove.dataset.remove), 1);
      persist(); counts(); renderBag();
      ($('[data-remove]') || $('[data-dismiss]', $('#bagDialog'))).focus();
    }
    if (event.target.closest('#downloadEnquiry')) downloadEnquiry();
    if (event.target.closest('#copyEnquiry')) copyEnquiry();
  });
  $('#productDialog').addEventListener('change', event => {
    if (event.target.name === 'size') {
      chosenSize = event.target.value;
      $('#addToBag').disabled = false;
      $('#addToBag').innerHTML = 'Add to bag <span>↗</span>';
    }
    if (event.target.id === 'detailColour') {
      if (colourOptions(byId(detailId)).includes(event.target.value)) chosenColour = event.target.value;
    }
  });
  $$('[data-category]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category; updateTabs(); render();
  }));
  $('#search').addEventListener('input', () => render());
  $('#priceFilter').addEventListener('change', () => render());
  $('#sort').addEventListener('change', () => render());
  $('#resetFilters').addEventListener('click', resetFilters);
  $('#emptyReset').addEventListener('click', resetFilters);
  $('#loadMore').addEventListener('click', () => {
    const previous = Math.min(limit, filtered.length);
    limit += 24; render(false);
    $$('.product__open')[previous]?.focus({preventScroll:true});
  });
  $('#savedToggle').addEventListener('click', () => {
    savedOnly = !savedOnly; render();
    $('#shop').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
  $('#bagOpen').addEventListener('click', () => { renderBag(); openDialog($('#bagDialog')); });
  $('#saleYear').textContent = new Date().getFullYear();
  async function loadCatalog() {
    $('#catalogError').hidden = true;
    $('#resultsCount').textContent = 'Loading the cute edit…';
    $('#productGrid').setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('assets/data/flash-sale.json');
      if (!response.ok) throw new Error('Catalogue unavailable');
      const data = await response.json();
      if (!Array.isArray(data) || !data.length || data.some(p => !p.id || !Array.isArray(p.sizes) || !Number.isFinite(p.price) || p.price < 500 || p.price > 1000)) throw new Error('Invalid catalogue');
      // Defend against repeated cards accidentally reintroduced in catalogue edits.
      const seenIds = new Set(), seenStyles = new Set(), seenImages = new Set();
      products = data.filter(p => {
        const style = p.subtitle.trim().toLowerCase();
        if (seenIds.has(p.id) || seenStyles.has(style) || seenImages.has(p.image)) return false;
        seenIds.add(p.id); seenStyles.add(style); seenImages.add(p.image);
        return true;
      });
      // Preserve pre-deduplication bags/favourites: old colour IDs now belong to one style.
      const legacy = new Map();
      products.forEach(p => p.variants?.forEach(v => legacy.set(v.id, {id:p.id, colour:v.colour})));
      bag = bag.map(row => {
        const variant = legacy.get(row.id);
        const p = byId(variant?.id || row.id);
        return p ? {...row, id:p.id, colour:row.colour || variant?.colour || p.colour} : null;
      }).filter(row => row && byId(row.id)?.sizes.includes(row.size) && colourOptions(byId(row.id)).includes(row.colour) && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 10);
      const migratedSaved = [...saved].map(id => legacy.get(id)?.id || id);
      saved.clear();
      migratedSaved.forEach(id => { if (byId(id)) saved.add(id); });
      $$('[data-catalog-count]').forEach(el => { el.textContent = products.length; });
      const countsByKind = products.reduce((totals, p) => { totals[p.imageKind] = (totals[p.imageKind] || 0) + 1; return totals; }, {});
      const imageSummary = [
        (countsByKind.photo || countsByKind['supplied-photo']) && `${(countsByKind.photo || 0) + (countsByKind['supplied-photo'] || 0)} photo references`,
        countsByKind['ai-generated'] && `${countsByKind['ai-generated']} AI-generated fashion images`,
        countsByKind.illustration && `${countsByKind.illustration} garment illustrations`,
      ].filter(Boolean).join(' + ');
      $$('[data-image-summary]').forEach(el => { el.textContent = imageSummary; });
      persist();
      counts(); render();
      $('#bagOpen').disabled = false;
      $('#savedToggle').disabled = false;
    } catch {
      $('#catalogError').hidden = false;
      $('#resultsCount').textContent = 'Catalogue unavailable';
      $('#productGrid').setAttribute('aria-busy', 'false');
      $('.load-more').hidden = true;
    }
  }
  $('#retryCatalog').addEventListener('click', loadCatalog);
  counts(); loadCatalog();
})();
