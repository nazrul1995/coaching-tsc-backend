"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
const mongoose_1 = require("mongoose");
const studentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    institution: { type: String, required: true },
    className: { type: String, required: true },
    batch: { type: String },
    group: { type: String, enum: ["science", "commerce", "arts"] },
    photo: { type: String },
}, {
    timestamps: true,
});
exports.Student = (0, mongoose_1.model)('Students', studentSchema);
