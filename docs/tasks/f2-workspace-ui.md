# F2: Giao diện Workspace

- Trạng thái: Chờ Task 6
- Phụ thuộc: [Task 6](task-06-workspace-api.md) đã merge, F1 hoàn thành

## Mục tiêu

Trang Home hiện danh sách workspace user tham gia. User tạo được workspace mới. Bấm vào một workspace thì sang trang chi tiết workspace (Task 7 sẽ thêm danh sách project vào trang này).

**Học được:** tổ chức feature mới theo cấu trúc sẵn có, query key theo cấp, đủ 4 trạng thái của một màn hình dữ liệu, invalidate cache sau khi tạo mới, Dialog có accessibility, đọc tham số URL an toàn, hiển thị giao diện theo vai trò.

## Bước 0: Dọn dẹp còn lại từ F1

Làm trước, rồi commit riêng:

- [ ] **`AvatarDropdown`**: `DropdownMenuTrigger` đang bọc một `Button`, tạo ra thẻ `<button>` nằm trong `<button>` (HTML không hợp lệ, trình đọc màn hình đọc sai). Dùng `render` của Base UI: `<DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>`.
- [ ] **Nút avatar chỉ có icon** nên cần tên cho trình đọc màn hình: `aria-label="Open user menu"`.
- [ ] Các mục "Profile" và "Settings" chưa làm gì. Xoá, hoặc để `disabled` cho tới khi có trang tương ứng.
- [ ] **`AppHeader`**: dùng thẻ `<header>` thay cho `<div>`. Thay `bg-blue-100 border-blue-200` bằng token (`bg-background border-b`), theo quy ước 1 của ADR 0004. Thay chữ "Home" cứng bằng tên app hoặc logo, và cho nó là link về `/`.
- [ ] **`AppLayout`**: xoá `{" "}` và comment JSX do Prettier tách ra.
- [ ] **`session.ts`**: khi nhận thông điệp, `event.data` vẫn có kiểu `any`. Kiểm tra bằng schema zod trước khi dùng.
- [ ] Commit toàn bộ F1 và tạo PR. Hiện có rất nhiều file thay đổi chưa commit.

## Bước 1: Cấu trúc feature `workspace`

```
ui/src/features/workspace/
  api.ts                       ← list, create, getById (dùng unwrap, có kiểu từ @ttm/shared)
  queries.ts                   ← workspaceKeys, useWorkspaces, useWorkspace(id)
  hooks.ts                     ← useCreateWorkspace
  pages/
    WorkspaceListPage.tsx      ← thay cho HomePage
    WorkspaceDetailPage.tsx
  components/
    WorkspaceCard.tsx
    CreateWorkspaceDialog.tsx
```

- Xoá `features/auth/pages/HomePage.tsx`. Trang Home không thuộc feature auth.
- Xoá `useMe` nếu không còn dùng, hoặc giữ lại cho trang Profile sau này.

## Bước 2: Query key theo cấp

```ts
export const workspaceKeys = {
  all: ["workspaces"] as const,
  list: () => [...workspaceKeys.all, "list"] as const,
  detail: (id: number) => [...workspaceKeys.all, "detail", id] as const,
};
```

Nhờ chia theo cấp, `invalidateQueries({ queryKey: workspaceKeys.all })` làm mới cả danh sách lẫn mọi trang chi tiết.

## Bước 3: Route

```
/                            → WorkspaceListPage
/workspaces/:workspaceId     → WorkspaceDetailPage
```

Cả hai nằm trong nhóm `ProtectedRoute` → `AppLayout`.

**Đọc `:workspaceId` an toàn:** `useParams()` trả về `string | undefined`. Parse bằng zod (`z.coerce.number().int().positive()`). Không hợp lệ (ví dụ `/workspaces/abc`) thì hiện trạng thái "không tìm thấy", không gọi API.

## Bước 4: `WorkspaceListPage`

Màn hình phải có đủ **4 trạng thái**:

| Trạng thái | Hiển thị                                                                |
| ---------- | ----------------------------------------------------------------------- |
| Đang tải   | Skeleton có hình dạng giống các card (`npx shadcn@latest add skeleton`) |
| Lỗi        | Thông báo dễ hiểu và nút "Try again" (gọi `refetch`)                    |
| Rỗng       | "You don't have any workspace yet" và nút "Create workspace"            |
| Có dữ liệu | Lưới các `WorkspaceCard`, và nút "Create workspace" ở đầu trang         |

**`WorkspaceCard`**: tên workspace, badge vai trò (`ADMIN`/`MEMBER`), số thành viên, số project.

