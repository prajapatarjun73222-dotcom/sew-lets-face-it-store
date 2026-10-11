/**
 * Demo catalogue content. Prices, stock levels and photographs are illustrative placeholders
 * (free Unsplash images) and are NOT confirmed business information. Replace via the admin panel.
 */
const img = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

export const categories = [
  {
    name: 'Tote Bags',
    slug: 'tote-bags',
    description: 'Roomy, everyday totes in corduroy, canvas and printed cottons.',
    image: img('1603290939650-b553549a5739', 800),
    sortOrder: 1,
  },
  {
    name: 'Handbags',
    slug: 'handbags',
    description: 'Structured handmade handbags with personality.',
    image: img('1591561954557-26941169b49e', 800),
    sortOrder: 2,
  },
  {
    name: 'Toiletry Bags',
    slug: 'toiletry-bags',
    description: 'Practical wash bags and make-up pouches, lined and zipped.',
    image: img('1758398332771-0a79c5df74a3', 800),
    sortOrder: 3,
  },
  {
    name: 'Phone Cases',
    slug: 'phone-cases',
    description: 'Padded fabric phone pouches and sleeves.',
    image: img('1601593346740-925612772716', 800),
    sortOrder: 4,
  },
  {
    name: 'Embroidered Creations',
    slug: 'embroidered-creations',
    description: 'Machine-embroidered pieces with florals, names and motifs.',
    image: img('1527385352018-3c26dd6c3916', 800),
    sortOrder: 5,
  },
  {
    name: 'Personalised Gifts',
    slug: 'personalised-gifts',
    description: 'Thoughtful handmade gifts personalised with a name or message.',
    image: img('1513201099705-a9746e1e201f', 800),
    sortOrder: 6,
  },
];

const fabric = (...names) => names.map((name) => ({ name, type: 'fabric' }));
const colour = (...names) => names.map((name) => ({ name, type: 'colour' }));

export const products = [
  {
    name: 'Handmade Corduroy Tote Bag',
    category: 'tote-bags',
    price: 28,
    stock: 6,
    isFeatured: true,
    images: [img('1603290939650-b553549a5739'), img('1558769132-cb1aea458c5e')],
    variants: colour('Oatmeal', 'Sage', 'Terracotta'),
    description:
      'A soft, structured corduroy tote with long shoulder straps, a fully lined interior and an inside pocket for keys and phone. Roomy enough for a laptop, a book and the weekly odds and ends.',
  },
  {
    name: 'Floral Patchwork Tote',
    category: 'tote-bags',
    price: 32,
    stock: 3,
    isFeatured: true,
    images: [img('1767839507898-9a8624bdd8b0'), img('1520006403909-838d6b92c22e')],
    variants: fabric('Spring Meadow', 'Autumn Bloom'),
    description:
      'Pieced together from carefully chosen floral cottons, each patchwork tote is one of a kind. Lined in a complementary plain cotton with a secure magnetic closure.',
  },
  {
    name: 'Everyday Handmade Handbag',
    category: 'handbags',
    price: 30,
    stock: 5,
    isFeatured: true,
    images: [img('1612902456551-333ac5afa26e'), img('1760624294514-3548bee70d26')],
    variants: colour('Natural', 'Denim Blue'),
    description:
      'A neat, go-anywhere handbag with sturdy handles and a zipped top. Interior slip pockets keep the essentials organised.',
  },
  {
    name: 'Floral Structured Handbag',
    category: 'handbags',
    price: 36,
    salePrice: 32,
    stock: 2,
    isFeatured: true,
    images: [img('1591561954557-26941169b49e'), img('1594223274512-ad4803739b7c')],
    variants: fabric('Rose Garden', 'Wildflower'),
    description:
      'A structured top-handle bag in a bold floral print, interfaced for shape and finished with neat piping along the seams.',
  },
  {
    name: 'Teal Top-Handle Bag',
    category: 'handbags',
    price: 34,
    stock: 0,
    images: [img('1524498250077-390f9e378fc0'), img('1594223274512-ad4803739b7c')],
    variants: colour('Teal', 'Forest Green'),
    description:
      'A compact top-handle bag in a rich teal, with a detachable strap so it can be carried by hand or worn across the body.',
  },
  {
    name: 'Personalised Toiletry Bag',
    category: 'toiletry-bags',
    price: 18,
    stock: 8,
    isFeatured: true,
    isCustomisable: true,
    images: [img('1758398332771-0a79c5df74a3'), img('1556228578-8c89e6adf883')],
    variants: fabric('Daisy Print', 'Linen Look', 'Botanical'),
    description:
      'A generous wash bag with a water-resistant lining and a sturdy zip. Add a name or initials and it can be machine-embroidered on the front.',
  },
  {
    name: 'Floral Make-up Pouch',
    category: 'toiletry-bags',
    price: 14,
    stock: 10,
    images: [img('1524860155154-c904628c418c'), img('1563904092230-7ec217b65fe2')],
    variants: fabric('Peony', 'Meadow', 'Blush Stripe'),
    description:
      'A small zipped pouch for make-up, chargers or bits and bobs. Lined, lightly padded and easy to wipe clean.',
  },
  {
    name: 'Embroidered Phone Pouch',
    category: 'phone-cases',
    price: 16,
    stock: 7,
    isFeatured: true,
    isCustomisable: true,
    images: [img('1777148783728-510bbeeba075'), img('1601593346740-925612772716')],
    variants: colour('Cream', 'Sage', 'Dusky Pink'),
    description:
      'A padded fabric phone pouch with a machine-embroidered floral motif and an optional crossbody strap. Sized to fit most modern phones.',
  },
  {
    name: 'Padded Phone Sleeve',
    category: 'phone-cases',
    price: 12,
    stock: 2,
    images: [img('1601593346740-925612772716'), img('1767839507898-9a8624bdd8b0')],
    variants: fabric('Floral', 'Corduroy'),
    description: 'A simple padded slip sleeve to protect your phone inside a bag. Soft lining and a snug fit.',
  },
  {
    name: 'Embroidered Botanical Tote',
    category: 'embroidered-creations',
    price: 26,
    stock: 4,
    isFeatured: true,
    isCustomisable: true,
    images: [img('1771585655058-1772ec95b84b'), img('1777027517918-e123ad70ab0e')],
    variants: colour('Cornflower Blue', 'Sage Green'),
    description:
      'A natural cotton tote decorated with a machine-embroidered botanical design. Personalise it with a name or short message underneath.',
  },
  {
    name: 'Embroidered Hoop Keepsake',
    category: 'embroidered-creations',
    price: 22,
    stock: 3,
    isCustomisable: true,
    images: [img('1527385352018-3c26dd6c3916'), img('1777148783728-510bbeeba075')],
    variants: [],
    description:
      'A framed embroidery hoop with a floral design, ready to hang. A lovely keepsake that can include a name, date or short phrase.',
  },
  {
    name: 'Custom Fabric Shopper',
    category: 'personalised-gifts',
    price: 30,
    stock: 5,
    isFeatured: true,
    isCustomisable: true,
    images: [img('1572196284554-4e321b0e7e0b'), img('1565592284342-7ed1636f409f')],
    variants: fabric('Your choice of fabric'),
    description:
      'A sturdy shopper made in a fabric of your choosing. Tell us the colours, prints or theme you love in the personalisation box and we will be in touch to discuss options.',
  },
];
