import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { LearningService } from '../core/services/learning.service';
import { MovaLayout } from './mova-layout';

describe('MovaLayout', () => {
  async function render(isAdmin = false) {
    const logout = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: () => ({ name: 'Ana', email: 'ana@x.com' }), isAdmin: () => isAdmin, logout } },
        {
          provide: LearningService,
          useValue: {
            categories: () => of([{ id: 'c', name: 'Gestão', slug: 'gestao', courses: [] }]),
            summary: () => of({ courses: [
              { progress: { totalLessons: 4, completedLessons: 1, percent: 25 } },
              { progress: { totalLessons: 6, completedLessons: 6, percent: 100 } },
            ] }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MovaLayout);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, logout };
  }

  it('links categories as home anchors and shows overall progress', async () => {
    const { el } = await render();
    expect(el.querySelector('a[href="/home#gestao"]')?.textContent).toContain('Gestão');
    expect(el.querySelector('.level-track')?.getAttribute('aria-valuenow')).toBe('70');
    expect(el.querySelector('.level-percent')?.textContent).toContain('70%');
  });

  it('opens the profile menu, shows admin entry only for admins and logs out', async () => {
    const student = await render();
    const avatar = student.el.querySelector<HTMLButtonElement>('.avatar')!;
    avatar.click();
    await student.fixture.whenStable();
    expect(avatar.getAttribute('aria-expanded')).toBe('true');
    expect(student.el.querySelector('[role=menu]')?.textContent).not.toContain('Administração');
    student.el.querySelector<HTMLButtonElement>('[role=menu] button')!.click();
    expect(student.logout).toHaveBeenCalled();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await student.fixture.whenStable();
    expect(student.el.querySelector('[role=menu]')).toBeNull();

    TestBed.resetTestingModule();
    const admin = await render(true);
    admin.el.querySelector<HTMLButtonElement>('.avatar')!.click();
    await admin.fixture.whenStable();
    expect(admin.el.querySelector('[role=menu]')?.textContent).toContain('Administração');
    document.body.click();
    await admin.fixture.whenStable();
    expect(admin.el.querySelector('[role=menu]')).toBeNull();
  });
});
