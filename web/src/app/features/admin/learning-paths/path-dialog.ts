import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { AdminLearningPath, CourseOption } from '../../../core/models/admin.models';

export interface PathDialogResult {
  id: string | null;
  payload: Omit<AdminLearningPath, 'id'>;
}

@Component({
  selector: 'cp-path-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <dialog #dialog class="modal" aria-labelledby="path-dialog-title">
      <form class="modal-body" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h2 id="path-dialog-title">{{ pathId() ? 'Editar trilha' : 'Nova trilha' }}</h2>
        <div class="field">
          <label for="path-title">Título</label>
          <input id="path-title" class="input" formControlName="title" />
          @if (form.controls.title.touched && form.controls.title.invalid) {
            <span class="error">Informe um título com 3 a 160 caracteres.</span>
          }
        </div>
        <div class="field">
          <label for="path-description">Descrição</label>
          <textarea id="path-description" class="input" formControlName="description" rows="2"></textarea>
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="path-thumb">Imagem (URL)</label>
            <input id="path-thumb" class="input" type="url" formControlName="thumbnailUrl" placeholder="https://" />
          </div>
          <div class="field">
            <label for="path-position">Ordem</label>
            <input id="path-position" class="input" type="number" min="0" formControlName="position" />
          </div>
        </div>
        <label class="check"><input type="checkbox" formControlName="published" /> Publicada</label>

        <fieldset class="courses">
          <legend>Cursos da trilha, na ordem em que serão feitos</legend>
          <ol>
            @for (id of selected(); track id; let i = $index; let first = $first; let last = $last) {
              <li>
                <span>{{ i + 1 }}. {{ titleOf(id) }}</span>
                <button type="button" class="btn btn-ghost btn-icon" [disabled]="first" (click)="move(i, -1)" [attr.aria-label]="'Mover ' + titleOf(id) + ' para cima'">
                  <i class="ri-arrow-up-s-line" aria-hidden="true"></i>
                </button>
                <button type="button" class="btn btn-ghost btn-icon" [disabled]="last" (click)="move(i, 1)" [attr.aria-label]="'Mover ' + titleOf(id) + ' para baixo'">
                  <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
                </button>
                <button type="button" class="btn btn-ghost btn-icon" (click)="toggle(id)" [attr.aria-label]="'Remover ' + titleOf(id)">
                  <i class="ri-close-line" aria-hidden="true"></i>
                </button>
              </li>
            }
          </ol>
          <label class="sr-only" for="path-add-course">Adicionar curso</label>
          <select id="path-add-course" class="input" (change)="add($any($event.target))">
            <option value="">Adicionar curso…</option>
            @for (course of available(); track course.id) {
              <option [value]="course.id">{{ course.title }}{{ course.published ? '' : ' (rascunho)' }}</option>
            }
          </select>
        </fieldset>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" (click)="close()">Cancelar</button>
          <button type="submit" class="btn btn-primary">{{ pathId() ? 'Salvar trilha' : 'Criar trilha' }}</button>
        </div>
      </form>
    </dialog>
  `,
  styles: `
    .courses { display: grid; gap: 0.5rem; margin: 0; padding: 0; border: 0; }
    legend { margin-bottom: 0.5rem; padding: 0; font-weight: 600; font-size: 0.9375rem; }
    ol { display: grid; gap: 0.25rem; margin: 0; padding: 0; list-style: none; }
    li { display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.25rem 0.25rem 0.75rem;
      border: 1px solid var(--line); border-radius: var(--radius-sm); }
    li span { flex: 1; }
  `,
})
export class PathDialog {
  readonly courses = input.required<CourseOption[]>();
  readonly saved = output<PathDialogResult>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly pathId = signal<string | null>(null);
  protected readonly selected = signal<string[]>([]);
  protected readonly available = computed(() =>
    this.courses().filter((course) => !this.selected().includes(course.id)),
  );

  protected readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
    description: [''],
    thumbnailUrl: [''],
    position: [0],
    published: [false],
  });

  open(path?: AdminLearningPath): void {
    this.pathId.set(path?.id ?? null);
    this.selected.set(path?.courseIds ?? []);
    this.form.reset({
      title: path?.title ?? '',
      description: path?.description ?? '',
      thumbnailUrl: path?.thumbnailUrl ?? '',
      position: path?.position ?? 0,
      published: path?.published ?? false,
    });
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected titleOf(id: string): string {
    return this.courses().find((course) => course.id === id)?.title ?? 'Curso';
  }

  protected add(select: HTMLSelectElement): void {
    if (select.value) this.selected.update((list) => [...list, select.value]);
    select.value = '';
  }

  protected toggle(id: string): void {
    this.selected.update((list) => list.filter((item) => item !== id));
  }

  protected move(index: number, direction: -1 | 1): void {
    this.selected.update((list) => {
      const copy = [...list];
      [copy[index], copy[index + direction]] = [copy[index + direction], copy[index]];
      return copy;
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({
      id: this.pathId(),
      payload: {
        ...value,
        title: value.title.trim(),
        thumbnailUrl: value.thumbnailUrl.trim() || null,
        position: Number(value.position),
        courseIds: this.selected(),
      },
    });
    this.close();
  }
}
