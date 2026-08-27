import { Request, Response } from "express";
import { Exam } from "../model/exam.model";
import { ExamResult } from "../model/examResult.model";
import { Student } from "../model/student.model";
import { calculateGrade } from "../utils/result.utils";

// ======================================================
// Helpers
// ======================================================

const getEligibleStudentFilter = (exam: any) => {
  const filter: Record<string, any> = {
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

const isStudentEligible = (exam: any, student: any) => {
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

const createResult = async (req: Request, res: Response) => {
  try {
    const {
      exam: examId,
      student: studentId,
      marks,
      isAbsent = false,
      remarks,
      subjectResults = [],
    } = req.body;

    if (!examId || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Exam and student are required",
      });
    }

    const exam = await Exam.findById(examId);

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

    const student = await Student.findById(studentId).lean();

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
        message:
          "This student is not eligible for this exam",
      });
    }

    const existing = await ExamResult.findOne({
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
      const result = await ExamResult.create({
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

    const percentage = Number(
      ((obtainedMarks / exam.totalMarks) * 100).toFixed(2)
    );

    const grade = calculateGrade(percentage);

    const result = await ExamResult.create({
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
  } catch (error: any) {
    console.error("Create Result Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create result",
      error: error.message,
    });
  }
};

// ======================================================
// Bulk Result Entry
// ======================================================

const addBulkResults = async (req: Request, res: Response) => {
  try {
    const { examId, results } = req.body;

    if (
      !examId ||
      !Array.isArray(results) ||
      results.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "examId and results array are required",
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    if (exam.status !== "published") {
      return res.status(400).json({
        success: false,
        message:
          "Exam must be published before entering results",
      });
    }

    const studentIds = results
      .map((item: any) => item.studentId)
      .filter(Boolean);

    const students = await Student.find({
      _id: { $in: studentIds },
    }).lean();

    const studentMap = new Map(
      students.map((student: any) => [
        student._id.toString(),
        student,
      ]),
    );

    let inserted = 0;
    let updated = 0;

    const errors: any[] = [];

    for (const item of results) {
      const studentId = item.studentId?.toString();

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
          reason:
            "Student is not eligible for this exam",
        });

        continue;
      }

      const isAbsent = item.isAbsent === true;

      let updateData: any;

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
        if (
          item.marks === undefined ||
          item.marks === null ||
          item.marks === ""
        ) {
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
            reason:
              `Marks cannot exceed ${exam.totalMarks}`,
          });

          continue;
        }

        const percentage = Number(
          (
            (obtainedMarks / exam.totalMarks) *
            100
          ).toFixed(2),
        );

        const grade = calculateGrade(percentage);

        updateData = {
          exam: exam._id,
          student: student._id,
          subjectResults:
            item.subjectResults || [],
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

      const existing = await ExamResult.findOne({
        exam: exam._id,
        student: student._id,
      });

      if (existing) {
        await ExamResult.updateOne(
          {
            _id: existing._id,
          },
          {
            $set: updateData,
          },
        );

        updated++;
      } else {
        await ExamResult.create(updateData);

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
  } catch (error: any) {
    console.error(
      "Bulk Result Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save bulk results",
      error: error.message,
    });
  }
};


// ======================================================
// Get Exam Results
// ======================================================

const getExamResults = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { status } = req.query;

    const exam = await Exam.findById(examId).lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const filter: Record<string, any> = {
      exam: examId,
    };

    if (status) {
      filter.status = status;
    }

    const results = await ExamResult.find(filter)
      .populate(
        "student",
        "name photo className batch group"
      )
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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam results",
      error: error.message,
    });
  }
};

// ======================================================
// Publish All Results For An Exam
// ======================================================

const publishResults = async (req: Request, res: Response) => {
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
        message: "Exam must be published before publishing results",
      });
    }

    const eligibleStudents = await Student.find(
      getEligibleStudentFilter(exam)
    )
      .select("_id name photo className batch group")
      .lean();

    if (eligibleStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No eligible students found for this exam",
      });
    }

    const results = await ExamResult.find({
      exam: examId,
    })
      .select("student status")
      .lean();

    const resultStudentIds = new Set(
      results.map((result: any) =>
        result.student.toString()
      )
    );

    const missingStudents = eligibleStudents.filter(
      (student: any) =>
        !resultStudentIds.has(student._id.toString())
    );

    // Every eligible student must have a result.
    // Absence should be entered explicitly as isAbsent=true.
    if (missingStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot publish results. Some eligible students do not have a result yet.",
        eligibleCount: eligibleStudents.length,
        resultCount: results.length,
        missingCount: missingStudents.length,
        missingStudents,
      });
    }

    const draftCount = results.filter(
      (result: any) => result.status === "draft"
    ).length;

    if (draftCount === 0) {
      return res.status(400).json({
        success: false,
        message: "All results are already published",
      });
    }

    const updateResult = await ExamResult.updateMany(
      {
        exam: examId,
        status: "draft",
      },
      {
        $set: {
          status: "published",
        },
      }
    );

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
  } catch (error: any) {
    console.error("Publish Results Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to publish exam results",
      error: error.message,
    });
  }
};

