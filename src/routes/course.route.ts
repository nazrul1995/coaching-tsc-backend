import express from 'express';
import { courseControllers } from '../controllers/course.controller';

const router = express.Router();

// Get all courses
router.get('/', courseControllers.getCourses);

// Get single course
router.get('/:id', courseControllers.getCourseById);

// Create course
router.post('/', courseControllers.createCourse);

// Update course
router.put('/:id', courseControllers.updateCourse);

// Delete course
router.delete('/:id', courseControllers.deleteCourse);


export const CourseRoutes = router;