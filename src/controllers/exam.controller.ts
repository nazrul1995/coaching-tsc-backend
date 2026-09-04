import { Request, Response, NextFunction } from "express";
import { Exam } from "../model/exam.model";
import { Student } from "../model/student.model";

// Allowed Exam Types Constant
const ALLOWED_EXAM_TYPES = ["weekly", "model_test"] as const;

// Helper: Auto-increment title generator
const generateExamTitle = async (
  type: string,
  className: string,
  batch?: string,
  group?: string
): Promise<string> => {
  const titlePrefix = type === "weekly" ? "Weekly Tutorial" : "Model Test";

  const seriesFilter: Record<string, any> = {
    type,
    className,
    batch: batch ? batch : { $exists: false },
    group: group ? group : { $exists: false },
  };

  const existingExams = await Exam.find(seriesFilter).select("title").lean();

  let maxNumber = 0;
  const escapedPrefix = titlePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const titleRegex = new RegExp(`^${escapedPrefix}-([0-9]+)$`, "i");

  for (const existingExam of existingExams) {
    if (!existingExam.title) continue;
    const match = existingExam.title.match(titleRegex);
    if (match) {
      const num = Number(match[1]);
      if (Number.isFinite(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  return `${titlePrefix}-${maxNumber + 1}`;
};

// ======================================================
// 1. Create Exam
// ======================================================
const createExam = async (req: Request, res: Response) => {
  try {
    const {
      type,
      subject,
      totalMarks,
      examDate,
      className,
      batch,
      group,
      description,
    } = req.body;

    // Required fields validation
    if (!type || !subject || totalMarks === undefined || !examDate || !className) {
      return res.status(400).json({
        success: false,
        message: "type, subject, totalMarks, examDate and className are required",
      });
    }

    // Validate Exam Type
    if (!ALLOWED_EXAM_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid exam type. Allowed types are: ${ALLOWED_EXAM_TYPES.join(", ")}`,
      });
    }

    // Validate Total Marks
    const parsedTotalMarks = Number(totalMarks);
    if (!Number.isFinite(parsedTotalMarks) || parsedTotalMarks <= 0) {
      return res.status(400).json({
        success: false,
        message: "totalMarks must be a valid positive number",
      });
    }

    // Normalizations
    const normalizedClassName = String(className).trim();
    if (!normalizedClassName) {
      return res.status(400).json({
        success: false,
        message: "className is required",
      });
    }

    const normalizedBatch = batch ? String(batch).trim() : undefined;
    const normalizedGroup = group ? String(group).trim() : undefined;

    // Generate Auto Title
    const generatedTitle = await generateExamTitle(
      type,
      normalizedClassName,
      normalizedBatch,
      normalizedGroup
    );

    // Create Exam Document
    const exam = await Exam.create({
      title: generatedTitle,
      type,
      subject: String(subject).trim(),
      totalMarks: parsedTotalMarks,
      examDate,
      className: normalizedClassName,
      batch: normalizedBatch,
      group: normalizedGroup,
      description: description ? String(description).trim() : undefined,
      status: "draft",
    });

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: exam,
    });
  } catch (error: any) {
    console.error("Create Exam Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create exam",
      error: error.message,
    });
  }
};

// ======================================================
// 2. Publish Exam
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
    console.error("Publish Exam Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish exam",
      error: error.message,
    });
  }
};

// ======================================================
// 3. Get Eligible Students For An Exam
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

    const filter: Record<string, any> = { className: exam.className };
    if (exam.batch) filter.batch = exam.batch;
    if (exam.group) filter.group = exam.group;

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
// 4. Get All Exams
// ======================================================
const getAllExams = async (req: Request, res: Response) => {
  try {
    const { type, className, batch, status } = req.query;
    const filter: Record<string, any> = {};

    if (type) filter.type = type;
    if (className) filter.className = className;
    if (batch) filter.batch = batch;
    if (status) filter.status = status;

    const exams = await Exam.find(filter).sort({ examDate: -1 }).lean();

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
// 5. Get Single Exam
// ======================================================
const getExam = async (req: Request, res: Response) => {
  try {
    const exam = await Exam.findById(req.params.examId).lean();

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

// ======================================================
// 6. Update Exam
// ======================================================
const updateExam = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const {
      type,
      subject,
      totalMarks,
      examDate,
      className,
      batch,
      group,
      description,
    } = req.body;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // if (exam.status === "published") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Published exam cannot be updated",
    //   });
    // }

    if (type !== undefined) {
      if (!ALLOWED_EXAM_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid exam type. Allowed types are: ${ALLOWED_EXAM_TYPES.join(", ")}`,
        });
      }
      exam.type = type;
    }

    if (subject !== undefined) {
      const normalizedSubject = String(subject).trim();
      if (!normalizedSubject) {
        return res.status(400).json({
          success: false,
          message: "subject cannot be empty",
        });
      }
      exam.subject = normalizedSubject;
    }

    if (totalMarks !== undefined) {
      const parsedTotalMarks = Number(totalMarks);
      if (!Number.isFinite(parsedTotalMarks) || parsedTotalMarks <= 0) {
        return res.status(400).json({
          success: false,
          message: "totalMarks must be a valid positive number",
        });
      }
      exam.totalMarks = parsedTotalMarks;
    }

    if (examDate !== undefined) {
      if (!examDate) {
        return res.status(400).json({
          success: false,
          message: "examDate cannot be empty",
        });
      }
      exam.examDate = examDate;
    }

    if (className !== undefined) {
      const normalizedClassName = String(className).trim();
      if (!normalizedClassName) {
        return res.status(400).json({
          success: false,
          message: "className cannot be empty",
        });
      }
      exam.className = normalizedClassName;
    }

    if (batch !== undefined) {
      exam.batch = String(batch).trim() || undefined;
    }

    if (group !== undefined) {
      if (group !== undefined) {
        const allowedGroups = [
          "science",
          "commerce",
          "arts",
          "general",
        ] as const;

        if (!allowedGroups.includes(group)) {
          return res.status(400).json({
            success: false,
            message: "Invalid group",
          });
        }

        exam.group = group;
      }
    }

    if (description !== undefined) {
      exam.description = String(description).trim() || undefined;
    }

    await exam.save();

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      data: exam,
    });
  } catch (error: any) {
    console.error("Update Exam Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update exam",
      error: error.message,
    });
  }
};
// ======================================================
// 7. Delete Exam
// ======================================================
const deleteExam = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Optional Safety Guard: Prevent deletion of published exams if results depend on it
    if (exam.status === "published") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a published exam. Unpublish or archive it first.",
      });
    }

    await Exam.findByIdAndDelete(examId);

    return res.status(200).json({
      success: true,
      message: "Exam deleted successfully",
      data: { _id: examId },
    });
  } catch (error: any) {
    console.error("Delete Exam Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete exam",
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
  updateExam,
  deleteExam
};