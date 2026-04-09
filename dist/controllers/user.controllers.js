"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userControllers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../model/user.model");
const config_1 = __importDefault(require("../config"));
// Register user
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        // Validate required fields
        if (!email || !req.body.password || !req.body.name || !req.body.role) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and role are required',
            });
        }
        // Check if user already exists
        const isUserExist = yield user_model_1.User.findOne({ email });
        if (isUserExist) {
            return res.status(400).json({
                success: false,
                message: 'User already exists!',
            });
        }
        const savedUser = yield user_model_1.User.create(req.body);
        // Generate token
        const token = jsonwebtoken_1.default.sign({ email: savedUser.email, role: savedUser.role }, config_1.default.jwt_secret, { expiresIn: config_1.default.jwt_expires_in });
        // Omit password from response
        const userResponse = savedUser.toObject();
        delete userResponse.password;
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: userResponse,
            token,
        });
    }
    catch (err) {
        console.error('Register Error:', err);
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages,
            });
        }
        // Handle duplicate key errors
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to register user',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        });
    }
});
// Login user
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }
        // Check if user exists
        const user = yield user_model_1.User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }
        // Compare passwords
        const isPasswordMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }
        // Generate token
        const token = jsonwebtoken_1.default.sign({ email: user.email, role: user.role }, config_1.default.jwt_secret, { expiresIn: config_1.default.jwt_expires_in });
        // Omit password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            token,
            user: userResponse,
        });
    }
    catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to login',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        });
    }
});
// Get all users
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.User.find().select('-password');
        res.status(200).json({
            success: true,
            message: 'Users fetched successfully',
            data: users,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: err.message,
        });
    }
});
// get single user
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user",
            error: error.message,
        });
    }
});
// get update user
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedUser = yield user_model_1.User.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true
        });
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: error.message,
        });
    }
});
//Update user role (admin / student)
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, role } = req.body;
        const updatedUser = yield user_model_1.User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update role",
            error: error.message,
        });
    }
});
const socialLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, image, credential } = req.body;
        // If credential (Google JWT) is provided, decode it
        let userData = { name, email, image };
        if (credential) {
            try {
                // Decode Google JWT without verification (we trust Google)
                const decoded = jsonwebtoken_1.default.decode(credential);
                if (decoded) {
                    userData = {
                        name: decoded.name || name || 'User',
                        email: decoded.email || email,
                        image: decoded.picture || image,
                    };
                }
            }
            catch (decodeErr) {
                console.error('Failed to decode Google credential:', decodeErr);
                // Fall back to provided data
            }
        }
        let user = yield user_model_1.User.findOne({ email: userData.email });
        // If user doesn't exist → create
        if (!user) {
            user = yield user_model_1.User.create({
                name: userData.name,
                email: userData.email,
                image: userData.image,
                password: "SOCIAL_LOGIN_" + Date.now(), // unique dummy password
                role: 'student',
            });
        }
        else {
            // Update existing user's image if provided
            if (userData.image) {
                user.image = userData.image;
                yield user.save();
            }
        }
        // Generate JWT (your system)
        const token = jsonwebtoken_1.default.sign({ email: user.email, role: user.role }, config_1.default.jwt_secret, { expiresIn: config_1.default.jwt_expires_in });
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(200).json({
            success: true,
            message: "Social login successful",
            token,
            user: userResponse,
        });
    }
    catch (error) {
        console.error('Social login error:', error);
        res.status(500).json({
            success: false,
            message: "Social login failed",
            error: error.message,
        });
    }
});
exports.userControllers = {
    register,
    login,
    getUsers,
    getUser,
    updateUser,
    updateUserRole,
    socialLogin,
};
