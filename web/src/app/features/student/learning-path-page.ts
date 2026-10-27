import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../core/services/learning.service';
import { valueOf } from '../../shared/utils/resource';

/** Learning path detail: Mova course hero, then the courses as numbered steps. */
@Component({
  selector: 'cp-learning-path-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (path.error()) {
      <div class="mova-state">
        <h1>Trilha não encontrada</h1>
        <a routerLink="/trilhas" class="btn btn-primary">Ver todas as trilhas</a>
      </div>
    } @else if (path.hasValue() && path.value(); as path) {
      <nav class="mova-breadcrumb" aria-label="Trilha de navegação">
        <ol>
          <li><a routerLink="/home">Início</a></li>
          <li><a routerLink="/trilhas">Trilhas</a></li>
          <li><span aria-current="page">{{ path.title }}</span></li>
        </ol>
      </nav>
      <section class="hero" aria-label="Resumo da trilha"
        [style.background-image]="path.thumbnailUrl ? 'url(' + path.thumbnailUrl + ')' : null">
        <div class="hero-overlay">
          <span class="badge"><i class="ri-route-line" aria-hidden="true"></i> {{ path.courses.length }} cursos</span>
          <h1 class="hero-title">{{ path.title }}</h1>
          @if (path.description) {
            <p class="hero-text">{{ path.description }}</p>
          }
          <div class="progress">
            <div class="track" role="progressbar" aria-label="Progresso na trilha" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="overall()">
              <div class="fill" [style.width.%]="overall()"></div>
            </div>
            <span class="label">{{ overall() }}%</span>
          </div>
        </div>
      </section>

      <h2 class="mova-section-title">Cursos da trilha</h2>
      <ol class="steps">
        @for (course of path.courses; track course.id; let i = $index) {
          <li class="step" [class.is-done]="course.progress?.percent === 100">
            <span class="number" aria-hidden="true">{{ i + 1 }}</span>
            <a class="card" [routerLink]="['/curso', course.id]">
              <span class="thumb" aria-hidden="true">
                @if (course.thumbnailUrl) {
                  <img [src]="course.thumbnailUrl" alt="" loading="lazy" />
                } @else {
                  <i class="ri-image-line"></i>
                }
              </span>
              <span class="body">
                <span class="title">{{ course.title }}</span>
                <span class="desc">{{ course.description }}</span>
                <span class="progress">
                  <span class="track" role="progressbar" aria-valuemin="0" aria-valuemax="100"
                    [attr.aria-valuenow]="course.progress?.percent ?? 0" [attr.aria-label]="'Progresso em ' + course.title">
                    <span class="fill" [style.width.%]="course.progress?.percent ?? 0"></span>
                  </span>
                  <span class="label">{{ course.progress?.percent ?? 0 }}%</span>
                </span>
              </span>
            </a>
          </li>
        } @empty {
          <li class="empty">Esta trilha ainda não tem cursos publicados.</li>
        }
      </ol>
    } @else {
      <p class="mova-state" role="status">Carregando trilha…</p>
    }
  `,
  styles: `
    :host { display: block; max-width: 1100px; }
    .hero { overflow: hidden; margin-bottom: 2rem; border-radius: 12px; background: var(--mova-bg) center / cover;
      background-image: radial-gradient(118% 150% at 10% 118%, color-mix(in srgb, var(--mova-accent) 30%, transparent) 0%, transparent 62%); }
    .hero-overlay { display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; gap: 0.875rem; min-height: 240px;
      padding: 1.5rem; background: linear-gradient(180deg, rgb(0 0 0 / 30%), rgb(0 0 0 / 80%)); }
    .badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; border: 1px solid rgb(251 251 251 / 15%);
      border-radius: 999px; background: rgb(0 0 0 / 70%); font-size: 0.8rem; font-weight: 600; }
    .badge i { color: #9d8cf2; }
    .hero-title { font-size: 2rem; font-weight: 800; line-height: 1.1; letter-spacing: 0; }
    .hero-text { max-width: 70ch; color: var(--mova-white-hover); }
    .progress { display: flex; align-items: center; gap: 0.75rem; width: 100%; max-width: 520px; }
    .track { flex: 1; display: block; height: 6px; overflow: hidden; border-radius: 999px; background: rgb(251 251 251 / 15%); }
    .fill { display: block; height: 100%; border-radius: inherit; background: var(--mova-green); }
    .label { min-width: 36px; font-size: 0.8rem; font-weight: 700; text-align: right; }
    .steps { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; }
    .step { display: grid; grid-template-columns: 2.5rem 1fr; gap: 1rem; align-items: center; }
    .number { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border: 2px solid #3d3d3d; border-radius: 50%;
      background: var(--mova-min); font-weight: 800; }
    .step.is-done .number { border-color: var(--mova-green); background: var(--mova-green); }
    .card { display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid rgb(251 251 251 / 8%); border-radius: 16px;
      background: var(--mova-black); color: inherit; text-decoration: none; transition: transform 0.2s ease, border-color 0.2s ease; }
    .card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--mova-accent) 45%, transparent); }
    .thumb { display: grid; place-items: center; flex-shrink: 0; width: 80px; aspect-ratio: 2 / 3; overflow: hidden; border-radius: 10px;
      background: rgb(251 251 251 / 6%); color: var(--mova-white-hover); font-size: 1.4rem; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .body { display: flex; flex: 1; flex-direction: column; gap: 0.4rem; min-width: 0; }
    .title { font-weight: 700; }
    .desc { color: var(--mova-white-hover); font-size: 0.875rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .empty { color: var(--mova-white-hover); }
  `,
})
export class LearningPathPage {
  private readonly learning = inject(LearningService);
  readonly idPath = input.required<string>();

  protected readonly path = rxResource({
    params: () => this.idPath(),
    stream: ({ params }) => this.learning.learningPath(params),
  });

  protected readonly overall = computed(() => {
    const courses = valueOf(this.path)?.courses ?? [];
    const total = courses.reduce((sum, course) => sum + (course.progress?.totalLessons ?? 0), 0);
    const done = courses.reduce((sum, course) => sum + (course.progress?.completedLessons ?? 0), 0);
    return total ? Math.round((done / total) * 100) : 0;
  });
}
