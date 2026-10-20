# Task 5: Thiết lập test cho Backend và Frontend

- Trạng thái: Chưa bắt đầu
- Phụ thuộc: Task 2 (Workspace API) và Task 4 (Workspace UI) đã chạy được
- Lộ trình: [roadmap.md](roadmap.md)

## Mục tiêu

Có hạ tầng test chạy được ở máy và trong CI, kèm test cho phần auth và workspace đã làm. Từ Task 6 trở đi, mỗi task đều viết test luôn.

**Học được:** các loại test và nên viết loại nào, test API với database thật, test component theo cách người dùng thao tác, giả lập API bằng MSW, chạy test trong CI.

---

## Phần 0: Hiểu trước khi viết

### Các loại test

| Loại        | Kiểm tra cái gì                                  | Ví dụ trong dự án                              | Tốc độ |
| ----------- | ------------------------------------------------ | ---------------------------------------------- | ------ |
| Unit        | Một hàm thuần, không gọi DB hay mạng             | `toSummary()`, schema zod, `applyApiErrorToForm` | Rất nhanh |
| Integration | Nhiều phần chạy cùng nhau                        | Gọi `POST /workspaces` qua Express + Prisma + DB thật | Vừa |
| Component   | Một component React render và phản hồi thao tác  | `CreateWorkspaceDialog` hiện lỗi khi để trống tên | Nhanh |
| E2E         | Cả hệ thống qua trình duyệt thật                 | Đăng nhập → tạo workspace (Playwright)          | Chậm   |

**Dự án này tập trung vào integration test cho backend và component test cho frontend.** Đây là hai loại cho nhiều giá trị nhất: chúng kiểm tra đúng hành vi mà người dùng hoặc client nhìn thấy, và không vỡ khi bạn đổi cách viết code bên trong. E2E để sau, nếu còn thời gian.

### Cấu trúc một test: Arrange – Act – Assert

```ts
it("returns 404 when user is not a member", async () => {
  // Arrange: chuẩn bị dữ liệu
  // Act: gọi thứ cần test
  // Assert: kiểm tra kết quả
});
```

Mỗi test chỉ kiểm tra **một hành vi**, và tên test mô tả hành vi đó. Đọc tên test là biết hệ thống làm gì.

### Nguyên tắc

- **Test hành vi, không test chi tiết cài đặt.** Kiểm tra status code và body, không kiểm tra "service có gọi `prisma.workspace.create` không".
- **Mỗi test độc lập.** Không test nào phụ thuộc vào dữ liệu mà test khác tạo ra. Thứ tự chạy không được ảnh hưởng kết quả.
- **Test phải fail được.** Viết xong một test, thử làm hỏng code (ví dụ đổi `404` thành `403` trong middleware) và xem test có đỏ không. Test không bao giờ đỏ thì vô dụng.

---

## Phần 1: Backend (vitest + supertest)

### Bước 1.1: Cài đặt

```bash
npm i -D vitest supertest @types/supertest -w server
```

Thêm script trong `server/package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

`app.ts` đã tách khỏi `server.ts` (chỉ `server.ts` gọi `listen`). Nhờ vậy supertest dùng được `app` mà không cần mở cổng thật.

### Bước 1.2: Database riêng cho test

**Không bao giờ chạy test trên database dev.** Test sẽ xoá sạch dữ liệu.

1. Tạo database mới, ví dụ `ttm_test`, trên cùng Postgres.
2. Tạo `server/.env.test` (thêm vào `.gitignore`), giống `.env` nhưng `DATABASE_URL` trỏ tới `ttm_test` và `NODE_ENV=test`.
3. Đẩy schema vào DB test:
   ```bash
   npx dotenv -e .env.test -- npx prisma migrate reset --force
   ```
   (Cần `npm i -D dotenv-cli -w server`.) Thêm script `"test:db": "dotenv -e .env.test -- prisma migrate reset --force"`.

### Bước 1.3: Cấu hình vitest

Tạo `server/vitest.config.ts`:

```ts
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
```

**Câu hỏi:** Vì sao phải đặt `env` ở đây mà không gọi `dotenv.config()` ở đầu file test?

### Bước 1.4: Dọn DB giữa các test

Tạo `server/test/setup.ts`:

```ts
import { afterAll, beforeEach } from "vitest";
import { prisma } from "../src/config/database.js";

