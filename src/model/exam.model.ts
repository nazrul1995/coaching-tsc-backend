import { Schema, model } from "mongoose";

export type ExamType = "weekly" | "model_test";

export type ExamStatus = "draft" | "published";

const examSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["weekly", "model_test"],
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    examDate: {
      type: Date,
      required: true,
    },

    // কোন class-এর জন্য
    className: {
      type: String,
      required: true,
    },

    // চাইলে নির্দিষ্ট batch-এর জন্য exam
    batch: {
      type: String,
    },

    group: {
      type: String,
      enum: ["science", "commerce", "arts", "general"],
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Exam = model("Exam", examSchema);
