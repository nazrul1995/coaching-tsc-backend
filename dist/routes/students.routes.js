"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const student_controller_1 = require("../controllers/student.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// create student by admin
router.post('/admin/add', auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRoles)("admin"), student_controller_1.studentControllers.createStudentByAdmin);
// create student
router.post('/', student_controller_1.studentControllers.createStudent);
// get all students
router.get('/', student_controller_1.studentControllers.getAllStudents);
// get single student by email
router.get('/email/:email', student_controller_1.studentControllers.getStudentByemail);
router.get("/details", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorizeRoles)("admin", "teacher", "student"), student_controller_1.studentControllers.getStudentDetails);
// update student
router.patch("/:id", student_controller_1.studentControllers.updateStudent);
// delete student
router.delete("/:id", student_controller_1.studentControllers.deleteStudent);
exports.StudentRoutes = router;
