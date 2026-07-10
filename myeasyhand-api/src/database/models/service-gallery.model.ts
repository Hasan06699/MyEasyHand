import { Schema, model, Document, Types } from 'mongoose';

export interface IServiceGallery extends Document {
  serviceId: Types.ObjectId;
  businessId: Types.ObjectId;
  imagePath: string;
  sortOrder: number;
  isDeleted: boolean;
}

const serviceGallerySchema = new Schema<IServiceGallery>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    imagePath: { type: String, required: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

serviceGallerySchema.index({ serviceId: 1, sortOrder: 1 });

export const ServiceGallery = model<IServiceGallery>('ServiceGallery', serviceGallerySchema);
