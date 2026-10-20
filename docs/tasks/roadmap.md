# Lộ trình đầy đủ (bản gộp, cập nhật 2026-10-19)

File này liệt kê **tất cả** task từ đầu tới khi dự án đủ để demo khi đi phỏng vấn. Các task nhỏ, có cùng khuôn mẫu đã được gộp lại. Task nào đang làm thì có file yêu cầu chi tiết riêng (ví dụ [f2-workspace-ui.md](f2-workspace-ui.md)). Khi bắt đầu một task mới, nhờ Claude viết file chi tiết từ mục tương ứng ở đây.

## Tổng quan

| #   | Task                                              | Gộp từ (bản cũ)           | Trạng thái |
| --- | ------------------------------------------------- | ------------------------- | ---------- |
| 1   | Auth backend: register, login, `/me`, refresh, logout | Task 1–5, F1.0         | ✅         |
| 2   | Workspace API                                     | Task 6                    | ✅         |
| 3   | Nền tảng frontend và Auth UI                      | F0, F1                    | ✅         |
| 4   | Workspace UI                                      | F2                        | ⏳         |
| 5   | Thiết lập test (backend và frontend)              | Task 12 (đưa lên sớm)     | ⬜         |
| 6   | Thành viên workspace                              | _mới_                     | ⬜         |
| 7   | Project và Board API                              | Task 7, Task 8            | ⬜         |
| 8   | Project và Board UI                               | F3, F4                    | ⬜         |
| 9   | Task và Comment API                               | Task 9, Task 10           | ⬜         |
| 10  | Kanban, chi tiết task, comment UI                 | F5                        | ⬜         |
| 11  | Bảo mật, logging, deploy                          | Task 11 + deploy          | ⬜         |
| 12  | Hoàn thiện để đi phỏng vấn                        | _mới_                     | ⬜         |

**Vì sao đưa test (5) lên sớm:** viết test cho Task 2 (workspace) trước, rồi mọi task sau đều kèm test ngay khi làm. Viết test dồn ở cuối thì rất nặng và dễ bỏ.

**Vì sao thêm thành viên workspace (6):** hiện chưa có cách nào để workspace có MEMBER. Không có nó thì không test được phân quyền, và không có ai để giao task.

## Quy ước chung cho mọi task backend

- Route lồng theo cấu trúc dữ liệu: `/workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId`.
- Mọi route trong workspace đi qua `requireWorkspaceMember()`. Các tài nguyên con (project, board, task) phải được kiểm tra **thuộc đúng workspace/project trên URL**, nếu không thì `404`. Đây là chỗ hay sinh lỗi IDOR nhất.
- Schema zod và kiểu dữ liệu nằm trong `@ttm/shared`, FE và BE dùng chung.
- Middleware và service throw `AppError`, không tự trả response.
- Xoá là xoá mềm (`deletedAt`). Mọi query đọc đều lọc `deletedAt: null`.
- Danh sách có thể dài thì phải phân trang.
- Mỗi task có: bảng tự kiểm tra, test tự động (từ Task 5 trở đi), `npm run check` xanh, PR riêng.

## Quy ước chung cho mọi task frontend

- Mỗi feature theo cấu trúc `features/<tên>/{api.ts, queries.ts, hooks.ts, pages/, components/}`.
- Query key theo cấp (`all → list → detail`). Sau mỗi mutation thì invalidate đúng phạm vi.
- Mọi màn hình dữ liệu có đủ 4 trạng thái: đang tải, lỗi, rỗng, có dữ liệu.
- Tham số URL được parse bằng schema zod trước khi gọi API. `404` từ API hiện "not found", không để trang trắng.
- Accessibility: điều hướng dùng `<Link>`, dialog có tiêu đề, nút chỉ có icon thì có `aria-label`.

---

## Task 4: Workspace UI ⏳

Xem [f2-workspace-ui.md](f2-workspace-ui.md).

---

## Task 5: Thiết lập test

File chi tiết: [task-05-testing.md](task-05-testing.md).

**Mục tiêu:** có hạ tầng test chạy được trong CI, và test cho phần auth và workspace đã làm.

