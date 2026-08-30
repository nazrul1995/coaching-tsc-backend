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
exports.examResultControllers = void 0;
const exam_model_1 = require("../model/exam.model");
const examResult_model_1 = require("../model/examResult.model");
const student_model_1 = require("../model/student.model");
const result_utils_1 = require("../utils/result.utils");
// ======================================================
// Helpers
// ======================================================
const getEligibleStudentFilter = (exam) => {
    const filter = {
        className: exam.className,
    };
    if (exam.batch) {
        filter.batch = exam.batch;
    }
    if (exam.group) {
        filter.group = exam.group;
    }
    return filter;
};
const isStudentEligible = (exam, student) => {
    if (student.className !== exam.className) {
        return false;
    }
    if (exam.batch && student.batch !== exam.batch) {
        return false;
    }
    if (exam.group && student.group !== exam.group) {
        return false;
    }
    return true;
};
// ======================================================
// Create Single Result
// ======================================================
const createResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { exam: examId, student: studentId, marks, isAbsent = false, remarks, subjectResults = [], } = req.body;
        if (!examId || !studentId) {
            return res.status(400).json({
                success: false,
                message: "Exam and student are required",
            });
        }
        const exam = yield exam_model_1.Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found",
            });
        }
        // Result entry starts after the exam is published.
        if (exam.status !== "published") {
            return res.status(400).json({
                success: false,
                message: "Exam must be published before entering results",
            });
        }
        const student = yield student_model_1.Student.findById(studentId).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }
        // Prevent a result for a student outside the exam's class/batch/group.
        if (!isStudentEligible(exam, student)) {
            return res.status(400).json({
                success: false,
                message: "This student is not eligible for this exam",
            });
        }
        const existing = yield examResult_model_1.ExamResult.findOne({
            exam: examId,
            student: studentId,
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Result already exists for this student",
            });
        }
        // --------------------------------------------------
        // Absent
        // --------------------------------------------------
        if (isAbsent === true) {
            const result = yield examResult_model_1.ExamResult.create({
                exam: examId,
                student: studentId,
                subjectResults: [],
                marks: 0,
                totalMarks: exam.totalMarks,
                percentage: 0,
                grade: "F",
                isAbsent: true,
                status: "draft",
                remarks,
            });
            return res.status(201).json({
                success: true,
                message: "Absent result created successfully",
                data: result,
            });
        }
        // --------------------------------------------------
        // Present
        // --------------------------------------------------
        if (marks === undefined || marks === null) {
            return res.status(400).json({
                success: false,
                message: "Marks are required",
            });
        }
        const obtainedMarks = Number(marks);
        if (!Number.isFinite(obtainedMarks)) {
            return res.status(400).json({
                success: false,
                message: "Marks must be a valid number",
            });
        }
        if (obtainedMarks < 0 || obtainedMarks > exam.totalMarks) {
            return res.status(400).json({
                success: false,
                message: `Marks must be between 0 and ${exam.totalMarks}`,
            });
        }
        const percentage = Number(((obtainedMarks / exam.totalMarks) * 100).toFixed(2));
        const grade = (0, result_utils_1.calculateGrade)(percentage);
        const result = yield examResult_model_1.ExamResult.create({
            exam: examId,
            student: studentId,
            subjectResults,
            marks: obtainedMarks,
            totalMarks: exam.totalMarks,
            percentage,
            grade,
            isAbsent: false,
            status: "draft",
            remarks,
        });
        return res.status(201).json({
            success: true,
            message: "Exam result created successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Create Result Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create result",
            error: error.message,
        });
    }
});
// ======================================================
// Bulk Result Entry
// ======================================================
const addBulkResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { examId, results } = req.body;
        if (!examId ||
            !Array.isArray(results) ||
            results.length === 0) {
            return res.status(400).json({
                success: false,
                message: "examId and results array are required",
            });
        }
        const exam = yield exam_model_1.Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found",
            });
        }
        if (exam.status !== "published") {
            return res.status(400).json({
                success: false,
                message: "Exam must be published before entering results",
            });
        }
        const studentIds = results
            .map((item) => item.studentId)
            .filter(Boolean);
        const students = yield student_model_1.Student.find({
            _id: { $in: studentIds },
        }).lean();
        const studentMap = new Map(students.map((student) => [
            student._id.toString(),
            student,
        ]));
        let inserted = 0;
        let updated = 0;
        const errors = [];
        for (const item of results) {
            const studentId = (_a = item.studentId) === null || _a === void 0 ? void 0 : _a.toString();
            if (!studentId) {
                errors.push({
                    studentId: null,
                    reason: "studentId is required",
                });
                continue;
            }
            const student = studentMap.get(studentId);
            if (!student) {
                errors.push({
                    studentId,
                    reason: "Student not found",
                });
                continue;
            }
            if (!isStudentEligible(exam, student)) {
                errors.push({
                    studentId,
                    reason: "Student is not eligible for this exam",
                });
                continue;
            }
            const isAbsent = item.isAbsent === true;
            let updateData;
            // ==============================================
            // ABSENT
            // ==============================================
            if (isAbsent) {
                updateData = {
                    exam: exam._id,
                    student: student._id,
                    subjectResults: [],
                    marks: 0,
                    totalMarks: exam.totalMarks,
                    percentage: 0,
                    grade: "F",
                    isAbsent: true,
                    status: "draft",
                    remarks: item.remarks,
                };
            }
            // ==============================================
            // PRESENT
            // ==============================================
            else {
                if (item.marks === undefined ||
                    item.marks === null ||
                    item.marks === "") {
                    errors.push({
                        studentId,
                        reason: "Marks are required",
                    });
                    continue;
                }
                const obtainedMarks = Number(item.marks);
                if (!Number.isFinite(obtainedMarks)) {
                    errors.push({
                        studentId,
                        reason: "Marks must be a valid number",
                    });
                    continue;
                }
                if (obtainedMarks < 0) {
                    errors.push({
                        studentId,
                        reason: "Marks cannot be negative",
                    });
                    continue;
                }
                if (obtainedMarks > exam.totalMarks) {
                    errors.push({
                        studentId,
                        reason: `Marks cannot exceed ${exam.totalMarks}`,
                    });
                    continue;
                }
                const percentage = Number(((obtainedMarks / exam.totalMarks) *
                    100).toFixed(2));
                const grade = (0, result_utils_1.calculateGrade)(percentage);
                updateData = {
                    exam: exam._id,
                    student: student._id,
                    subjectResults: item.subjectResults || [],
                    marks: obtainedMarks,
                    totalMarks: exam.totalMarks,
                    percentage,
                    grade,
                    isAbsent: false,
                    status: "draft",
                    remarks: item.remarks,
                };
            }
            // ==============================================
            // CREATE OR UPDATE
            // ==============================================
            const existing = yield examResult_model_1.ExamResult.findOne({
                exam: exam._id,
                student: student._id,
            });
            if (existing) {
                yield examResult_model_1.ExamResult.updateOne({
                    _id: existing._id,
                }, {
                    $set: updateData,
                });
                updated++;
            }
            else {
                yield examResult_model_1.ExamResult.create(updateData);
                inserted++;
            }
        }
        if (inserted === 0 && updated === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid results found",
                inserted,
                updated,
                failed: errors.length,
                errors,
            });
        }
        return res.status(200).json({
            success: true,
            message: "Results saved successfully",
            inserted,
            updated,
            failed: errors.length,
            errors,
        });
    }
    catch (error) {
        console.error("Bulk Result Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save bulk results",
            error: error.message,
        });
    }
});
// ======================================================
// Get Exam Results
// ======================================================
const getExamResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examId } = req.params;
        const { status } = req.query;
        const exam = yield exam_model_1.Exam.findById(examId).lean();
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found",
            });
        }
        const filter = {
            exam: examId,
        };
        if (status) {
            filter.status = status;
        }
        const results = yield examResult_model_1.ExamResult.find(filter)
            .populate("student", "name photo className batch group")
            .sort({ marks: -1, createdAt: 1 })
            .lean();
        return res.status(200).json({
            success: true,
            count: results.length,
            exam: {
                _id: exam._id,
                title: exam.title,
                totalMarks: exam.totalMarks,
                status: exam.status,
            },
            data: results,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch exam results",
            error: error.message,
        });
    }
});
// ======================================================
// Publish All Results For An Exam
// ======================================================
const publishResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                message: "Exam must be published before publishing results",
            });
        }
        const eligibleStudents = yield student_model_1.Student.find(getEligibleStudentFilter(exam))
            .select("_id name photo className batch group")
            .lean();
        if (eligibleStudents.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No eligible students found for this exam",
            });
        }
        const results = yield examResult_model_1.ExamResult.find({
            exam: examId,
        })
            .select("student status")
            .lean();
        const resultStudentIds = new Set(results.map((result) => result.student.toString()));
        const missingStudents = eligibleStudents.filter((student) => !resultStudentIds.has(student._id.toString()));
        // Every eligible student must have a result.
        // Absence should be entered explicitly as isAbsent=true.
        if (missingStudents.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot publish results. Some eligible students do not have a result yet.",
                eligibleCount: eligibleStudents.length,
                resultCount: results.length,
                missingCount: missingStudents.length,
                missingStudents,
            });
        }
        const draftCount = results.filter((result) => result.status === "draft").length;
        if (draftCount === 0) {
            return res.status(400).json({
                success: false,
                message: "All results are already published",
            });
        }
        const updateResult = yield examResult_model_1.ExamResult.updateMany({
            exam: examId,
            status: "draft",
        }, {
            $set: {
                status: "published",
            },
        });
        return res.status(200).json({
            success: true,
            message: "Exam results published successfully",
            publishedCount: updateResult.modifiedCount,
            data: {
                examId,
                eligibleStudents: eligibleStudents.length,
                publishedResults: updateResult.modifiedCount,
            },
        });
    }
    catch (error) {
        console.error("Publish Results Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to publish exam results",
            error: error.message,
        });
    }
});
// ======================================================
// Exam Leaderboard
// ======================================================
const getExamLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examId } = req.params;
        const exam = yield exam_model_1.Exam.findById(examId).lean();
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found",
            });
        }
        const results = yield examResult_model_1.ExamResult.find({
            exam: examId,
            status: "published",
            isAbsent: false,
        })
            .populate("student", "name photo className batch group")
            .sort({ percentage: -1, marks: -1 })
            .lean();
        const leaderboard = results.map((result, index) => ({
            rank: index + 1,
            student: result.student,
            marks: result.marks,
            totalMarks: result.totalMarks,
            percentage: result.percentage,
            grade: result.grade,
        }));
        return res.status(200).json({
            success: true,
            count: leaderboard.length,
            data: leaderboard,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to generate leaderboard",
            error: error.message,
        });
    }
});
// ======================================================
// Class Leaderboard
// ======================================================
const getClassLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examId, className } = req.params;
        const results = yield examResult_model_1.ExamResult.find({
            exam: examId,
            status: "published",
            isAbsent: false,
        })
            .populate({
            path: "student",
            match: { className },
            select: "name photo className batch group",
        })
            .sort({ percentage: -1, marks: -1 })
            .lean();
        const filteredResults = results.filter((item) => item.student);
        const leaderboard = filteredResults.map((result, index) => ({
            rank: index + 1,
            student: result.student,
            marks: result.marks,
            totalMarks: result.totalMarks,
            percentage: result.percentage,
            grade: result.grade,
        }));
        return res.status(200).json({
            success: true,
            className,
            count: leaderboard.length,
            data: leaderboard,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to generate class leaderboard",
            error: error.message,
        });
    }
});
// ======================================================
// Overall Coaching Leaderboard
// ======================================================
const getOverallLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { className, batch, examType } = req.query;
        const match = {
            status: "published",
            isAbsent: false,
        };
        if (examType) {
            const exams = yield exam_model_1.Exam.find({
                type: examType,
            }).select("_id");
            match.exam = {
                $in: exams.map((exam) => exam._id),
            };
        }
        const pipeline = [
            { $match: match },
            {
                $lookup: {
                    from: "students",
                    localField: "student",
                    foreignField: "_id",
                    as: "student",
                },
            },
            { $unwind: "$student" },
        ];
        if (className) {
            pipeline.push({
                $match: {
                    "student.className": className,
                },
            });
        }
        if (batch) {
            pipeline.push({
                $match: {
                    "student.batch": batch,
                },
            });
        }
        pipeline.push({
            $group: {
                _id: "$student._id",
                averagePercentage: {
                    $avg: "$percentage",
                },
                totalExams: {
                    $sum: 1,
                },
                student: {
                    $first: "$student",
                },
            },
        }, {
            $sort: {
                averagePercentage: -1,
            },
        }, { $limit: 100 });
        const results = yield examResult_model_1.ExamResult.aggregate(pipeline);
        const leaderboard = results.map((item, index) => ({
            rank: index + 1,
            student: {
                _id: item.student._id,
                name: item.student.name,
                photo: item.student.photo,
                className: item.student.className,
                batch: item.student.batch,
                group: item.student.group,
            },
            averagePercentage: Number(item.averagePercentage.toFixed(2)),
            totalExams: item.totalExams,
        }));
        return res.status(200).json({
            success: true,
            count: leaderboard.length,
            data: leaderboard,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to generate overall leaderboard",
            error: error.message,
        });
    }
});
// ======================================================
// Student Statistics
// ======================================================
const getStudentStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const student = yield student_model_1.Student.findById(studentId).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }
        const results = yield examResult_model_1.ExamResult.find({
            student: studentId,
            status: "published",
        })
            .populate("exam", "title type examDate")
            .sort({ createdAt: -1 })
            .lean();
        const participated = results.filter((result) => !result.isAbsent);
        const absent = results.filter((result) => result.isAbsent);
        const percentages = participated.map((result) => result.percentage);
        const averagePercentage = percentages.length > 0
            ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length
            : 0;
        const highestPercentage = percentages.length > 0
            ? Math.max(...percentages)
            : 0;
        const lowestPercentage = percentages.length > 0
            ? Math.min(...percentages)
            : 0;
        return res.status(200).json({
            success: true,
            data: {
                totalExams: results.length,
                participated: participated.length,
                absent: absent.length,
                averagePercentage: Number(averagePercentage.toFixed(2)),
                highestPercentage,
                lowestPercentage,
                recentResults: results.slice(0, 10),
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to generate student statistics",
            error: error.message,
        });
    }
});
// ======================================================
// Student Performance
// ======================================================
const getStudentPerformance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const student = yield student_model_1.Student.findById(studentId).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }
        const results = yield examResult_model_1.ExamResult.find({
            student: studentId,
            status: "published",
            isAbsent: false,
        })
            .populate("exam")
            .sort({ createdAt: -1 })
            .lean();
        const totalExams = results.length;
        const totalObtained = results.reduce((sum, result) => sum + result.marks, 0);
        const averagePercentage = totalExams > 0
            ? Number((results.reduce((sum, result) => sum + result.percentage, 0) / totalExams).toFixed(2))
            : 0;
        const weeklyResults = results.filter((result) => { var _a; return ((_a = result.exam) === null || _a === void 0 ? void 0 : _a.type) === "weekly"; });
        const modelTestResults = results.filter((result) => { var _a; return ((_a = result.exam) === null || _a === void 0 ? void 0 : _a.type) === "model_test"; });
        return res.status(200).json({
            success: true,
            student: {
                id: student._id,
                name: student.name,
                photo: student.photo,
                className: student.className,
                batch: student.batch,
            },
            summary: {
                totalExams,
                totalObtained,
                averagePercentage,
                weeklyExamCount: weeklyResults.length,
                modelTestCount: modelTestResults.length,
            },
            results,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch student performance",
            error: error.message,
        });
    }
});
exports.examResultControllers = {
    createResult,
    addBulkResults,
    getExamResults,
    publishResults,
    getExamLeaderboard,
    getClassLeaderboard,
    getOverallLeaderboard,
    getStudentStatistics,
    getStudentPerformance,
};
