import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/auth.middleware";
import { StudentFeeControllers } from "../controllers/payment.controller";

const router = express.Router();

// Apply token verification middleware to all payment routes
router.use(verifyToken);

// Trigger button endpoint: Generates new cycles & updates past-due statuses
router.post(
  "/sync-fees",
  authorizeRoles("admin"),
  StudentFeeControllers.syncStudentFees
);

// Get all student fees (filterable by status, date range)
router.get(
  "/",
  authorizeRoles("admin"),
  StudentFeeControllers.getAllFees
);

// Get payment history & total outstanding balance for a specific student
router.get(
  "/student/:studentId",
  authorizeRoles("admin", "student"),
  StudentFeeControllers.getStudentFeeHistory
);

// Collect payment and apply FIFO distribution across due cycles
router.post(
  "/pay",
  authorizeRoles("admin"),
  StudentFeeControllers.collectPayment
);

// Get system financial summary
router.get(
  "/summary",
  authorizeRoles("admin"),
  StudentFeeControllers.getPaymentSummary
);

export const paymentRoutes = router;