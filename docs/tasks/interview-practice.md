# Luyện phỏng vấn React qua project

File này gắn **17 câu hỏi phỏng vấn bạn từng gặp** với các bài tập làm ngay trong project. Mục tiêu: khi bị hỏi, bạn trả lời bằng **việc mình đã làm** ("trong project em đã...") thay vì học thuộc lý thuyết.

## Cách dùng

Với mỗi câu:

1. Đọc **Ý chính** để biết hướng. Đây không phải câu trả lời đầy đủ.
2. Làm **Bài tập** trong project.
3. Trả lời **Tự kiểm tra**.
4. Tự viết câu trả lời 1–2 phút bằng lời của mình, rồi gửi Claude nhận xét như phỏng vấn thật.

Cột "Khi nào làm" cho biết bài tập gắn với task nào trong [roadmap.md](roadmap.md). Những câu ghi "Ngay" làm được với code hiện tại.

## Tổng quan

| #   | Câu hỏi                                                  | Bài tập trong project                                | Khi nào làm |
| --- | -------------------------------------------------------- | ---------------------------------------------------- | ----------- |
| 1   | Props và state khác nhau thế nào                         | Phân tích `WorkspaceCard` và `CreateWorkspaceDialog` | Ngay        |
| 2   | Component không có props có render lại khi cha render?   | Đo bằng React DevTools Profiler                      | Ngay        |
| 3   | Session, cookie, localStorage                            | Giải thích cách lưu token của project                | Ngay        |
| 4   | Strict Mode                                              | Quan sát request `/me` bị gọi 2 lần                  | Ngay        |
| 5   | So sánh Promise và async/await                           | Gọi API song song và tuần tự                         | Ngay        |
| 6   | Một API dùng nhiều chỗ, chỉ gọi 1 lần                    | Hook `useWorkspace` dùng ở nhiều component           | Ngay        |
| 7   | Khi nào dùng state, store, context                       | Rà lại state trong project                           | Ngay        |
| 8   | Setup biến theme                                         | Dark mode bằng CSS variables                         | Ngay        |
| 9   | Design system                                            | Ghi lại token và variant của project                 | Ngay        |
| 10  | Mở modal ở B nhưng modal nằm ở A                         | Mở chi tiết task từ card                             | Task 8–10   |
| 11  | `key` trong React, 2 list dùng index làm key             | Danh sách board và task                              | Task 8–10   |
| 12  | API trả rất nhiều user, tối ưu phía FE                   | Danh sách task lớn, virtualization                   | Task 10     |
| 13  | Component search select user mượt                        | Ô chọn assignee có tìm kiếm                          | Task 10     |
| 14  | `useTransition`                                          | Lọc task trên Kanban                                 | Task 10     |
| 15  | Memory leak trong React                                  | Dọn effect, BroadcastChannel, WebSocket              | Task 10     |
| 16  | WebSocket: client B nhận message từ client A             | Kanban cập nhật realtime                             | Task 10+    |
| 17  | Người dùng mở nhiều tab trang bảng giá, tối ưu hiệu năng | Chỉ một tab giữ kết nối WebSocket                    | Task 10+    |

---

## Nhóm 1: Nền tảng React

### 1. Props và state khác nhau thế nào?

**Ý chính**

- **Props**: dữ liệu **cha truyền xuống**. Component con chỉ đọc, không sửa.
- **State**: dữ liệu component **tự sở hữu và tự thay đổi**. Gọi `setState` thì component render lại.
- Cùng một dữ liệu có thể là state ở cha và là props ở con. Đây là "lifting state up".

**Bài tập**

- Mở `WorkspaceListPage`, `CreateWorkspaceDialog`, `WorkspaceCard`. Liệt kê: `openDialog` là gì ở `WorkspaceListPage`, và là gì ở `CreateWorkspaceDialog`?
- Vì sao `open` của dialog phải nằm ở `WorkspaceListPage` mà không nằm trong dialog?

**Tự kiểm tra:** Nếu con muốn thay đổi dữ liệu của cha thì làm thế nào? (Gợi ý: `onClose` trong project.)

### 2. Component không có props, cha render lại thì nó có render lại không?

