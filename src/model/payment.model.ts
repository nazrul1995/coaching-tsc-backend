import { Schema, model, Types } from "mongoose";

// --- 1. Student Fee Schema ---
export interface IStudentFee {
  _id?: Types.ObjectId;
  student: Types.ObjectId;
  cycleStartDate: Date;
  cycleEndDate: Date;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  status: "unpaid" | "partial" | "paid" | "overdue";
  createdAt?: Date;
  updatedAt?: Date;
}

const feeSchema = new Schema<IStudentFee>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    cycleStartDate: { type: Date, required: true },
    cycleEndDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "overdue"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

feeSchema.index({ student: 1, cycleStartDate: 1 }, { unique: true });
export const StudentFee = model<IStudentFee>("StudentFee", feeSchema);


// --- 2. Payment Log / Audit Schema ---
export interface IPaymentLog {
  _id?: Types.ObjectId;
  student: Types.ObjectId;
  fee: Types.ObjectId;
  amountPaid: number;
  paymentMethod: "cash" | "bkash" | "nagad" | "bank";
  trxId?: string;
  collectedBy?: Types.ObjectId;
  remarks?: string;
  createdAt?: Date;
}

const paymentLogSchema = new Schema<IPaymentLog>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    fee: { type: Schema.Types.ObjectId, ref: "StudentFee", required: true },
    amountPaid: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ["cash", "bkash", "nagad", "bank"],
      default: "cash",
    },
    trxId: { type: String },
    collectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    remarks: { type: String },
  },
  { timestamps: true }
);

export const PaymentLog = model<IPaymentLog>("PaymentLog", paymentLogSchema);