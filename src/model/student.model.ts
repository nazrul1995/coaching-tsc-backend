import { Schema, model } from 'mongoose';
import { TStudent } from '../types/student.interface';

const studentSchema = new Schema<TStudent>({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      guradianName: { type: String, required: true },
      phone: { type: String, required: true },
      institution: { type: String, required: true },
      className: { type: String, required: true },
      batch: { type: String },
      group: { type: String, enum: ["science", "commerce", "arts","general"] },
      admissionDate: { type: Date, required: true },
      photo: { type: String },
        monthlyFee: {
      type: Number,
      required: true,
      min: 0,
    },
}, {
  timestamps: true,
});

export const Student = model<TStudent>('Student', studentSchema);