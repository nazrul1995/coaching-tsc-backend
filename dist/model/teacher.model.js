"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Teacher = void 0;
const mongoose_1 = require("mongoose");
const teacherSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    photoUrl: { type: String },
    bio: { type: String },
    qualification: { type: String },
    experience: { type: String },
    subjects: [{ type: String }],
    teachingLevel: [{ type: String }],
    availableDays: [{ type: String }],
    linkedin: { type: String },
    facebook: { type: String },
    twitter: { type: String },
    website: { type: String },
    rating: { type: Number, default: 1 },
    reviewsCount: { type: Number, default: 1 },
    status: { type: String, enum: ["active", "inactive", "pending"], default: "pending" },
}, {
    timestamps: true,
});
exports.Teacher = (0, mongoose_1.model)('Teachers', teacherSchema);
