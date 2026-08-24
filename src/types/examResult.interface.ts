import { Types } from "mongoose";

export type ResultGrade =
  | "A+"
  | "A"
  | "A-"
  | "B"
  | "C"
  | "D"
  | "F";

export type ResultStatus = "draft" | "published";

export interface ISubjectResult {
  subject: Types.ObjectId;
  marks: number;
  fullMarks: number;
  percentage: number;
  grade?: ResultGrade;
}

export interface IExamResult {
  _id?: Types.ObjectId;

  exam: Types.ObjectId;
  student: Types.ObjectId;

  subjectResults?: ISubjectResult[];

  /** Obtained marks */
  marks: number;

  /** Full marks */
  totalMarks: number;

  percentage: number;
  grade: ResultGrade;

  isAbsent: boolean;
  status: ResultStatus;

  remarks?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
