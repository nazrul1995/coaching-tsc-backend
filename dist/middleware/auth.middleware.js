"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOwnerOrAdmin = exports.authorizeRoles = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_secret);
        req.user = decoded;
        next();
    }
    catch (_a) {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
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
    var _a;
    const userId = req.params.id;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin") {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: "You can only modify your own account",
    });
};
exports.isOwnerOrAdmin = isOwnerOrAdmin;
