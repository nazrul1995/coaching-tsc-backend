import { Request, Response, NextFunction } from "express";
import { Student } from "../model/student.model";
import { AuthRequest } from "../middleware/auth.middleware";
import bcrypt from "bcrypt";
import { User } from "../model/user.model";
import { StudentFee } from "../model/payment.model";
import mongoose from "mongoose";

// Helper to catch async errors
const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};


export const createStudentByAdmin = catchAsync(
  async (req: any, res: Response) => {
    const {
      name,
      email,
      password,
      phone,
      className,
      batch,
      group,
      photo,
      institution,
      guradianName,
      monthlyFee,
      admissionDate,
    } = req.body;

    // ==========================
    // 1. Validate required fields
    // ==========================
    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !className ||
      !institution ||
      !guradianName ||
      monthlyFee === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password, phone, className, institution, guardian name and monthly fee are required",
      });
    }

    const fee = Number(monthlyFee);
    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({
        success: false,
        message: "Monthly fee must be a valid positive number",
      });
    }

    // admissionDate সঠিক ফরম্যাটে হ্যান্ডেল করা
    const parsedAdmissionDate = admissionDate
      ? new Date(admissionDate)
      : new Date();

    if (isNaN(parsedAdmissionDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid admission date provided",
      });
    }

    // ==========================
    // 2. Check Existing Records
    // ==========================
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student already exists with this email",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user already exists with this email",
      });
    }

    // ==========================
    // 3. Create User, Student & Initial Fee using Transaction
    // ==========================
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create User
      const [newUser] = await User.create(
        [
          {
            name,
            email,
            password,
            role: "student",
            image: photo,
          },
        ],
        { session }
      );

      // Create Student
      const [newStudent] = await Student.create(
        [
          {
            name,
            email,
            phone,
            className,
            guradianName,
            batch,
            group,
            photo,
            institution,
            monthlyFee: fee,
            admissionDate: parsedAdmissionDate,
          },
        ],
        { session }
      );

      // ==========================
      // 4. Generate First Cycle Fee Automatically
      // ==========================
      const cycleStartDate = new Date(parsedAdmissionDate);
      const cycleEndDate = new Date(cycleStartDate);
      cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);

      const dueDate = new Date(cycleEndDate);
      dueDate.setDate(dueDate.getDate() + 7); // গ্রেস পিরিয়ডসহ Due Date (৭ দিন)

      const initialFee = await new StudentFee({
        student: newStudent._id,
        cycleStartDate,
        cycleEndDate,
        dueDate,
        amount: fee,
        paidAmount: 0,
        status: "unpaid",
      }).save({ session });

      // Transaction সফল হলে Commit করা
      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        message: "Student, User account, and initial Fee record created successfully",
        student: newStudent,
        initialFee,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          image: newUser.image,
        },
      });
    } catch (error: any) {
      // কোনো একটি স্টেপে ভুল হলে পুরো ট্রানজেকশন অটো রোলব্যাক হয়ে যাবে
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
)



// CREATE STUDENT
export const createStudent = catchAsync(async (req: AuthRequest, res: Response) => {
  const { name, email, phone, className, batch, group, photo,institution,guradianName } = req.body;
  if (!name || !email || !phone || !className || !guradianName) {
    return res.status(400).json({
      success: false,
      message: "Name, email, phone, className, and guardian name are required",
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
    guradianName,
    batch,
    group,
    photo,
    institution,
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


// GET ALL STUDENTS (OPTIONAL FILTER BY CLASS)
export const getAllStudents = catchAsync(async (req: Request, res: Response) => {
  const className = req.query.class as string;

  // build filter dynamically
  const filter: any = {};

  if (className) {
    filter.className = className;
  }

  const students = await Student.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Students retrieved successfully',
    data: students, // ✅ better API structure
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
  console.log(name, email, phone, className, batch, group, photoUrl)
  const updatedStudent = await Student.findByIdAndUpdate(
    req.params.id,
    { name, email, phone, className, batch, group, photo: photoUrl },
    { new: true, runValidators: true }
  );

  if (!updatedStudent) {
    return res.status(404).json({
      success: false,
      message: "Student not found",
    });
  }

  const updatedUser = await User.findOneAndUpdate(
    { email: updatedStudent.email }, // or req.body.email
    {
      name,
    },
    { new: true, runValidators: true }
  );

  return res.status(200).json({
    success: true,
    message: "Student updated successfully",
    student: updatedStudent,
    user: updatedUser,
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
  createStudentByAdmin,

};