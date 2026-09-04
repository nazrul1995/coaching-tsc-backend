"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.examRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const examResult_controller_1 = require("../controllers/examResult.controller");
const exam_controller_1 = require("../controllers/exam.controller");
const router = express_1.default.Router();
// ======================================================
// OVERALL COACHING LEADERBOARD
// ======================================================
router.get("/leaderboard/overall", examResult_controller_1.examResultControllers.getOverallLeaderboard);
router.use(auth_middleware_1.verifyToken);
// ======================================================
// EXAMS
// ======================================================
router.post("/", (0, auth_middleware_1.authorizeRoles)("admin", "teacher"), exam_controller_1.ExamControllers.createExam);
router.get("/", exam_controller_1.ExamControllers.getAllExams);
router.get("/:examId", exam_controller_1.ExamControllers.getExam);
// Update existing exam
router.put("/:examId", exam_controller_1.ExamControllers.updateExam);
// Delete exam
router.delete("/:examId", exam_controller_1.ExamControllers.deleteExam);
router.patch("/:examId/publish", (0, auth_middleware_1.authorizeRoles)("admin", "teacher"), exam_controller_1.ExamControllers.publishExam);
// Eligible students for result entry
router.get("/:examId/eligible-students", (0, auth_middleware_1.authorizeRoles)("admin", "teacher"), exam_controller_1.ExamControllers.getEligibleStudents);
// ======================================================
// RESULTS
// ======================================================
router.post("/results", (0, auth_middleware_1.authorizeRoles)("admin", "teacher"), examResult_controller_1.examResultControllers.createResult);
router.post("/results/bulk", (0, auth_middleware_1.authorizeRoles)("admin", "teacher"), examResult_controller_1.examResultControllers.addBulkResults);
// View draft/published results for an exam
router.get("/:examId/results", (0, auth_middleware_1.authorizeRoles)("admin", "teacher"), examResult_controller_1.examResultControllers.getExamResults);
// Publish all draft results for an exam
router.patch("/results/:examId/publish", (0, auth_middleware_1.authorizeRoles)("admin", "teacher"), examResult_controller_1.examResultControllers.publishResults);
// ======================================================
// EXAM LEADERBOARD
// ======================================================
router.get("/:examId/leaderboard", examResult_controller_1.examResultControllers.getExamLeaderboard);
router.get("/:examId/leaderboard/class/:className", examResult_controller_1.examResultControllers.getClassLeaderboard);
// ======================================================
// STUDENT PERFORMANCE
// ======================================================
router.get("/student/:studentId/statistics", examResult_controller_1.examResultControllers.getStudentStatistics);
router.get("/student/:studentId/performance", examResult_controller_1.examResultControllers.getStudentPerformance);
exports.examRoutes = router;
