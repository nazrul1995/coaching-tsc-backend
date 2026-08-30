"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentFeeControllers = exports.getPaymentSummary = exports.getAllPayments = exports.generateStudentCycles = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const student_model_1 = require("../model/student.model");
const payment_model_1 = require("../model/payment.model");
// Helper function to handle month increments cleanly
const addOneMonth = (date) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1);
    return result;
};
const generateStudentCycles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        const students = yield student_model_1.Student.find({ isActive: { $ne: false } });
        let createdCount = 0;
        const newCycles = [];
        for (const student of students) {
            if (!student.admissionDate)
                continue;
            // Find last generated fee
            const lastFee = yield payment_model_1.StudentFee.findOne({ student: student._id }).sort({ cycleEndDate: -1 });
            let currentStart = lastFee ? new Date(lastFee.cycleEndDate) : new Date(student.admissionDate);
            while (currentStart < today) {
                const currentEnd = addOneMonth(currentStart);
                const dueDate = new Date(currentEnd);
                newCycles.push({
                    student: student._id,
                    cycleStartDate: new Date(currentStart),
                    cycleEndDate: new Date(currentEnd),
                    dueDate: dueDate,
                    amount: student.monthlyFee || 0,
                    paidAmount: 0,
                    status: "unpaid",
                });
                createdCount++;
                currentStart = currentEnd;
            }
        }
        // Insert in bulk to improve performance
        if (newCycles.length > 0) {
            yield payment_model_1.StudentFee.insertMany(newCycles, { ordered: false });
        }
        return res.status(200).json({
            success: true,
            message: `Successfully created ${createdCount} missing fee cycles.`,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.generateStudentCycles = generateStudentCycles;
const getAllPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        // 1. Mark unpaid cycles as overdue if due date has passed
        yield payment_model_1.StudentFee.updateMany({
            dueDate: { $lt: today },
            status: "unpaid",
        }, { $set: { status: "overdue" } });
        // 2. Fetch all cycles with populated student info
        const payments = yield payment_model_1.StudentFee.find()
            .populate({
            path: "student",
            select: "name roll email phone",
        })
            .sort({ cycleStartDate: -1 })
            .lean();
        // 3. Map result so studentId maps cleanly to populated student
        const formattedPayments = payments.map((fee) => (Object.assign(Object.assign({}, fee), { studentId: fee.student })));
        return res.status(200).json({
            success: true,
            count: formattedPayments.length,
            data: formattedPayments,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.getAllPayments = getAllPayments;
// Retrieve payment records with status and date filtering
const getAllFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, startDate, endDate } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (startDate || endDate) {
            filter.dueDate = {};
            if (startDate)
                filter.dueDate.$gte = new Date(startDate);
            if (endDate)
                filter.dueDate.$lte = new Date(endDate);
        }
        const fees = yield payment_model_1.StudentFee.find(filter)
            .populate("student", "name email phone className monthlyFee admissionDate")
            .sort({ dueDate: -1 });
        const data = fees.map((fee) => (Object.assign(Object.assign({}, fee.toObject()), { dueAmount: fee.amount - fee.paidAmount })));
        return res.status(200).json({ success: true, count: data.length, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
// Retrieve individual student ledger and balance summary
const getStudentFeeHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const student = yield student_model_1.Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        const fees = yield payment_model_1.StudentFee.find({ student: studentId }).sort({ cycleStartDate: -1 });
        const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
        const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
        const totalOutstanding = totalAmount - totalPaid;
        const history = fees.map((fee) => (Object.assign(Object.assign({}, fee.toObject()), { dueAmount: fee.amount - fee.paidAmount })));
        return res.status(200).json({
            success: true,
            student: {
                id: student._id,
                name: student.name,
                admissionDate: student.admissionDate,
                monthlyFee: student.monthlyFee,
            },
            summary: { totalAmount, totalPaid, totalOutstanding },
            history,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
// Collect payment and apply to oldest due cycles first (Transaction-Safe)
const collectPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { studentId, amount } = req.body;
        const paymentAmount = Number(amount);
        if (!studentId || !paymentAmount || paymentAmount <= 0) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Valid studentId and positive amount required." });
        }
        // Get all outstanding fees sorted by oldest cycle first
        const dueFees = yield payment_model_1.StudentFee.find({
            student: studentId,
            status: { $in: ["unpaid", "partial", "overdue"] },
        })
            .sort({ cycleStartDate: 1 })
            .session(session);
        if (dueFees.length === 0) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Student has no outstanding dues." });
        }
        const totalOutstanding = dueFees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
        if (paymentAmount > totalOutstanding) {
            yield session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Payment exceeds total outstanding balance.",
                totalOutstanding,
            });
        }
        let remainingPayment = paymentAmount;
        const updatedFees = [];
        for (const fee of dueFees) {
            if (remainingPayment <= 0)
                break;
            const cycleDue = fee.amount - fee.paidAmount;
            const allocatedAmount = Math.min(remainingPayment, cycleDue);
            fee.paidAmount += allocatedAmount;
            fee.paymentDate = new Date();
            if (fee.paidAmount >= fee.amount) {
                fee.status = "paid";
            }
            else {
                fee.status = "partial";
            }
            yield fee.save({ session });
            remainingPayment -= allocatedAmount;
            updatedFees.push({
                feeId: fee._id,
                cycle: `${fee.cycleStartDate.toISOString().slice(0, 10)} to ${fee.cycleEndDate.toISOString().slice(0, 10)}`,
                allocatedAmount,
                remainingDue: fee.amount - fee.paidAmount,
                status: fee.status,
            });
        }
        yield session.commitTransaction();
        session.endSession();
        return res.status(200).json({
            success: true,
            message: "Payment processed successfully.",
            collectedAmount: paymentAmount,
            updatedFees,
        });
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        return res.status(500).json({ success: false, message: error.message });
    }
});
// Financial overview across all dynamic cycles
const getPaymentSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield payment_model_1.StudentFee.aggregate([
            {
                $group: {
                    _id: null,
                    totalCollected: { $sum: "$paidAmount" },
                    totalPending: {
                        $sum: {
                            $cond: [
                                { $ne: ["$status", "paid"] },
                                { $subtract: ["$amount", "$paidAmount"] },
                                0,
                            ],
                        },
                    },
                    overdueCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "overdue"] }, 1, 0],
                        },
                    },
                },
            },
        ]);
        const summary = stats[0] || {
            totalCollected: 0,
            totalPending: 0,
            overdueCount: 0,
        };
        return res.status(200).json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.getPaymentSummary = getPaymentSummary;
