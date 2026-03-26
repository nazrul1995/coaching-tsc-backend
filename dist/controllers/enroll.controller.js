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
exports.enrollControllers = void 0;
const courses_model_1 = require("../model/courses.model");
const enrollcourse_model_1 = require("../model/enrollcourse.model");
const enrollCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userEmail, userName, courseId } = req.body;
        // 1. Check course exists
        const course = yield courses_model_1.Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }
        // 2. Prevent duplicate enrollment
        const alreadyEnrolled = yield enrollcourse_model_1.EnrollCourse.findOne({
            userEmail,
            courseId,
        });
        if (alreadyEnrolled) {
            return res.status(400).json({
                success: false,
                message: "You already enrolled in this course",
            });
        }
        // 3. Create enrollment
        const enrollment = yield enrollcourse_model_1.EnrollCourse.create({
            userEmail,
            userName,
            courseId,
            courseTitle: course.title,
            price: course.price,
        });
        // 4. Update enrolledStudents count
        yield courses_model_1.Course.findByIdAndUpdate(courseId, {
            $inc: { enrolledStudents: 1 },
        });
        res.status(201).json({
            success: true,
            message: "Course enrolled successfully",
            data: enrollment,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Enrollment failed",
            error: error.message,
        });
    }
});
exports.enrollControllers = {
    enrollCourse,
};
