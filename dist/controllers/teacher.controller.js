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
exports.teacherControllers = exports.deleteTeacher = exports.updateTeacher = exports.getTeacherByEmail = exports.getTeacherById = exports.getAllTeachers = exports.createTeacher = void 0;
const teacher_model_1 = require("../model/teacher.model");
const user_model_1 = require("../model/user.model");
// Helper to catch async errors
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
// CREATE TeACHER
exports.createTeacher = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, photoUrl, bio, qualification, experience, subjects, teachingLevel, availableDays, linkedin, facebook, twitter, website, rating, reviewsCount, status } = req.body;
    console.log(req.body);
    if (!name || !email || !phone) {
        return res.status(400).json({
            success: false,
            message: "Name, email, and phone are required",
        });
    }
    const existingTeacher = yield teacher_model_1.Teacher.findOne({ email });
    if (existingTeacher) {
        return res.status(400).json({
            success: false,
            message: "Teacher already exists with this email",
        });
    }
    const newTeacher = yield teacher_model_1.Teacher.create({
        name,
        email,
        phone,
        photoUrl,
        bio,
        qualification,
        experience,
        subjects,
        teachingLevel,
        availableDays,
        linkedin,
        facebook,
        twitter,
        website,
        rating,
        reviewsCount,
        status,
    });
    const updatedUser = yield user_model_1.User.findOneAndUpdate({ email }, { role: "teacher" }, { new: true });
    res.status(201).json({
        success: true,
        message: "Teacher created successfully and user role updated",
        teacher: newTeacher,
        user: updatedUser,
    });
}));
// GET ALL TEACHERS
exports.getAllTeachers = catchAsync((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teachers = yield teacher_model_1.Teacher.find();
    res.status(200).json({
        success: true,
        message: "Teachers retrieved successfully",
        teachers,
    });
}));
// GET TEACHER BY ID
exports.getTeacherById = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teacher = yield teacher_model_1.Teacher.findById(req.params.id);
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: "Teacher not found",
        });
    }
    res.status(200).json({
        success: true,
        message: "Teacher retrieved successfully",
        teacher,
    });
}));
// GET TEACHER BY EMAIL
exports.getTeacherByEmail = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teacher = yield teacher_model_1.Teacher.findOne({ email: req.params.email });
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: "Teacher not found",
        });
    }
    res.status(200).json({
        success: true,
        message: "Teacher retrieved successfully",
        teacher,
    });
}));
// UPDATE TEACHER
exports.updateTeacher = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, photoUrl, // ✅ FIXED
    bio, qualification, experience, subjects, teachingLevel, availableDays, linkedin, facebook, twitter, website, rating, reviewsCount, } = req.body;
    const updatedTeacher = yield teacher_model_1.Teacher.findByIdAndUpdate(req.params.id, {
        name,
        email,
        phone,
        photoUrl,
        bio,
        qualification,
        experience,
        subjects,
        teachingLevel,
        availableDays,
        linkedin,
        facebook,
        twitter,
        website,
        rating,
        reviewsCount,
    }, { new: true, runValidators: true });
    if (!updatedTeacher) {
        return res.status(404).json({
            success: false,
            message: "Teacher not found",
        });
    }
    res.status(200).json({
        success: true,
        message: "Teacher updated successfully",
        teacher: updatedTeacher,
    });
}));
// DELETE TEACHER
exports.deleteTeacher = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teacher = yield teacher_model_1.Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: "Teacher not found",
        });
    }
    yield user_model_1.User.findOneAndUpdate({ email: teacher.email }, { role: "user" }, { returnDocument: "after" });
    res.status(200).json({
        success: true,
        message: "Teacher deleted successfully and user role reset",
    });
}));
// Export controllers
exports.teacherControllers = {
    createTeacher: exports.createTeacher,
    getAllTeachers: exports.getAllTeachers,
    getTeacherById: exports.getTeacherById,
    getTeacherByEmail: exports.getTeacherByEmail,
    updateTeacher: exports.updateTeacher,
    deleteTeacher: exports.deleteTeacher,
};
