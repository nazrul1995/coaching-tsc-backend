import { Schema, model } from "mongoose";
import { TEnrollCourse } from "../types/enroll.interface";

const enrollCourseSchema = new Schema<TEnrollCourse >(
  {
    userEmail: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
    },
    courseTitle: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const EnrollCourse = model<TEnrollCourse>(
  "EnrollCourse",
  enrollCourseSchema
);