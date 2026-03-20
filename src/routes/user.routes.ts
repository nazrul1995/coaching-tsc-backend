import express from 'express';
import { userControllers } from '../controllers/user.controllers';

const router = express.Router();

// Register user
router.post('/register', userControllers.register);
// Login user
router.post('/login', userControllers.login);
// Get all users
router.get('/', userControllers.getUsers);
// Get single user
router.get('/:id', userControllers.getUser);
// Update user
router.patch("/:id", userControllers.updateUser)
// UPDATE role
router.patch("/role", userControllers.updateUserRole);

export const UserRoutes = router;