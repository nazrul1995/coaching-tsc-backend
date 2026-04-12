export interface TStudentResult {
    id?: string;

    studentId: string;
    studentName:string;
    className: string;
    studentPhoto?:string;
    examName: string;
    subject: string;

    totalMarks: Number;
    obtainedMarks: Number,
    percentage: Number,
    examAppearedDate: string;
    grade: string;
}