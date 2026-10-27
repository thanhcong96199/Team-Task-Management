import { defineConfig } from "vitest/config";
import { config } from "dotenv";

export default defineConfig({
  test: {
    // Nạp .env.test TRƯỚC khi code của app chạy, để env.ts đọc đúng DATABASE_URL
    env: config({ path: ".env.test" }).parsed,
    setupFiles: ["./test/setup.ts"],
    // Các file test dùng chung một DB, nên chạy lần lượt để không xoá dữ liệu của nhau
    fileParallelism: false,
  },
});
