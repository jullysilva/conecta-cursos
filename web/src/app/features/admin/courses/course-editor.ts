import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import type { CoursePayload } from '../../../core/models/admin.models';
import { errorMessage } from '../../../shared/utils/http-error';
import { CourseContent } from './course-content';
import { valueOf } from '../../../shared/utils/resource';

export const NEW_ID = 'novo';
const URL_PATTERN = /^https?:\/\/.+/i;

@Component({
  selector: 'cp-course-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, CourseContent],
  templateUrl: './course-editor.html',
  styles: `
    .layout { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: 1.5rem; align-items: start; }
    .details { display: grid; gap: 1.25rem; padding: 1.5rem; }
    .flags { display: flex; gap: 1.5rem; }
    .back { display: inline-flex; gap: 0.375rem; font-weight: 600; text-decoration: none; }
    .save { justify-self: start; }
    @media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } }
  `,
})
export class CourseEditor {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();
  protected readonly isNew = computed(() => this.id() === NEW_ID);
  protected readonly saving = signal(false);

  protected readonly course = rxResource({
    params: () => (this.isNew() ? undefined : this.id()),
    stream: ({ params }) => this.api.course(params),
  });
  protected readonly categories = rxResource({ stream: () => this.api.categories() });

  protected readonly form = inject(FormBuilder).group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
    description: ['', Validators.maxLength(5000)],
    categoryId: [null as string | null],
    thumbnailUrl: ['', Validators.pattern(URL_PATTERN)],
    workloadHours: [0, [Validators.min(0)]],
    published: [false],
    featured: [false],
  });

  constructor() {
    effect(() => {
      const course = valueOf(this.course);
      if (!course) return;
      this.form.reset({
        title: course.title,
        description: course.description,
        categoryId: course.categoryId,
        thumbnailUrl: course.thumbnailUrl ?? '',
        workloadHours: course.workloadHours,
        published: course.published,
        featured: course.featured,
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: CoursePayload = {
      title: value.title!.trim(),
      description: value.description ?? '',
      categoryId: value.categoryId || null,
      thumbnailUrl: value.thumbnailUrl?.trim() || null,
      workloadHours: Number(value.workloadHours ?? 0),
      published: Boolean(value.published),
      featured: Boolean(value.featured),
    };
    this.saving.set(true);
    const request = this.isNew()
      ? this.api.createCourse(payload)
      : this.api.updateCourse(this.id(), payload);
    request.subscribe({
      next: (course) => {
        this.saving.set(false);
        this.form.markAsPristine();
        if (this.isNew()) {
          this.toast.success('Curso criado. Agora adicione os módulos e as aulas.');
          void this.router.navigate(['/adm/cursos/edit', course.id], { replaceUrl: true });
        } else {
          this.toast.success('Curso salvo.');
        }
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.toast.error(errorMessage(error));
      },
    });
  }
}
