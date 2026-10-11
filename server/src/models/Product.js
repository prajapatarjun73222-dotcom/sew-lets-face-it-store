import mongoose from 'mongoose';

const urlPattern = /^https?:\/\/\S+$/i;

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    type: { type: String, enum: ['fabric', 'colour'], default: 'fabric' },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 4000, default: '' },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    salePrice: {
      type: Number,
      min: [0, 'Sale price cannot be negative'],
      default: null,
      validate: {
        validator(value) {
          if (value === null || value === undefined) return true;
          const price = this.price ?? this.get?.('price');
          return price === undefined || value < price;
        },
        message: 'Sale price must be lower than the regular price',
      },
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    images: {
      type: [{ type: String, trim: true, match: [urlPattern, 'Images must be valid http(s) URLs'] }],
      default: [],
    },
    variants: { type: [variantSchema], default: [] },
    stock: { type: Number, min: [0, 'Stock cannot be negative'], default: 0 },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    isCustomisable: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('effectivePrice').get(function effectivePrice() {
  return this.salePrice !== null && this.salePrice !== undefined ? this.salePrice : this.price;
});

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isPublished: 1, category: 1, price: 1 });

export const LOW_STOCK_THRESHOLD = 3;

export default mongoose.model('Product', productSchema);
