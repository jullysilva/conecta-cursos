import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Paginated } from '../models/models';
import type {
  AdminBanner,
  AdminCourse,
  AdminCourseDetail,
  AdminLearningPath,
  AdminLesson,
  AdminModule,
  AdminUser,
  AdminUserDetail,
  Category,
  CourseOption,
  CoursePayload,
  Dashboard,
  LessonPayload,
  UserPayload,
} from '../models/admin.models';

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
}

function toParams(query: ListQuery): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params = params.set(key, String(value));
  }
  return params;
}

const BASE = '/api/admin';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  dashboard() {
    return this.http.get<Dashboard>(`${BASE}/dashboard`);
  }

  // Users
  users(query: ListQuery) {
    return this.http.get<Paginated<AdminUser>>(`${BASE}/users`, { params: toParams(query) });
  }
  user(id: string) {
    return this.http.get<AdminUserDetail>(`${BASE}/users/${id}`);
  }
  createUser(payload: UserPayload) {
    return this.http.post<AdminUser>(`${BASE}/users`, payload);
  }
  updateUser(id: string, payload: Partial<UserPayload>) {
    return this.http.patch<AdminUser>(`${BASE}/users/${id}`, payload);
  }
  deleteUser(id: string) {
    return this.http.delete<void>(`${BASE}/users/${id}`);
  }

  // Categories
  categories() {
    return this.http.get<Category[]>(`${BASE}/categories`);
  }
  createCategory(payload: Pick<Category, 'name'> & Partial<Pick<Category, 'position'>>) {
    return this.http.post<Category>(`${BASE}/categories`, payload);
  }
  updateCategory(id: string, payload: Partial<Pick<Category, 'name' | 'position'>>) {
    return this.http.patch<Category>(`${BASE}/categories/${id}`, payload);
  }
  deleteCategory(id: string) {
    return this.http.delete<void>(`${BASE}/categories/${id}`);
  }

  // Courses and content
  courses(query: ListQuery) {
    return this.http.get<Paginated<AdminCourse>>(`${BASE}/courses`, { params: toParams(query) });
  }
  courseOptions() {
    return this.http.get<CourseOption[]>(`${BASE}/courses/options`);
  }
  course(id: string) {
    return this.http.get<AdminCourseDetail>(`${BASE}/courses/${id}`);
  }
  createCourse(payload: CoursePayload) {
    return this.http.post<AdminCourse>(`${BASE}/courses`, payload);
  }
  updateCourse(id: string, payload: CoursePayload) {
    return this.http.patch<AdminCourse>(`${BASE}/courses/${id}`, payload);
  }
  deleteCourse(id: string) {
    return this.http.delete<void>(`${BASE}/courses/${id}`);
  }
  createModule(courseId: string, title: string) {
    return this.http.post<AdminModule>(`${BASE}/courses/${courseId}/modules`, { title });
  }
  updateModule(id: string, title: string) {
    return this.http.patch<AdminModule>(`${BASE}/modules/${id}`, { title });
  }
  deleteModule(id: string) {
    return this.http.delete<void>(`${BASE}/modules/${id}`);
  }
  reorderModules(courseId: string, ids: string[]) {
    return this.http.put<void>(`${BASE}/courses/${courseId}/modules/order`, { ids });
  }
  createLesson(moduleId: string, payload: LessonPayload) {
    return this.http.post<AdminLesson>(`${BASE}/modules/${moduleId}/lessons`, payload);
  }
  updateLesson(id: string, payload: LessonPayload) {
    return this.http.patch<AdminLesson>(`${BASE}/lessons/${id}`, payload);
  }
  deleteLesson(id: string) {
    return this.http.delete<void>(`${BASE}/lessons/${id}`);
  }
  reorderLessons(moduleId: string, ids: string[]) {
    return this.http.put<void>(`${BASE}/modules/${moduleId}/lessons/order`, { ids });
  }

  // Learning paths
  learningPaths() {
    return this.http.get<AdminLearningPath[]>(`${BASE}/learning-paths`);
  }
  createLearningPath(payload: Omit<AdminLearningPath, 'id'>) {
    return this.http.post<AdminLearningPath>(`${BASE}/learning-paths`, payload);
  }
  updateLearningPath(id: string, payload: Partial<Omit<AdminLearningPath, 'id'>>) {
    return this.http.patch<AdminLearningPath>(`${BASE}/learning-paths/${id}`, payload);
  }
  deleteLearningPath(id: string) {
    return this.http.delete<void>(`${BASE}/learning-paths/${id}`);
  }

  // Banners
  banners() {
    return this.http.get<AdminBanner[]>(`${BASE}/banners`);
  }
  banner(id: string) {
    return this.http.get<AdminBanner>(`${BASE}/banners/${id}`);
  }
  createBanner(payload: Omit<AdminBanner, 'id'>) {
    return this.http.post<AdminBanner>(`${BASE}/banners`, payload);
  }
  updateBanner(id: string, payload: Partial<Omit<AdminBanner, 'id'>>) {
    return this.http.patch<AdminBanner>(`${BASE}/banners/${id}`, payload);
  }
  deleteBanner(id: string) {
    return this.http.delete<void>(`${BASE}/banners/${id}`);
  }
}
