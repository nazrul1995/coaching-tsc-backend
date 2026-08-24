import { Schema, model } from "mongoose";
import {
  IExamResult,
  ISubjectResult,
} from "../types/examResult.interface";

const subjectResultSchema = new Schema<ISubjectResult>(
  {
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    marks: {
      type: Number,
      required: true,
      min: 0,
    },

    fullMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    grade: {
      type: String,
      enum: ["A+", "A", "A-", "B", "C", "D", "F"],
    },
  },
  { _id: false }
);

const examResultSchema = new Schema<IExamResult>(
  {
    exam: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },

    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    subjectResults: {
      type: [subjectResultSchema],
      default: [],
    },

    // Obtained marks
    marks: {
      type: Number,
      required: true,
      min: 0,
    },

    // Full marks
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    grade: {
      type: String,
      enum: ["A+", "A", "A-", "B", "C", "D", "F"],
      required: true,
    },

    isAbsent: {
      type: Boolean,
      default: false,
    },

    // Result workflow state.
    // draft -> published
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * একজন student একই exam-এ একবারের বেশি result পাবে না।
 */
examResultSchema.index(
  { exam: 1, student: 1 },
  { unique: true }
);

export const ExamResult = model<IExamResult>(
  "ExamResult",
  examResultSchema
);
