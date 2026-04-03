import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';
import { TTeacher } from '../types/teacher.interface';

const teacherSchema = new Schema<TTeacher>({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      phone: { type: String, required: true },
      photo: { type: String },

      bio: { type: String },
      qualification: { type: String },
      experience: { type: String },
      subjects: [{ type: String }],
      teachingLevel: { type: String },

      availableDays: [{ type: String }],
      availableTime: { type: String },

      linkedin: { type: String },
      facebook: { type: String },
      twitter: { type: String },
      website: { type: String },

      rating: { type: Number, min: 1, max: 5 },
      reviewsCount: { type: Number },

      status: { type: String, enum: ["active", "inactive"] }
}, {
  timestamps: true,
});

export const Teacher = model<TTeacher>('Teachers', teacherSchema);