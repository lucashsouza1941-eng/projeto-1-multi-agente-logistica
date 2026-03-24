/*
  Warnings:

  - The `aiDecisionLog` column on the `EscalationTicket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `timeline` column on the `EscalationTicket` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "EscalationTicket" DROP COLUMN "aiDecisionLog",
ADD COLUMN     "aiDecisionLog" JSONB[],
DROP COLUMN "timeline",
ADD COLUMN     "timeline" JSONB[];
