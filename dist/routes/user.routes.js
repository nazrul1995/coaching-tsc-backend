"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controllers_1 = require("../controllers/user.controllers");
const router = express_1.default.Router();
// Register user
router.post('/register', user_controllers_1.userControllers.register);
// Login user
router.post('/login', user_controllers_1.userControllers.login);
// Get all users
router.get('/', user_controllers_1.userControllers.getUsers);
// Get single user
router.get('/:id', user_controllers_1.userControllers.getUser);
// Update user
router.patch("/:id", user_controllers_1.userControllers.updateUser);
// UPDATE role
router.patch("/role", user_controllers_1.userControllers.updateUserRole);
router.post("/social-login", user_controllers_1.userControllers.socialLogin);
exports.UserRoutes = router;
