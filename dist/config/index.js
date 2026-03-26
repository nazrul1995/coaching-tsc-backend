"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
exports.default = {
    port: process.env.PORT || 5000,
    database_url: process.env.MONGODB_URI,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || 12,
    jwt_secret: process.env.JWT_SECRET || 'default-secret-key-change-this',
    jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
    gemini_api_key: process.env.GEMINI_API_KEY,
};
