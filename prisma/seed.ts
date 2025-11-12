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