**Ý chính**

- **Có.** Mặc định, cha render thì **mọi con đều render lại**, dù props không đổi hay không có props.
- Muốn bỏ qua: bọc bằng `React.memo`. Khi đó con chỉ render lại nếu props thay đổi (so sánh nông).
- `memo` mất tác dụng nếu cha truyền object hoặc hàm **tạo mới mỗi lần render**. Lúc đó cần `useMemo` / `useCallback`.
- React Compiler (React 19) có thể tự làm việc này.
- Render lại không có nghĩa là DOM thay đổi. React chỉ cập nhật DOM ở chỗ khác biệt.

**Bài tập**

1. Cài React DevTools, bật **"Highlight updates when components render"**.
2. Ở `WorkspaceListPage`, bấm mở dialog. Những component nào nháy? `WorkspaceCard` có nháy không?
3. Bọc `WorkspaceCard` bằng `memo`, thử lại. Rồi truyền thêm prop `onClick={() => {}}` và quan sát `memo` mất tác dụng.
4. Dùng tab **Profiler** ghi lại một lần mở dialog, xem component nào tốn thời gian.

**Tự kiểm tra:** Vì sao không nên bọc mọi component bằng `memo`?

### 3. Phân biệt session, cookie, localStorage

**Ý chính**

|                  | Cookie                       | localStorage    | sessionStorage           |
| ---------------- | ---------------------------- | --------------- | ------------------------ |
| Gửi lên server   | **Tự động** theo mỗi request | Không           | Không                    |
| JS đọc được      | Được, **trừ khi `httpOnly`** | Được            | Được                     |
| Sống bao lâu     | Theo `Expires` / `Max-Age`   | Mãi tới khi xoá | Tới khi **đóng tab**     |
| Chia sẻ giữa tab | Có                           | Có              | **Không**, mỗi tab riêng |
| Dung lượng       | ~4KB                         | ~5MB            | ~5MB                     |

"Session" ở phía server là dữ liệu đăng nhập lưu trên server, client chỉ giữ **session id** trong cookie.

**Bài tập:** Project đã có sẵn câu trả lời. Đọc lại [ADR 0003](../adr/0003-refresh-token-storage.md) và tự giải thích:

- Vì sao refresh token nằm trong cookie **`httpOnly`**, không nằm trong localStorage? (Từ khoá: **XSS**.)
- Vì sao access token chỉ nằm **trong bộ nhớ** (biến JS)? Reload trang thì mất, vậy làm sao vẫn đăng nhập?
- Cookie gửi tự động thì có nguy cơ gì? `SameSite` giúp gì? (Từ khoá: **CSRF**.)

**Tự kiểm tra:** Mở DevTools → Application → Cookies. Thử `document.cookie` trong Console, có thấy refresh token không? Vì sao?

### 4. Strict Mode

**Ý chính**

- `<StrictMode>` chỉ có tác dụng ở **môi trường dev**, không ảnh hưởng production.
- Nó cố tình **render 2 lần** và **chạy effect 2 lần** (mount → unmount → mount), để lộ ra các effect thiếu cleanup và code có tác dụng phụ trong lúc render.
- Nếu effect chạy 2 lần mà app hỏng, thì effect đó vốn đã sai. Trong thực tế, chuyện component mount lại vẫn xảy ra.

**Bài tập**

1. Mở `ui/src/main.tsx`, kiểm tra có `<StrictMode>` không.
2. Mở tab Network, reload. Có request nào bị gọi 2 lần không (ví dụ refresh token lúc khởi động)? Nếu có, nó có gây lỗi không? Với refresh token **rotation**, gọi 2 lần song song là nguy hiểm. Vì sao?
3. Tìm chỗ nào trong project tự xử lý việc này (gợi ý: `bootstrap.ts`).

**Tự kiểm tra:** Vì sao TanStack Query không bị gọi API 2 lần dưới Strict Mode?

### 5. So sánh Promise và async/await

**Ý chính**

