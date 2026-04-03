import { Request, Response, NextFunction } from "express";
import { Student } from "../model/student.model";
import { User } from "../model/user.model";
import { AuthRequest } from "../middleware/auth.middleware";

// Helper to catch async errors
const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// CREATE STUDENT
export const createStudent = catchAsync(async (req: AuthRequest, res: Response) => {
  const { name, email, phone, className, batch, group, photo } = req.body;

  if (!name || !email || !phone || !className) {
    return res.status(400).json({
      success: false,
      message: "Name, email, phone, and className are required",
    });
  }

  const existingStudent = await Student.findOne({ email });
  if (existingStudent) {
    return res.status(400).json({
      success: false,
      message: "Student already exists with this email",
    });
  }

  const newStudent = await Student.create({
    name,
    email,
    phone,
    className,
    batch,
    group,
    photo,
  });

  const updatedUser = await User.findOneAndUpdate(
    { email },
    { role: "student" },
    { new: true }
  );

  res.status(201).json({
    success: true,
    message: "Student created successfully and user role updated",
    student: newStudent,
    user: updatedUser,
  });
});

// GET ALL STUDENTS
export const getAllStudents = catchAsync(async (_req: Request, res: Response) => {
  const students = await Student.find();
  res.status(200).json({
    success: true,
    message: "Students retrieved successfully",
    students,
  });
});

// GET STUDENT BY EMAIL
export const getStudentByemail = catchAsync(async (req: Request, res: Response) => {
  const student = await Student.findOne({ email: req.params.email });
  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student not found",
    });
  }
  res.status(200).json({
    success: true,
    message: "Student retrieved successfully",
    student,
  });
});

// UPDATE STUDENT
export const updateStudent = catchAsync(async (req: Request, res: Response) => {
  const { name, email, phone, className, batch, group, photoUrl } = req.body;

  const updatedStudent = await Student.findByIdAndUpdate(
    req.params.id,
    { name, email, phone, className, batch, group, photoUrl },
    { new: true, runValidators: true }
  );

  if (!updatedStudent) {
    return res.status(404).json({
      success: false,
      message: "Student not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Student updated successfully",
    student: updatedStudent,
  });
});

// DELETE STUDENT
export const deleteStudent = catchAsync(async (req: Request, res: Response) => {
  const student = await Student.findByIdAndDelete(req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student not found",
    });
  }

  await User.findOneAndUpdate(
    { email: student.email },
    { role: "user" },
    { returnDocument: "after" }
  );

  res.status(200).json({
    success: true,
    message: "Student deleted successfully and user role reset",
  });
});

// Export controllers
export const studentControllers = {
  createStudent,
  getAllStudents,
  getStudentByemail,
  updateStudent,
  deleteStudent,
};