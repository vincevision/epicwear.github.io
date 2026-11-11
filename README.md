# EPIC WEAR

Static EPIC WEAR website. No framework, build step or external CDN required.

## Preview

```sh
python3 -m http.server 3000 --bind 0.0.0.0
```

- `/index.html` — original coming-soon experience, with flash-sale entry points.
- `/flash-sale.html` — **The Cute Edit**, using the same fonts, logo, dark palette, orange accent and chamfered buttons.

## Flash-sale catalogue

`assets/data/flash-sale.json` holds 120 **distinct design listings**: 12 supplied photo-reference outfits and 108 original SVG garment illustrations. Colour requests are grouped inside a photo-reference style, never repeated as separate cards. Illustrations propose cuts/details, not actual stock or product photography. All prices are whole KSh values between 500 and 1,000. The 12 supplied photos are optimized local WebP assets. All 120 catalogue images are local and have unique artwork. SVG illustration sources and catalogue generation are in `scripts/build-design-studies.py` (Python standard library only). Run it from the repository root to rebuild the studies deterministically.

Features: category/search/budget filters, price/name sorting, incremental loading, persistent favourites, colour and size selection, an enquiry bag with quantities, and copy/download of a plain-text enquiry. Local-storage failures are handled gracefully. Native dialogs provide Escape dismissal and focus restoration; reduced motion is respected.

### Before accepting sales

This is an inspiration catalogue, **not a stock, brand-authenticity or payment integration**. Photos do not depict every proposed colourway. Proposed prices and sizes must be confirmed against actual supplier stock. The UI makes this explicit and never fabricates a countdown, discount, stock scarcity, order confirmation or payment result.

1. Confirm each SKU, final price, actual colour and size availability.
2. Replace reference photos with authorized, exact product/colour photography.
3. Replace the original site's placeholder contact details with verified studio details.
4. Add real delivery policies, sale terms and a payment/order backend before enabling checkout. Currently, enquiries can only be copied/downloaded and shared manually; they are not submitted to a server.

Data shape: `id`, `name`, `subtitle`, `category`, `image`, `imageKind`, `colour`, `swatch`, `price`, `sizes`, `description`, optional `variants` (legacy colour IDs, names and swatches). Legacy bags and favourites are migrated to the consolidated styles; bag rows store the requested colour independently. Keep IDs stable because bags and favourites store them in local storage. Update category filter labels in `flash-sale.html` if categories change.

## Tests

```sh
node --test tests/catalog.test.cjs
node --check assets/js/flash-sale.js
```

The catalogue tests verify option count, unique IDs, price bounds, unique names, garment descriptions, image paths, image hashes, illustration artwork, size coverage, image existence/payload and homepage integration. The site is compatible with static GitHub Pages hosting and uses relative URLs throughout.
