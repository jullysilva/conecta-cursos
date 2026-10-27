import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import type { AdminCourseDetail } from '../../core/models/admin.models';
import { CourseList } from './courses/course-list';
import { CourseEditor } from './courses/course-editor';
import { CourseContent } from './courses/course-content';
import { Categories } from './categories';
import { Dashboard } from './dashboard';
import { UserEdit } from './users/user-edit';

const detail: AdminCourseDetail = {
  id: 'c1', title: 'Curso', slug: 'curso', description: '', thumbnailUrl: null, workloadHours: 1,
  published: false, featured: false, categoryId: null, updatedAt: '2026-10-01',
  modules: [
    { id: 'm1', courseId: 'c1', title: 'Módulo A', position: 0, lessons: [
      { id: 'l1', moduleId: 'm1', title: 'Aula 1', description: '', videoProvider: 'YOUTUBE', videoRef: '', durationSec: 0, materialUrl: null, position: 0 },
      { id: 'l2', moduleId: 'm1', title: 'Aula 2', description: '', videoProvider: 'URL', videoRef: 'x', durationSec: 75, materialUrl: null, position: 1 },
    ] },
    { id: 'm2', courseId: 'c1', title: 'Módulo B', position: 1, lessons: [] },
  ],
};

function setup(confirmAnswer = true) {
  const api = {
    dashboard: vi.fn(() => of({ students: 3, admins: 1, courses: 2, publishedCourses: 1, lessons: 9,
      completionsLast30Days: 12, activeStudentsLast30Days: 2, topCourses: [{ id: 'c1', title: 'Curso', enrollments: 2 }] })),
    courses: vi.fn(() => of({ items: [{ ...detail, _count: { modules: 2, enrollments: 0 } }], total: 1, page: 1, pageSize: 20 })),
    deleteCourse: vi.fn(() => of(undefined)),
    categories: vi.fn(() => of([{ id: 'cat', name: 'Gestão', slug: 'gestao', position: 0, _count: { courses: 1 } }])),
    createCategory: vi.fn(() => of({})),
    updateCategory: vi.fn(() => of({})),
    course: vi.fn(() => of(detail)),
    createCourse: vi.fn(() => of({ ...detail, id: 'new-id' })),
    updateCourse: vi.fn(() => of(detail)),
    createModule: vi.fn(() => of({})),
    reorderModules: vi.fn(() => of(undefined)),
    reorderLessons: vi.fn(() => of(undefined)),
    deleteLesson: vi.fn(() => of(undefined)),
    user: vi.fn(() => of({ id: 'me', name: 'Admin', email: 'a@x.com', role: 'ADMIN', active: true, createdAt: '', enrollments: [] })),
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AdminApiService, useValue: api },
      { provide: ConfirmService, useValue: { ask: vi.fn(async () => confirmAnswer) } },
      { provide: AuthService, useValue: { user: () => ({ id: 'me' }) } },
    ],
  });
  return api;
}

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('Dashboard', () => {
  it('shows metrics and the top courses', async () => {
    setup();
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.lead dd')?.textContent).toContain('12');
    expect(fixture.nativeElement.textContent).toContain('2 alunos');
  });
});

describe('CourseList', () => {
  it('searches with debounce and resets to the first page', async () => {
    const api = setup();
    const fixture = TestBed.createComponent(CourseList);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('#course-search') as HTMLInputElement;
    input.value = 'lider';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(api.courses).not.toHaveBeenLastCalledWith(expect.objectContaining({ search: 'lider' }));
    await new Promise((resolve) => setTimeout(resolve, 350));
    await fixture.whenStable();
    expect(api.courses).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: 'lider' });
  });

  it('deletes a course only after confirmation', async () => {
    const api = setup();
    const fixture = TestBed.createComponent(CourseList);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('button[title=Excluir]') as HTMLButtonElement).click();
    await flush();
    expect(api.deleteCourse).toHaveBeenCalledWith('c1');
  });
});

