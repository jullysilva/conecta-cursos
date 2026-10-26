import { ChangeDetectionStrategy, Component, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AdminCourseDetail, AdminLesson, AdminModule } from '../../../core/models/admin.models';
import { formatDuration } from '../../../shared/utils/format';
import { errorMessage } from '../../../shared/utils/http-error';
import { LessonDialog, LessonDialogResult } from './lesson-dialog';

const PROVIDER_LABEL = { YOUTUBE: 'YouTube', VIMEO: 'Vimeo', PANDA: 'Panda', URL: 'Arquivo' } as const;

function moved<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/** Modules and lessons tree of a course, with create/edit/delete/reorder. */
@Component({
  selector: 'cp-course-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LessonDialog],
  templateUrl: './course-content.html',
  styleUrl: './course-content.scss',
})
export class CourseContent {
  private readonly api = inject(AdminApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly course = input.required<AdminCourseDetail>();
  readonly changed = output<void>();

  private readonly lessonDialog = viewChild.required(LessonDialog);
  protected readonly newModuleTitle = signal('');
  protected readonly editingModuleId = signal<string | null>(null);
  protected readonly editingTitle = signal('');
  protected readonly busy = signal(false);

  protected lessonMeta(lesson: AdminLesson): string {
    const provider = PROVIDER_LABEL[lesson.videoProvider];
    return lesson.durationSec ? `${provider}, ${formatDuration(lesson.durationSec)}` : provider;
  }

  protected addModule(): void {
    const title = this.newModuleTitle().trim();
    if (title.length < 2) return;
    this.run(this.api.createModule(this.course().id, title), 'Módulo adicionado.', () =>
      this.newModuleTitle.set(''),
    );
  }

  protected startRename(module: AdminModule): void {
    this.editingModuleId.set(module.id);
    this.editingTitle.set(module.title);
  }

  protected saveRename(module: AdminModule): void {
    const title = this.editingTitle().trim();
    this.editingModuleId.set(null);
    if (title.length < 2 || title === module.title) return;
    this.run(this.api.updateModule(module.id, title), 'Módulo renomeado.');
  }

  protected async removeModule(module: AdminModule): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Excluir módulo?',
      message: `"${module.title}" e suas ${module.lessons.length} aulas serão excluídos.`,
      confirmLabel: 'Excluir módulo',
      danger: true,
    });
    if (confirmed) this.run(this.api.deleteModule(module.id), 'Módulo excluído.');
  }

  protected moveModule(index: number, direction: -1 | 1): void {
    const ids = moved(this.course().modules, index, index + direction).map((module) => module.id);
    this.run(this.api.reorderModules(this.course().id, ids));
  }

  protected moveLesson(module: AdminModule, index: number, direction: -1 | 1): void {
    const ids = moved(module.lessons, index, index + direction).map((lesson) => lesson.id);
    this.run(this.api.reorderLessons(module.id, ids));
  }

  protected openLesson(module: AdminModule, lesson?: AdminLesson): void {
    this.lessonDialog().open(module.id, lesson);
  }

  protected saveLesson(result: LessonDialogResult): void {
    const request = result.lessonId
      ? this.api.updateLesson(result.lessonId, result.payload)
      : this.api.createLesson(result.moduleId, result.payload);
    this.run(request, result.lessonId ? 'Aula salva.' : 'Aula adicionada.');
  }

  protected async removeLesson(lesson: AdminLesson): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Excluir aula?',
      message: `"${lesson.title}" e o progresso dos alunos nela serão excluídos.`,
      confirmLabel: 'Excluir aula',
      danger: true,
    });
    if (confirmed) this.run(this.api.deleteLesson(lesson.id), 'Aula excluída.');
  }

  private run(request: Observable<unknown>, success?: string, after?: () => void): void {
    this.busy.set(true);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        if (success) this.toast.success(success);
        after?.();
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.toast.error(errorMessage(error));
      },
    });
  }
}
