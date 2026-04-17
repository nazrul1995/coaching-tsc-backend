"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const student_controller_1 = require("../controllers/student.controller");
const router = express_1.default.Router();
// create student
router.post('/', student_controller_1.studentControllers.createStudent);
// get all students
router.get('/', student_controller_1.studentControllers.getAllStudents);
// get all students
router.get('/', student_controller_1.studentControllers.getAllStudents);
// get single student by email
router.get('/email/:email', student_controller_1.studentControllers.getStudentByemail);
// update student
router.patch("/:id", student_controller_1.studentControllers.updateStudent);
// delete student
router.delete("/:id", student_controller_1.studentControllers.deleteStudent);
exports.StudentRoutes = router;