beforeEach(async () => {
  // TODO: xoá dữ liệu mọi bảng.
  // Gợi ý: một câu TRUNCATE ... RESTART IDENTITY CASCADE qua prisma.$executeRawUnsafe.
  // Tên bảng là tên model trong schema.prisma, đặt trong ngoặc kép: "User", "Workspace", ...
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

**Câu hỏi:** Vì sao dọn ở `beforeEach` mà không phải `afterEach`? (Gợi ý: nếu một test bị lỗi giữa chừng thì sao?)

### Bước 1.5: Helper tạo dữ liệu

Tạo `server/test/helpers.ts`. Viết test sẽ lặp lại "tạo user rồi đăng nhập" rất nhiều lần, nên gom vào helper:

```ts
import request from "supertest";
import app from "../src/app.js";

let counter = 0;

export async function createUserAndLogin(name = "User") {
  counter += 1;
  const input = { name, email: `user${counter}@test.com`, password: "password123" };

  await request(app).post("/api/v1/auth/register").send(input).expect(201);
  const res = await request(app).post("/api/v1/auth/login").send(input).expect(200);

  return { ...input, accessToken: res.body.data.accessToken as string };
}

// TODO: export function createWorkspace(token, name) — gọi POST /workspaces, trả về body.data
```

### Bước 1.6: Test đầu tiên (ví dụ mẫu)

`server/src/modules/workspace/workspace.test.ts`. Đặt file test cạnh code được test.

```ts
import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { createUserAndLogin } from "../../../test/helpers.js";

describe("GET /api/v1/workspaces", () => {
  it("returns 401 without a token", async () => {
    await request(app).get("/api/v1/workspaces").expect(401);
  });

  it("returns an empty array for a new user", async () => {
    const a = await createUserAndLogin("A");

    const res = await request(app)
      .get("/api/v1/workspaces")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .expect(200);

    expect(res.body.data).toEqual([]);
  });
});
```

Chạy `npm run test:db` một lần, sau đó `npm test -w server`. Thấy 2 test xanh thì chuyển sang bước tiếp.

### Bước 1.7: Tự viết các test còn lại

Mỗi dòng là một `it(...)`. Tự viết, nhờ review khi xong.

**Auth** (`auth.test.ts`)
- [ ] Register thành công → 201, response **không** chứa `password`.
- [ ] Register trùng email → 409.
- [ ] Register thiếu email → 400, lỗi ở field `email`.
- [ ] Login sai mật khẩu → 401.
- [ ] `GET /auth/me` với token hợp lệ → 200, đúng email.
- [ ] Refresh: dùng cookie refresh → 200 và nhận access token mới.
- [ ] Refresh rotation: dùng lại cookie refresh **cũ** lần hai → bị từ chối.
- [ ] Logout xong, refresh bằng cookie cũ → bị từ chối.

Gợi ý cho cookie: lấy `res.headers["set-cookie"]` từ response login, rồi gửi lại bằng `.set("Cookie", cookies)`.

**Workspace** (`workspace.test.ts`)
- [ ] `POST` → 201, `role: "ADMIN"`, `memberCount: 1`, `projectCount: 0`.
- [ ] `POST` với `name: "   "` → 400.
- [ ] `POST` kèm `projectName` → `projectCount: 1`, và `GET` chi tiết có project đó.
- [ ] Danh sách sắp xếp mới nhất trước.
- [ ] B không thấy workspace của A trong danh sách.
- [ ] B gọi chi tiết workspace của A → 404 (không phải 403).
- [ ] `GET /workspaces/abc` → 400.
- [ ] Workspace đã xoá mềm: không có trong danh sách, chi tiết → 404. (Dùng `prisma.workspace.update` trực tiếp trong test để gán `deletedAt`.)

**Unit test** (không cần DB)
- [ ] `createWorkspaceSchema`: tên rỗng sau `trim` thì fail, tên 101 ký tự thì fail, `projectName` bỏ trống thì pass.

### Bước 1.8: Kiểm tra test có thật sự bắt lỗi

Thử lần lượt các thay đổi dưới đây, chạy test, thấy đỏ thì hoàn tác:
- Trong `requireWorkspaceMember`, đổi `404` thành `403`.
- Bỏ điều kiện `deletedAt` khi kiểm tra thành viên.
- Trong `createWorkspace`, bỏ phần tạo member ADMIN.

Thay đổi nào mà test vẫn xanh thì bạn đang thiếu test cho trường hợp đó.

---

## Phần 2: Frontend (vitest + Testing Library + MSW)

### Bước 2.1: Cài đặt

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw -w ui
```

Script trong `ui/package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`.

Thêm vào `ui/vite.config.ts` (vitest đọc chung file này):

```ts
/// <reference types="vitest/config" />
// ...
export default defineConfig({
  // ... giữ nguyên plugins, resolve, server
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

### Bước 2.2: Giả lập API bằng MSW

**Vì sao MSW:** thay vì mock `axios` hay mock hook, MSW chặn request ở tầng mạng và trả response giả. Component, hook, axios, `unwrap`, xử lý lỗi đều chạy thật, nên test giống thực tế hơn.

`ui/src/test/server.ts`:

```ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Handler mặc định: trường hợp "bình thường". Từng test có thể ghi đè.
export const server = setupServer(
  http.get("/api/v1/workspaces", () => HttpResponse.json({ data: [] })),
);
```

`ui/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
```

`onUnhandledRequest: "error"`: component gọi API mà test chưa khai báo thì test fail ngay, không âm thầm gọi ra ngoài.

> Nếu axios báo lỗi URL tương đối trong jsdom, đổi URL trong handler thành `*/api/v1/workspaces`.

### Bước 2.3: Hàm render dùng chung

Component của bạn cần `QueryClientProvider` và Router. Tạo `ui/src/test/render.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { ReactElement } from "react";

export function renderWithProviders(ui: ReactElement, { route = "/" } = {}) {
  // QueryClient MỚI cho mỗi test: cache không rò từ test này sang test khác.
  // retry: false để test lỗi không phải chờ retry.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
```

### Bước 2.4: Test đầu tiên (ví dụ mẫu)

`ui/src/features/workspace/pages/WorkspaceListPage.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/render";
import WorkspaceListPage from "./WorkspaceListPage";

describe("WorkspaceListPage", () => {
  it("shows the empty state when the user has no workspace", async () => {
    renderWithProviders(<WorkspaceListPage />);

    // findBy* chờ cho tới khi phần tử xuất hiện (dữ liệu tải xong)
    expect(await screen.findByText(/don't have any workspace/i)).toBeInTheDocument();
  });

  it("shows workspace cards", async () => {
    server.use(
      http.get("/api/v1/workspaces", () =>
        HttpResponse.json({
          data: [
            { id: 1, name: "Team A", role: "ADMIN", memberCount: 1, projectCount: 0, createdAt: "2026-10-19T00:00:00.000Z" },
          ],
        }),
      ),
    );

    renderWithProviders(<WorkspaceListPage />);

    expect(await screen.findByRole("link", { name: /team a/i })).toBeInTheDocument();
  });
});
```

### Cách tìm phần tử: ưu tiên như người dùng nhìn thấy

Thứ tự ưu tiên của Testing Library:
1. `getByRole("button", { name: /create workspace/i })`: giống cách trình đọc màn hình thấy. **Dùng cái này nhiều nhất.**
2. `getByLabelText(/workspace name/i)`: cho ô nhập.
3. `getByText(...)`: cho đoạn chữ.
4. `getByTestId(...)`: chỉ khi không còn cách nào khác.

Nếu `getByRole` không tìm được nút hay ô nhập của bạn, thường là do **accessibility của component có vấn đề** (thiếu label, dùng `div` thay cho `button`). Viết test sẽ phát hiện luôn lỗi này.

| Hàm         | Không tìm thấy thì     | Dùng khi                                  |
| ----------- | ---------------------- | ----------------------------------------- |
| `getBy...`  | Throw ngay             | Phần tử phải có sẵn                       |
| `queryBy...`| Trả `null`             | Kiểm tra phần tử **không** tồn tại        |
| `findBy...` | Chờ (mặc định 1 giây)  | Phần tử xuất hiện sau khi gọi API         |

Thao tác người dùng thì dùng `userEvent`:

```ts
const user = userEvent.setup();
await user.click(screen.getByRole("button", { name: /create workspace/i }));
await user.type(screen.getByLabelText(/workspace name/i), "Team A");
```

### Bước 2.5: Tự viết các test còn lại

**`WorkspaceListPage`**
- [ ] Đang tải: thấy skeleton. (Gợi ý: handler `await delay()` của MSW.)
- [ ] Lỗi: handler trả 500 → thấy thông báo lỗi và nút "Try again". Đổi handler thành thành công, bấm nút → thấy dữ liệu.
- [ ] Rỗng (đã có mẫu).
- [ ] Có dữ liệu (đã có mẫu): card là link tới `/workspaces/1`, hiện badge vai trò.

**`CreateWorkspaceDialog`**
- [ ] Trước khi bấm "Create workspace": không có dialog (`queryByRole("dialog")` là `null`).
- [ ] Bấm nút → dialog mở. Bấm Esc → dialog đóng.
- [ ] Để trống tên, bấm Submit → hiện lỗi dưới ô tên, **không có request nào được gửi** (gợi ý: đếm số lần handler `POST` được gọi).
- [ ] Server trả 400 với `errors: { name: [...] }` → lỗi hiện dưới ô tên, dialog vẫn mở.
- [ ] Thành công → dialog đóng, danh sách có workspace mới.

**`WorkspaceDetailPage`**
- [ ] Route `/workspaces/abc` → "not found", không gọi API.
- [ ] API trả 404 → "Workspace not found" và link về `/`.
- [ ] MEMBER không thấy nút "Settings", ADMIN thấy.

(Với trang chi tiết, cần render trong `<Routes><Route path="/workspaces/:workspaceId" element={...} /></Routes>` để `useParams` có giá trị.)

---

## Phần 3: Chạy trong CI

1. Thêm script ở `package.json` gốc: `"test": "npm run test -w server -w ui"`.
2. Trong `.github/workflows/ci.yml`, thêm service Postgres cho job:
   ```yaml
   services:
     postgres:
       image: postgres:16
       env:
         POSTGRES_USER: ci
         POSTGRES_PASSWORD: ci
         POSTGRES_DB: ttm_test
       ports: ["5432:5432"]
       options: >-
         --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 10
   ```
3. Trong CI không có `.env.test` (file này bị gitignore). Tự tìm cách cung cấp biến môi trường cho bước test. Gợi ý: `env:` ở cấp step, và `vitest.config.ts` nên dùng `process.env` khi không có file `.env.test`.
4. Thêm bước `prisma migrate deploy` rồi `npm test` sau bước Build.

---

## Tự kiểm tra

| #   | Thao tác                                        | Mong đợi                                         |
| --- | ----------------------------------------------- | ------------------------------------------------ |
| 1   | `npm test -w server`                            | Xanh, chạy trên `ttm_test`, DB dev không bị đụng |
| 2   | Chạy lại lần hai                                | Vẫn xanh (test không phụ thuộc dữ liệu cũ)       |
| 3   | Chạy riêng một test bằng `it.only`              | Xanh (test độc lập)                              |
| 4   | Làm các thay đổi ở Bước 1.8                     | Mỗi thay đổi làm ít nhất một test đỏ             |
| 5   | `npm test -w ui`                                | Xanh                                             |
| 6   | Xoá `aria-label` hoặc label của một ô nhập      | Test component tương ứng đỏ                      |
| 7   | Push lên nhánh, mở PR                           | CI chạy test và xanh                             |

## Câu hỏi để suy nghĩ

1. Vì sao test backend dùng database thật thay vì mock Prisma? Khi nào mock thì hợp lý hơn?
2. Vì sao mỗi test frontend cần một `QueryClient` mới?
3. MSW khác gì so với `vi.mock("axios")`? Test nào sẽ bỏ sót lỗi khi mock axios?
4. Coverage 100% có nghĩa là không còn bug không? Vì sao?

## Các mốc nhờ review

1. Xong Phần 1 đến Bước 1.6 (2 test mẫu xanh) → báo để kiểm tra setup.
2. Xong Bước 1.7–1.8 (toàn bộ test backend) → review.
3. Xong Phần 2 → review.
4. Xong Phần 3, CI xanh → hoàn thành Task 5.
