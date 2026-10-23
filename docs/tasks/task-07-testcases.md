# Task 7: Testcase thủ công cho Project và Board API

Dùng Postman (hoặc Thunder Client). Chuẩn bị trước:

- **A**: ADMIN của workspace `W1` (A tạo W1).
- **M**: MEMBER của `W1`. Chưa có API thêm thành viên (Task 6), nên tạm thêm bằng Prisma Studio: tạo bản ghi `WorkspaceMember` với `userId` của M, `workspaceId` của W1, `role = MEMBER`.
- **B**: người ngoài, không thuộc W1. B tạo workspace riêng `W2`.
- Lưu `{{W1}}`, `{{W2}}`, `{{P1}}` (project của W1), `{{P2}}` (project của W2), `{{B1}}` (board của P1) làm biến trong Postman.

Base URL: `/api/v1/workspaces/{{W1}}/projects`.

Mỗi dòng: gọi, so sánh status **và** body. Ghi kết quả thực tế vào cột cuối.

## Project

| #   | Ai  | Request                                                   | Mong đợi                              | Thực tế |
| --- | --- | --------------------------------------------------------- | ------------------------------------- | ------- |
| P1  | -   | `GET /projects` không gửi token                           | 401                                   |         |
| P2  | A   | `GET /projects` khi W1 chưa có project                    | 200, `data: []`                       |         |
| P3  | A   | `POST /projects` `{ "projectName": "Website" }`                  | 201, trả về project vừa tạo (có `id`) |         |
| P4  | A   | `POST /projects` `{ "projectName": "   " }`                      | 400, lỗi ở `name`                     |         |
| P5  | A   | `POST /projects` `{}`                                     | 400                                   |         |
| P6  | A   | `POST /projects` tên dài 101 ký tự                        | 400                                   |         |
| P7  | M   | `POST /projects` `{ "name": "X" }`                        | 403 "Only workspace admins..."        |         |
| P8  | B   | `POST /projects` `{ "name": "X" }`                        | 404 (không phải 403)                  |         |
| P9  | M   | `GET /projects`                                           | 200, thấy "Website"                   |         |
| P10 | B   | `GET /projects`                                           | 404                                   |         |
| P11 | A   | `GET /projects/{{P1}}`                                    | 200, đúng id, name, description       |         |
| P12 | A   | `GET /projects/abc`                                       | 400                                   |         |
| P13 | A   | `GET /projects/999999`                                    | 404 "Project not found"               |         |
| P14 | A   | `GET /workspaces/{{W1}}/projects/{{P2}}` (project của W2) | **404**: chống IDOR                   |         |
| P15 | B   | `GET /projects/{{P1}}`                                    | 404                                   |         |
| P16 | A   | `PATCH /projects/{{P1}}` `{ "name": "Website v2" }`       | 200, tên mới; `GET` lại thấy tên mới  |         |
| P17 | A   | `PATCH /projects/{{P1}}` `{ "name": "" }`                 | 400                                   |         |
| P18 | A   | `PATCH /projects/{{P1}}` không có body                    | 400 (không phải 500)                  |         |
| P19 | M   | `PATCH /projects/{{P1}}` `{ "name": "Y" }`                | 403                                   |         |
| P20 | M   | `DELETE /projects/{{P1}}`                                 | 403                                   |         |
| P21 | A   | `DELETE /projects/{{P1}}`                                 | 204, **không treo**, không có body    |         |
| P22 | A   | `GET /projects` sau P21                                   | 200, **không còn** P1                 |         |
| P23 | A   | `GET /projects/{{P1}}` sau P21                            | 404                                   |         |
| P24 | A   | `DELETE /projects/{{P1}}` lần hai                         | 404                                   |         |
| P25 | A   | `GET /workspaces/{{W1}}` sau P21                          | `projectCount` giảm 1                 |         |

## Board

Base URL: `/api/v1/workspaces/{{W1}}/projects/{{P1}}/boards`. Tạo lại một project mới làm `{{P1}}` nếu đã xoá ở trên.

**Tạo board theo lô:** `POST /boards` nhận **một mảng** board, tạo tất cả trong một request:

```json
{ "boards": [{ "title": "Sprint 1" }, { "title": "Sprint 2", "active": false }] }
```

- `title`: bắt buộc, `trim`, dài 1–100 ký tự. `active`: tùy chọn, mặc định `true`.
- Mảng có ít nhất 1 phần tử, tối đa 20 (tự chọn giới hạn, nhưng **phải có giới hạn**).
- **Tất cả hoặc không gì cả:** một board không hợp lệ thì cả request trả 400, không board nào được tạo.
- Response `201` trả về **mảng các board vừa tạo, có `id`**, để UI dùng được ngay. Lưu ý `createMany` chỉ trả `{ count }`. Tìm hiểu `createManyAndReturn` của Prisma.

Ký hiệu: `{{BD1}}`, `{{BD2}}` là id board lấy từ response của BC1. `{{BDX}}` là id một board thuộc project **khác** (tạo trước một board trong P2).

