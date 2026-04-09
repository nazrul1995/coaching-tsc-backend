"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherRoutes = void 0;
const express_1 = __importDefault(require("express"));
const teacher_controller_1 = require("../controllers/teacher.controller");
const router = express_1.default.Router();
// create teacher
router.post('/', teacher_controller_1.teacherControllers.createTeacher);
// get all teachers
router.get('/', teacher_controller_1.teacherControllers.getAllTeachers);
// get single teacher
router.get('/:id', teacher_controller_1.teacherControllers.getTeacherById);
// get teacher by email
router.get('/email/:email', teacher_controller_1.teacherControllers.getTeacherByEmail);
// update teacher
router.patch("/:id", teacher_controller_1.teacherControllers.updateTeacher);
// delete teacher
router.delete("/:id", teacher_controller_1.teacherControllers.deleteTeacher);
exports.TeacherRoutes = router;
