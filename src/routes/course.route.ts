import express from 'express';
import { courseControllers } from '../controllers/course.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

// Get all courses
router.get('/', courseControllers.getCourses);

// ✅ SPECIFIC ROUTES MUST COME BEFORE WILDCARD ROUTES
// Get courses by current user (protected route)
router.get('/my-courses', verifyToken, courseControllers.getMyCourses);

// Get single course (wildcard route - comes after specific routes)
router.get('/:id', courseControllers.getCourseById);

// Create course
router.post('/', courseControllers.createCourse);

// Update course
router.put('/:id', courseControllers.updateCourse);

// Delete course
router.delete('/:id', courseControllers.deleteCourse);

export const CourseRoutes = router;