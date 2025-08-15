-- AlterTable
ALTER TABLE "ChatMessages" ADD COLUMN     "webSearchData" TEXT[] DEFAULT ARRAY[]::TEXT[];