### Backend (vitest + supertest)
- Cài `vitest`, `supertest`. Tách `app.ts` (export app) khỏi `server.ts` (listen) nếu chưa tách.
- Dùng **database riêng cho test** (`.env.test`, `DATABASE_URL` khác). Chạy `prisma migrate reset --force` trước bộ test, xoá dữ liệu giữa các test.
- Helper: `createUser()`, `loginAs(user)` trả về access token.
- Test tối thiểu:
  - Auth: register trùng email → 409; login sai mật khẩu → 401; refresh token dùng lại lần hai → bị từ chối.
  - Workspace: toàn bộ bảng tự kiểm tra của Task 6 (B không xem được workspace của A, `abc` → 400, xoá mềm → 404, tạo kèm project).

### Frontend (vitest + Testing Library + MSW)
- Cài `@testing-library/react`, `@testing-library/user-event`, `msw`.
- Test `WorkspaceListPage`: 4 trạng thái (dùng MSW giả lập response chậm, lỗi, rỗng, có dữ liệu).
- Test `CreateWorkspaceDialog`: để trống tên → hiện lỗi, không gửi request; lỗi 400 từ server → hiện dưới ô nhập.

### CI
- Thêm bước `npm test` vào `.github/workflows/ci.yml`. Backend cần service Postgres trong CI.

**Câu hỏi:** Vì sao test API dùng database thật thay vì mock Prisma? Khi nào mock thì hợp lý?

---

## Task 6: Thành viên workspace

**Mục tiêu:** ADMIN thêm, đổi vai trò, xoá thành viên. Mọi thành viên xem được danh sách.

| Method   | URL                                     | Quyền      | Kết quả                                    |
| -------- | --------------------------------------- | ---------- | ------------------------------------------ |
| `GET`    | `/workspaces/:id/members`               | Thành viên | `200`, `{ userId, name, email, role }[]`   |
| `POST`   | `/workspaces/:id/members` `{ email, role }` | ADMIN  | `201`. Email không tồn tại → `404`; đã là thành viên → `409` |
| `PATCH`  | `/workspaces/:id/members/:userId` `{ role }` | ADMIN | `200`                                      |
| `DELETE` | `/workspaces/:id/members/:userId`       | ADMIN      | `204`                                      |

Quy tắc nghiệp vụ:
- **Workspace luôn phải còn ít nhất 1 ADMIN.** Không cho hạ quyền hoặc xoá ADMIN cuối cùng → `409`. Kiểm tra và cập nhật trong **một transaction** để hai request đồng thời không cùng lách qua.
- Thành viên tự rời workspace: `DELETE .../members/me` (cũng phải tuân theo quy tắc ADMIN cuối cùng).
- Chỉ thêm user đã có tài khoản (chưa làm mời qua email).

UI: trang "Members" trong workspace (bảng thành viên, dialog thêm, đổi vai trò bằng select, nút xoá có xác nhận). MEMBER chỉ xem.

**Câu hỏi:** Vì sao kiểm tra "ADMIN cuối cùng" ngoài transaction có thể sai khi có hai request cùng lúc (race condition)?

---

## Task 7: Project và Board API (gộp Task 7 + 8)

Project và Board có cùng khuôn mẫu CRUD, nên làm chung. Làm Project trước, sau đó Board chỉ việc lặp lại khuôn.

### Project
| Method   | URL                                         | Quyền      |
| -------- | ------------------------------------------- | ---------- |
| `GET`    | `/workspaces/:workspaceId/projects`         | Thành viên |
| `POST`   | `/workspaces/:workspaceId/projects`         | ADMIN      |
| `GET`    | `/workspaces/:workspaceId/projects/:projectId` | Thành viên |
| `PATCH`  | `/workspaces/:workspaceId/projects/:projectId` | ADMIN   |
| `DELETE` | `/workspaces/:workspaceId/projects/:projectId` | ADMIN (xoá mềm) |

