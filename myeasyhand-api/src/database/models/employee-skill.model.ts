import { Schema, model, Document, Types } from 'mongoose';

export type SkillProficiency = 'beginner' | 'intermediate' | 'expert';

export interface IEmployeeSkill extends Document {
  employeeId: Types.ObjectId;
  businessId: Types.ObjectId;
  serviceId?: Types.ObjectId;
  skillName: string;
  proficiencyLevel: SkillProficiency;
  isDeleted: boolean;
}

const employeeSkillSchema = new Schema<IEmployeeSkill>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    skillName: { type: String, required: true, trim: true },
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'intermediate',
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

employeeSkillSchema.index({ employeeId: 1, skillName: 1 });

export const EmployeeSkill = model<IEmployeeSkill>('EmployeeSkill', employeeSkillSchema);
