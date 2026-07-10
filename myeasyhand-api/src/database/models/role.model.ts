import { Schema, model, Document, Types } from 'mongoose';
import { RoleSlug } from '../../common/types/express';

export interface IRole extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: RoleSlug;
  description?: string;
  isSystem: boolean;
  permissions: string[];
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    isSystem: { type: Boolean, default: false },
    permissions: [{ type: String }],
  },
  { timestamps: true },
);

export const Role = model<IRole>('Role', roleSchema);
