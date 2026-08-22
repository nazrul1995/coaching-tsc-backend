import { Schema, model } from "mongoose";
import { IStudentFee } from "../types/payement.interface";
// ❌ Avoid empty side-effect imports like: import "./student.model";
// ✅ Import the named Student model directly to guarantee registration
import { Student } from "./student.model"; 

const studentFeeSchema = new Schema<IStudentFee>(
  {
    student: { 
      type: Schema.Types.ObjectId, 
      ref: "Student", // 👈 Changed from "Student" to "Students"      required: true 
    },
    cycleStartDate: { type: Date, required: true },
    cycleEndDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentDate: { type: Date },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "overdue"],
      default: "unpaid",
    },
    remarks: { type: String },
  },
  { timestamps: true }
);

studentFeeSchema.index({ student: 1, cycleStartDate: 1 }, { unique: true });

export const StudentFee = model<IStudentFee>("StudentFee", studentFeeSchema);