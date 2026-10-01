# 0003. Lưu refresh token trong cookie httpOnly

- Trạng thái: Accepted
- Ngày: 2026-10-01

## Bối cảnh

Hệ thống auth dùng 2 loại token (xem Task 5):

- **Access token**: sống 15 phút, gửi qua header `Authorization: Bearer ...` để gọi API.
- **Refresh token**: sống 7 ngày, chỉ dùng để gọi `/refresh` lấy access token mới. Có rotation, và được lưu dưới dạng hash trong bảng `RefreshToken`.

Refresh token sống lâu, nên nếu bị lộ thì kẻ tấn công giữ được phiên đăng nhập trong nhiều ngày. Rủi ro lớn nhất ở phía frontend là **XSS**: script độc hại chạy trên trang có thể đọc mọi thứ mà JavaScript đọc được.

Cần quyết định: frontend giữ refresh token ở đâu, và backend gửi/nhận nó bằng cách nào.

## Các phương án

1. **`localStorage`**: dễ làm nhất, reload trang không mất. Nhưng XSS đọc được, và lấy được token dùng tới 7 ngày.
2. **Chỉ giữ trong memory (biến JS)**: XSS khó lấy hơn. Nhưng reload trang hay mở tab mới là mất, user phải login lại.
3. **Cookie `httpOnly` cho refresh token, access token giữ trong memory**: JavaScript không đọc được refresh token. Reload trang thì gọi `/refresh` để lấy lại access token. Cần cấu hình thêm ở backend.
4. **Cookie cho cả xác thực API (cookie-based session)**: không cần header `Authorization`. Nhưng trình duyệt tự gửi cookie tới mọi API, nên **mọi** API đều phải chống CSRF.

## Quyết định

Chọn **phương án 3**.

- `/login` và `/refresh` gửi refresh token qua `Set-Cookie`, **không** trả trong body. Body chỉ có `accessToken` (và `user` ở `/login`).
- `/refresh` và `/logout` đọc token từ cookie (dùng `cookie-parser`).
- `/logout` luôn trả 204 và xoá cookie, kể cả khi request không có cookie.
- Frontend giữ access token trong memory, và gọi `/refresh` khi app khởi động (silent refresh).

Thuộc tính của cookie `refreshToken`:

| Thuộc tính | Giá trị                        | Lý do                                                                                             |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `httpOnly` | `true` (mọi môi trường)        | JavaScript không đọc được, chống XSS lấy token                                                    |
| `secure`   | `true` khi `production`        | Chỉ gửi qua HTTPS. Khi dev chạy `localhost` bằng HTTP nên tắt                                     |
| `sameSite` | `strict`                       | Trình duyệt không gửi cookie khi request đến từ site khác, chống CSRF cho `/refresh` và `/logout` |
| `path`     | `/api/v1/auth`                 | Chỉ gửi cookie tới các route auth, không gửi tới `/boards`, `/tasks`...                           |
| `expires`  | Lấy từ `exp` của refresh token | Cookie và token hết hạn cùng lúc, theo `JWT_REFRESH_EXPIRES_IN`                                   |

Không chọn phương án 4 vì header `Authorization` không bao giờ được trình duyệt tự gửi tới site khác, nên các API dùng access token mặc định đã an toàn trước CSRF. Chỉ cần lo CSRF cho 2 endpoint đọc cookie, và `sameSite: strict` đã xử lý việc đó.

## Hệ quả

**Được:**

- XSS không đọc được refresh token, kể cả khi đọc được response của `/login` và `/refresh`.
- Reload trang hay mở tab mới vẫn giữ được phiên đăng nhập.
- Refresh token không xuất hiện ở các request nghiệp vụ, nên ít khả năng bị ghi vào log của middleware hay proxy.

**Mất / phải làm thêm:**