// ======================================================
// Exam Leaderboard
// ======================================================

const getExamLeaderboard = async (
  req: Request,
  res: Response
) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const results = await ExamResult.find({
      exam: examId,
      status: "published",
      isAbsent: false,
    })
      .populate(
        "student",
        "name photo className batch group"
      )
      .sort({ percentage: -1, marks: -1 })
      .lean();

    const leaderboard = results.map(
      (result: any, index) => ({
        rank: index + 1,
        student: result.student,
        marks: result.marks,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        grade: result.grade,
      })
    );

    return res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate leaderboard",
      error: error.message,
    });
  }
};

// ======================================================
// Class Leaderboard
// ======================================================

const getClassLeaderboard = async (
  req: Request,
  res: Response
) => {
  try {
    const { examId, className } = req.params;

    const results = await ExamResult.find({
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

    const filteredResults = results.filter(
      (item: any) => item.student
    );

    const leaderboard = filteredResults.map(
      (result: any, index) => ({
        rank: index + 1,
        student: result.student,
        marks: result.marks,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        grade: result.grade,
      })
    );

    return res.status(200).json({
      success: true,
      className,
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate class leaderboard",
      error: error.message,
    });
  }
};

// ======================================================
// Overall Coaching Leaderboard
// ======================================================

const getOverallLeaderboard = async (
  req: Request,
  res: Response
) => {
  try {
    const { className, batch, examType } = req.query;

    const match: any = {
      status: "published",
      isAbsent: false,
    };

    if (examType) {
      const exams = await Exam.find({
        type: examType,
      }).select("_id");

      match.exam = {
        $in: exams.map((exam) => exam._id),
      };
    }

    const pipeline: any[] = [
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

    pipeline.push(
      {
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
      },

      {
        $sort: {
          averagePercentage: -1,
        },
      },

      { $limit: 100 }
    );

    const results = await ExamResult.aggregate(pipeline);

    const leaderboard = results.map(
      (item, index) => ({
        rank: index + 1,
        student: {
          _id: item.student._id,
          name: item.student.name,
          photo: item.student.photo,
          className: item.student.className,
          batch: item.student.batch,
          group: item.student.group,
        },
        averagePercentage: Number(
          item.averagePercentage.toFixed(2)
        ),
        totalExams: item.totalExams,
      })
    );

    return res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate overall leaderboard",
      error: error.message,
    });
  }
};

// ======================================================
// Student Statistics
// ======================================================

const getStudentStatistics = async (
  req: Request,
  res: Response
) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const results = await ExamResult.find({
      student: studentId,
      status: "published",
    })
      .populate("exam", "title type examDate")
      .sort({ createdAt: -1 })
      .lean();

    const participated = results.filter(
      (result) => !result.isAbsent
    );

    const absent = results.filter(
      (result) => result.isAbsent
    );

    const percentages = participated.map(
      (result) => result.percentage
    );

    const averagePercentage =
      percentages.length > 0
        ? percentages.reduce(
            (sum, value) => sum + value,
            0
          ) / percentages.length
        : 0;

    const highestPercentage =
      percentages.length > 0
        ? Math.max(...percentages)
        : 0;

    const lowestPercentage =
      percentages.length > 0
        ? Math.min(...percentages)
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalExams: results.length,
        participated: participated.length,
        absent: absent.length,
        averagePercentage: Number(
          averagePercentage.toFixed(2)
        ),
        highestPercentage,
        lowestPercentage,
        recentResults: results.slice(0, 10),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate student statistics",
      error: error.message,
    });
  }
};

// ======================================================
// Student Performance
// ======================================================

const getStudentPerformance = async (
  req: Request,
  res: Response
) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const results = await ExamResult.find({
      student: studentId,
      status: "published",
      isAbsent: false,
    })
      .populate("exam")
      .sort({ createdAt: -1 })
      .lean();

    const totalExams = results.length;

    const totalObtained = results.reduce(
      (sum, result) => sum + result.marks,
      0
    );

    const averagePercentage =
      totalExams > 0
        ? Number(
            (
              results.reduce(
                (sum, result) => sum + result.percentage,
                0
              ) / totalExams
            ).toFixed(2)
          )
        : 0;

    const weeklyResults = results.filter(
      (result: any) => result.exam?.type === "weekly"
    );

    const modelTestResults = results.filter(
      (result: any) => result.exam?.type === "model_test"
    );

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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student performance",
      error: error.message,
    });
  }
};

export const examResultControllers = {
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
