"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollCourse = void 0;
const mongoose_1 = require("mongoose");
const enrollCourseSchema = new mongoose_1.Schema({
    userEmail: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    courseId: {
        type: String,
        required: true,
    },
    courseTitle: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'unpaid',
    },
    creatorEmail: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
exports.EnrollCourse = (0, mongoose_1.model)("EnrollCourse", enrollCourseSchema);
