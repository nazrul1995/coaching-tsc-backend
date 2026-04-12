import { Request, Response } from 'express';
import { StudentResult } from '../model/result.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Create result
const createResult = async (req: AuthRequest, res: Response) => {
  try {
    const savedResult = await StudentResult.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Result created successfully',
      data: savedResult,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create result',
      error: err.message,
    });
  }
};

// Get all results (with filter + pagination)
const getResults = async (req: Request, res: Response) => {
  try {
    const {
      limit = '10',
      page = '1',
      className,
      examName,
      subject,
      studentId,
    } = req.query;

    const limitNum = Math.max(1, Number(limit));
    const pageNum = Math.max(1, Number(page));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {};

    if (className) query.className = className;
    if (examName) query.examName = examName;
    if (subject) query.subject = subject;
    if (studentId) query.studentId = studentId;

    const results = await StudentResult.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await StudentResult.countDocuments(query);

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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: err.message,
    });
  }
};

// Get single result
const getResultById = async (req: Request, res: Response) => {
  try {
    const result = await StudentResult.findById(req.params.id);

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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch result',
      error: err.message,
    });
  }
};

// Get results by student
const getResultsByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const results = await StudentResult.find({ studentId });

    res.status(200).json({
      success: true,
      message: 'Student results fetched successfully',
      data: results,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student results',
      error: err.message,
    });
  }
};

// Update result
const updateResult = async (req: AuthRequest, res: Response) => {
  try {
    const updatedResult = await StudentResult.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update result',
      error: err.message,
    });
  }
};

// Delete result
const deleteResult = async (req: AuthRequest, res: Response) => {
  try {
    const deletedResult = await StudentResult.findByIdAndDelete(
      req.params.id
    );

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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete result',
      error: err.message,
    });
  }
};

export const studentResultControllers = {
  createResult,
  getResults,
  getResultById,
  getResultsByStudent,
  updateResult,
  deleteResult,
};