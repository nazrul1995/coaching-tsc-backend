import { Request, Response } from "express";
import mongoose from "mongoose";
import { Student } from "../model/student.model"; // আপনার প্রজেক্টের পাথ অনুযায়ী অ্যাডজাস্ট করুন
import { StudentFee, PaymentLog } from "../model/payment.model";
import { AuthRequest } from "../middleware/auth.middleware";

// 1. Core Generator Engine (Reusable Engine)
export const evaluateBillingCyclesEngine = async () => {
  // ১. কেবল যেসব স্টুডেন্টের admissionDate এবং monthlyFee বিদ্যমান আছে তাদের ফিল্টার করুন
  const activeStudents = await Student.find({
    admissionDate: { $exists: true, $ne: null },
    monthlyFee: { $exists: true, $ne: null },
  });

  let createdCount = 0;
  const now = new Date();

  for (const student of activeStudents) {
    // admissionDate সঠিক Date Object কিনা তা নিশ্চিত করা
    const rawAdmissionDate = new Date(student.admissionDate);
    if (isNaN(rawAdmissionDate.getTime())) {
      console.warn(`[SKIP] Invalid admissionDate for student: ${student._id}`);
      continue; // তারিখ ভুল থাকলে এই স্টুডেন্ট স্কিপ হবে
    }

    // monthlyFee সঠিক সংখ্যা কিনা তা নিশ্চিত করা
    const studentFeeAmount = Number(student.monthlyFee);
    if (!Number.isFinite(studentFeeAmount) || studentFeeAmount <= 0) {
      console.warn(`[SKIP] Invalid monthlyFee for student: ${student._id}`);
      continue;
    }

    let hasMoreCycles = true;

    while (hasMoreCycles) {
      const lastFee = await StudentFee.findOne({ student: student._id }).sort({
        cycleEndDate: -1,
      });

      let cycleStartDate: Date;
      if (lastFee && !isNaN(new Date(lastFee.cycleEndDate).getTime())) {
        cycleStartDate = new Date(lastFee.cycleEndDate);
      } else {
        cycleStartDate = new Date(rawAdmissionDate);
      }

      const cycleEndDate = new Date(cycleStartDate);
      cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);

      if (now < cycleEndDate) {
        hasMoreCycles = false;
        break;
      }

      const dueDate = new Date(cycleEndDate);
      dueDate.setDate(dueDate.getDate() + 7);

      await StudentFee.create({
        student: student._id,
        cycleStartDate,
        cycleEndDate,
        dueDate,
        amount: studentFeeAmount, // Validated amount
        paidAmount: 0,
        status: "unpaid",
      });

      createdCount++;
    }
  }

  // Overdue Sync
  await StudentFee.updateMany(
    { status: { $ne: "paid" }, dueDate: { $lt: now } },
    { $set: { status: "overdue" } }
  );

  return createdCount;
};

// API Endpoint Handler for Manual Generator
const generateNextCycleFee = async (req: Request, res: Response) => {
  try {
    const createdCount = await evaluateBillingCyclesEngine();
    return res.status(200).json({
      success: true,
      message: "Billing cycles evaluated and database synced successfully",
      newFeesCreated: createdCount,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate billing cycle fees",
      error: error.message,
    });
  }
};

// 2. Collect Payment (With Audit Log & FIFO)
const collectPayment = async (req: Request, res: Response) => {
  console.log("[Payment Collection] Request Body:", req.body);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { studentId, amount, paymentMethod, trxId, remarks } = req.body;
    const adminId = (req as any).user?._id; // Auth middleware থেকে পাওয়া admin user ID
    const paymentAmount = Number(amount);

    if (!studentId || !paymentAmount || paymentAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Valid Student ID and payment amount (>0) are required",
      });
    }

    const student = await Student.findById(studentId).session(session);
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // বকেয়া বিলগুলো বের করা (পুরোনো সাইকেল আগে)
    const pendingFees = await StudentFee.find({
      student: studentId,
      status: { $in: ["unpaid", "partial", "overdue"] },
    })
      .sort({ cycleStartDate: 1 })
      .session(session);

    if (pendingFees.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "This student has no due fees",
      });
    }

    const totalDue = pendingFees.reduce(
      (sum, fee) => sum + (fee.amount - fee.paidAmount),
      0
    );

    if (paymentAmount > totalDue) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Payment amount (${paymentAmount}) exceeds total due (${totalDue})`,
        totalDue,
      });
    }

    let remainingPayment = paymentAmount;
    const paymentLogs = [];

    for (const fee of pendingFees) {
      if (remainingPayment <= 0) break;

      const dueAmount = fee.amount - fee.paidAmount;
      const paymentForThisFee = Math.min(remainingPayment, dueAmount);

      fee.paidAmount += paymentForThisFee;

      if (fee.paidAmount >= fee.amount) {
        fee.paidAmount = fee.amount;
        fee.status = "paid";
      } else {
        fee.status = "partial";
      }

      await fee.save({ session });

      // Audit Log তৈরি করা
      const log = await PaymentLog.create(
        [
          {
            student: student._id,
            fee: fee._id,
            amountPaid: paymentForThisFee,
            paymentMethod: paymentMethod || "cash",
            trxId,
            collectedBy: adminId,
            remarks,
          },
        ],
        { session }
      );

      paymentLogs.push(log[0]);
      remainingPayment -= paymentForThisFee;
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Payment collected successfully and logged",
      paymentAmount,
      logs: paymentLogs,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: "Failed to collect payment",
      error: error.message,
    });
  }
};

// 3. Get Student Payment Audit History
const getStudentPaymentLogs = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const logs = await PaymentLog.find({ student: studentId })
      .populate("collectedBy", "name email")
      .populate("fee", "cycleStartDate cycleEndDate")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
      error: error.message,
    });
  }
};

export const getStudentFees = async (req: AuthRequest, res: Response) => {
  try {
    const fees = await StudentFee.find()
      .populate('student', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: fees,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment fees',
      error: error.message,
    });
  }
};

export const StudentFeeControllers = {
  generateNextCycleFee,
  collectPayment,
  getStudentPaymentLogs,
  getStudentFees,
};