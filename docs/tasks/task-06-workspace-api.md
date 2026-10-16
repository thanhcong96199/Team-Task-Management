# Task 6: API Workspace

- Trạng thái: Hoàn thành (2026-10-15)
- Phụ thuộc: Task 1–5 (auth), middleware `authenticate`
- Frontend dùng API này: [F2](f2-workspace-ui.md)

## Mục tiêu

User xem được các workspace mình tham gia (kèm vai trò), tạo được workspace mới (và tự động trở thành ADMIN), xem được chi tiết một workspace nếu là thành viên.

**Học được:** lấy danh tính từ token thay vì từ URL (chống IDOR), ghi nhiều bảng trong một thao tác nguyên tử, middleware phân quyền theo vai trò, chọn đúng 404 hay 403, đếm dữ liệu liên quan mà không bị N+1.

## Review phần code đã có trong `server/src/modules/workspace/`

Bản nháp hiện tại có các lỗi sau, cần sửa khi làm task này:

| Vị trí                    | Vấn đề                                                | Hậu quả                                                                                                                    |
| ------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `workspace.routes.ts`     | Route `GET /workspaces/:userId` lấy `userId` từ URL   | **Lỗ hổng IDOR**: user A gọi `/workspaces/2` là xem được workspace của user B. Danh tính phải lấy từ token (`req.user.id`) |
| `workspace.routes.ts`     | Không có middleware `authenticate`                    | Ai cũng gọi được, kể cả khi chưa đăng nhập                                                                                 |
| `workspace.controller.ts` | Đọc `req.params.id`, nhưng route đặt tên là `:userId` | `Number(undefined)` là `NaN`                                                                                               |
| `workspace.controller.ts` | Thiếu `await` trước `getWorkspaceOfUser`              | Trả về một Promise, nên body là `{}`                                                                                       |
| `workspace.controller.ts` | Trả status `201` cho request `GET`                    | `201` chỉ dùng khi tạo mới. `GET` trả `200`                                                                                |
| `workspace.validation.ts` | `z.string()` dùng cho `req.params`                    | `req.params` là object, nên validate luôn thất bại                                                                         |
| `workspace.service.ts`    | Trả về nguyên các bản ghi `WorkspaceMember`           | Thiếu tên workspace, thừa các field nội bộ. Cần `select` đúng dữ liệu                                                      |
| `workspace.service.ts`    | `console.log`                                         | Xoá                                                                                                                        |
| `app.ts`                  | Router chưa được gắn vào app                          | Mọi request tới `/workspaces` đều 404                                                                                      |

## Bước 6.1: Hợp đồng dữ liệu trong `@ttm/shared`

Tạo `packages/shared/src/workspace.schema.ts` và export từ `index.ts`:

- `createWorkspaceSchema`: `{ name }`, chuỗi, `trim`, dài 1–100 ký tự.
- Type `WorkspaceRole = "ADMIN" | "MEMBER"`.
- Type `WorkspaceSummary`: dữ liệu một dòng trong danh sách.
  ```ts
  {
    id: number;
    name: string;
    role: WorkspaceRole; // vai trò của user hiện tại trong workspace này
    memberCount: number;
    projectCount: number; // chỉ đếm project chưa bị xoá mềm
    createdAt: string; // JSON không có kiểu Date
  }
  ```
- Type `WorkspaceDetail`: tạm thời giống `WorkspaceSummary`. Task 7 sẽ bổ sung.

Nhớ chạy `npm run build:shared` sau khi sửa.

## Bước 6.2: Các endpoint

Gắn router vào `app.ts` ở `/api/v1/workspaces`. **Mọi route đều qua `authenticate`.** Có thể gắn một lần cho cả router: `workspaceRouter.use(authenticate)`.

| Method | URL                        | Quyền        | Kết quả                                             |
| ------ | -------------------------- | ------------ | --------------------------------------------------- |
| `GET`  | `/workspaces`              | Đã đăng nhập | `200`, mảng `WorkspaceSummary[]` của user hiện tại  |
| `POST` | `/workspaces`              | Đã đăng nhập | `201`, `WorkspaceSummary` vừa tạo (`role: "ADMIN"`) |
| `GET`  | `/workspaces/:workspaceId` | Thành viên   | `200`, `WorkspaceDetail`                            |

### `GET /workspaces`

- Lấy `userId` từ `req.user.id`. **Không nhận `userId` từ URL hay query.**
- Chỉ lấy workspace chưa bị xoá mềm (`deletedAt: null`).
- Sắp xếp theo `createdAt` giảm dần (workspace mới nhất lên đầu).
- Đếm `memberCount` và `projectCount` **ngay trong cùng một query** bằng `_count` của Prisma. Không gọi thêm một query cho mỗi workspace (lỗi N+1).
- Không có workspace nào thì trả `[]`, không phải 404.

### `POST /workspaces`

- Validate body bằng `createWorkspaceSchema`.
- **Tạo workspace và bản ghi `WorkspaceMember` (role `ADMIN`) trong cùng một thao tác nguyên tử.** Nếu tạo member thất bại, workspace cũng không được tạo, để không có workspace "mồ côi" không ai quản lý.
  - Gợi ý: nested write của Prisma (`workspace.create({ data: { name, workspaceMembers: { create: {...} } } })`) chạy trong một transaction.

