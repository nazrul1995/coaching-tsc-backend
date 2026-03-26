"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseRoutes = void 0;
const express_1 = __importDefault(require("express"));
const course_controller_1 = require("../controllers/course.controller");
const router = express_1.default.Router();
// Get all courses
router.get('/', course_controller_1.courseControllers.getCourses);
// Get single course
router.get('/:id', course_controller_1.courseControllers.getCourseById);
// Create course
router.post('/', course_controller_1.courseControllers.createCourse);
// Update course
router.put('/:id', course_controller_1.courseControllers.updateCourse);
// Delete course
router.delete('/:id', course_controller_1.courseControllers.deleteCourse);
exports.CourseRoutes = router;