- `async/await` **chỉ là cú pháp** viết Promise dễ đọc hơn. Hàm `async` luôn trả về Promise.
- Bắt lỗi: `.catch()` với Promise, `try/catch` với `await`.
- Bẫy hay gặp: `await` liên tiếp chạy **tuần tự**. Muốn chạy **song song** thì dùng `Promise.all`. Muốn không bị dừng khi một request lỗi thì dùng `Promise.allSettled`.

**Bài tập**

- Trong `workspace.test.ts`, test tạo user A và B đang `await` tuần tự. Viết lại bằng `Promise.all` và so sánh thời gian chạy.
- Trong `board.service.ts`, `getAllBoard` gọi 2 query. Có chạy song song được không? Vì sao? (Gợi ý: query 2 cần kết quả query 1.)
- `authApi.login` dùng `.then().then()`. Viết lại bằng `async/await`.

**Tự kiểm tra:** `Promise.all([a(), b()])` mà `a()` lỗi thì chuyện gì xảy ra với `b()`?

### 6. Một API dùng ở nhiều chỗ, làm sao chỉ gọi 1 lần?

**Ý chính**

- Gom logic gọi API vào **một custom hook**, ví dụ `useWorkspace(id)`, dùng chung một **query key**.
- TanStack Query tự **gộp các request trùng** (deduplication): 10 component cùng gọi `useWorkspace(5)` thì chỉ có 1 request, và tất cả dùng chung cache.
- Không có thư viện thì tự làm: lưu **Promise đang chạy** vào một Map theo key, request sau dùng lại Promise đó.

**Bài tập**

1. Dùng `useWorkspace(id)` ở **2 component cùng lúc**: `WorkspaceDetailPage` và một component `WorkspaceHeader` mới. Mở Network: có mấy request `GET /workspaces/:id`?
2. **Không** dùng TanStack, viết một hàm `fetchOnce(key, fn)` dùng `Map<string, Promise>` để 2 lần gọi cùng lúc chỉ tạo 1 request. Đây là câu hỏi đào sâu hay gặp.

**Tự kiểm tra:** Vì sao lưu **Promise** chứ không lưu **kết quả**?

### 7. Khi nào dùng state, store, context?

**Ý chính**

- **`useState`**: dữ liệu chỉ một component (và con trực tiếp) dùng. Ví dụ: dialog đang mở.
- **Context**: dữ liệu **ít thay đổi**, cần ở nhiều nơi xa nhau. Ví dụ: theme, ngôn ngữ, `QueryClient`. Nhược điểm: giá trị đổi thì **mọi component dùng context đều render lại**.
- **Store (Zustand, Redux)**: dữ liệu toàn cục **thay đổi thường xuyên**. Có **selector** nên component chỉ render lại khi phần nó chọn thay đổi. Đọc được cả **bên ngoài React**.
- **Server state** thì dùng TanStack Query, không dùng 3 loại trên (xem câu luyện số 1 trước đó).

**Bài tập**

- Lập bảng mọi state trong `ui/src`: tên, đang dùng gì, nên dùng gì.
- Trong `AppHeader`: `useAuthStore((s) => s.user)`. Nếu đổi thành `useAuthStore()` (lấy cả store) thì khi access token đổi, `AppHeader` có render lại không? Kiểm tra bằng Profiler.

**Tự kiểm tra:** Vì sao không nên đặt auth vào Context trong project này?

### 8. Setup biến theme như thế nào?

**Ý chính**

- Khai báo màu bằng **CSS variables** (`--background`, `--primary`...) trên `:root`, định nghĩa lại dưới class `.dark`.
- Component chỉ dùng token (`bg-background`), không dùng màu cứng (`bg-blue-100`). Xem quy ước trong [ADR 0004](../adr/0004-styling-tailwind-shadcn.md).
- Đổi theme bằng cách thêm hoặc bỏ class `dark` trên `<html>`. Không component nào phải render lại.
- Lưu lựa chọn vào localStorage. Mặc định theo hệ điều hành (`prefers-color-scheme`).
- Tránh **nháy màu khi tải trang**: đặt một đoạn script nhỏ trong `index.html` để gắn class trước khi React chạy.

**Bài tập:** Làm nút chuyển Light / Dark / System trên `AppHeader`, theo đúng các ý trên. Kiểm tra reload không bị nháy.

