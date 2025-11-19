import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting database seeding...');

  // Crear insignias predefinidas
  const badges = [
    {
      name: 'Tutor Destacado',
      description: 'Tutor con avgRating >= 4.8 y 20+ sesiones en el mes',
      criteria: JSON.stringify({
        avgRating: { gte: 4.8 },
        sessionsLastMonth: { gte: 20 },
      }),
      iconUrl: '/assets/badges/star.png',
    },
    {
      name: 'Colaborador Activo',
      description: 'Usuario con 10+ materiales subidos y 5+ likes promedio',
      criteria: JSON.stringify({
        materialsUploaded: { gte: 10 },
        avgLikes: { gte: 5 },
      }),
      iconUrl: '/assets/badges/active.png',
    },
    {
      name: 'Mentor del Mes',
      description: 'Top 3 en puntos ganados durante el mes',
      criteria: JSON.stringify({
        rank: { lte: 3 },
      }),
      iconUrl: '/assets/badges/trophy.png',
    },
    {
      name: 'Principiante',
      description: 'Primera sesión completada',
      criteria: JSON.stringify({
        sessionsCompleted: { gte: 1 },
      }),
      iconUrl: '/assets/badges/beginner.png',
    },
    {
      name: 'Estudiante Dedicado',
      description: '50+ horas de estudio acumuladas',
      criteria: JSON.stringify({
        totalStudyHours: { gte: 50 },
      }),
      iconUrl: '/assets/badges/dedicated.png',
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }

  console.log('[SEED] Badges created successfully');

  // Crear usuarios de ejemplo
  const users = [
    {
      email: 'admin@wiswe.com',
      name: 'Administrador',
      role: 'ADMIN' as const,
    },
    {
      email: 'tutor1@example.com',
      name: 'Juan Pérez',
      role: 'TUTOR' as const,
    },
    {
      email: 'tutor2@example.com',
      name: 'María García',
      role: 'TUTOR' as const,
    },
    {
      email: 'student1@example.com',
      name: 'Carlos López',
      role: 'STUDENT' as const,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        score: {
          create: { points: 0 },
        },
        stats: {
          create: {},
        },
      },
    });

    // Crear perfil de tutor si es TUTOR
    if (userData.role === 'TUTOR') {
      await prisma.tutorProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          avgRating: 4.5,
          totalRatings: 10,
          responseTime: 15,
          sessionsLastMonth: 5,
          subjects: ['Matemáticas', 'Física'],
          availabilityScore: 0.8,
        },
      });
    }
  }

  console.log('[SEED] Sample users created successfully');

  // Crear datos de ejemplo para auditoría
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@wiswe.com' },
  });

  if (admin) {
    await prisma.auditLog.create({
      data: {
        action: 'USER_CREATED',
        userId: admin.id,
        resourceType: 'User',
        resourceId: admin.id,
        metadata: {
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        ipAddress: '127.0.0.1',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'BADGE_CREATED',
        userId: admin.id,
        resourceType: 'Badge',
        resourceId: 'badge-sample',
        metadata: {
          name: 'Tutor Destacado',
          description: 'Badge de ejemplo',
        },
        ipAddress: '127.0.0.1',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_CREATED',
        userId: admin.id,
        resourceType: 'User',
        resourceId: admin.id,
        metadata: {
          email: admin.email,
          name: admin.name,
        },
        ipAddress: '127.0.0.1',
      },
    });

    console.log('[SEED] Audit logs created successfully');
  }

  // Crear snapshots de reportes de ejemplo
  const tutor1 = await prisma.user.findUnique({
    where: { email: 'tutor1@example.com' },
  });

  if (tutor1) {
    // Snapshot de sistema general
    await prisma.reportSnapshot.create({
      data: {
        type: 'system_overview',
        name: 'Snapshot Inicial - Sistema',
        description: 'Estado inicial del sistema para pruebas',
        data: {
          users: { total: 4, tutors: 2, students: 1, admins: 1 },
          badges: { total: 5, awarded: 0, avgPerUser: 0 },
          notifications: { total: 0 },
          points: { total: 0, avgPerUser: 0 },
        },
        createdBy: admin?.id,
      },
    });

    // Snapshot de top usuarios
    await prisma.reportSnapshot.create({
      data: {
        type: 'top_users',
        name: 'Top 10 Usuarios - Inicial',
        description: 'Ranking inicial de usuarios',
        data: [
          {
            rank: 1,
            userId: tutor1.id,
            name: tutor1.name,
            email: tutor1.email,
            role: tutor1.role,
            points: 0,
          },
        ],
        createdBy: admin?.id,
      },
    });

    // Snapshot de tutores
    await prisma.reportSnapshot.create({
      data: {
        type: 'tutor_statistics',
        name: 'Estadísticas Tutores - Inicial',
        description: 'Estado inicial de tutores',
        data: {
          totalTutors: 2,
          averages: {
            rating: 4.5,
            responseTime: 15,
            sessionsLastMonth: 5,
            availabilityScore: 0.8,
          },
          topTutors: [],
        },
        createdBy: admin?.id,
      },
    });

    console.log('[SEED] Report snapshots created successfully');
  }

  console.log('[SEED] Database seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('[ERROR] Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
