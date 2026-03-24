export interface IUser {
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'teacher' | 'guardian' | 'admin' | 'user';
  image?: string;
}