### `GET /workspaces/:workspaceId`

- Dùng middleware phân quyền ở bước 6.3.
- Trả `WorkspaceDetail` kèm `role` của user hiện tại.

## Bước 6.3: Middleware phân quyền `requireWorkspaceMember`

Đặt trong `server/src/modules/workspace/workspace.middleware.ts`. Task 7–9 sẽ dùng lại.

1. Parse `req.params.workspaceId` bằng zod (`z.coerce.number().int().positive()`). Không hợp lệ thì `400`.
2. Tìm `WorkspaceMember` theo `userId` (từ token) và `workspaceId`, với workspace chưa bị xoá. Dùng khoá `@@unique([userId, workspaceId])` đã có trong schema.
3. **Không phải thành viên → `404 "Workspace not found"`**, không phải 403. Như vậy người ngoài không biết workspace đó có tồn tại hay không.
4. Là thành viên → gắn thông tin vào request (ví dụ `req.membership = { workspaceId, role }`) rồi `next()`. Khai báo kiểu trong `src/types/express.d.ts`, giống cách đã làm với `req.user`.
5. Cho phép yêu cầu vai trò: `requireWorkspaceMember("ADMIN")`. Là thành viên nhưng không đủ vai trò → **`403 "Only workspace admins can perform this action"`**.

| Trường hợp                                                          | Mã  | Lý do                                                 |
| ------------------------------------------------------------------- | --- | ----------------------------------------------------- |
| `workspaceId` không phải số                                         | 400 | Dữ liệu sai định dạng                                 |
| Không phải thành viên, hoặc workspace không tồn tại, hoặc đã bị xoá | 404 | Giấu sự tồn tại của workspace                         |
| Là thành viên nhưng thiếu quyền                                     | 403 | User đã biết workspace tồn tại, chỉ là không đủ quyền |

Middleware throw `AppError`, không tự trả response, để mọi lỗi đi qua `errorHandler`.

## Bước 6.4: Dọn dẹp

- Xoá `board.middleware.ts` cũ, hoặc viết lại theo cách của `requireWorkspaceMember` ở Task 8. Bản hiện tại trả `404` kèm message `"Forbidden"` và tự trả response thay vì throw.
- Xoá `boardParamsSchema` khỏi `validate.middleware.ts` (sẽ chuyển về module board ở Task 8).

## Tự kiểm tra

Tạo 2 user A và B. Dùng Postman với access token của từng user.

| #   | Thao tác                                                                                         | Mong đợi                                                  |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| 1   | `GET /workspaces` không gửi token                                                                | 401                                                       |
| 2   | A gọi `GET /workspaces` khi chưa có workspace                                                    | 200, `[]`                                                 |
| 3   | A gọi `POST /workspaces` với `{ "name": "Team A" }`                                              | 201, `role: "ADMIN"`, `memberCount: 1`, `projectCount: 0` |
| 4   | A gọi `POST /workspaces` với `{ "name": "   " }`                                                 | 400, lỗi ở field `name`                                   |
| 5   | A gọi `GET /workspaces`                                                                          | 200, có "Team A"                                          |
| 6   | B gọi `GET /workspaces`                                                                          | 200, `[]`. **Không thấy workspace của A**                 |
| 7   | B gọi `GET /workspaces/<id của Team A>`                                                          | **404**                                                   |
| 8   | A gọi `GET /workspaces/abc`                                                                      | 400                                                       |
| 9   | A gọi `GET /workspaces/<id của Team A>`                                                          | 200                                                       |
| 10  | Trong Prisma Studio, gán `deletedAt` cho Team A, rồi A gọi lại test #5 và #9                     | Không còn trong danh sách, và chi tiết trả 404            |
| 11  | Trong Prisma Studio: có đúng 1 bản ghi `WorkspaceMember` (role `ADMIN`) cho mỗi workspace đã tạo | Đúng                                                      |
| 12  | `npm run check`                                                                                  | Xanh                                                      |

## Câu hỏi để suy nghĩ

1. Vì sao lấy `userId` từ URL là lỗ hổng, kể cả khi đã có middleware `authenticate`?
2. Nested write của Prisma khác gì so với gọi `create` hai lần liên tiếp? Chuyện gì xảy ra nếu lần gọi thứ hai lỗi?
3. Khoá `@@unique([userId, workspaceId])` có giúp query "tất cả workspace của user X" chạy nhanh không? Vì sao? (Gợi ý: thứ tự cột trong index.)
4. Nếu đếm `projectCount` bằng cách gọi một query riêng cho từng workspace, một user có 50 workspace sẽ tốn bao nhiêu query?

## Các mốc nhờ review

1. Xong 6.1 và `GET /workspaces` → review.
2. Xong `POST /workspaces` và middleware 6.3 → review.
3. Chạy hết bảng tự kiểm tra, trả lời câu hỏi → hoàn thành, bắt đầu F2.
