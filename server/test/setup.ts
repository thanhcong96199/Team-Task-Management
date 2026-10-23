import { afterAll, beforeEach } from "vitest";
import { prisma } from "../src/config/database.js";

// Guard: TRUNCATE below wipes every table, so refuse to run against anything but the test DB
const TEST_DB_NAME = "test_taskflow";
const dbName = new URL(process.env.DATABASE_URL ?? "").pathname.slice(1);

if (process.env.NODE_ENV !== "test" || dbName !== TEST_DB_NAME) {
  throw new Error(
    `Refusing to run tests: expected NODE_ENV=test and database "${TEST_DB_NAME}", ` +
      `got NODE_ENV=${process.env.NODE_ENV} and database "${dbName}". Check server/.env.test.`,
  );
}

// Every model in schema.prisma. Add new models here, or their rows will leak between tests.
const TABLES = [
  "User",
  "RefreshToken",
  "Workspace",
  "WorkspaceMember",
  "Project",
  "Board",
  "Task",
  "Comment",
];

beforeEach(async () => {
  const tableList = TABLES.map((table) => `"${table}"`).join(", ");
  // RESTART IDENTITY: ids start from 1 again. CASCADE: ignore foreign key order.
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await prisma.$disconnect();
});