**Tự kiểm tra:** Vì sao đổi theme bằng CSS variables nhanh hơn lưu màu trong React Context?

### 9. Design system

**Ý chính**

- Design system gồm: **token** (màu, khoảng cách, cỡ chữ, bo góc), **component** dùng chung có **variant** (Button: default, outline, destructive...), **quy tắc** dùng và tài liệu.
- Project dùng **shadcn/ui** trên **Base UI**: code component nằm ngay trong repo (`shared/ui`), tự sửa được. Variant viết bằng **`cva`**.

**Bài tập**

- Đọc `shared/ui/button.tsx`, giải thích `cva` làm gì.
- Tạo `Badge` cho vai trò (`ADMIN`, `MEMBER`) và trạng thái task (`TODO`...) bằng variant, không viết class màu rời rạc trong từng trang.

**Tự kiểm tra:** shadcn/ui khác MUI hay Ant Design ở điểm nào? Ưu và nhược điểm?

---

## Nhóm 2: Làm cùng các task UI (Task 8–10)

### 10. Component B nằm trong A, mở modal từ B nhưng modal nằm ở A

**Ý chính**: có 3 cách, nên nêu được cả 3 kèm đánh đổi.

1. **Lifting state up**: state `open` và dữ liệu đang chọn nằm ở A, B nhận callback `onOpen(task)`. Đơn giản, nhưng nếu B nằm sâu thì phải truyền props qua nhiều tầng (**prop drilling**).
2. **Context hoặc store**: A cung cấp `openTaskDetail(id)`, B ở tầng nào cũng gọi được.
3. **URL**: B là `<Link to=".../tasks/5">`, A đọc `taskId` từ URL để mở modal. Reload hay chia sẻ link vẫn mở đúng modal.

Ngoài ra còn **Portal** (`createPortal`): modal **khai báo** ở B nhưng **render** ra cuối `<body>`, để không bị `overflow: hidden` hay `z-index` của cha che. `Dialog` của shadcn đã dùng Portal sẵn.

**Bài tập (Task 10):** Kanban: `BoardPage` (A) → `Column` → `TaskCard` (B). Bấm `TaskCard` thì mở `TaskDetailSheet` nằm ở `BoardPage`. Làm theo cách URL (roadmap yêu cầu), rồi viết thêm phiên bản lifting state để so sánh.

**Tự kiểm tra:** Mở DevTools → Elements. Dialog đang mở nằm ở đâu trong DOM? Vì sao?

### 11. `key` trong React, 2 list cùng dùng index làm key

**Ý chính**

- `key` giúp React biết **phần tử nào là phần tử nào** giữa các lần render, để giữ đúng state và DOM.
- Dùng **index** làm key sai khi danh sách **bị thêm/xoá ở đầu/giữa, sắp xếp lại, lọc**: React gán state của phần tử cũ cho phần tử mới. Dùng **id ổn định** từ dữ liệu.
- `key` chỉ cần **duy nhất giữa các anh em trong cùng một list**. Vì vậy 2 list khác nhau (user A và user B) cùng có key `0, 1, 2` **không ảnh hưởng nhau**.
- Đổi `key` của một component thì React **huỷ và tạo lại** nó. Đây là mẹo để reset state, ví dụ reset form.

**Bài tập (Task 8):**

1. Danh sách board: tạm dùng `key={index}`, mỗi card có một `<input>`. Gõ chữ vào card thứ 2, rồi **xoá card thứ 1**. Chữ bị nhảy sang card nào?
2. Đổi lại `key={board.id}` và thử lại.
3. Dùng `key={workspaceId}` trên `WorkspaceDetailPage` để reset state khi chuyển workspace.

**Tự kiểm tra:** Khi nào dùng index làm key là chấp nhận được?

### 12. API trả rất nhiều user, tối ưu phía FE thế nào?

**Ý chính:** cách tốt nhất là **không tải hết**, sau đó mới tới việc render ít.

