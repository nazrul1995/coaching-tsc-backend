import express from 'express';
import { teacherControllers } from '../controllers/teacher.controller';

const router = express.Router();

// create teacher
router.post('/', teacherControllers.createTeacher);
// get all teachers
router.get('/', teacherControllers.getAllTeachers);
// get single teacher
router.get('/:id', teacherControllers.getTeacherById);
// get teacher by email
router.get('/email/:email', teacherControllers.getTeacherByEmail);
// update teacher
router.patch("/:id", teacherControllers.updateTeacher);
// delete teacher
router.delete("/:id", teacherControllers.deleteTeacher);

export const TeacherRoutes = router;
