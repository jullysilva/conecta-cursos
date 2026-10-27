import { escapeHtml } from './escape-html.js';
import { slugify } from './slugify.js';
import { uniqueSlug } from './unique-slug.js';
import { generateToken, hashToken } from './token.js';

describe('slugify', () => {
  it.each([
    ['Gestão de Pessoas', 'gestao-de-pessoas'],
    ['  Olá, Mundo!!  ', 'ola-mundo'],
    ['C# & .NET 8', 'c-net-8'],
    ['---', ''],
  ])('%s -> %s', (input, expected) => expect(slugify(input)).toBe(expected));
});

describe('uniqueSlug', () => {
  it('appends a numeric suffix until the slug is free', async () => {
    const taken = new Set(['curso', 'curso-2']);
    expect(await uniqueSlug('Curso', async (slug) => taken.has(slug))).toBe('curso-3');
  });

  it('falls back to "item" when the title has no slug characters', async () => {
    expect(await uniqueSlug('!!!', async () => false)).toBe('item');
  });
});

describe('token', () => {
  it('generates unique url-safe tokens with a stable sha256 hash', () => {
    const [a, b] = [generateToken(), generateToken()];
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).toHaveLength(64);
  });
});

describe('escapeHtml', () => {
  it('neutralizes markup and attribute quotes', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>Tom & Jerry</a>`)).toBe(
      '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;Tom &amp; Jerry&lt;/a&gt;',
    );
  });

  it('keeps plain text and accents as they are', () => {
    expect(escapeHtml('Maria José')).toBe('Maria José');
  });
});
