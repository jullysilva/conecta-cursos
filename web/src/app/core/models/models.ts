export type Role = 'STUDENT' | 'ADMIN';
export type VideoProvider = 'YOUTUBE' | 'VIMEO' | 'PANDA' | 'URL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
}

export interface Session {
  accessToken: string;
  user: User;
}

export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

export interface CourseCard {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  workloadHours: number;
  progress?: CourseProgress;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string | null;
}

export interface CategoryShelf {
  id: string;
  name: string;
  slug: string;
  courses: CourseCard[];
}

export interface LearningPathSummary {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  coursesCount: number;
}

export interface LearningPathDetail extends Omit<LearningPathSummary, 'coursesCount'> {
  courses: CourseCard[];
}

export interface LessonOutline {
  id: string;
  title: string;
  durationSec: number;
  position: number;
  completed: boolean;
}

export interface ModuleOutline {
  id: string;
  title: string;
  position: number;
  lessons: LessonOutline[];
}

export interface CourseDetail extends CourseCard {
  category: { id: string; name: string } | null;
  modules: ModuleOutline[];
  progress: CourseProgress;
  nextLessonId: string | null;
}

export interface LessonDetail {
  id: string;
  title: string;
  description: string;
  videoProvider: VideoProvider;
  videoRef: string;
  durationSec: number;
  materialUrl: string | null;
  module: { id: string; title: string; courseId: string };
  course: { id: string; title: string };
  previousLessonId: string | null;
  nextLessonId: string | null;
  progress: { positionSec: number; completed: boolean };
}

export interface EnrolledCourse {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  workloadHours: number;
  lastLessonId: string | null;
  lastAccessedAt: string;
  progress: CourseProgress;
}

export interface StudentSummary {
  completedLessons: number;
  completedCourses: number;
  inProgressCourses: number;
  continueWatching: EnrolledCourse[];
  courses: EnrolledCourse[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