- **Cả card là một `<Link to={/workspaces/${id}}>`**, không phải `<div onClick={navigate}>`. Link cho phép Ctrl+Click mở tab mới, dùng được bằng bàn phím, và trình đọc màn hình hiểu đó là liên kết.
- Lưới co giãn theo màn hình: 1 cột trên điện thoại, 2–3 cột trên màn hình lớn.

## Bước 5: `CreateWorkspaceDialog`

- Dùng `Dialog` của shadcn (`npx shadcn@latest add dialog`). Dialog đã lo phần giữ focus bên trong, đóng bằng Esc, và trả focus về nút mở khi đóng.
- Form dùng `FormField`, `zodResolver(createWorkspaceSchema)` từ `@ttm/shared`, lỗi API qua `applyApiErrorToForm`.
- Nút submit bị disable khi đang gửi.
- `useCreateWorkspace` (`useMutation`):
  - Thành công: `invalidateQueries({ queryKey: workspaceKeys.list() })`, đóng dialog, reset form, rồi chuyển sang trang chi tiết của workspace vừa tạo.
  - Lỗi: dialog vẫn mở, lỗi hiện trong form.

## Bước 6: `WorkspaceDetailPage`

- `useWorkspace(id)` lấy dữ liệu từ `GET /workspaces/:workspaceId`.
- Hiện tên workspace và badge vai trò. Phần nội dung tạm ghi "Projects will appear here" (Task 7).
- **API trả 404** (không phải thành viên, hoặc workspace không tồn tại): hiện trạng thái "Workspace not found" kèm link về `/`. Không để trang trắng hay rơi vào `RouteErrorPage`.
- **Giao diện theo vai trò:** chỉ ADMIN thấy nút "Settings" (tạm thời `disabled`). Đây chỉ là che giao diện; backend vẫn phải kiểm tra quyền ở mọi API.

## Tự kiểm tra

| #   | Thao tác                                     | Mong đợi                                                                                   |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | User mới đăng nhập, vào `/`                  | Thấy trạng thái rỗng và nút "Create workspace"                                             |
| 2   | Bật Slow 3G, reload `/`                      | Thấy skeleton trước khi có dữ liệu                                                         |
| 3   | Tắt backend, reload `/`                      | Thấy thông báo lỗi và nút "Try again". Bật backend, bấm nút thì tải được                   |
| 4   | Tạo workspace tên để trống                   | Lỗi hiện dưới ô name, không gửi request                                                    |
| 5   | Tạo workspace "Team A"                       | Dialog đóng, chuyển sang trang chi tiết. Quay về `/` thấy "Team A" **mà không cần reload** |
| 6   | Bấm 2 lần thật nhanh vào nút tạo             | Chỉ có 1 request `POST /workspaces`                                                        |
| 7   | Mở dialog, bấm Esc                           | Dialog đóng, focus quay lại nút "Create workspace"                                         |
| 8   | Ctrl+Click vào một card                      | Mở trang chi tiết ở tab mới                                                                |
| 9   | Dùng Tab để đi qua các card, Enter để mở     | Hoạt động bằng bàn phím                                                                    |
| 10  | Vào `/workspaces/abc`                        | Trạng thái "not found", **không có request** gửi đi                                        |
| 11  | User B vào URL workspace của user A          | "Workspace not found"                                                                      |
| 12  | User là MEMBER vào workspace                 | Không thấy nút "Settings"                                                                  |
| 13  | Đăng xuất bằng user A, đăng nhập bằng user B | Không thấy workspace của A dù chỉ một khoảnh khắc (cache đã bị xoá)                        |
| 14  | Màn hình 375px                               | Lưới còn 1 cột, dialog vừa màn hình                                                        |
| 15  | `npm run check`                              | Xanh                                                                                       |

## Câu hỏi để suy nghĩ

1. Sau khi tạo workspace, vì sao dùng `invalidateQueries` thay vì tự thêm workspace mới vào cache bằng `setQueryData`? Khi nào thì `setQueryData` hợp lý hơn?
2. Vì sao ẩn nút "Settings" với MEMBER là chưa đủ để bảo mật?
3. Vì sao card nên là `<Link>` mà không phải `<div onClick>`?

## Các mốc nhờ review

1. Xong Bước 0 → review nhanh và tạo PR cho F1.
2. Xong Bước 1–4 (danh sách, đủ 4 trạng thái) → review.
3. Xong Bước 5–6 (dialog, trang chi tiết), chạy hết bảng tự kiểm tra → hoàn thành F2.
