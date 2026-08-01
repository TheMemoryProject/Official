-- CreateEnum
CREATE TYPE "DependencyKind" AS ENUM ('STANDARD', 'MATERIAL', 'PROCESS', 'SUPPLIER', 'EVIDENCE', 'KNOWLEDGE', 'ENVIRONMENT', 'REGULATION', 'EXPERT');

-- CreateEnum
CREATE TYPE "DependencyCriticality" AS ENUM ('BLOCKING', 'MAJOR', 'MINOR');

-- CreateEnum
CREATE TYPE "ChangeEventType" AS ENUM ('STANDARD_REVISED', 'STANDARD_WITHDRAWN', 'MATERIAL_SPEC_CHANGED', 'PROCESS_CHANGED', 'SUPPLIER_CHANGED', 'EVIDENCE_SUPERSEDED', 'EVIDENCE_RETRACTED', 'FIELD_FAILURE_REPORTED', 'REGULATION_PUBLISHED', 'KNOWLEDGE_SUPERSEDED', 'EXPERT_DEPARTED');

-- CreateEnum
CREATE TYPE "ChangeEventStatus" AS ENUM ('DETECTED', 'PROPAGATED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CurrencyStatus" AS ENUM ('CURRENT', 'REVALIDATION_REQUIRED', 'UNDER_REVALIDATION', 'SUPERSEDED', 'RETIRED');

-- CreateEnum
CREATE TYPE "RevalidationTaskStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_REVIEW', 'RESOLVED_CONFIRMED', 'RESOLVED_AMENDED', 'RESOLVED_RETIRED', 'DISMISSED');

-- CreateTable
CREATE TABLE "KnowledgeDependency" (
    "id" UUID NOT NULL,
    "knowledgeId" UUID NOT NULL,
    "kind" "DependencyKind" NOT NULL,
    "targetId" UUID,
    "targetIdentifier" TEXT NOT NULL,
    "pinnedRevision" TEXT,
    "criticality" "DependencyCriticality" NOT NULL DEFAULT 'MAJOR',
    "rationale" TEXT,
    "declaredById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeEvent" (
    "id" UUID NOT NULL,
    "type" "ChangeEventType" NOT NULL,
    "dependencyKind" "DependencyKind" NOT NULL,
    "subjectId" UUID,
    "subjectIdentifier" TEXT NOT NULL,
    "fromRevision" TEXT,
    "toRevision" TEXT,
    "summary" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detectedById" UUID,
    "status" "ChangeEventStatus" NOT NULL DEFAULT 'DETECTED',
    "propagatedAt" TIMESTAMP(3),
    "engineVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactAssessment" (
    "id" UUID NOT NULL,
    "changeEventId" UUID NOT NULL,
    "knowledgeId" UUID NOT NULL,
    "dependencyId" UUID,
    "criticality" "DependencyCriticality" NOT NULL,
    "previousStatus" "CurrencyStatus" NOT NULL,
    "newStatus" "CurrencyStatus" NOT NULL,
    "pathJson" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpactAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevalidationTask" (
    "id" UUID NOT NULL,
    "knowledgeId" UUID NOT NULL,
    "changeEventId" UUID,
    "status" "RevalidationTaskStatus" NOT NULL DEFAULT 'OPEN',
    "criticality" "DependencyCriticality" NOT NULL,
    "reason" TEXT NOT NULL,
    "assigneeId" UUID,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" UUID,
    "resolutionRationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevalidationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCurrency" (
    "id" UUID NOT NULL,
    "knowledgeId" UUID NOT NULL,
    "status" "CurrencyStatus" NOT NULL DEFAULT 'CURRENT',
    "currencyScore" INTEGER NOT NULL,
    "decayComponent" INTEGER NOT NULL,
    "impactComponent" INTEGER NOT NULL,
    "openTaskCount" INTEGER NOT NULL DEFAULT 0,
    "blockingTaskCount" INTEGER NOT NULL DEFAULT 0,
    "ageDays" INTEGER NOT NULL DEFAULT 0,
    "lastRevalidatedAt" TIMESTAMP(3),
    "breakdownJson" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeCurrency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeStatusHistory" (
    "id" UUID NOT NULL,
    "knowledgeId" UUID NOT NULL,
    "fromStatus" "CurrencyStatus",
    "toStatus" "CurrencyStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "changeEventId" UUID,
    "taskId" UUID,
    "actorId" UUID,
    "engineVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeDependency_kind_targetIdentifier_idx" ON "KnowledgeDependency"("kind", "targetIdentifier");

-- CreateIndex
CREATE INDEX "KnowledgeDependency_knowledgeId_idx" ON "KnowledgeDependency"("knowledgeId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeDependency_knowledgeId_kind_targetIdentifier_key" ON "KnowledgeDependency"("knowledgeId", "kind", "targetIdentifier");

-- CreateIndex
CREATE INDEX "ChangeEvent_dependencyKind_subjectIdentifier_idx" ON "ChangeEvent"("dependencyKind", "subjectIdentifier");

-- CreateIndex
CREATE INDEX "ChangeEvent_status_idx" ON "ChangeEvent"("status");

-- CreateIndex
CREATE INDEX "ChangeEvent_detectedAt_idx" ON "ChangeEvent"("detectedAt");

-- CreateIndex
CREATE INDEX "ImpactAssessment_knowledgeId_idx" ON "ImpactAssessment"("knowledgeId");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactAssessment_changeEventId_knowledgeId_key" ON "ImpactAssessment"("changeEventId", "knowledgeId");

-- CreateIndex
CREATE INDEX "RevalidationTask_status_idx" ON "RevalidationTask"("status");

-- CreateIndex
CREATE INDEX "RevalidationTask_knowledgeId_idx" ON "RevalidationTask"("knowledgeId");

-- CreateIndex
CREATE INDEX "RevalidationTask_assigneeId_idx" ON "RevalidationTask"("assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCurrency_knowledgeId_key" ON "KnowledgeCurrency"("knowledgeId");

-- CreateIndex
CREATE INDEX "KnowledgeCurrency_status_idx" ON "KnowledgeCurrency"("status");

-- CreateIndex
CREATE INDEX "KnowledgeCurrency_currencyScore_idx" ON "KnowledgeCurrency"("currencyScore");

-- CreateIndex
CREATE INDEX "KnowledgeStatusHistory_knowledgeId_createdAt_idx" ON "KnowledgeStatusHistory"("knowledgeId", "createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeStatusHistory_changeEventId_idx" ON "KnowledgeStatusHistory"("changeEventId");

-- AddForeignKey
ALTER TABLE "KnowledgeDependency" ADD CONSTRAINT "KnowledgeDependency_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "KnowledgeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDependency" ADD CONSTRAINT "KnowledgeDependency_declaredById_fkey" FOREIGN KEY ("declaredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeEvent" ADD CONSTRAINT "ChangeEvent_detectedById_fkey" FOREIGN KEY ("detectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAssessment" ADD CONSTRAINT "ImpactAssessment_changeEventId_fkey" FOREIGN KEY ("changeEventId") REFERENCES "ChangeEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAssessment" ADD CONSTRAINT "ImpactAssessment_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "KnowledgeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevalidationTask" ADD CONSTRAINT "RevalidationTask_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "KnowledgeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevalidationTask" ADD CONSTRAINT "RevalidationTask_changeEventId_fkey" FOREIGN KEY ("changeEventId") REFERENCES "ChangeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevalidationTask" ADD CONSTRAINT "RevalidationTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevalidationTask" ADD CONSTRAINT "RevalidationTask_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCurrency" ADD CONSTRAINT "KnowledgeCurrency_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "KnowledgeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeStatusHistory" ADD CONSTRAINT "KnowledgeStatusHistory_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "KnowledgeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeStatusHistory" ADD CONSTRAINT "KnowledgeStatusHistory_changeEventId_fkey" FOREIGN KEY ("changeEventId") REFERENCES "ChangeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeStatusHistory" ADD CONSTRAINT "KnowledgeStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
