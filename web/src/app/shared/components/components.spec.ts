import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialog } from './confirm-dialog';
import { CourseCover } from './course-cover';
import { Pagination } from './pagination';
import { ProgressRail } from './progress-rail';
import { CourseCard } from './course-card';
import { BrandMark } from './brand-mark';

describe('ProgressRail', () => {
  it('clamps and exposes the value to assistive tech', async () => {
    const fixture = TestBed.createComponent(ProgressRail);
    fixture.componentRef.setInput('percent', 142.4);
    fixture.componentRef.setInput('label', 'Progresso no curso');
    await fixture.whenStable();
    const bar: HTMLElement = fixture.nativeElement.querySelector('[role=progressbar]');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    expect(bar.getAttribute('aria-label')).toBe('Progresso no curso');
    expect(fixture.nativeElement.textContent).toContain('100%');
  });
});

describe('CourseCover', () => {
  it('renders the image when present, otherwise a monogram', async () => {
    const fixture = TestBed.createComponent(CourseCover);
    fixture.componentRef.setInput('title', 'Gestão de Pessoas');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.generated').dataset.monogram).toBe('GP');
    fixture.componentRef.setInput('imageUrl', 'https://img/x.png');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('https://img/x.png');
  });
});

describe('CourseCard', () => {
  it('links to the course and shows progress only once started', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CourseCard);
    const course = { id: 'c1', title: 'Curso', slug: 'curso', description: '', thumbnailUrl: null, workloadHours: 3,
      progress: { totalLessons: 4, completedLessons: 0, percent: 0 } };
    fixture.componentRef.setInput('course', course);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/curso/c1');
    expect(fixture.nativeElement.querySelector('cp-progress-rail')).toBeNull();
    fixture.componentRef.setInput('course', { ...course, progress: { totalLessons: 4, completedLessons: 1, percent: 25 } });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('cp-progress-rail')).not.toBeNull();
  });
});

describe('Pagination', () => {
  @Component({
    imports: [Pagination],
    template: `<cp-pagination [page]="page()" [pageSize]="10" [total]="total()" (pageChange)="page.set($event)" />`,
  })
  class Host {
    page = signal(1);
    total = signal(25);
  }

  it('navigates between pages and disables the edges', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [prev, next] = fixture.nativeElement.querySelectorAll('button');
    expect(prev.disabled).toBe(true);
    next.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.page()).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('página 2 de 3');
  });

  it('hides itself when everything fits in one page', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.total.set(5);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });
});

describe('ConfirmDialog', () => {
  beforeAll(() => {
    // jsdom does not implement <dialog> methods.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
  });

  it('resolves the promise with the chosen answer', async () => {
    const fixture = TestBed.createComponent(ConfirmDialog);
    const confirm = TestBed.inject(ConfirmService);
    const answer = confirm.ask({ title: 'Excluir?', message: 'Tem certeza?', confirmLabel: 'Excluir', danger: true });
    await fixture.whenStable();
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(fixture.nativeElement.textContent).toContain('Tem certeza?');
    buttons.find((button) => button.textContent?.trim() === 'Excluir')!.click();
    await expect(answer).resolves.toBe(true);
    expect(confirm.pending()).toBeNull();
  });
});

describe('ToastService', () => {
  it('adds and auto-dismisses toasts', () => {
    vi.useFakeTimers();
    const toasts = TestBed.inject(ToastService);
    toasts.success('Salvo');
    toasts.error('Falhou');
    expect(toasts.toasts().map((toast) => toast.kind)).toEqual(['success', 'error']);
    vi.advanceTimersByTime(4000);
    expect(toasts.toasts()).toEqual([]);
    vi.useRealTimers();
  });
});

describe('BrandMark', () => {
  it('shows the decorative symbol at the requested size with the brand name as text', async () => {
    const fixture = TestBed.createComponent(BrandMark);
    fixture.componentRef.setInput('size', 32);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const img = el.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('brand/symbol-96.png');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('width')).toBe('32');
    expect(el.querySelector('.name')?.textContent?.trim()).toBe('Conecta Cursos');
  });

  it('can render the symbol alone', async () => {
    const fixture = TestBed.createComponent(BrandMark);
    fixture.componentRef.setInput('showName', false);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.name')).toBeNull();
  });
});
