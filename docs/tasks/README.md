# Lộ trình và tiến độ

File này theo dõi các task của dự án. Mỗi task lớn có một file yêu cầu riêng trong thư mục này. Các quyết định kiến trúc nằm trong `docs/adr/`.

## Quyết định sản phẩm (2026-10-14)

- **Luồng chính:** Home hiện các workspace user tham gia → vào workspace thấy danh sách project → vào project thấy danh sách board → vào board thấy bảng Kanban.
- **Giữ tầng Board** giữa Project và Task (phương án A), giống Jira/Trello. Một project có thể có nhiều board.
- **"Task của tôi":** bảng Kanban hiện tất cả task của board, có bộ lọc "Chỉ task của tôi" (`assigneeId` = user đang đăng nhập). Trang "My tasks" gom task từ mọi workspace sẽ làm sau.
- **URL phản ánh cấu trúc dữ liệu:** `/workspaces/:workspaceId/projects/:projectId/boards/:boardId`. Trạng thái "đang xem cái gì" nằm trên URL, không nằm trong store.

## Tiến độ

### Backend

| Task  | Nội dung                                                    | Trạng thái                                                  |
| ----- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| 1     | Validate body register                                      | ✅                                                          |
| 2     | Cấu hình env                                                | ✅                                                          |
| 3     | Login và access token                                       | ✅                                                          |
| 4     | Middleware `authenticate`, `GET /auth/me`                   | ✅                                                          |
| 5     | Refresh token (rotation) và logout                          | ✅                                                          |
| F1.0  | Refresh token trong cookie httpOnly                         | ✅                                                          |
| 6     | Workspace: danh sách, tạo mới, xem chi tiết, phân quyền     | ✅ [task-06-workspace-api.md](task-06-workspace-api.md)     |
| 7     | Project trong workspace                                     | ⬜                                                          |
| 8     | Board trong project                                         | ⬜                                                          |
| 9     | Task: CRUD, lọc theo status/assignee, đổi status            | ⬜                                                          |
| 10    | Comment                                                     | ⬜                                                          |
| 11    | Bảo mật: helmet, cors, rate limit, dọn bảng RefreshToken    | ⬜                                                          |
| 12    | Test (vitest, supertest)                                    | ⬜                                                          |

### Frontend

| Task   | Nội dung                                                              | Trạng thái                                      |
| ------ | --------------------------------------------------------------------- | ----------------------------------------------- |
| F0     | Monorepo, ESLint/Prettier, CI, ADR 0001–0004                          | ✅                                              |
| F1     | Auth: API client, refresh token, route guard, form, đồng bộ nhiều tab | ✅ (còn vài việc dọn dẹp, xem F2)               |
| **F2** | **Danh sách workspace, tạo workspace, trang chi tiết workspace**      | **⏳ [f2-workspace-ui.md](f2-workspace-ui.md)** |
| F3     | Danh sách project trong workspace                                     | ⬜ (sau Task 7)                                 |
| F4     | Danh sách board trong project                                         | ⬜ (sau Task 8)                                 |
| F5     | Bảng Kanban, kéo thả, bộ lọc "Chỉ task của tôi"                       | ⬜ (sau Task 9)                                 |

## Cách làm với mỗi task

1. Đọc file yêu cầu, làm theo thứ tự các bước.
2. Nhờ review ở các mốc được ghi trong file.
3. Chạy hết bảng "Tự kiểm tra" và `npm run check`.
4. Commit, tạo PR, merge khi CI xanh. Cập nhật trạng thái trong file này.
