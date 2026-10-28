import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CarouselCourse, CourseCarousel, ItemsPerPage } from './course-carousel';
import { MovaBanner } from './mova-banner';
import type { Banner } from '../../../core/models/models';

const course = (n: number, progress?: number): CarouselCourse => ({
  id: `c${n}`, title: `Curso ${n}`, description: `Sobre o curso ${n}`, thumbnailUrl: n % 2 ? null : `https://img/${n}.jpg`,
  lessonsCount: n, workloadHours: 2, progress, link: ['/curso', `c${n}`],
});

@Component({
  imports: [CourseCarousel],
  template: `<cp-course-carousel title="Liderança" anchorId="lideranca" [courses]="courses()" [itemsPerPageConfig]="config" />`,
})
class CarouselHost {
  courses = signal<CarouselCourse[]>([1, 2, 3, 4, 5].map((n) => course(n)));
  config: ItemsPerPage = { tablet: 2, desktop: 2 };
}

describe('CourseCarousel', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CarouselHost);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('renders the anchored title, posters and placeholders', async () => {
    const { el } = await render();
    expect(el.querySelector('section')?.id).toBe('lideranca');
    expect(el.querySelector('h2')?.textContent).toContain('Liderança');
    expect(el.querySelectorAll('.slide')).toHaveLength(5);
    expect(el.querySelectorAll('img.image')).toHaveLength(2);
    expect(el.querySelectorAll('.image--placeholder')).toHaveLength(3);
  });

  it('pages with arrows and bullets, trimming the last page', async () => {
    const { el, fixture } = await render();
    const visible = () =>
      Array.from(el.querySelectorAll('.slide')).filter((slide) => slide.getAttribute('aria-hidden') === 'false').length;
    const prev = el.querySelector<HTMLButtonElement>('.arrow--prev')!;
    const next = el.querySelector<HTMLButtonElement>('.arrow--next')!;
    expect(el.querySelectorAll('.bullet')).toHaveLength(3);
    expect(prev.disabled).toBe(true);
    expect(visible()).toBe(2);

    el.querySelectorAll<HTMLButtonElement>('.bullet')[2].click();
    await fixture.whenStable();
    expect(next.disabled).toBe(true);
    // Last page shows the final two cards instead of a lone one.
    expect(el.querySelector('.track')?.getAttribute('style')).toContain('calc(-3 * (100% + 1rem) / 2)');
    expect(el.querySelectorAll('.slide')[4].getAttribute('aria-hidden')).toBe('false');
    expect(el.querySelectorAll('.slide')[3].getAttribute('aria-hidden')).toBe('false');

    prev.click();
    await fixture.whenStable();
    expect(el.querySelector('.bullet.is-active')).toBe(el.querySelectorAll('.bullet')[1]);
  });

  it('opens the course details on click and closes with Escape', async () => {
    const { el, fixture } = await render();
    const trigger = el.querySelector<HTMLButtonElement>('.trigger')!;
    trigger.click();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const info = el.querySelector('#info-c1')!;
    expect(info.textContent).toContain('Sobre o curso 1');
    expect(info.querySelector('a')?.textContent?.trim()).toBe('Iniciar');
    expect(info.querySelector('a')?.getAttribute('href')).toBe('/curso/c1');

    el.querySelector('cp-course-carousel')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows progress for the whole row once any course has started', async () => {
    const { el, fixture } = await render();
    expect(el.querySelectorAll('.progress')).toHaveLength(0);
    fixture.componentInstance.courses.set([course(1, 40), course(2)]);
    await fixture.whenStable();
    const labels = Array.from(el.querySelectorAll('.progress-label')).map((label) => label.textContent?.trim());
    expect(labels).toEqual(['40%', '0%']);
    expect(el.querySelector('#info-c1 a')?.textContent?.trim()).toBe('Continuar');
    expect(el.querySelector('.arrow')).toBeNull();
  });
});

describe('MovaBanner', () => {
  const banners: Banner[] = [
    { id: 'b1', title: 'Primeiro', subtitle: '', imageUrl: 'https://img/1.jpg', linkUrl: '/trilhas' },
    { id: 'b2', title: 'Segundo', subtitle: '', imageUrl: 'https://img/2.jpg', linkUrl: 'https://externo.com' },
    { id: 'b3', title: 'Terceiro', subtitle: '', imageUrl: 'https://img/3.jpg', linkUrl: null },
  ];

  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(MovaBanner);
    fixture.componentRef.setInput('slides', banners);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('renders internal, external and plain slides with alt text', async () => {
    const { el } = await render();
    const slides = el.querySelectorAll('.slide');
    expect(slides[0].querySelector('a')?.getAttribute('href')).toBe('/trilhas');
    expect(slides[1].querySelector('a')?.getAttribute('target')).toBe('_blank');
    expect(slides[2].querySelector('a')).toBeNull();
    expect(slides[2].querySelector('img')?.getAttribute('alt')).toBe('Terceiro');
  });

  it('wraps around with the arrows and jumps with bullets', async () => {
    const { el, fixture } = await render();
    const current = () => el.querySelector('.bullet.is-active')?.getAttribute('aria-label');
    el.querySelector<HTMLButtonElement>('.arrow--prev')!.click();
    await fixture.whenStable();
    expect(current()).toBe('Ir para banner 3');
    el.querySelector<HTMLButtonElement>('.arrow--next')!.click();
    await fixture.whenStable();
    expect(current()).toBe('Ir para banner 1');
    el.querySelectorAll<HTMLButtonElement>('.bullet')[1].click();
    await fixture.whenStable();
    expect(el.querySelectorAll('.slide')[1].getAttribute('aria-hidden')).toBe('false');
  });
});

describe('Touch paging', () => {
  const swipeLeft = (target: Element) => {
    const event = (type: string, x: number) =>
      Object.assign(new Event(type), { changedTouches: [{ clientX: x, clientY: 100 }] });
    target.dispatchEvent(event('touchstart', 300));
    target.dispatchEvent(event('touchend', 200));
  };

  afterEach(() => vi.unstubAllGlobals());

  it('shows two posters per page on phones and pages the carousel by swipe', async () => {
    vi.stubGlobal('innerWidth', 375);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CarouselHost);
    fixture.componentInstance.config = { tablet: 3, desktop: 4 };
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const visible = () => Array.from(el.querySelectorAll('.slide')).filter((slide) => slide.getAttribute('aria-hidden') === 'false');
    expect(visible()).toHaveLength(2);
    expect(el.querySelectorAll('.bullet')).toHaveLength(3);

    swipeLeft(el.querySelector('.viewport')!);
    await fixture.whenStable();
    expect(el.querySelector('.bullet.is-active')?.getAttribute('aria-label')).toBe('Ir para página 2');
  });

  it('moves the banner to the next slide on swipe', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(MovaBanner);
    fixture.componentRef.setInput('slides', [
      { id: 'b1', title: 'Um', imageUrl: 'https://img/1.jpg', linkUrl: null },
      { id: 'b2', title: 'Dois', imageUrl: 'https://img/2.jpg', linkUrl: null },
    ] as Banner[]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    swipeLeft(el.querySelector('.viewport')!);
    await fixture.whenStable();
    expect(el.querySelector('.bullet.is-active')?.getAttribute('aria-label')).toBe('Ir para banner 2');
  });
});
