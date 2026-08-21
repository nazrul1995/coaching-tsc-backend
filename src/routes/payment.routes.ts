import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/auth.middleware";
import { StudentFeeControllers } from "../controllers/payment.controller";

const router = express.Router();

// ১. ম্যানুয়াল ফি জেনারেটর এপিআই
router.post(
  "/generate",
  verifyToken,
  authorizeRoles("admin"),
  StudentFeeControllers.generateNextCycleFee
);


// GET all fees summary for dashboard
router.get('/fees',verifyToken,
 StudentFeeControllers.getStudentFees);

// ২. ফি কালেকশন এপিআই (FIFO + PaymentLog)
router.post(
  "/pay",
  verifyToken,
  authorizeRoles("admin"),
  StudentFeeControllers.collectPayment
);

// ৩. কোনো স্টুডেন্টের বিস্তারিত পেমেন্ট ট্রানজেকশন হিস্ট্রি দেখা
router.get(
  "/logs/:studentId",
  verifyToken,
  authorizeRoles("admin", "student"),
  StudentFeeControllers.getStudentPaymentLogs
);

export const paymentRoutes = router;