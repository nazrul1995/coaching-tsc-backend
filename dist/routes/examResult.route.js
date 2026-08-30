"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.examResultRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const examResult_controller_1 = require("../controllers/examResult.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.verifyToken);
// Admin result entry
router.post("/results", (0, auth_middleware_1.authorizeRoles)("admin", "teacher"), examResult_controller_1.examResultControllers.createResult);
router.post("/results/bulk", (0, auth_middleware_1.authorizeRoles)("admin", "teacher"), examResult_controller_1.examResultControllers.addBulkResults);
// Exam leaderboard
router.get("/exam/:examId/leaderboard", (0, auth_middleware_1.authorizeRoles)("admin", "student"), examResult_controller_1.examResultControllers.getExamLeaderboard);
// Class leaderboard
router.get("/exam/:examId/class/:className", (0, auth_middleware_1.authorizeRoles)("admin", "student"), examResult_controller_1.examResultControllers.getClassLeaderboard);
// Overall coaching leaderboard
router.get("/leaderboard/overall", (0, auth_middleware_1.authorizeRoles)("admin", "student"), examResult_controller_1.examResultControllers.getOverallLeaderboard);
// Student statistics
router.get("/student/:studentId/statistics", (0, auth_middleware_1.authorizeRoles)("admin", "student"), examResult_controller_1.examResultControllers.getStudentStatistics);
exports.examResultRoutes = router;
