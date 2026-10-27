import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { LearningService } from '../../core/services/learning.service';
import type { CourseDetail, LessonDetail, StudentSummary } from '../../core/models/models';
import { Home } from './home';
import { CoursePage } from './course-page';
import { LessonPage } from './lesson-page';
import { Profile } from './profile';

const progress = (percent: number) => ({ totalLessons: 4, completedLessons: percent / 25, percent });

const summary: StudentSummary = {
  completedLessons: 1,
  completedCourses: 0,
  inProgressCourses: 1,
  continueWatching: [
    { id: 'c1', title: 'Liderança', thumbnailUrl: null, workloadHours: 2, lastLessonId: 'l2', lastAccessedAt: '2026-10-01T00:00:00Z', progress: progress(25) },
  ],
  courses: [
    { id: 'c1', title: 'Liderança', thumbnailUrl: null, workloadHours: 2, lastLessonId: 'l2', lastAccessedAt: '2026-10-01T00:00:00Z', progress: progress(25) },
  ],
};

const course: CourseDetail = {
  id: 'c1', title: 'Liderança', slug: 'lideranca', description: 'Desc', thumbnailUrl: null, workloadHours: 2,
  category: { id: 'cat', name: 'Gestão' }, progress: progress(25), nextLessonId: 'l2',
  modules: [{ id: 'm1', title: 'Início', position: 0, lessons: [
    { id: 'l1', title: 'Aula 1', durationSec: 60, position: 0, completed: true },
    { id: 'l2', title: 'Aula 2', durationSec: 90, position: 1, completed: false },
  ] }],
};

const lesson: LessonDetail = {
  id: 'l2', title: 'Aula 2', description: 'Sobre a aula', videoProvider: 'YOUTUBE', videoRef: 'dQw4w9WgXcQ',
  durationSec: 90, materialUrl: 'https://files/apoio.pdf', module: { id: 'm1', title: 'Início', courseId: 'c1' },
  course: { id: 'c1', title: 'Liderança' }, previousLessonId: 'l1', nextLessonId: null,
  progress: { positionSec: 0, completed: false },
};

function setup(overrides: Partial<Record<keyof LearningService, unknown>> = {}) {
  const learning = {
    summary: vi.fn(() => of(summary)),
    banners: vi.fn(() => of([{ id: 'b1', title: 'Bem-vindo', subtitle: '', imageUrl: 'https://img', linkUrl: '/trilhas' }])),
    categories: vi.fn(() => of([{ id: 'cat', name: 'Gestão', slug: 'gestao', courses: [{ ...course, progress: progress(0) }] }])),
    featuredCourse: vi.fn(() => of(null)),
    learningPaths: vi.fn(() => of([{ id: 'p1', title: 'Trilha', description: '', thumbnailUrl: null, coursesCount: 2 }])),
    course: vi.fn(() => of(course)),
    lesson: vi.fn(() => of(lesson)),
    saveProgress: vi.fn(() => of({ positionSec: 0, completed: true })),
    saveProgressOnExit: vi.fn(),
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: LearningService, useValue: learning },
      { provide: AuthService, useValue: { user: () => ({ name: 'Ana Souza', email: 'ana@x.com' }) } },
    ],
  });
  return learning;
}

describe('Home', () => {
  it('greets the student and offers to resume the last lesson', async () => {
    setup();
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent).toContain('Olá, Ana');
    expect(el.textContent).toContain('Continue de onde parou');
    expect(el.querySelector('.resume a')?.getAttribute('href')).toBe('/aula/l2');
    expect(el.textContent).toContain('Gestão');
    expect(el.textContent).toContain('Trilha');
  });

  it('shows a retry when the catalog fails to load', async () => {
    setup({ categories: vi.fn(() => throwError(() => new Error('offline'))) });
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar os cursos');
  });
});

describe('CoursePage', () => {
  it('renders the outline, completion marks and the continue CTA', async () => {
    setup();
    const fixture = TestBed.createComponent(CoursePage);
    fixture.componentRef.setInput('idCourse', 'c1');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent).toContain('Liderança');
    expect(el.querySelector('.hero .btn-primary')?.textContent).toContain('Continuar curso');
    expect(el.querySelectorAll('.lessons a.is-done')).toHaveLength(1);

    const toggle = el.querySelector<HTMLButtonElement>('.module-toggle')!;
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('.lessons')).toBeNull();
  });

  it('shows not found on error', async () => {
    setup({ course: vi.fn(() => throwError(() => new Error('404'))) });
    const fixture = TestBed.createComponent(CoursePage);
    fixture.componentRef.setInput('idCourse', 'x');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Curso não encontrado');
  });
});

describe('LessonPage', () => {
  it('marks the lesson as completed and refreshes the outline', async () => {
    const learning = setup();
    const fixture = TestBed.createComponent(LessonPage);
    fixture.componentRef.setInput('idLesson', 'l2');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent).toContain('Aula 2');
    expect(el.textContent).toContain('Módulo 1: Início');
    expect(el.querySelector('a[aria-current=page]')?.textContent).toContain('Aula 2');

    const button = el.querySelector<HTMLButtonElement>('.lesson-head .btn')!;
    button.click();
    await fixture.whenStable();
    expect(learning.saveProgress).toHaveBeenCalledWith('l2', 0, true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(learning.course).toHaveBeenCalledTimes(2);
    // Last lesson + completed: offer the way back to the course.
    expect(el.querySelector('.pager .next')?.textContent).toContain('Voltar ao curso');
  });

  it('reverts the toggle when saving fails', async () => {
    setup({ saveProgress: vi.fn(() => throwError(() => new Error('fail'))) });
    const fixture = TestBed.createComponent(LessonPage);
    fixture.componentRef.setInput('idLesson', 'l2');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('.lesson-head .btn') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });
});

describe('Profile', () => {
  it('lists stats and enrolled courses', async () => {
    setup();
    const fixture = TestBed.createComponent(Profile);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.stats')?.textContent).toContain('Aulas concluídas');
    expect(el.querySelector('tbody a')?.getAttribute('href')).toBe('/curso/c1');
    expect(el.textContent).toContain('Continuar');
  });
});
