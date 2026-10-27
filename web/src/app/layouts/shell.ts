import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { initials } from '../shared/utils/format';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  exact?: boolean;
}

const STUDENT_NAV: NavItem[] = [
  { label: 'Início', icon: 'ri-home-5-line', link: '/home' },
  { label: 'Trilhas', icon: 'ri-route-line', link: '/trilhas' },
  { label: 'Meu progresso', icon: 'ri-user-3-line', link: '/perfil' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Visão geral', icon: 'ri-dashboard-3-line', link: '/adm', exact: true },
  { label: 'Cursos', icon: 'ri-book-open-line', link: '/adm/cursos' },
  { label: 'Categorias', icon: 'ri-price-tag-3-line', link: '/adm/categorias' },
  { label: 'Trilhas', icon: 'ri-route-line', link: '/adm/trilhas' },
  { label: 'Banners', icon: 'ri-image-line', link: '/adm/banners' },
  { label: 'Usuários', icon: 'ri-team-line', link: '/adm/usuarios' },
];

/** Application frame: navigation rail + routed content, for both student and admin areas. */
@Component({
  selector: 'cp-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly isAdminArea = this.route.snapshot.data['area'] === 'admin';
  protected readonly nav = this.isAdminArea ? ADMIN_NAV : STUDENT_NAV;
  protected readonly userInitials = computed(() => initials(this.auth.user()?.name ?? ''));
}
