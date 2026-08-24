import express from "express";

import {
  verifyToken,
  authorizeRoles,
} from "../middleware/auth.middleware";
import { examResultControllers } from "../controllers/examResult.controller";


const router = express.Router();

router.use(verifyToken);

// Admin result entry
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

// Exam leaderboard
router.get(
  "/exam/:examId/leaderboard",
  authorizeRoles("admin", "student"),
  examResultControllers.getExamLeaderboard
);

// Class leaderboard
router.get(
  "/exam/:examId/class/:className",
  authorizeRoles("admin", "student"),
  examResultControllers.getClassLeaderboard
);

// Overall coaching leaderboard
router.get(
  "/leaderboard/overall",
  authorizeRoles("admin", "student"),
  examResultControllers.getOverallLeaderboard
);

// Student statistics
router.get(
  "/student/:studentId/statistics",
  authorizeRoles("admin", "student"),
  examResultControllers.getStudentStatistics
);

export const examResultRoutes = router;
