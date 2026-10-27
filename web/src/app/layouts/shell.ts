import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { initials } from '../shared/utils/format';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  exact?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Visão geral', icon: 'ri-dashboard-3-line', link: '/adm', exact: true },
  { label: 'Cursos', icon: 'ri-book-open-line', link: '/adm/cursos' },
  { label: 'Categorias', icon: 'ri-price-tag-3-line', link: '/adm/categorias' },
  { label: 'Trilhas', icon: 'ri-route-line', link: '/adm/trilhas' },
  { label: 'Banners', icon: 'ri-image-line', link: '/adm/banners' },
  { label: 'Usuários', icon: 'ri-team-line', link: '/adm/usuarios' },
];

/** Admin frame: navigation rail + routed content. The student area uses MovaLayout. */
@Component({
  selector: 'cp-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly nav = ADMIN_NAV;
  protected readonly userInitials = computed(() => initials(this.auth.user()?.name ?? ''));
}
