-- CreateEnum
CREATE TYPE "SessionTypeValue" AS ENUM ('SPEED', 'ENDURANCE', 'VOLUME', 'TECHNIQUE', 'HILLS', 'HURDLES', 'GYM', 'RECOVERY');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('NONE', 'CRAMP', 'PAIN', 'EARLY_FATIGUE');

-- CreateTable
CREATE TABLE "Session" (
    "id"          TEXT NOT NULL,
    "date"        TIMESTAMP(3) NOT NULL,
    "title"       TEXT NOT NULL,
    "durationMin" INTEGER,
    "athleteId"   TEXT NOT NULL,
    "coachId"     TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionType" (
    "id"        TEXT NOT NULL,
    "type"      "SessionTypeValue" NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "SessionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarmupItem" (
    "id"        TEXT NOT NULL,
    "order"     INTEGER NOT NULL,
    "name"      TEXT NOT NULL,
    "detail"    TEXT,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "WarmupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSet" (
    "id"        TEXT NOT NULL,
    "order"     INTEGER NOT NULL,
    "abandoned" BOOLEAN NOT NULL DEFAULT false,
    "note"      TEXT,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "TrainingSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lap" (
    "id"          TEXT NOT NULL,
    "order"       INTEGER NOT NULL,
    "distance"    TEXT NOT NULL,
    "timeSeconds" DOUBLE PRECISION,
    "note"        TEXT,
    "setId"       TEXT NOT NULL,

    CONSTRAINT "Lap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drill" (
    "id"        TEXT NOT NULL,
    "order"     INTEGER NOT NULL,
    "name"      TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "Drill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionFeedback" (
    "id"        TEXT NOT NULL,
    "fatigue"   INTEGER NOT NULL,
    "rpe"       INTEGER NOT NULL,
    "note"      TEXT,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "SessionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionFeedback_sessionId_key" ON "SessionFeedback"("sessionId");

-- CreateTable
CREATE TABLE "Incident" (
    "id"         TEXT NOT NULL,
    "type"       "IncidentType" NOT NULL,
    "bodyPart"   TEXT,
    "severity"   INTEGER,
    "detail"     TEXT,
    "feedbackId" TEXT NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SessionType" ADD CONSTRAINT "SessionType_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WarmupItem" ADD CONSTRAINT "WarmupItem_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrainingSet" ADD CONSTRAINT "TrainingSet_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lap" ADD CONSTRAINT "Lap_setId_fkey"
    FOREIGN KEY ("setId") REFERENCES "TrainingSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Drill" ADD CONSTRAINT "Drill_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SessionFeedback" ADD CONSTRAINT "SessionFeedback_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Incident" ADD CONSTRAINT "Incident_feedbackId_fkey"
    FOREIGN KEY ("feedbackId") REFERENCES "SessionFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
