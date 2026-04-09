import { Request, Response, NextFunction } from "express";
import { Student } from "../model/student.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { Teacher } from "../model/teacher.model";
import { User } from "../model/user.model";

// Helper to catch async errors
const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// CREATE TeACHER
export const createTeacher = catchAsync(async (req: AuthRequest, res: Response) => {
  const { name, email, phone,photoUrl, bio, qualification, experience, subjects, teachingLevel, availableDays, linkedin, facebook, twitter, website, rating, reviewsCount, status } = req.body;
  console.log(req.body)
  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and phone are required",
    });
  }

  const existingTeacher = await Teacher.findOne({ email });
  if (existingTeacher) {
    return res.status(400).json({
      success: false,
      message: "Teacher already exists with this email",
    });
  }

  const newTeacher = await Teacher.create({
    name,
    email,
    phone,
    photoUrl,
    bio,
    qualification,
    experience,
    subjects,
    teachingLevel,
    availableDays,
    linkedin,
    facebook,
    twitter,
    website,
    rating,
    reviewsCount,
    status,
  });

  const updatedUser = await User.findOneAndUpdate(
    {email},
    { role: "teacher" },
    { new: true }
  );

  res.status(201).json({
    success: true,
    message: "Teacher created successfully and user role updated",
    teacher: newTeacher,
    user: updatedUser,
  });
});

// GET ALL TEACHERS
export const getAllTeachers = catchAsync(async (_req: Request, res: Response) => {
  const teachers = await Teacher.find();
  res.status(200).json({
    success: true,
    message: "Teachers retrieved successfully",
    teachers,
  });
});

// GET TEACHER BY ID
export const getTeacherById = catchAsync(async (req: Request, res: Response) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: "Teacher not found",
    });
  }
  res.status(200).json({
    success: true,
    message: "Teacher retrieved successfully",
    teacher,
  });
});

// GET TEACHER BY EMAIL
export const getTeacherByEmail = catchAsync(async (req: Request, res: Response) => {
  const teacher = await Teacher.findOne({ email: req.params.email });
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: "Teacher not found",
    });
  }
  res.status(200).json({
    success: true,
    message: "Teacher retrieved successfully",
    teacher,
  });
});


// UPDATE TEACHER
export const updateTeacher = catchAsync(async (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    photoUrl, // ✅ FIXED
    bio,
    qualification,
    experience,
    subjects,
    teachingLevel,
    availableDays,
    linkedin,
    facebook,
    twitter,
    website,
    rating,
    reviewsCount,
  } = req.body;

  const updatedTeacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    {
      name,
      email,
      phone,
      photoUrl,
      bio,
      qualification,
      experience,
      subjects,
      teachingLevel,
      availableDays,
      linkedin,
      facebook,
      twitter,
      website,
      rating,
      reviewsCount,
    },
    { new: true, runValidators: true }
  );

  if (!updatedTeacher) {
    return res.status(404).json({
      success: false,
      message: "Teacher not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Teacher updated successfully",
    teacher: updatedTeacher,
  });
});
// DELETE TEACHER
export const deleteTeacher = catchAsync(async (req: Request, res: Response) => {
  const teacher = await Teacher.findByIdAndDelete(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: "Teacher not found",
    });
  }

  await User.findOneAndUpdate(
    { email: teacher.email },
    { role: "user" },
    { returnDocument: "after" }
  );

  res.status(200).json({
    success: true,
    message: "Teacher deleted successfully and user role reset",
  });
});

// Export controllers
export const teacherControllers = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  getTeacherByEmail,
  updateTeacher,
  deleteTeacher,
};