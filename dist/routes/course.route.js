"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseRoutes = void 0;
const express_1 = __importDefault(require("express"));
const course_controller_1 = require("../controllers/course.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Get all courses
router.get('/', course_controller_1.courseControllers.getCourses);
// ✅ SPECIFIC ROUTES MUST COME BEFORE WILDCARD ROUTES
// Get courses by current user (protected route)
router.get('/my-courses', auth_middleware_1.verifyToken, course_controller_1.courseControllers.getMyCourses);
// Get single course (wildcard route - comes after specific routes)
router.get('/:id', course_controller_1.courseControllers.getCourseById);
// Create course
router.post('/', course_controller_1.courseControllers.createCourse);
// Update course
router.put('/:id', course_controller_1.courseControllers.updateCourse);
// Delete course
router.delete('/:id', course_controller_1.courseControllers.deleteCourse);
exports.CourseRoutes = router;
