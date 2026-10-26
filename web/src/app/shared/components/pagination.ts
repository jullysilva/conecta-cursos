import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'cp-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pages() > 1) {
      <nav aria-label="Paginação">
        <span>{{ total() }} registros, página {{ page() }} de {{ pages() }}</span>
        <button type="button" class="btn btn-secondary btn-icon" [disabled]="page() <= 1"
          (click)="pageChange.emit(page() - 1)" aria-label="Página anterior">
          <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
        </button>
        <button type="button" class="btn btn-secondary btn-icon" [disabled]="page() >= pages()"
          (click)="pageChange.emit(page() + 1)" aria-label="Próxima página">
          <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
        </button>
      </nav>
    }
  `,
  styles: `
    nav { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; padding: 0.75rem 1rem; }
    span { margin-right: 0.5rem; color: var(--ink-soft); font-size: 0.875rem; }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageChange = output<number>();
  protected readonly pages = computed(() => Math.ceil(this.total() / this.pageSize()));
}
