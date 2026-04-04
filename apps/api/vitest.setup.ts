import 'reflect-metadata';

process.env.JWT_SECRET ??=
  'vitest-jwt-secret-minimum-32-characters-long!!!!';
process.env.REFRESH_TOKEN_SECRET ??=
  'vitest-refresh-secret-minimum-32-characters!!';