- Viết middleware `requireProject` (chạy sau `requireWorkspaceMember`): tìm project theo `projectId` **và** `workspaceId` của URL, chưa xoá; không có → `404`. Gắn `req.project`.
- Cân nhắc cho `description` là tuỳ chọn (sửa schema Prisma, viết migration).
- Danh sách có `boardCount`.

### Board
- Tương tự, dưới `/projects/:projectId/boards`. Middleware `requireBoard` kiểm tra board thuộc đúng project.
- Quyền: thành viên tạo và sửa board, ADMIN xoá. (Bạn tự quyết định và ghi lý do vào file chi tiết.)
- Danh sách có số task theo từng trạng thái (`TODO`, `IN_PROGRESS`, `DONE`), dùng `groupBy` hoặc `_count` có điều kiện, **không N+1**.

### Dọn dẹp
- Xoá `board.middleware.ts` cũ và `boardParamsSchema` trong `validate.middleware.ts`.
- **Xoá mềm theo tầng:** xoá project thì board và task bên trong cũng không còn hiện. Chọn một cách: (a) cập nhật `deletedAt` cho cả cây trong một transaction, hoặc (b) chỉ đánh dấu project và mọi query đọc board/task đều lọc theo project cha. Ghi lý do chọn.

**Câu hỏi:** Nếu `requireBoard` chỉ tìm theo `boardId` mà không kiểm tra `projectId`, kẻ xấu làm được gì?

---

## Task 8: Project và Board UI (gộp F3 + F4)

- Trang chi tiết workspace: lưới project (card là `<Link>`), dialog tạo project (chỉ ADMIN thấy nút), sửa tên, xoá có hộp xác nhận.
- Route `/workspaces/:workspaceId/projects/:projectId`: danh sách board, mỗi board hiện số task theo trạng thái.
- **Breadcrumb:** Workspace › Project › Board, mỗi cấp là link.
- **Cập nhật lạc quan (optimistic update)** khi đổi tên project: đổi ngay trên UI, lỗi thì khôi phục (`onMutate` / `onError` / `onSettled`).
- Xoá thành công thì chuyển về trang cha và invalidate danh sách.

**Câu hỏi:** Khi nào dùng optimistic update, khi nào nên chờ server trả về?

---

## Task 9: Task và Comment API (gộp Task 9 + 10)

### Task
| Method   | URL                         | Ghi chú                                         |
| -------- | --------------------------- | ----------------------------------------------- |
| `GET`    | `.../boards/:boardId/tasks` | Lọc và phân trang (xem dưới)                    |
| `POST`   | `.../boards/:boardId/tasks` | `creatorId` lấy từ token                        |
| `GET`    | `.../tasks/:taskId`         | Kèm assignee, creator, số comment               |
| `PATCH`  | `.../tasks/:taskId`         | Sửa title, description, priority, dueDate, assignee |
| `PATCH`  | `.../tasks/:taskId/status`  | Đổi trạng thái (dùng cho kéo thả)               |
| `DELETE` | `.../tasks/:taskId`         | Người tạo hoặc ADMIN                            |

- **Lọc:** `status`, `priority`, `assigneeId`, `assignee=me`, `q` (tìm theo title). Query string parse bằng zod (`z.coerce`, `z.enum`).
- **Phân trang:** `page`, `pageSize` (mặc định 20, tối đa 100). Response `{ data, meta: { page, pageSize, total } }`. Lấy `total` và `data` trong một `prisma.$transaction([...])`.
- **`assigneeId` phải là thành viên của workspace**, nếu không → `400`. Đây là kiểm tra hay bị quên.
- Thêm index cần thiết (ví dụ `@@index([boardId, status])`) và giải thích vì sao.

### Comment
- `GET/POST .../tasks/:taskId/comments`, `PATCH/DELETE .../comments/:commentId`.
- Chỉ người viết được sửa. Người viết hoặc ADMIN được xoá.
- Danh sách phân trang theo **cursor** (`cursor`, `limit`), cũ nhất trước. So sánh với phân trang theo `page` ở trên.

**Câu hỏi:**
1. Phân trang offset (`page`) và cursor khác nhau thế nào khi có người thêm dữ liệu trong lúc bạn đang lật trang?
2. Index `(boardId, status)` giúp query nào? Query nào nó không giúp?

