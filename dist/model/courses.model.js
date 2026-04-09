"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
const mongoose_1 = require("mongoose");
const eventScema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    creatorRole: {
        type: String,
        required: true,
    },
    creatorEmail: {
        type: String,
        required: true,
    },
    enrolledStudents: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    totalModules: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});
exports.Course = (0, mongoose_1.model)('Course', eventScema);
