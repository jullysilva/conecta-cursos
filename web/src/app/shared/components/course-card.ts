import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CourseCard as CourseCardModel } from '../../core/models/models';
import { CourseCover } from './course-cover';
import { ProgressRail } from './progress-rail';

@Component({
  selector: 'cp-course-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CourseCover, ProgressRail],
  template: `
    <a class="card" [routerLink]="['/curso', course().id]">
      <cp-course-cover [title]="course().title" [imageUrl]="course().thumbnailUrl" />
      <div class="body">
        <h3>{{ course().title }}</h3>
        <p class="meta">
          @if (course().workloadHours) {
            <span><i class="ri-time-line" aria-hidden="true"></i> {{ course().workloadHours }}h</span>
          }
          @if (course().progress; as progress) {
            <span>{{ progress.totalLessons }} aulas</span>
          }
        </p>
        @if (course().progress; as progress) {
          @if (progress.percent > 0) {
            <cp-progress-rail [percent]="progress.percent" [label]="'Progresso em ' + course().title" />
          }
        }
      </div>
    </a>
  `,
  styles: `
    :host { display: block; }
    .card { display: flex; flex-direction: column; height: 100%; overflow: hidden; color: inherit;
      text-decoration: none; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); }
    .card:hover h3 { color: var(--forest); }
    .body { display: grid; gap: 0.5rem; padding: 0.875rem 1rem 1rem; }
    h3 { font-size: 1rem; line-height: 1.3; }
    .meta { display: flex; gap: 0.875rem; color: var(--ink-faint); font-size: 0.875rem; }
    .meta i { vertical-align: -2px; }
  `,
})
export class CourseCard {
  readonly course = input.required<CourseCardModel>();
}
