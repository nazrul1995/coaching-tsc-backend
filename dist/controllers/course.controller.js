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
exports.courseControllers = void 0;
const courses_model_1 = require("../model/courses.model");
// Create course
const createCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const savedCourse = yield courses_model_1.Course.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: savedCourse,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: err.message,
        });
    }
});
// Get all courses
const getCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { limit = '3', page = '3', sort = 'price', order = 'desc', search = '', rating, priceMin, priceMax, } = req.query;
        const limitNum = Math.max(1, Number(limit));
        const pageNum = Math.max(1, Number(page));
        const skip = (pageNum - 1) * limitNum;
        // 🔍 Query object
        const query = {};
        // Search
        if (search) {
            query.title = { $regex: String(search), $options: 'i' };
        }
        // ⭐ Rating filter
        if (rating) {
            query.rating = { $gte: Number(rating) };
        }
        // 💰 Price filter
        if (priceMin || priceMax) {
            query.price = {};
            if (priceMin)
                query.price.$gte = Number(priceMin);
            if (priceMax)
                query.price.$lte = Number(priceMax);
        }
        // 🔃 Sorting
        const sortOption = {};
        sortOption[String(sort)] = order === 'asc' ? 1 : -1;
        const courses = yield courses_model_1.Course.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum);
        const total = yield courses_model_1.Course.countDocuments(query);
        res.status(200).json({
            success: true,
            data: courses,
            meta: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPage: Math.ceil(total / limitNum),
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch courses',
            error: err.message,
        });
    }
});
// Get single course
const getCourseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const course = yield courses_model_1.Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Course fetched successfully',
            data: course,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course',
            error: err.message,
        });
    }
});
// Get  course by email
const getMyCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
        if (!userEmail) {
            return res.status(400).json({ success: false, message: "User email missing" });
        }
        console.log("Fetching courses for email:", userEmail);
        const courses = yield courses_model_1.Course.find({ creatorEmail: userEmail }); // 🔹 updated field
        res.status(200).json({
            success: true,
            message: "Courses fetched successfully",
            data: courses,
        });
    }
    catch (err) {
        console.error("Failed to fetch courses:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch courses",
            error: err.message,
        });
    }
});
// Update course
const updateCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedCourse = yield courses_model_1.Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: updatedCourse,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to update course',
            error: err.message,
        });
    }
});
const updateCourseRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedCourseRating = yield courses_model_1.Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedCourseRating) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: updatedCourseRating,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to update course Rating',
            error: err.message,
        });
    }
});
// Delete course
const deleteCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedCourse = yield courses_model_1.Course.findByIdAndDelete(req.params.id);
        if (!deletedCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Course deleted successfully',
            data: null,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete course',
            error: err.message,
        });
    }
});
exports.courseControllers = {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    updateCourseRating,
    getMyCourses,
};