- Backend cần thêm `cookie-parser`. Nếu thiếu, `req.cookies` là `undefined`, và TypeScript **không** bắt được lỗi này vì `req.cookies` có kiểu `any`.
- Options của cookie phải **giống hệt nhau** ở mọi chỗ set và xoá. `clearCookie` chỉ xoá được cookie có cùng `path`. Nếu `path` khác nhau, trình duyệt sẽ lưu 2 cookie cùng tên và có thể gửi nhầm cookie cũ đã bị thu hồi.
- Access token mất khi reload trang, nên frontend phải có trạng thái `loading` lúc khởi động để tránh chớp qua trang login. Chi phí là 1 request `POST /refresh` (khoảng 20–100ms) mỗi lần tải trang, nhỏ so với việc tải JS bundle.
- Mỗi lần refresh (kể cả khi reload trang) tạo thêm 1 bản ghi trong bảng `RefreshToken`. Cần một job dọn định kỳ các bản ghi đã hết hạn hoặc đã bị thu hồi quá vài ngày.
- `path` khớp theo tiền tố, nên `/api/v1/auth/me` và `/api/v1/auth/login` vẫn nhận cookie dù không dùng tới. Có thể thu hẹp bằng cách gom `/refresh` và `/logout` vào `/api/v1/auth/session/*`, nhưng hiện chưa cần.
- Postman bỏ qua `SameSite` và `HttpOnly`. Chỉ dùng Postman để kiểm tra server có gửi đúng `Set-Cookie`; muốn kiểm tra cookie có thật sự được bảo vệ thì phải test trên trình duyệt (`document.cookie` không được thấy `refreshToken`).

**Ràng buộc khi phát triển và deploy:**

- Khi dev, frontend gọi API qua proxy của Vite (`/api` → `localhost:3000`) để FE và BE cùng origin. Nếu gọi thẳng sang port khác, cookie `sameSite: strict` có thể không được gửi.
- Nếu sau này deploy FE và BE ở 2 domain khác nhau (ví dụ `app.example.com` và `api.example.com`), cần xem lại `sameSite`, `domain` và cấu hình CORS (`credentials: true`).
- Access token vẫn dùng được tối đa 15 phút sau khi logout. Đây là giới hạn đã chấp nhận của JWT stateless (xem Task 5).

**Không lưu access token vào Redux, `localStorage` hay `sessionStorage`:**

Redux, Zustand hay Context cũng nằm trong memory, nên reload trang vẫn mất. Muốn giữ được qua reload thì phải ghi xuống storage (ví dụ `redux-persist` ghi vào `localStorage`), và khi đó XSS đọc được, tức là quay về phương án 1. Mọi nơi mà JavaScript đọc lại được sau khi reload thì script độc hại cũng đọc được. Vì vậy access token chỉ nằm trong memory, và lấy lại bằng `/refresh` khi tải trang.

**Nhiều tab refresh cùng lúc:**

Các tab dùng chung một cookie nhưng mỗi tab có memory riêng, nên cơ chế "chỉ refresh một lần" trong một tab không chặn được các tab khác. Khi nhiều tab cùng gọi `/refresh` với cùng một refresh token (ví dụ mở lại trình duyệt có 3 tab), rotation chỉ cho tab đầu tiên thành công, các tab còn lại nhận 401 và bị đẩy về trang login.

Hướng xử lý: frontend dùng Web Locks API (`navigator.locks.request("auth-refresh", ...)`) để các tab xếp hàng khi refresh. Tab sau chờ tab trước xong rồi mới gọi `/refresh` với cookie mới. Phương án thay thế ở backend là cho phép dùng lại refresh token vừa bị thu hồi trong một khoảng ân hạn ngắn (10–30 giây), nhưng cách này làm phức tạp rotation và làm yếu reuse detection, nên chưa áp dụng.

**Việc có thể làm thêm:**

- Cho `/refresh` trả về luôn `user` cùng `accessToken`, để lúc khởi động app chỉ cần 1 request thay vì `/refresh` rồi mới tới `/me`.
