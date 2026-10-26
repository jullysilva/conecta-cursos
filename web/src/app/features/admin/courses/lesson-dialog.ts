import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { AdminLesson, AdminModule, LessonPayload } from '../../../core/models/admin.models';
import type { VideoProvider } from '../../../core/models/models';

const PROVIDER_HINTS: Record<VideoProvider, string> = {
  YOUTUBE: 'Cole o link do vídeo (youtube.com/watch?v=… ou youtu.be/…) ou só o ID.',
  VIMEO: 'Cole o link do vídeo (vimeo.com/123456) ou só o número.',
  PANDA: 'Cole o link de incorporação completo do player Panda.',
  URL: 'Endereço direto de um arquivo de vídeo (.mp4). Permite retomar de onde o aluno parou.',
};

export interface LessonDialogResult {
  lessonId: string | null;
  moduleId: string;
  payload: LessonPayload;
}

@Component({
  selector: 'cp-lesson-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <dialog #dialog class="modal" aria-labelledby="lesson-dialog-title" (close)="closed.emit()">
      <form class="modal-body" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h2 id="lesson-dialog-title">{{ lessonId() ? 'Editar aula' : 'Nova aula' }}</h2>
        <div class="field">
          <label for="lesson-title">Título</label>
          <input id="lesson-title" class="input" formControlName="title" />
          @if (form.controls.title.touched && form.controls.title.invalid) {
            <span class="error">Informe um título com 2 a 160 caracteres.</span>
          }
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="lesson-provider">Origem do vídeo</label>
            <select id="lesson-provider" class="input" formControlName="videoProvider">
              <option value="YOUTUBE">YouTube</option>
              <option value="VIMEO">Vimeo</option>
              <option value="PANDA">Panda Video</option>
              <option value="URL">Arquivo de vídeo</option>
            </select>
          </div>
          @if (lessonId()) {
            <div class="field">
              <label for="lesson-module">Módulo</label>
              <select id="lesson-module" class="input" formControlName="moduleId">
                @for (module of modules(); track module.id) {
                  <option [value]="module.id">{{ module.title }}</option>
                }
              </select>
            </div>
          }
          <div class="field span-2">
            <label for="lesson-video">Vídeo</label>
            <input id="lesson-video" class="input" formControlName="videoRef" aria-describedby="lesson-video-hint" />
            <span class="hint" id="lesson-video-hint">{{ hints[form.controls.videoProvider.value!] }}</span>
          </div>
          <fieldset class="field duration">
            <legend>Duração</legend>
            <label class="sr-only" for="lesson-min">Minutos</label>
            <input id="lesson-min" class="input" type="number" min="0" formControlName="minutes" /> <span>min</span>
            <label class="sr-only" for="lesson-sec">Segundos</label>
            <input id="lesson-sec" class="input" type="number" min="0" max="59" formControlName="seconds" /> <span>s</span>
          </fieldset>
          <div class="field">
            <label for="lesson-material">Material de apoio (URL)</label>
            <input id="lesson-material" class="input" type="url" formControlName="materialUrl" placeholder="https://" />
          </div>
          <div class="field span-2">
            <label for="lesson-description">Descrição</label>
            <textarea id="lesson-description" class="input" formControlName="description" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" (click)="close()">Cancelar</button>
          <button type="submit" class="btn btn-primary">{{ lessonId() ? 'Salvar aula' : 'Adicionar aula' }}</button>
        </div>
      </form>
    </dialog>
  `,
  styles: `
    .duration { display: flex; align-items: center; gap: 0.375rem; margin: 0; padding: 0; border: 0; }
    .duration legend { padding: 0; margin-bottom: 0.375rem; font-weight: 600; font-size: 0.9375rem; }
    .duration .input { width: 5rem; }
  `,
})
export class LessonDialog {
  readonly modules = input.required<AdminModule[]>();
  readonly saved = output<LessonDialogResult>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly hints = PROVIDER_HINTS;
  protected readonly lessonId = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    description: [''],
    videoProvider: ['YOUTUBE' as VideoProvider],
    videoRef: [''],
    minutes: [0, Validators.min(0)],
    seconds: [0, [Validators.min(0), Validators.max(59)]],
    materialUrl: ['', Validators.pattern(/^https?:\/\/.+/i)],
    moduleId: [''],
  });

  open(moduleId: string, lesson?: AdminLesson): void {
    this.lessonId.set(lesson?.id ?? null);
    this.form.reset({
      title: lesson?.title ?? '',
      description: lesson?.description ?? '',
      videoProvider: lesson?.videoProvider ?? 'YOUTUBE',
      videoRef: lesson?.videoRef ?? '',
      minutes: Math.floor((lesson?.durationSec ?? 0) / 60),
      seconds: (lesson?.durationSec ?? 0) % 60,
      materialUrl: lesson?.materialUrl ?? '',
      moduleId,
    });
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({
      lessonId: this.lessonId(),
      moduleId: value.moduleId,
      payload: {
        title: value.title.trim(),
        description: value.description,
        videoProvider: value.videoProvider,
        videoRef: value.videoRef.trim(),
        durationSec: Number(value.minutes) * 60 + Number(value.seconds),
        materialUrl: value.materialUrl.trim() || null,
        ...(this.lessonId() && { moduleId: value.moduleId }),
      },
    });
    this.close();
  }
}
