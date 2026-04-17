import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';
import { TStudent } from '../types/student.interface';

const studentSchema = new Schema<TStudent>({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      phone: { type: String, required: true },
      institution: { type: String, required: true },
      className: { type: String, required: true },
      batch: { type: String },
      group: { type: String, enum: ["science", "commerce", "arts"] },
      photo: { type: String },
}, {
  timestamps: true,
});

export const Student = model<TStudent>('Students', studentSchema);