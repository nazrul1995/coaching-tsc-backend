import { Schema, model } from "mongoose";
import { TReview } from "../types/review.interface";


const reviewSchema = new Schema<TReview>(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      ref: "Course",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Review = model<TReview>("Review", reviewSchema);