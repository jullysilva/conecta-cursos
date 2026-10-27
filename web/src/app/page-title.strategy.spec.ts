import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { Component } from '@angular/core';
import { PageTitleStrategy } from './page-title.strategy';

@Component({ template: '' })
class Blank {}

describe('PageTitleStrategy', () => {
  it('suffixes page titles with the brand and falls back to the brand alone', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'cursos', title: 'Cursos', component: Blank },
          { path: 'sem-titulo', component: Blank },
        ]),
        { provide: TitleStrategy, useClass: PageTitleStrategy },
      ],
    });
    const router = TestBed.inject(Router);
    const title = TestBed.inject(Title);

    await router.navigateByUrl('/cursos');
    expect(title.getTitle()).toBe('Cursos | Conecta Cursos');
    await router.navigateByUrl('/sem-titulo');
    expect(title.getTitle()).toBe('Conecta Cursos');
  });
});
