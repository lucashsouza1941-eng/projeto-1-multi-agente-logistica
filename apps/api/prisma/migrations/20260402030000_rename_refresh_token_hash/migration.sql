-- Rename hashed refresh token column to clearer name.
ALTER TABLE "User" RENAME COLUMN "refreshTokenHash" TO "refreshToken";
