import { PrismaClient, SystemRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Knowledge Translation Network database...');

  // 1. Seed Engineering Domains
  await prisma.engineeringDomain.upsert({
    where: { code: 'AERO' },
    update: {},
    create: {
      name: 'Aerospace & Propulsion',
      code: 'AERO',
      description: 'Aerodynamic structures, propulsion systems, and orbital mechanics.',
    },
  });

  // 2. Seed System Deployments & Environments
  await prisma.systemDeploymentRecord.create({
    data: {
      environment: 'PRODUCTION',
      deploymentMode: 'MULTI_TENANT_SAAS',
      version: 'v1.0.0',
      status: 'SUCCESS',
      deployedBy: 'GITHUB_ACTIONS_WORKFLOW',
    },
  });

  await prisma.deploymentEnvironmentConfig.upsert({
    where: { envName: 'PRODUCTION' },
    update: {},
    create: {
      envName: 'PRODUCTION',
      region: 'US-EAST-1',
      maxReplicas: 10,
      storageProvider: 'S3_COMPATIBLE',
      isMaintenanceMode: false,
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
