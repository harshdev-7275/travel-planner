/*
  Warnings:

  - You are about to drop the column `response` on the `ChatMessages` table. All the data in the column will be lost.
  - Added the required column `role` to the `ChatMessages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First, add the role column as nullable with a default value
ALTER TABLE "ChatMessages" ADD COLUMN "role" TEXT DEFAULT 'user';

-- Update existing records to have a role
UPDATE "ChatMessages" SET "role" = 'user' WHERE "role" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "ChatMessages" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "ChatMessages" ALTER COLUMN "role" DROP DEFAULT;

-- Drop the response column
ALTER TABLE "ChatMessages" DROP COLUMN "response";