1. **Phân trang** hoặc **cuộn vô hạn** từ server (`useInfiniteQuery`).
2. **Lọc và tìm kiếm phía server**, không tải hết về rồi `filter`.
3. Nếu bắt buộc phải có cả danh sách: **virtualization**, chỉ render các dòng đang nhìn thấy (`@tanstack/react-virtual`, `react-window`). 10.000 dòng nhưng chỉ khoảng 20 thẻ DOM.
4. `memo` cho từng dòng, `key` ổn định, tránh tính toán nặng trong lúc render (`useMemo`).

**Bài tập (Task 9–10):**

1. Seed **5.000 task** vào một board.
2. Render tất cả không phân trang. Đo bằng Profiler, ghi lại thời gian render và cảm giác cuộn.
3. Áp dụng phân trang hoặc cuộn vô hạn (API Task 9 đã có `page`).
4. Áp dụng virtualization cho một cột. Đo lại và so sánh số liệu.

Có số liệu "trước X ms, sau Y ms" là câu trả lời rất mạnh khi phỏng vấn.

**Tự kiểm tra:** Virtualization có nhược điểm gì? (Gợi ý: Ctrl+F của trình duyệt, chiều cao dòng thay đổi.)

### 13. Component search select user, làm sao cho mượt?

**Ý chính**

- **Debounce** ô nhập (300ms): gõ "nguyen" không bắn 6 request.
- **Huỷ request cũ** khi có request mới (`AbortController`; TanStack Query truyền sẵn `signal` cho `queryFn`). Tránh **race condition**: response cũ về sau đè lên kết quả mới.
- `placeholderData: keepPreviousData` để danh sách không nháy trống khi đang tải.
- Danh sách dài thì virtualization (câu 12).
- **Accessibility**: điều hướng bằng phím mũi tên, Enter để chọn, `role="combobox"`. Nên dùng Combobox có sẵn (Base UI/shadcn) thay vì tự viết.

**Bài tập (Task 10):** Ô chọn assignee trong form task. API `GET /workspaces/:id/members?q=...` (thêm vào Task 6). Làm đủ 5 ý trên. Kiểm tra bằng Network với chế độ Slow 3G: gõ nhanh thì chỉ có request cuối được dùng.

**Tự kiểm tra:** Debounce và throttle khác nhau thế nào? Ô tìm kiếm dùng cái nào?

### 14. `useTransition`

**Ý chính**

- Đánh dấu một cập nhật state là **"không gấp"**. React ưu tiên các cập nhật gấp (gõ phím), và có thể **ngắt** việc render cập nhật không gấp nếu có thao tác mới.
- Dùng khi một thao tác gây **render nặng** làm UI bị khựng, ví dụ lọc danh sách lớn.
- `isPending` cho biết đang chuyển, để hiện hiệu ứng mờ hay spinner.
- `useDeferredValue` có cùng ý tưởng, nhưng áp dụng cho **một giá trị** thay vì một hàm set state.
- Không thay được debounce: transition giúp **render** mượt, không giảm **số request**.

**Bài tập (Task 10):** Bộ lọc "tìm theo title" lọc **phía client** trên 5.000 task (câu 12):

1. Không dùng gì: gõ nhanh có bị khựng không?
2. Bọc `setFilter` trong `startTransition`, hoặc dùng `useDeferredValue(filter)`. So sánh bằng Profiler.

**Tự kiểm tra:** Vì sao không bọc `setInputValue` (giá trị hiển thị trong ô input) trong transition?

### 15. Ví dụ memory leak trong React và cách khắc phục

**Ý chính**: rò rỉ bộ nhớ xảy ra khi component đã unmount nhưng vẫn còn thứ giữ tham chiếu tới nó:

- `setInterval` / `setTimeout` không `clear`.
- `addEventListener` (window, document) không `removeEventListener`.
- WebSocket hoặc BroadcastChannel không `close` hay unsubscribe.
- Request trả về sau khi unmount rồi gọi `setState` (React 18+ không còn cảnh báo, nhưng vẫn là việc thừa). Huỷ bằng `AbortController`.

Cách sửa chung: **effect nào đăng ký thứ gì thì phải trả về hàm cleanup để huỷ thứ đó.**

**Bài tập**