### Tạo board

| #    | Ai  | Request `POST /boards`                                                  | Mong đợi                                                             | Thực tế |
| ---- | --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| BC1  | A   | `{ "boards": [{ "title": "Sprint 1" }, { "title": "Sprint 2" }] }`      | 201, `data` là mảng 2 board, mỗi board có `id`, `title`, `active: true` |      |
| BC2  | A   | `{ "boards": [{ "title": "Backlog" }] }`                                | 201, mảng 1 phần tử                                                  |         |
| BC3  | A   | `{ "boards": [{ "title": "Archive", "active": false }] }`               | 201, `active: false`                                                 |         |
| BC4  | A   | `{ "boards": [] }`                                                      | 400 (mảng rỗng)                                                      |         |
| BC5  | A   | `{}` hoặc `{ "boards": "Sprint" }`                                      | 400                                                                  |         |
| BC6  | A   | `{ "boards": [{ "title": "   " }] }`                                    | 400, lỗi chỉ ra phần tử nào sai                                      |         |
| BC7  | A   | `{ "boards": [{ "title": "OK" }, { "title": "" }] }`                    | 400, và **"OK" không được tạo** (kiểm tra bằng `GET`)                |         |
| BC8  | A   | `{ "boards": [{ "title": "<101 ký tự>" }] }`                            | 400                                                                  |         |
| BC9  | A   | Mảng 11 phần tử                                                         | 400 (vượt giới hạn)                                                  |         |
| BC10 | A   | `{ "boards": [{ "title": "X", "projectId": 999 }] }`                    | 201, board vẫn thuộc **P1** (field lạ bị bỏ qua, không ghi đè được)  |         |
| BC11 | M   | `{ "boards": [{ "title": "Sprint 3" }] }`                               | 201 (MEMBER được tạo board)                                          |         |
| BC12 | B   | `{ "boards": [{ "title": "Hack" }] }`                                   | 404                                                                  |         |
| BC13 | A   | Gọi tới `/projects/{{P2}}/boards` (P2 thuộc W2)                         | 404                                                                  |         |

### Xem, sửa, xoá board

| #    | Ai  | Request                                                    | Mong đợi                                                             | Thực tế |
| ---- | --- | ---------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| B1   | A   | `GET /boards` khi project chưa có board (chạy trước BC1)   | 200, `data: []`                                                      |         |
| B2   | A   | `GET /boards` sau BC1–BC3, BC10, BC11                      | 200, đủ các board đã tạo, mới nhất trước                             |         |
| B3   | A   | `GET /boards` (khi đã có task, sau Task 9)                 | Mỗi board có số task theo `TODO` / `IN_PROGRESS` / `DONE`            |         |
| B4   | B   | `GET /boards`                                              | 404                                                                  |         |
| B5   | A   | `GET /workspaces/{{W1}}/projects/{{P2}}/boards`            | 404 (P2 không thuộc W1)                                              |         |
| B6   | A   | `PATCH /boards/{{BD1}}` `{ "title": "Sprint 1 (done)" }`   | 200, tên mới                                                         |         |
| B7   | M   | `PATCH /boards/{{BD1}}` `{ "active": false }`              | 200 (MEMBER được sửa board)                                          |         |
| B8   | A   | `PATCH /boards/{{BD1}}` `{ "title": "" }`                  | 400                                                                  |         |
| B9   | A   | `PATCH /boards/abc`                                        | 400                                                                  |         |
| B10  | A   | `PATCH /boards/{{BDX}}` (board của project khác, qua URL P1) | 404 "Board not found"                                              |         |
| B11  | M   | `DELETE /boards/{{BD1}}`                                   | 403                                                                  |         |
| B12  | A   | `DELETE /boards/{{BD1}}`                                   | 204, không treo, không có body                                       |         |
| B13  | A   | `GET /boards` sau B12                                      | Không còn BD1                                                        |         |
| B14  | A   | `PATCH /boards/{{BD1}}` sau B12                            | 404                                                                  |         |
| B15  | A   | Xoá project P1, rồi `GET /projects/{{P1}}/boards`          | 404 (project đã xoá thì board cũng không truy cập được)              |         |
| B16  | -   | Prisma Studio sau B15                                      | Các board của P1 đều có `deletedAt`                                  |         |

**Câu hỏi:** BC7 kiểm tra tính "tất cả hoặc không gì cả". Ở đây ai đảm bảo điều đó: zod (validate cả mảng trước khi vào service) hay database (`createMany` chạy trong một câu lệnh)? Nếu bạn thay `createMany` bằng vòng lặp `for` gọi `create` từng cái, chuyện gì có thể xảy ra?

## Sau khi test xong

Các testcase ở đây sẽ được chuyển thành test tự động khi làm [Task 5](task-05-testing.md). Ghi lại testcase nào fail và bạn đã sửa thế nào.
