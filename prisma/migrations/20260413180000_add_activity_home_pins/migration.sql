-- AlterTable
ALTER TABLE "UserHomePreferences" ADD COLUMN "showActivityCalendar" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserHomePreferences" ADD COLUMN "pinnedActivityTypeIds" JSONB NOT NULL DEFAULT '[]';
