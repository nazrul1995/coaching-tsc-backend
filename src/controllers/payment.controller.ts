import { Request, Response } from "express";
import mongoose from "mongoose";
import { Student } from "../model/student.model";
import { StudentFee } from "../model/payment.model";

// Helper function to handle month increments cleanly
const addOneMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  return result;
};

export const generateStudentCycles = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const students = await Student.find({ isActive: { $ne: false } });

    let createdCount = 0;
    const newCycles = [];

    for (const student of students) {
      if (!student.admissionDate) continue;

      // Find last generated fee
      const lastFee = await StudentFee.findOne({ student: student._id }).sort({ cycleEndDate: -1 });

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
      await StudentFee.insertMany(newCycles, { ordered: false });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully created ${createdCount} missing fee cycles.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const today = new Date();

    // ১. নির্ধারিত তারিখ পেরিয়ে যাওয়া অবিক্রীত/অনাদায়ী সাইকেলগুলোকে Overdue মার্ক করা
    await StudentFee.updateMany(
      {
        dueDate: { $lt: today },
        status: "unpaid",
      },
      { $set: { status: "overdue" } }
    );

    // ২. StudentFee সংগ্রহ থেকে প্রতি স্টুডেন্ট অনুযায়ী Aggregation চালান
    const summaryData = await StudentFee.aggregate([
      {
        $group: {
          _id: "$student",
          totalAmount: { $sum: "$amount" },
          totalPaid: { $sum: "$paidAmount" },
          totalCycles: { $sum: 1 },
          overdueCycles: {
            $sum: {
              $cond: [{ $eq: ["$status", "overdue"] }, 1, 0],
            },
          },
          lastPaymentDate: { $max: "$paymentDate" },
        },
      },
      {
        $lookup: {
          from: "students", // নিশ্চিত করুন Mongoose এ Student Collection নাম 'students'
          localField: "_id",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      {
        $unwind: "$studentInfo",
      },
      {
        $project: {
          _id: 0,
          studentId: "$studentInfo._id",
          student: {
            _id: "$studentInfo._id",
            name: "$studentInfo.name",
            userId: "$studentInfo.userId",
            admissionDate: "$studentInfo.admissionDate",
            email: "$studentInfo.email",
            phone: "$studentInfo.phone",
            className: "$studentInfo.className",
            monthlyFee: "$studentInfo.monthlyFee",
          },
          totalAmount: 1,
          totalPaid: 1,
          totalOutstanding: { $subtract: ["$totalAmount", "$totalPaid"] },
          totalCycles: 1,
          overdueCycles: 1,
          lastPaymentDate: 1,
        },
      },
      {
        $sort: { "student.admissionDate": 1 }, // প্রয়োজন অনুযায়ী সর্ট করুন
      },
    ]);

    return res.status(200).json({
      success: true,
      count: summaryData.length,
      data: summaryData,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// Retrieve payment records with status and date filtering
const getAllFees = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) filter.dueDate.$gte = new Date(startDate as string);
      if (endDate) filter.dueDate.$lte = new Date(endDate as string);
    }

    const fees = await StudentFee.find(filter)
      .populate("student", "name email phone className monthlyFee admissionDate")
      .sort({ dueDate: -1 });

    const data = fees.map((fee) => ({
      ...fee.toObject(),
      dueAmount: fee.amount - fee.paidAmount,
    }));

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Retrieve individual student ledger and balance summary
const getStudentFeeHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const fees = await StudentFee.find({ student: student._id }).sort({ cycleStartDate: -1 });

    const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalOutstanding = totalAmount - totalPaid;

    const history = fees.map((fee) => ({
      ...fee.toObject(),
      dueAmount: fee.amount - fee.paidAmount,
    }));

    return res.status(200).json({
      success: true,
      student: {
        id: student._id,
        userId: student?.userId,
        name: student.name,
        admissionDate: student.admissionDate,
        monthlyFee: student.monthlyFee,
      },
      summary: { totalAmount, totalPaid, totalOutstanding },
      history,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Collect payment and apply to oldest due cycles first (Transaction-Safe)
const collectPayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { studentId, amount } = req.body;
    const paymentAmount = Number(amount);

    if (!studentId || !paymentAmount || paymentAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Valid studentId and positive amount required." });
    }

    // Get all outstanding fees sorted by oldest cycle first
    const dueFees = await StudentFee.find({
      student: studentId,
      status: { $in: ["unpaid", "partial", "overdue"] },
    })
      .sort({ cycleStartDate: 1 })
      .session(session);

    if (dueFees.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Student has no outstanding dues." });
    }

    const totalOutstanding = dueFees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);

    if (paymentAmount > totalOutstanding) {
      await session.abortTransaction();
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
      if (remainingPayment <= 0) break;

      const cycleDue = fee.amount - fee.paidAmount;
      const allocatedAmount = Math.min(remainingPayment, cycleDue);

      fee.paidAmount += allocatedAmount;
      fee.paymentDate = new Date();

      if (fee.paidAmount >= fee.amount) {
        fee.status = "paid";
      } else {
        fee.status = "partial";
      }

      await fee.save({ session });
      remainingPayment -= allocatedAmount;

      updatedFees.push({
        feeId: fee._id,
        cycle: `${fee.cycleStartDate.toISOString().slice(0, 10)} to ${fee.cycleEndDate.toISOString().slice(0, 10)}`,
        allocatedAmount,
        remainingDue: fee.amount - fee.paidAmount,
        status: fee.status,
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Payment processed successfully.",
      collectedAmount: paymentAmount,
      updatedFees,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Financial overview across all dynamic cycles
export const getPaymentSummary = async (req: Request, res: Response) => {
  try {
    const stats = await StudentFee.aggregate([
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// Manual Trigger: Generate Due Cycles & Update Overdues
// ==========================================
const syncStudentFees = async (req: Request, res: Response) => {
  try {
    const today = new Date();

    // 1. Mark past-due unpaid fees as overdue
    const overdueResult = await StudentFee.updateMany(
      { dueDate: { $lt: today }, status: "unpaid" },
      { $set: { status: "overdue" } }
    );

    // 2. Fetch active students
    const students = await Student.find({ isActive: { $ne: false } });

    let newCyclesCreated = 0;

    for (const student of students) {
      if (!student.admissionDate) continue;

      // Find the last generated cycle for this student
      const lastFee = await StudentFee.findOne({ student: student._id }).sort({
        cycleEndDate: -1,
      });

      let nextStart = lastFee
        ? new Date(lastFee.cycleEndDate)
        : new Date(student.admissionDate);

      // Generate cycles up to current date
      while (nextStart <= today) {
        const nextEnd = addOneMonth(nextStart);

        await StudentFee.create({
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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to sync student fees",
      error: error.message,
    });
  }
};

export const StudentFeeControllers = {
  generateStudentCycles,
  getAllFees,
  getStudentFeeHistory,
  collectPayment,
  getPaymentSummary,
  syncStudentFees,
  getAllPayments,
};