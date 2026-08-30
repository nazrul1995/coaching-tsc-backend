"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exam = void 0;
const mongoose_1 = require("mongoose");
const examSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
exports.Exam = (0, mongoose_1.model)("Exam", examSchema);