1. **Ngay:** mở `features/auth/session.ts`. `BroadcastChannel` có bao giờ được `close()` không? Nếu khởi tạo nhiều lần (ví dụ Strict Mode hoặc HMR) thì sao?
2. Cố tình viết một component có `setInterval` mà không cleanup, rồi mount và unmount 20 lần. Dùng DevTools → **Memory** → Heap snapshot, tìm "Detached" nodes.
3. **Task 10:** đăng ký WebSocket trong `BoardPage` có cleanup đúng khi rời trang.

**Tự kiểm tra:** Vì sao Strict Mode (câu 4) giúp phát hiện loại lỗi này sớm?

---

## Nhóm 3: Realtime (làm sau Task 10)

Thêm vào roadmap một task tùy chọn: **"Kanban realtime"**.

### 16. WebSocket là gì? Client B nhận message từ client A thế nào?

**Ý chính**

- HTTP: client hỏi thì server trả lời, server **không tự gửi** được. WebSocket là kết nối **hai chiều, giữ mở**, nên server **chủ động đẩy** dữ liệu xuống.
- Client A **không gửi thẳng** cho B. A gửi lên **server**, server **phát lại** cho B. Server quản lý ai đang kết nối.
- **Room**: chỉ gửi cho người đang xem cùng một board (`board:5`), không gửi cho tất cả.
- Phải **xác thực** khi kết nối (gửi access token lúc handshake) và **kiểm tra quyền** khi join room. Người ngoài không được join board của workspace khác. Đây là lại bài học 404 / IDOR.
- Mất kết nối thì tự kết nối lại. Sau khi kết nối lại, **tải lại dữ liệu** vì có thể đã lỡ mất message.

**Bài tập:**

- **Backend:** `socket.io`, sự kiện `task:moved` phát vào room `board:<id>` sau khi `PATCH /tasks/:id/status` thành công.
- **Frontend:** nhận sự kiện thì cập nhật cache TanStack (`setQueryData`) hoặc `invalidateQueries`.
- **Kiểm tra:** mở 2 trình duyệt bằng user A và M, A kéo task thì M thấy ngay.

**Tự kiểm tra:** Khi nhận sự kiện, nên `setQueryData` hay `invalidateQueries`? Đánh đổi là gì?

### 17. Người dùng mở nhiều tab trang bảng giá, tối ưu hiệu năng thế nào?

**Ý chính**

- Mỗi tab mở một WebSocket thì 10 tab là 10 kết nối, server và máy người dùng đều tốn tài nguyên.
- **Chỉ một tab ("leader") giữ kết nối**, rồi chia sẻ dữ liệu sang các tab khác qua **BroadcastChannel** (project đã dùng cho logout) hoặc **SharedWorker**. Leader đóng thì tab khác lên thay (từ khoá: **leader election**, `navigator.locks`).
- Tab **đang ẩn** thì ngừng hoặc giảm tần suất cập nhật (**Page Visibility API**, `document.visibilityState`). TanStack Query: `refetchIntervalInBackground: false`.
- Dữ liệu cập nhật liên tục (giá): **gộp nhiều cập nhật** rồi render một lần mỗi khoảng thời gian (`requestAnimationFrame` hoặc throttle), chỉ render lại ô bị đổi.

**Bài tập (sau câu 16):**

1. Mở 5 tab cùng board. DevTools → Network → WS: có mấy kết nối?
2. Dùng `navigator.locks.request("board-socket", ...)` để chỉ một tab kết nối, các tab khác nhận dữ liệu qua BroadcastChannel.
3. Đóng tab leader, kiểm tra tab khác tự lên thay.

**Tự kiểm tra:** Vì sao không dùng localStorage event để chia sẻ dữ liệu giữa các tab?

---

## Thứ tự gợi ý

1. **Tuần này (làm ngay):** câu 1–9. Mỗi ngày 2 câu: làm bài tập, viết câu trả lời, nhờ Claude nhận xét.
2. **Song song Task 8–10:** câu 10–15, làm cùng các tính năng tương ứng.
3. **Sau Task 10:** câu 16–17 (Kanban realtime).

Câu 4, 6, 15 liên quan tới code đã có (`bootstrap.ts`, `session.ts`, `useWorkspace`), nên làm sớm để có ví dụ thật khi phỏng vấn.
