import express from 'express';
import { studentControllers } from '../controllers/student.controller';

const router = express.Router();

// create student
router.post('/', studentControllers.createStudent);
// get all students
router.get('/', studentControllers.getAllStudents);
// get single student
router.get('/:id', studentControllers.getStudentById);
// update student
router.patch("/:id", studentControllers.updateStudent);
// delete student
router.delete("/:id", studentControllers.deleteStudent);

export const StudentRoutes = router;
