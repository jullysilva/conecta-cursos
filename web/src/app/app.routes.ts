import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guards';
import { Shell } from './layouts/shell';
import { MovaLayout } from './layouts/mova-layout';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'login',
    title: 'Entrar',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'recuperar-senha',
    title: 'Recuperar senha',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'redefinir-senha',
    title: 'Criar nova senha',
    loadComponent: () => import('./features/auth/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'adm',
    component: Shell,
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '',
    component: MovaLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        title: 'Início',
        loadComponent: () => import('./features/student/home').then((m) => m.Home),
      },
      {
        path: 'curso/:idCourse',
        title: 'Curso',
        loadComponent: () => import('./features/student/course-page').then((m) => m.CoursePage),
      },
      {
        path: 'aula/:idLesson',
        title: 'Aula',
        loadComponent: () => import('./features/student/lesson-page').then((m) => m.LessonPage),
      },
      {
        path: 'trilhas',
        title: 'Trilhas',
        loadComponent: () => import('./features/student/learning-paths').then((m) => m.LearningPaths),
      },
      {
        path: 'trilhas/:idPath',
        title: 'Trilha',
        loadComponent: () =>
          import('./features/student/learning-path-page').then((m) => m.LearningPathPage),
      },
      {
        path: 'perfil',
        title: 'Meu progresso',
        loadComponent: () => import('./features/student/profile').then((m) => m.Profile),
      },
      {
        path: '**',
        title: 'Página não encontrada',
        loadComponent: () => import('./features/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
