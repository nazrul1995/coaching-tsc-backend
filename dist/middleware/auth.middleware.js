"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOwnerOrAdmin = exports.authorizeRoles = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const verifyToken = (req, res, next) => {
    var _a;
    try {
        // 1. প্রথমে HttpOnly cookie থেকে token নেবে
        let token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
        // 2. Cookie-তে না থাকলে Authorization header থেকে নেবে
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }
        // Token পাওয়া না গেলে
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        // Verify JWT
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_secret);
        // User information request-এর মধ্যে রাখবে
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
exports.verifyToken = verifyToken;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied for role: ${req.user.role}`,
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
const isOwnerOrAdmin = (req, res, next) => {
    var _a, _b, _c;
    const userId = req.params.id;
    // Admin সব user-এর account modify করতে পারবে
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin") {
        return next();
    }
    // নিজের account ছাড়া অন্য account modify করতে পারবে না
    if (((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString()) === userId) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: "You can only modify your own account",
    });
};
exports.isOwnerOrAdmin = isOwnerOrAdmin;
