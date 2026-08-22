import { Types } from "mongoose";

export type FeeStatus = "unpaid" | "partial" | "paid" | "overdue";

export interface IStudentFee {
  _id?: Types.ObjectId;
  student: Types.ObjectId;
  cycleStartDate: Date;
  cycleEndDate: Date;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  paymentDate?: Date;
  status: FeeStatus;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}