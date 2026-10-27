import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
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
  category: { id: 'cat', name: 'Gestão', slug: 'gestao' }, progress: progress(25), nextLessonId: 'l2',
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
  it('shows the banner, continue watching, featured and category rows', async () => {
    setup({ featuredCourse: vi.fn(() => of({ ...course, progress: progress(0) })) });
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('cp-mova-banner')).not.toBeNull();
    const titles = Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(titles).toEqual(['Continue assistindo', 'Em destaque', 'Gestão']);
    // Continue watching resumes from the last lesson.
    expect(el.querySelector('.progress-row .info-cta')?.getAttribute('href')).toBe('/aula/l2');
    expect(el.querySelector('#gestao')).not.toBeNull();
  });

  it('recommends courses not started when there is nothing to continue', async () => {
    setup({ summary: vi.fn(() => of({ ...summary, continueWatching: [] })) });
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const titles = Array.from(fixture.nativeElement.querySelectorAll('h2')).map((h) => (h as HTMLElement).textContent?.trim());
    expect(titles[0]).toBe('Recomendados para você');
  });

  it('still shows the catalog when the progress summary fails', async () => {
    setup({ summary: vi.fn(() => throwError(() => new Error('500'))) });
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const titles = Array.from(fixture.nativeElement.querySelectorAll('h2')).map((h) => (h as HTMLElement).textContent?.trim());
    expect(titles).toEqual(['Recomendados para você', 'Gestão']);
  });

  it('shows a retry when the catalog fails to load', async () => {
    const categories = vi.fn(() => throwError(() => new Error('offline')) as ReturnType<LearningService['categories']>);
    setup({ categories });
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar seus cursos.');
    categories.mockReturnValue(of([]));
    (fixture.nativeElement.querySelector('.empty button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Você ainda não tem cursos disponíveis.');
  });
});

describe('CoursePage', () => {
  it('shows the hero, the continue action and the course outline in the sidebar', async () => {
    setup();
    const fixture = TestBed.createComponent(CoursePage);
    fixture.componentRef.setInput('idCourse', 'c1');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.hero-title')?.textContent).toContain('Liderança');
    expect(el.querySelector('.mova-breadcrumb a[href="/home#gestao"]')?.textContent).toContain('Gestão');
    expect(el.querySelector('.action-title')?.textContent).toContain('Continue de onde parou');
    expect(el.querySelector('.action-cta')?.getAttribute('href')).toBe('/aula/l2');
    expect(el.querySelectorAll('cp-course-frame .lesson.is-completed')).toHaveLength(1);
    expect(el.querySelector('.lesson-number')?.textContent).toContain('Aula 1');
  });

  it('expands a module into lesson cards and closes it again', async () => {
    setup();
    const fixture = TestBed.createComponent(CoursePage);
    fixture.componentRef.setInput('idCourse', 'c1');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const card = el.querySelector<HTMLButtonElement>('.module-card')!;
    expect(card.querySelector('.module-meta')?.textContent).toContain('1 de 2 aulas concluídas');
    card.click();
    await fixture.whenStable();
    expect(card.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelectorAll('.lesson-card')).toHaveLength(2);
    expect(el.querySelector('.lesson-card .lesson-meta')?.textContent).toContain('1:00, concluída');
    el.querySelector<HTMLButtonElement>('.expanded-close')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.expanded')).toBeNull();
  });

  it('highlights the start action for a course not started and shows done when finished', async () => {
    setup({ course: vi.fn(() => of({ ...course, progress: progress(0) })) });
    const fresh = TestBed.createComponent(CoursePage);
    fresh.componentRef.setInput('idCourse', 'c1');
    await fresh.whenStable();
    expect(fresh.nativeElement.querySelector('.action--highlight .action-cta')?.textContent).toContain('Começar curso');

    TestBed.resetTestingModule();
    setup({ course: vi.fn(() => of({ ...course, progress: progress(100) })) });
    const done = TestBed.createComponent(CoursePage);
    done.componentRef.setInput('idCourse', 'c1');
    await done.whenStable();
    expect(done.nativeElement.querySelector('.action-title')?.textContent).toContain('Curso concluído');
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
  beforeEach(() => localStorage.clear());

  async function render(overrides: Parameters<typeof setup>[0] = {}) {
    const learning = setup(overrides);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LessonPage);
    fixture.componentRef.setInput('idLesson', 'l2');
    await fixture.whenStable();
    return { learning, navigate, fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('marks the lesson as completed and refreshes the outline', async () => {
    const { learning, fixture, el } = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Aula 2');
    expect(el.querySelector('.lesson.is-selected')?.textContent).toContain('Aula 2');
    expect(el.querySelector('.badge--status')?.textContent).toContain('Não concluída');

    const button = el.querySelector<HTMLButtonElement>('.tools .btn')!;
    button.click();
    await fixture.whenStable();
    expect(learning.saveProgress).toHaveBeenCalledWith('l2', 0, true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector('.badge--done')).not.toBeNull();
    expect(learning.course).toHaveBeenCalledTimes(2);
    // Last lesson: the pager leads back to the course.
    expect(el.querySelector('.pager-btn--next')?.textContent).toContain('Voltar ao curso');
  });

  it('reverts the toggle when saving fails', async () => {
    const { fixture, el } = await render({ saveProgress: vi.fn(() => throwError(() => new Error('fail'))) });
    const button = el.querySelector<HTMLButtonElement>('.tools .btn')!;
    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('remembers autoplay and advances to the next lesson when the video ends', async () => {
    const { fixture, el, navigate } = await render({ lesson: vi.fn(() => of({ ...lesson, nextLessonId: 'l3' })) });
    const toggle = el.querySelector<HTMLInputElement>('.autoplay-input')!;
    toggle.click();
    await fixture.whenStable();
    expect(localStorage.getItem('cp.autoplay-next-lesson')).toBe('1');
    expect(el.querySelector('.autoplay--on')).not.toBeNull();

    (fixture.componentInstance as unknown as { onEnded(): void }).onEnded();
    expect(navigate).toHaveBeenCalledWith(['/aula', 'l3']);
  });
});

describe('Profile', () => {
  it('shows the identity card and the course history', async () => {
    setup();
    TestBed.overrideProvider(AuthService, { useValue: { user: () => ({ name: 'Ana Souza', email: 'ana@x.com' }), logout: vi.fn() } });
    const fixture = TestBed.createComponent(Profile);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.name')?.textContent).toContain('Ana Souza');
    expect(el.querySelector('.badge')?.textContent).toContain('1 aula concluída');
    expect(el.querySelector('.status')?.textContent).toContain('Em andamento');
    expect(el.querySelector('.card .action')?.getAttribute('href')).toBe('/aula/l2');
  });
});
