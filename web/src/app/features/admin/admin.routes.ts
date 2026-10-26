import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Visão geral',
    loadComponent: () => import('./dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'cursos',
    title: 'Cursos',
    loadComponent: () => import('./courses/course-list').then((m) => m.CourseList),
  },
  {
    path: 'cursos/edit/:id',
    title: 'Editar curso',
    loadComponent: () => import('./courses/course-editor').then((m) => m.CourseEditor),
  },
  {
    path: 'categorias',
    title: 'Categorias',
    loadComponent: () => import('./categories').then((m) => m.Categories),
  },
  {
    path: 'trilhas',
    title: 'Trilhas',
    loadComponent: () => import('./learning-paths/path-list').then((m) => m.PathList),
  },
  {
    path: 'banners',
    title: 'Banners',
    loadComponent: () => import('./banners/banner-list').then((m) => m.BannerList),
  },
  {
    path: 'banners/edit/:id',
    title: 'Editar banner',
    loadComponent: () => import('./banners/banner-edit').then((m) => m.BannerEdit),
  },
  {
    path: 'usuarios',
    title: 'Usuários',
    loadComponent: () => import('./users/user-list').then((m) => m.UserList),
  },
  {
    path: 'usuarios/:id',
    title: 'Usuário',
    loadComponent: () => import('./users/user-edit').then((m) => m.UserEdit),
  },
];
