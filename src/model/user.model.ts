import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';
import config from '../config';
import { IUser } from '../types/user.interface';

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'user' },
  image: { type: String },
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password as string, Number(config.bcrypt_salt_rounds));
});

export const User = model<IUser>('User', userSchema);