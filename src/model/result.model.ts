import { model, Schema } from "mongoose";
import { TStudentResult } from "../types/result.interface";

const studentResultSchema = new Schema<TStudentResult>(
  {
    studentId: { type: String, required: true },
    studentName:{ type: String, required: true },
    studentPhoto:{ type: String},
    className: { type: String, required: true },
    examName: { type: String, required: true },
    subject: { type: String, required: true },

    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },

    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B', 'C', 'D', 'F'],
      required: true,
    },
    examAppearedDate: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const StudentResult = model<TStudentResult>('StudentResults', studentResultSchema);