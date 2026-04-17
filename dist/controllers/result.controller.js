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
exports.studentResultControllers = void 0;
const result_model_1 = require("../model/result.model");
// Create result
const createResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const savedResult = yield result_model_1.StudentResult.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Result created successfully',
            data: savedResult,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to create result',
            error: err.message,
        });
    }
});
// Get all results (with filter + pagination)
const getResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { limit = '10', page = '1', className, examName, subject, studentId, } = req.query;
        const limitNum = Math.max(1, Number(limit));
        const pageNum = Math.max(1, Number(page));
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        if (className)
            query.className = className;
        if (examName)
            query.examName = examName;
        if (subject)
            query.subject = subject;
        if (studentId)
            query.studentId = studentId;
        const results = yield result_model_1.StudentResult.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = yield result_model_1.StudentResult.countDocuments(query);
        res.status(200).json({
            success: true,
            data: results,
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
            message: 'Failed to fetch results',
            error: err.message,
        });
    }
});
// Get single result
const getResultById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield result_model_1.StudentResult.findById(req.params.id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Result not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Result fetched successfully',
            data: result,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch result',
            error: err.message,
        });
    }
});
// Get results by student
const getResultsByStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const results = yield result_model_1.StudentResult.find({ studentId });
        res.status(200).json({
            success: true,
            message: 'Student results fetched successfully',
            data: results,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student results',
            error: err.message,
        });
    }
});
// Update result
const updateResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedResult = yield result_model_1.StudentResult.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedResult) {
            return res.status(404).json({
                success: false,
                message: 'Result not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Result updated successfully',
            data: updatedResult,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to update result',
            error: err.message,
        });
    }
});
// Delete result
const deleteResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedResult = yield result_model_1.StudentResult.findByIdAndDelete(req.params.id);
        if (!deletedResult) {
            return res.status(404).json({
                success: false,
                message: 'Result not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Result deleted successfully',
            data: null,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete result',
            error: err.message,
        });
    }
});
exports.studentResultControllers = {
    createResult,
    getResults,
    getResultById,
    getResultsByStudent,
    updateResult,
    deleteResult,
};
