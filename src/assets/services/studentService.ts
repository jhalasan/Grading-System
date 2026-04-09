import { pb } from "./pocketbase";
import type { Student } from "../types/Student";

export const getAllStudents = async (): Promise<Student[]> => {
  try {
    const records = await pb.collection("students").getFullList({
      sort: "student_name",
    });
    return records as unknown as Student[];
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

export const getStudentById = async (studentId: string): Promise<Student> => {
  try {
    const record = await pb.collection("students").getOne(studentId);
    return record as unknown as Student;
  } catch (error) {
    console.error("Error fetching student:", error);
    throw error;
  }
};

export const getStudentsByCourse = async (course: string): Promise<Student[]> => {
  try {
    const records = await pb.collection("students").getFullList({
      filter: `course = "${course}"`,
      sort: "student_name",
    });
    return records as unknown as Student[];
  } catch (error) {
    console.error("Error fetching students by course:", error);
    throw error;
  }
};

export const getStudentsBySection = async (section: string): Promise<Student[]> => {
  try {
    const records = await pb.collection("students").getFullList({
      filter: `section = "${section}"`,
      sort: "student_name",
    });
    return records as unknown as Student[];
  } catch (error) {
    console.error("Error fetching students by section:", error);
    throw error;
  }
};

export const createStudent = async (
  studentName: string,
  course: string,
  section: string
): Promise<Student> => {
  try {
    const record = await pb.collection("students").create({
      student_name: studentName,
      course: course,
      section: section,
    });
    return record as unknown as Student;
  } catch (error) {
    console.error("Error creating student:", error);
    throw error;
  }
};
