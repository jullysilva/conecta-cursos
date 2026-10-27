import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const catalog = [
  {
    category: 'Liderança',
    courses: [
      { title: 'Fundamentos da Liderança', featured: true, modules: ['Papel do líder', 'Comunicação', 'Feedback'] },
      { title: 'Gestão de Equipes de Alta Performance', modules: ['Metas', 'Rituais de gestão'] },
    ],
  },
  {
    category: 'Atendimento',
    courses: [
      { title: 'Excelência no Atendimento ao Cliente', modules: ['Primeiro contato', 'Resolução de conflitos'] },
      { title: 'Vendas Consultivas', modules: ['Descoberta', 'Negociação', 'Fechamento'] },
    ],
  },
  {
    category: 'Tecnologia',
    courses: [{ title: 'Produtividade com Planilhas', modules: ['Fórmulas', 'Tabelas dinâmicas'] }],
  },
];

/** Poster (2:3) placeholder image, stable per course. */
const posterUrl = (slug: string) => `https://picsum.photos/seed/${slug}/600/900`;

function slugify(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@cursos.local' },
    update: {},
    create: { name: 'Administrador', email: 'admin@cursos.local', role: 'ADMIN', passwordHash: await bcrypt.hash('Admin@123', 10) },
  });
  await prisma.user.upsert({
    where: { email: 'aluno@cursos.local' },
    update: {},
    create: { name: 'Aluno Demo', email: 'aluno@cursos.local', passwordHash: await bcrypt.hash('Aluno@123', 10) },
  });

  const createdCourseIds: string[] = [];
  for (const [categoryIndex, group] of catalog.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(group.category) },
      update: {},
      create: { name: group.category, slug: slugify(group.category), position: categoryIndex },
    });
    for (const item of group.courses) {
      const slug = slugify(item.title);
      const existing = await prisma.course.findUnique({ where: { slug } });
      if (existing) {
        if (!existing.thumbnailUrl) {
          await prisma.course.update({ where: { id: existing.id }, data: { thumbnailUrl: posterUrl(slug) } });
        }
        createdCourseIds.push(existing.id);
        continue;
      }
      const course = await prisma.course.create({
        data: {
          title: item.title,
          slug,
          description: `Aprenda na prática os conceitos essenciais de ${item.title.toLowerCase()}.`,
          thumbnailUrl: posterUrl(slug),
          workloadHours: item.modules.length * 2,
          published: true,
          featured: item.featured ?? false,
          categoryId: category.id,
          modules: {
            create: item.modules.map((title, position) => ({
              title,
              position,
              lessons: {
                create: [1, 2, 3].map((n, lessonPosition) => ({
                  title: `${title} — Aula ${n}`,
                  description: `Conteúdo da aula ${n} do módulo ${title}.`,
                  videoProvider: 'URL' as const,
                  videoRef: SAMPLE_VIDEO,
                  durationSec: 596,
                  position: lessonPosition,
                })),
              },
            })),
          },
        },
      });
      createdCourseIds.push(course.id);
    }
  }

  if (!(await prisma.learningPath.count())) {
    await prisma.learningPath.create({
      data: {
        title: 'Trilha do Novo Líder',
        description: 'Do primeiro dia como líder à gestão de equipes de alta performance.',
        published: true,
        courses: { create: createdCourseIds.slice(0, 2).map((courseId, position) => ({ courseId, position })) },
      },
    });
  }

  if (!(await prisma.banner.count())) {
    await prisma.banner.createMany({
      data: [
        { title: 'Bem-vindo à plataforma', subtitle: 'Explore cursos e trilhas feitos para você', imageUrl: 'https://picsum.photos/seed/course-banner-1/2172/558', position: 0 },
        { title: 'Nova trilha: Novo Líder', subtitle: 'Desenvolva suas habilidades de liderança', imageUrl: 'https://picsum.photos/seed/course-banner-2/2172/558', linkUrl: '/trilhas', position: 1 },
      ],
    });
  }
  console.log('Seed concluído.');
}

main().finally(() => prisma.$disconnect());
