"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentResult = void 0;
const mongoose_1 = require("mongoose");
const studentResultSchema = new mongoose_1.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    studentPhoto: { type: String },
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
}, {
    timestamps: true,
});
exports.StudentResult = (0, mongoose_1.model)('StudentResults', studentResultSchema);
