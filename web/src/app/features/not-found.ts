import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../shared/components/empty-state';

@Component({
  selector: 'cp-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyState],
  template: `
    <cp-empty-state icon="ri-signpost-line" title="Página não encontrada"
      text="O endereço pode estar errado ou a página foi removida.">
      <a routerLink="/home" class="btn btn-primary">Ir para o início</a>
    </cp-empty-state>
  `,
})
export class NotFound {}