---

## Task 10: Kanban, chi tiết task, comment UI (F5)

- Route `.../boards/:boardId`: 3 cột `TODO`, `IN_PROGRESS`, `DONE`.
- **Kéo thả** bằng `@dnd-kit` để đổi trạng thái, có optimistic update và rollback khi lỗi. Hỗ trợ bàn phím (dnd-kit có sẵn keyboard sensor).
- **Bộ lọc** "Chỉ task của tôi", priority, tìm kiếm. **Bộ lọc nằm trên URL** (`?assignee=me&priority=HIGH`), để reload hay chia sẻ link vẫn giữ nguyên. Ô tìm kiếm có debounce.
- **Chi tiết task** mở trong Sheet/Drawer, URL `.../tasks/:taskId` (mở link trực tiếp cũng hiện được).
- Form tạo và sửa task: chọn assignee từ danh sách thành viên (Task 6), chọn ngày hết hạn.
- Comment: danh sách cuộn "Load more" (`useInfiniteQuery`), thêm, sửa, xoá comment của mình.

**Câu hỏi:** Vì sao lưu bộ lọc trên URL tốt hơn lưu trong `useState` hoặc store?

---

## Task 11: Bảo mật, logging, deploy

### Bảo mật
- `helmet`, `cors` chỉ cho phép origin của UI (từ env), `credentials: true` vì có cookie.
- Rate limit cho `/auth/login`, `/auth/register`, `/auth/refresh` (ví dụ `express-rate-limit`).
- Giới hạn kích thước body (`express.json({ limit: "100kb" })`).
- Job dọn `RefreshToken` đã hết hạn hoặc đã thu hồi.
- Kiểm tra lại: không log mật khẩu hoặc token; response lỗi 500 không lộ stack trace.

### Logging và health check
- Logger có cấu trúc (`pino`), mỗi request có `requestId`, log thời gian xử lý.
- `GET /health` (kiểm tra kết nối DB).

### Deploy
- `Dockerfile` cho server (multi-stage build), `docker-compose.yml` cho local (Postgres + server).
- Deploy: server và Postgres lên Render/Railway/Fly, UI lên Vercel/Netlify.
- Chạy `prisma migrate deploy` khi deploy. Env production tách riêng.
- Cookie refresh khi UI và API khác domain: kiểm tra `SameSite`, `Secure`. Ghi quyết định vào ADR mới.

**Câu hỏi:** Vì sao `cors` không phải là cơ chế bảo mật cho API (Postman vẫn gọi được)? Thứ thật sự bảo vệ API là gì?

---

## Task 12: Hoàn thiện để đi phỏng vấn

- **README:** giới thiệu, ảnh hoặc GIF demo, link deploy, sơ đồ kiến trúc và sơ đồ DB, cách chạy local, link tới các ADR.
- **Seed dữ liệu demo** (`prisma db seed`): 2 user, 1 workspace, vài project, board và task. Ghi tài khoản demo vào README.
- **Tài liệu API:** OpenAPI/Swagger (có thể sinh từ schema zod) hoặc collection Postman.
- Rà soát lỗi còn sót, chạy lại toàn bộ bảng tự kiểm tra các task.
- **Luyện trình bày:** chuẩn bị 3 câu chuyện kỹ thuật 2 phút mỗi câu, ví dụ:
  1. Refresh token rotation và đồng bộ đăng xuất nhiều tab.
  2. Phân quyền theo workspace, vì sao trả 404 thay vì 403, chống IDOR.
  3. Kéo thả Kanban với optimistic update và rollback.

---

## Cách làm với mỗi task

1. Nhờ Claude viết file yêu cầu chi tiết từ mục tương ứng ở đây.
2. Làm theo các bước, nhờ review ở các mốc trong file.
3. Chạy bảng tự kiểm tra, test tự động và `npm run check`.
4. Commit, tạo PR, merge khi CI xanh. Cập nhật cột "Trạng thái" ở bảng tổng quan.
