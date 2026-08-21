import { Types } from "mongoose";

export interface IStudentFee {
  _id?: Types.ObjectId;
  student: Types.ObjectId;
  cycleStartDate: Date;
  cycleEndDate: Date;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  paymentDate?: Date;
  status: "unpaid" | "partial" | "paid" | "overdue";
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}