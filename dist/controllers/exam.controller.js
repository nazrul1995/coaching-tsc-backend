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
exports.ExamControllers = void 0;
const exam_model_1 = require("../model/exam.model");
const student_model_1 = require("../model/student.model");
// ======================================================
// Create Exam
// ======================================================
const createExam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, subject, totalMarks, examDate, className, batch, group, description, } = req.body;
        // ==================================================
        // Required fields validation
        // ==================================================
        if (!type ||
            !subject ||
            totalMarks === undefined ||
            !examDate ||
            !className) {
            return res.status(400).json({
                success: false,
                message: "type, subject, totalMarks, examDate and className are required",
            });
        }
        // ==================================================
        // Validate Exam Type
        // ==================================================
        const allowedExamTypes = [
            "weekly",
            "model_test",
        ];
        if (!allowedExamTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam type. Allowed types are weekly and model_test",
            });
        }
        // ==================================================
        // Validate Total Marks
        // ==================================================
        const parsedTotalMarks = Number(totalMarks);
        if (!Number.isFinite(parsedTotalMarks) ||
            parsedTotalMarks <= 0) {
            return res.status(400).json({
                success: false,
                message: "totalMarks must be a valid positive number",
            });
        }
        // ==================================================
        // Normalize Class
        //
        // 10 / "10" → "10"
        // ==================================================
        const normalizedClassName = String(className).trim();
        if (!normalizedClassName) {
            return res.status(400).json({
                success: false,
                message: "className is required",
            });
        }
        // ==================================================
        // Normalize Batch
        //
        // SSC-2028 / "SSC-2028"
        // ==================================================
        const normalizedBatch = batch
            ? String(batch).trim()
            : undefined;
        // ==================================================
        // Normalize Group
        // ==================================================
        const normalizedGroup = group
            ? String(group).trim()
            : undefined;
        // ==================================================
        // Title Prefix
        // ==================================================
        const titlePrefix = type === "weekly"
            ? "Weekly Tutorial"
            : "Model Test";
        // ==================================================
        // Find exams belonging to the SAME SERIES
        //
        // Same:
        // type
        // className
        // batch
        // group
        //
        // Example:
        //
        // weekly
        // class 10
        // SSC-2028
        // science
        //
        // → Weekly Tutorial-1
        // → Weekly Tutorial-2
        // ==================================================
        const seriesFilter = {
            type,
            className: normalizedClassName,
        };
        // Batch থাকলে same batch match করবে
        if (normalizedBatch) {
            seriesFilter.batch = normalizedBatch;
        }
        else {
            seriesFilter.batch = {
                $exists: false,
            };
        }
        // Group থাকলে same group match করবে
        if (normalizedGroup) {
            seriesFilter.group = normalizedGroup;
        }
        else {
            seriesFilter.group = {
                $exists: false,
            };
        }
        const existingExams = yield exam_model_1.Exam.find(seriesFilter)
            .select("title")
            .lean();
        // ==================================================
        // Find highest serial number
        // ==================================================
        let maxNumber = 0;
        const escapedPrefix = titlePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const titleRegex = new RegExp(`^${escapedPrefix}-([0-9]+)$`, "i");
        for (const existingExam of existingExams) {
            if (!existingExam.title) {
                continue;
            }
            const match = existingExam.title.match(titleRegex);
            if (!match) {
                continue;
            }
            const number = Number(match[1]);
            if (Number.isFinite(number) &&
                number > maxNumber) {
                maxNumber = number;
            }
        }
        // ==================================================
        // Generate Title
        // ==================================================
        const nextNumber = maxNumber + 1;
        const generatedTitle = `${titlePrefix}-${nextNumber}`;
        // ==================================================
        // Create Exam
        // ==================================================
        const exam = yield exam_model_1.Exam.create({
            title: generatedTitle,
            type,
            subject,
            totalMarks: parsedTotalMarks,
            examDate,
            className: normalizedClassName,
            batch: normalizedBatch,
            group: normalizedGroup,
            description: description
                ? String(description).trim()
                : undefined,
            // New exam always starts as draft
            status: "draft",
        });
        // ==================================================
        // Response
        // ==================================================
        return res.status(201).json({
            success: true,
            message: "Exam created successfully",
            data: exam,
        });
    }
    catch (error) {
        console.error("Create Exam Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create exam",
            error: error.message,
        });
    }
});
// ======================================================
// Publish Exam
// ======================================================
const publishExam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examId } = req.params;
        const exam = yield exam_model_1.Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found",
            });
        }
        if (exam.status === "published") {
            return res.status(400).json({
                success: false,
                message: "Exam is already published",
            });
        }
        exam.status = "published";
        yield exam.save();
        return res.status(200).json({
            success: true,
            message: "Exam published successfully",
            data: exam,
        });
    }
    catch (error) {
        console.error("Publish Exam Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to publish exam",
            error: error.message,
        });
    }
});
// ======================================================
// Get Eligible Students For An Exam
// ======================================================
const getEligibleStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examId } = req.params;
        const exam = yield exam_model_1.Exam.findById(examId).lean();
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found",
            });
        }
        if (exam.status !== "published") {
            return res.status(400).json({
                success: false,
                message: "Only published exams can have eligible students",
            });
        }
        const filter = {
            className: exam.className,
        };
        if (exam.batch) {
            filter.batch = exam.batch;
        }
        if (exam.group) {
            filter.group = exam.group;
        }
        const students = yield student_model_1.Student.find(filter)
            .select("name photo className batch group")
            .sort({ name: 1 })
            .lean();
        return res.status(200).json({
            success: true,
            count: students.length,
            exam: {
                _id: exam._id,
                title: exam.title,
                className: exam.className,
                batch: exam.batch,
                group: exam.group,
                totalMarks: exam.totalMarks,
            },
            data: students,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch eligible students",
            error: error.message,
        });
    }
});
// ======================================================
// Get All Exams
// ======================================================
const getAllExams = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, className, batch, status } = req.query;
        const filter = {};
        if (type)
            filter.type = type;
        if (className)
            filter.className = className;
        if (batch)
            filter.batch = batch;
        if (status)
            filter.status = status;
        const exams = yield exam_model_1.Exam.find(filter)
            .sort({ examDate: -1 })
            .lean();
        return res.status(200).json({
            success: true,
            count: exams.length,
            data: exams,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch exams",
            error: error.message,
        });
    }
});
// ======================================================
// Get Single Exam
// ======================================================
const getExam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const exam = yield exam_model_1.Exam.findById(req.params.examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: exam,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch exam",
            error: error.message,
        });
    }
});
exports.ExamControllers = {
    createExam,
    publishExam,
    getEligibleStudents,
    getAllExams,
    getExam,
};