// ==========================================
// Manual Trigger: Generate Due Cycles & Update Overdues
// ==========================================
const syncStudentFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        // 1. Mark past-due unpaid fees as overdue
        const overdueResult = yield payment_model_1.StudentFee.updateMany({ dueDate: { $lt: today }, status: "unpaid" }, { $set: { status: "overdue" } });
        // 2. Fetch active students
        const students = yield student_model_1.Student.find({ isActive: { $ne: false } });
        let newCyclesCreated = 0;
        for (const student of students) {
            if (!student.admissionDate)
                continue;
            // Find the last generated cycle for this student
            const lastFee = yield payment_model_1.StudentFee.findOne({ student: student._id }).sort({
                cycleEndDate: -1,
            });
            let nextStart = lastFee
                ? new Date(lastFee.cycleEndDate)
                : new Date(student.admissionDate);
            // Generate cycles up to current date
            while (nextStart <= today) {
                const nextEnd = addOneMonth(nextStart);
                yield payment_model_1.StudentFee.create({
                    student: student._id,
                    cycleStartDate: nextStart,
                    cycleEndDate: nextEnd,
                    dueDate: nextEnd,
                    amount: student.monthlyFee,
                    paidAmount: 0,
                    status: "unpaid",
                });
                newCyclesCreated++;
                nextStart = nextEnd;
            }
        }
        return res.status(200).json({
            success: true,
            message: "Student fee system synced successfully.",
            summary: {
                overdueFeesUpdated: overdueResult.modifiedCount,
                newCyclesCreated,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to sync student fees",
            error: error.message,
        });
    }
});
exports.StudentFeeControllers = {
    generateStudentCycles: exports.generateStudentCycles,
    getAllFees,
    getStudentFeeHistory,
    collectPayment,
    getPaymentSummary: exports.getPaymentSummary,
    syncStudentFees,
};
