"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentFee = void 0;
const mongoose_1 = require("mongoose");
const studentFeeSchema = new mongoose_1.Schema({
    student: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Student", // 👈 Changed from "Student" to "Students"      required: true 
    },
    cycleStartDate: { type: Date, required: true },
    cycleEndDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentDate: { type: Date },
    status: {
        type: String,
        enum: ["unpaid", "partial", "paid", "overdue"],
        default: "unpaid",
    },
    remarks: { type: String },
}, { timestamps: true });
studentFeeSchema.index({ student: 1, cycleStartDate: 1 }, { unique: true });
exports.StudentFee = (0, mongoose_1.model)("StudentFee", studentFeeSchema);
