import express from "express";
import {
  authorizeRoles,
  verifyToken,
} from "../middleware/auth.middleware";

import { examResultControllers } from "../controllers/examResult.controller";
import { ExamControllers } from "../controllers/exam.controller";

const router = express.Router();

router.use(verifyToken);

// ======================================================
// EXAMS
// ======================================================

router.post(
  "/",
  authorizeRoles("admin", "teacher"),
  ExamControllers.createExam
);

router.get(
  "/",
  ExamControllers.getAllExams
);

router.get(
  "/:examId",
  ExamControllers.getExam
);

router.patch(
  "/:examId/publish",
  authorizeRoles("admin", "teacher"),
  ExamControllers.publishExam
);

// Eligible students for result entry
router.get(
  "/:examId/eligible-students",
  authorizeRoles("admin", "teacher"),
  ExamControllers.getEligibleStudents
);

// ======================================================
// RESULTS
// ======================================================

router.post(
  "/results",
  authorizeRoles("admin", "teacher"),
  examResultControllers.createResult
);

router.post(
  "/results/bulk",
  authorizeRoles("admin", "teacher"),
  examResultControllers.addBulkResults
);

// View draft/published results for an exam
router.get(
  "/:examId/results",
  authorizeRoles("admin", "teacher"),
  examResultControllers.getExamResults
);

// Publish all draft results for an exam
router.patch(
  "/results/:examId/publish",
  authorizeRoles("admin", "teacher"),
  examResultControllers.publishResults
);

// ======================================================
// EXAM LEADERBOARD
// ======================================================

router.get(
  "/:examId/leaderboard",
  examResultControllers.getExamLeaderboard
);

router.get(
  "/:examId/leaderboard/class/:className",
  examResultControllers.getClassLeaderboard
);

// ======================================================
// STUDENT PERFORMANCE
// ======================================================

router.get(
  "/student/:studentId/statistics",
  examResultControllers.getStudentStatistics
);

router.get(
  "/student/:studentId/performance",
  examResultControllers.getStudentPerformance
);

// ======================================================
// OVERALL COACHING LEADERBOARD
// ======================================================

router.get(
  "/leaderboard/overall",
  examResultControllers.getOverallLeaderboard
);

export const examRoutes = router;
