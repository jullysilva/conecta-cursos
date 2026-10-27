import { BadRequestException, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Paginated, paginationArgs } from '../../../common/dto/pagination-query.dto.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { CreateUserDto, UpdateUserDto, UserListQueryDto } from '../dto/admin.dto.js';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  avatarUrl: true,
  createdAt: true,
} as const;

type AdminUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: UserListQueryDto): Promise<Paginated<AdminUser>> {
    const where: Prisma.UserWhereInput = {
      ...(query.role && { role: query.role }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        ...paginationArgs(query),
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id }, select: userSelect });
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: id },
      orderBy: { lastAccessedAt: 'desc' },
      select: { lastAccessedAt: true, course: { select: { id: true, title: true } } },
    });
    return { ...user, enrollments };
  }

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        role: dto.role,
        active: dto.active,
        passwordHash: await bcrypt.hash(dto.password, 10),
      },
      select: userSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    if (id === actorId && (dto.active === false || (dto.role && dto.role !== 'ADMIN'))) {
      throw new BadRequestException('Você não pode remover seu próprio acesso de administrador');
    }
    const { password, email, ...rest } = dto;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(email && { email: email.toLowerCase() }),
        ...(password && { passwordHash: await bcrypt.hash(password, 10) }),
      },
      select: userSelect,
    });
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) throw new BadRequestException('Você não pode excluir a si mesmo');
    await this.prisma.user.delete({ where: { id } });
  }
}
