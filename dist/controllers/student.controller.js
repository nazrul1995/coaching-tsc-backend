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
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentControllers = exports.deleteStudent = exports.updateStudent = exports.getStudentByemail = exports.getAllStudents = exports.createStudent = void 0;
const student_model_1 = require("../model/student.model");
const user_model_1 = require("../model/user.model");
// Helper to catch async errors
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
// CREATE STUDENT
exports.createStudent = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, className, batch, group, photo, institution } = req.body;
    if (!name || !email || !phone || !className) {
        return res.status(400).json({
            success: false,
            message: "Name, email, phone, and className are required",
        });
    }
    const existingStudent = yield student_model_1.Student.findOne({ email });
    if (existingStudent) {
        return res.status(400).json({
            success: false,
            message: "Student already exists with this email",
        });
    }
    const newStudent = yield student_model_1.Student.create({
        name,
        email,
        phone,
        className,
        batch,
        group,
        photo,
        institution,
    });
    const updatedUser = yield user_model_1.User.findOneAndUpdate({ email }, { role: "student" }, { new: true });
    res.status(201).json({
        success: true,
        message: "Student created successfully and user role updated",
        student: newStudent,
        user: updatedUser,
    });
}));
// GET ALL STUDENTS (OPTIONAL FILTER BY CLASS)
exports.getAllStudents = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const className = req.query.class;
    // build filter dynamically
    const filter = {};
    if (className) {
        filter.className = className;
    }
    const students = yield student_model_1.Student.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: students, // ✅ better API structure
    });
}));
// GET STUDENT BY EMAIL
exports.getStudentByemail = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield student_model_1.Student.findOne({ email: req.params.email });
    if (!student) {
        return res.status(404).json({
            success: false,
            message: "Student not found",
        });
    }
    res.status(200).json({
        success: true,
        message: "Student retrieved successfully",
        student,
    });
}));
// UPDATE STUDENT
exports.updateStudent = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, className, batch, group, photoUrl } = req.body;
    console.log(name, email, phone, className, batch, group, photoUrl);
    const updatedStudent = yield student_model_1.Student.findByIdAndUpdate(req.params.id, { name, email, phone, className, batch, group, photo: photoUrl }, { new: true, runValidators: true });
    if (!updatedStudent) {
        return res.status(404).json({
            success: false,
            message: "Student not found",
        });
    }
    const updatedUser = yield user_model_1.User.findOneAndUpdate({ email: updatedStudent.email }, // or req.body.email
    {
        name,
    }, { new: true, runValidators: true });
    return res.status(200).json({
        success: true,
        message: "Student updated successfully",
        student: updatedStudent,
        user: updatedUser,
    });
}));
// DELETE STUDENT
exports.deleteStudent = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield student_model_1.Student.findByIdAndDelete(req.params.id);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: "Student not found",
        });
    }
    yield user_model_1.User.findOneAndUpdate({ email: student.email }, { role: "user" }, { returnDocument: "after" });
    res.status(200).json({
        success: true,
        message: "Student deleted successfully and user role reset",
    });
}));
// Export controllers
exports.studentControllers = {
    createStudent: exports.createStudent,
    getAllStudents: exports.getAllStudents,
    getStudentByemail: exports.getStudentByemail,
    updateStudent: exports.updateStudent,
    deleteStudent: exports.deleteStudent,
};
