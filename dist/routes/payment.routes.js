"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const payment_controller_1 = require("../controllers/payment.controller");
const router = express_1.default.Router();
// Apply token verification middleware to all payment routes
router.use(auth_middleware_1.verifyToken);
// Trigger button endpoint: Generates new cycles & updates past-due statuses
router.post("/sync-fees", (0, auth_middleware_1.authorizeRoles)("admin"), payment_controller_1.StudentFeeControllers.syncStudentFees);
// Get all student fees (filterable by status, date range)
router.get("/", (0, auth_middleware_1.authorizeRoles)("admin"), payment_controller_1.StudentFeeControllers.getAllFees);
router.get("/all", (0, auth_middleware_1.authorizeRoles)("admin"), payment_controller_1.StudentFeeControllers.getAllPayments);
// Get payment history & total outstanding balance for a specific student
router.get("/student/:userId", (0, auth_middleware_1.authorizeRoles)("admin", "student"), payment_controller_1.StudentFeeControllers.getStudentFeeHistory);
// Collect payment and apply FIFO distribution across due cycles
router.post("/pay", (0, auth_middleware_1.authorizeRoles)("admin"), payment_controller_1.StudentFeeControllers.collectPayment);
// Get system financial summary
router.get("/summary", (0, auth_middleware_1.authorizeRoles)("admin"), payment_controller_1.StudentFeeControllers.getPaymentSummary);
// generateStudentCycles,
// getAllFees,
// getStudentFeeHistory,
// collectPayment,
// getPaymentSummary,
// syncStudentFees,
exports.paymentRoutes = router;
