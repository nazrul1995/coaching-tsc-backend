import { Request, Response } from "express";
import { Exam } from "../model/exam.model";
import { Student } from "../model/student.model";

// ======================================================
// Create Exam
// ======================================================

const createExam = async (req: Request, res: Response) => {
  try {
    const {
      title,
      type,
      subject,
      totalMarks,
      examDate,
      className,
      batch,
      group,
      description,
    } = req.body;

    if (
      !title ||
      !type ||
      !subject ||
      totalMarks === undefined ||
      !examDate ||
      !className
    ) {
      return res.status(400).json({
        success: false,
        message:
          "title, type, subject, totalMarks, examDate and className are required",
      });
    }

    const parsedTotalMarks = Number(totalMarks);

    if (!Number.isFinite(parsedTotalMarks) || parsedTotalMarks <= 0) {
      return res.status(400).json({
        success: false,
        message: "totalMarks must be a valid positive number",
      });
    }

    const exam = await Exam.create({
      title,
      type,
      subject,
      totalMarks: parsedTotalMarks,
      examDate,
      className,
      batch,
      group,
      description,
      status: "draft",
    });

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: exam,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to create exam",
      error: error.message,
    });
  }
};

// ======================================================
// Publish Exam
// ======================================================

const publishExam = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);

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
    await exam.save();

    return res.status(200).json({
      success: true,
      message: "Exam published successfully",
      data: exam,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to publish exam",
      error: error.message,
    });
  }
};

// ======================================================
// Get Eligible Students For An Exam
// ======================================================

const getEligibleStudents = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).lean();

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

    const filter: Record<string, any> = {
      className: exam.className,
    };

    if (exam.batch) {
      filter.batch = exam.batch;
    }

    if (exam.group) {
      filter.group = exam.group;
    }

    const students = await Student.find(filter)
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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch eligible students",
      error: error.message,
    });
  }
};

// ======================================================
// Get All Exams
// ======================================================

const getAllExams = async (req: Request, res: Response) => {
  try {
    const { type, className, batch, status } = req.query;

    const filter: Record<string, any> = {};

    if (type) filter.type = type;
    if (className) filter.className = className;
    if (batch) filter.batch = batch;
    if (status) filter.status = status;

    const exams = await Exam.find(filter)
      .sort({ examDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      error: error.message,
    });
  }
};

// ======================================================
// Get Single Exam
// ======================================================

const getExam = async (req: Request, res: Response) => {
  try {
    const exam = await Exam.findById(req.params.examId);

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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam",
      error: error.message,
    });
  }
};

export const ExamControllers = {
  createExam,
  publishExam,
  getEligibleStudents,
  getAllExams,
  getExam,
};
