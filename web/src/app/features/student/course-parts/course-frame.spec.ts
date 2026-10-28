import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { CourseDetail } from '../../../core/models/models';
import { CourseFrame } from './course-frame';

const course: CourseDetail = {
  id: 'c1', title: 'Curso', slug: 'curso', description: '', thumbnailUrl: null, workloadHours: 1, category: null,
  progress: { totalLessons: 3, completedLessons: 1, percent: 33 }, nextLessonId: 'l2',
  modules: [
    { id: 'm1', title: 'Módulo A', position: 0, lessons: [{ id: 'l1', title: 'Um', durationSec: 0, position: 0, completed: true }] },
    { id: 'm2', title: 'Módulo B', position: 1, lessons: [
      { id: 'l2', title: 'Dois', durationSec: 90, position: 0, completed: false },
      { id: 'l3', title: 'Três', durationSec: 0, position: 1, completed: false },
    ] },
  ],
};

describe('CourseFrame', () => {
  beforeEach(() => localStorage.clear());

  async function render(currentLessonId: string | null) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CourseFrame);
    fixture.componentRef.setInput('course', course);
    fixture.componentRef.setInput('currentLessonId', currentLessonId);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('opens the module of the current lesson and numbers lessons across the course', async () => {
    const { el } = await render('l3');
    const open = el.querySelectorAll('.module.is-open');
    expect(open).toHaveLength(1);
    expect(open[0].textContent).toContain('Módulo B');
    expect(el.querySelector('.lesson.is-selected .lesson-number')?.textContent).toContain('Aula 3');
    expect(el.querySelector('.lesson.is-selected a')?.getAttribute('aria-current')).toBe('page');
  });

  it('opens the first module when no lesson is selected and toggles modules', async () => {
    const { el, fixture } = await render(null);
    expect(el.querySelector('.module.is-open')?.textContent).toContain('Módulo A');
    el.querySelectorAll<HTMLButtonElement>('.module-header')[1].click();
    await fixture.whenStable();
    expect(el.querySelectorAll('.module.is-open')).toHaveLength(2);
  });

  it('collapses the sidebar and remembers the choice', async () => {
    const { el, fixture } = await render(null);
    el.querySelector<HTMLButtonElement>('[aria-label="Recolher menu"]')!.click();
    await fixture.whenStable();
    expect(el.classList).toContain('is-collapsed');
    expect(el.querySelector('.nav')).toBeNull();
    expect(localStorage.getItem('cp.course-sidebar-collapsed')).toBe('1');
    el.querySelector<HTMLButtonElement>('[aria-label="Expandir menu"]')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.nav')).not.toBeNull();
  });
});

describe('CourseFrame mobile drawer', () => {
  beforeEach(() => localStorage.clear());

  it('opens the outline as a drawer and closes it with Escape or a lesson link', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', children: [] }])] });
    const fixture = TestBed.createComponent(CourseFrame);
    fixture.componentRef.setInput('course', course);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const trigger = el.querySelector<HTMLButtonElement>('.drawer-trigger')!;
    expect(trigger.textContent).toContain('33%');

    trigger.click();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('.sidebar')?.classList).toContain('is-drawer-open');
    // Focus moving into the drawer and back to the trigger is asserted in e2e/mobile.spec.ts (real browser).
    expect(el.querySelector('[aria-label="Fechar conteúdo do curso"]')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(el.querySelector('.sidebar')?.classList).not.toContain('is-drawer-open');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    await fixture.whenStable();
    el.querySelector<HTMLAnchorElement>('.lesson-link')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.backdrop')).toBeNull();
  });

  it('shows the full outline in the drawer even when the desktop sidebar is collapsed', async () => {
    localStorage.setItem('cp.course-sidebar-collapsed', '1');
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CourseFrame);
    fixture.componentRef.setInput('course', course);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.nav')).toBeNull();
    el.querySelector<HTMLButtonElement>('.drawer-trigger')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.nav')).not.toBeNull();
  });
});
