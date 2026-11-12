# EPIC WEAR

Static EPIC WEAR website. No framework, build step or external CDN required.

## Preview

```sh
python3 -m http.server 3000 --bind 0.0.0.0
```

- `/index.html` — original coming-soon experience, with flash-sale entry points.
- `/flash-sale.html` — **The Cute Edit**, using the same fonts, logo, dark palette, orange accent and chamfered buttons.

## Flash-sale catalogue

`assets/data/flash-sale.json` holds 133 **distinct design listings**: 33 supplied photo-reference outfits, 12 photorealistic AI-generated fashion images, and 88 SVG garment illustrations. Colour requests are grouped inside a photo-reference style, never repeated as separate cards. AI-generated images and illustrations propose cuts/details, not actual stock or product photography. Twenty illustrations have been replaced: eight now use the latest supplied photos (replacing the first eight AI images in catalogue order), and twelve use AI-generated imagery. Eighty-eight illustrations still need replacement. AI imagery is explicitly labelled on cards, in image alt text, in product details and in the shop disclosure. All prices are whole KSh values between 500 and 1,000. All supplied outfit references are optimized local WebP assets. All 133 catalogue images are local and have unique artwork. SVG illustration sources and catalogue generation are in `scripts/build-design-studies.py` (Python standard library only). Run it from the repository root to rebuild the studies deterministically. `assets/data/generated-images.json` maps stable product IDs to optimized generated WebP assets; this manifest preserves replacements during rebuilds. Add future AI image batches there, then rerun the script. `assets/data/supplied-images.json` holds user-uploaded image replacements and matching names, descriptions, categories and colour requests; these overrides take precedence and are labelled as supplied photo references, not AI images. `assets/data/additional-outfits.json` adds 13 more uploaded outfits with their own IDs, names, categories, colours, prices and garment-specific descriptions; these are featured after the eight prior photo replacements and do not overwrite existing products. Some uploaded references include illustrated styling examples; those are preserved as supplied and not labelled AI-generated. Jewellery, bags, shoes and styling accessories are excluded in each new description. Original SVG studies are retained as source artwork, but replaced designs use their generated images in the catalogue.

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