describe('CourseEditor', () => {
  it('validates and creates a new course, then opens its editor', async () => {
    const api = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CourseEditor);
    fixture.componentRef.setInput('id', 'novo');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('button[type=submit]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(api.createCourse).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Informe um título');

    const title = el.querySelector('#title') as HTMLInputElement;
    title.value = 'Novo curso';
    title.dispatchEvent(new Event('input'));
    (el.querySelector('button[type=submit]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(api.createCourse).toHaveBeenCalledWith(expect.objectContaining({ title: 'Novo curso', categoryId: null, thumbnailUrl: null }));
    expect(navigate).toHaveBeenCalledWith(['/adm/cursos/edit', 'new-id'], { replaceUrl: true });
  });

  it('loads an existing course into the form and its content tree', async () => {
    setup();
    const fixture = TestBed.createComponent(CourseEditor);
    fixture.componentRef.setInput('id', 'c1');
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('#title') as HTMLInputElement).value).toBe('Curso');
    expect(fixture.nativeElement.querySelector('cp-course-content')).not.toBeNull();
  });
});

describe('CourseContent', () => {
  async function render() {
    const api = setup();
    const fixture = TestBed.createComponent(CourseContent);
    fixture.componentRef.setInput('course', detail);
    const changed = vi.fn();
    fixture.componentInstance.changed.subscribe(changed);
    await fixture.whenStable();
    return { api, fixture, el: fixture.nativeElement as HTMLElement, changed };
  }

  it('flags lessons without video and formats duration', async () => {
    const { el } = await render();
    const metas = Array.from(el.querySelectorAll('.lesson-meta')).map((node) => node.textContent?.trim());
    expect(metas[0]).toContain('Sem vídeo');
    expect(metas[1]).toBe('Arquivo, 1:15');
  });

  it('reorders modules and lessons with the full id list', async () => {
    const { api, el, changed } = await render();
    (el.querySelector('[aria-label="Mover módulo Módulo A para baixo"]') as HTMLButtonElement).click();
    expect(api.reorderModules).toHaveBeenCalledWith('c1', ['m2', 'm1']);
    (el.querySelector('[aria-label="Mover aula Aula 2 para cima"]') as HTMLButtonElement).click();
    expect(api.reorderLessons).toHaveBeenCalledWith('m1', ['l2', 'l1']);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('adds a module from the inline form', async () => {
    const { api, el, fixture } = await render();
    const input = el.querySelector('#new-module') as HTMLInputElement;
    input.value = 'Módulo C';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    (el.querySelector('.new-module button') as HTMLButtonElement).click();
    expect(api.createModule).toHaveBeenCalledWith('c1', 'Módulo C');
  });

  it('deletes a lesson after confirmation', async () => {
    const { api, el } = await render();
    (el.querySelector('[aria-label="Excluir aula Aula 1"]') as HTMLButtonElement).click();
    await flush();
    expect(api.deleteLesson).toHaveBeenCalledWith('l1');
  });
});

describe('Categories', () => {
  it('creates a category at the end of the list', async () => {
    const api = setup();
    const fixture = TestBed.createComponent(Categories);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const input = el.querySelector('#category-name') as HTMLInputElement;
    input.value = 'Vendas';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    (el.querySelector('form button') as HTMLButtonElement).click();
    expect(api.createCategory).toHaveBeenCalledWith({ name: 'Vendas', position: 1 });
  });

  it('rejects names that are too short when renaming', async () => {
    const api = setup();
    const fixture = TestBed.createComponent(Categories);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('#name-cat') as HTMLInputElement;
    input.value = 'x';
    input.dispatchEvent(new Event('change'));
    expect(api.updateCategory).not.toHaveBeenCalled();
  });
});

describe('UserEdit', () => {
  it('prevents admins from demoting, deactivating or deleting themselves', async () => {
    setup();
    const fixture = TestBed.createComponent(UserEdit);
    fixture.componentRef.setInput('id', 'me');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect((el.querySelector('#user-role') as HTMLSelectElement).disabled).toBe(true);
    expect(el.textContent).toContain('Você não pode alterar o próprio perfil.');
    expect(el.textContent).not.toContain('Excluir usuário');
  });
});
