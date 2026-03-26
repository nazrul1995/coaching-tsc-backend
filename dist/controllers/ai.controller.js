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
exports.aiControllers = void 0;
const generative_ai_1 = require("@google/generative-ai");
const config_1 = __importDefault(require("../config"));
const generateDescription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Event title is required to generate a description',
            });
        }
        if (!config_1.default.gemini_api_key) {
            return res.status(500).json({
                success: false,
                message: 'Gemini API key is not configured',
            });
        }
        // Initialize Gemini
        const genAI = new generative_ai_1.GoogleGenerativeAI(config_1.default.gemini_api_key);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Write a catchy and informative event description for an event titled: "${title}". Keep it around 100 words.`;
        const result = yield model.generateContent(prompt);
        const response = yield result.response;
        const text = response.text();
        res.status(200).json({
            success: true,
            message: 'Description generated successfully',
            data: text,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate description',
            error: err.message,
        });
    }
});
exports.aiControllers = {
    generateDescription,
};
