# 0004. Viết style bằng Tailwind CSS và shadcn/ui

- Trạng thái: Accepted
- Ngày: 2026-10-12

## Bối cảnh

`ui/` mới chỉ có `index.css` của template Vite và vài chỗ dùng `style={{ ... }}` trực tiếp trong component. Trước khi làm thêm trang (Register, Workspace, Board...), cần thống nhất cách viết style để giao diện nhất quán và không phải làm lại.

App quản lý task cần nhiều component tương tác phức tạp: Dialog, Dropdown, Popover, Combobox (chọn người được giao task), Tooltip. Những component này rất khó tự viết cho đúng accessibility: giữ focus trong dialog, điều hướng bằng bàn phím, thuộc tính ARIA, đóng bằng phím Esc...

## Các phương án

1. **Tailwind CSS + shadcn/ui**: class viết ngay trong JSX, design token khai báo một chỗ. shadcn copy code component vào repo (không phải thư viện cài vào `node_modules`), dựng sẵn trên một thư viện primitive đã lo phần accessibility. JSX dài hơn và phải học quy ước của Tailwind.
2. **CSS Modules**: CSS thuần, Vite hỗ trợ sẵn, class tự có phạm vi riêng. Nhưng phải tự xây design system và tự viết các component tương tác cho đúng accessibility.
3. **CSS-in-JS (styled-components, Emotion)**: style động theo props, nhưng tốn chi phí khi chạy và không hợp với hướng đi hiện tại của React 19. Không phù hợp cho dự án mới.

## Quyết định

Chọn **phương án 1**, với cấu hình cụ thể:

| Thành phần       | Lựa chọn                             | Ghi chú                                                    |
| ---------------- | ------------------------------------ | ---------------------------------------------------------- |
| Tailwind         | v4, qua plugin `@tailwindcss/vite`   | Không có file `tailwind.config`, cấu hình bằng CSS         |
| Style của shadcn | `base-nova`                          | Dựng trên **Base UI** (`@base-ui/react`), không phải Radix |
| Icon             | `lucide-react`                       |                                                            |
| Font             | Geist (`@fontsource-variable/geist`) | Tự host, không tải từ Google Fonts                         |
| Dark mode        | Class `.dark` trên phần tử gốc       | Khai báo bằng `@custom-variant dark`                       |

**Quy ước:**

1. **Design token chỉ khai báo ở một nơi**: CSS variables và khối `@theme inline` trong `src/index.css`. Component dùng class theo token (`bg-primary`, `text-muted-foreground`), không dùng giá trị cứng như `bg-[#aa3bff]`.
2. **Component giao diện dùng chung nằm trong `src/shared/ui/`**, theo cấu trúc theo feature của dự án (xem ADR 0001). Các component này chỉ lo giao diện: không gọi API, không dùng store.
3. **Trang trong `features/*/pages/` chỉ ghép các component từ `shared/ui/`** và thêm class bố cục. Nếu một tổ hợp class bị lặp lại lần thứ hai, chuyển nó thành component trong `shared/ui/`.
4. **Không dùng inline style**, trừ giá trị tính lúc chạy (ví dụ `style={{ width: \`${percent}%\` }}`).
5. **Ghép class bằng hàm `cn()` từ gói `cn`**, để class truyền từ ngoài vào ghi đè đúng class mặc định của component. Dùng đúng gói mà shadcn (style `base-nova`) sinh ra, để component thêm bằng `add` không phải sửa import. Không cài thêm `clsx` hay `tailwind-merge`. `src/shared/lib/utils.ts` chỉ re-export `cn`.
6. **Form dùng component `FormField`** gói label, input và dòng báo lỗi, gắn sẵn `htmlFor`/`id`, `aria-invalid`, `aria-describedby`.

## Hệ quả

**Được:**

- Có sẵn các component tương tác đã đúng accessibility, tiết kiệm nhiều công so với tự viết.
- Code component nằm trong repo, đọc và sửa được trực tiếp, không bị khoá vào API của một thư viện.
- Đổi màu chủ đạo hay bật dark mode chỉ cần sửa token trong `index.css`.
- Tailwind chỉ sinh ra những class thực sự được dùng, nên CSS khi build nhỏ.

**Mất / phải làm thêm:**

- **Tự cập nhật component**: shadcn copy code vào repo, nên khi shadcn ra bản mới thì không tự cập nhật. Muốn nhận bản sửa lỗi phải chạy lại lệnh `add` và so sánh thay đổi.
- **Base UI ít tài liệu và ví dụ hơn Radix**: phần lớn ví dụ shadcn trên mạng viết cho Radix. API có khác biệt (ví dụ Base UI dùng prop `render` thay cho `asChild` của Radix), nên không copy ví dụ Radix sang mà không đọc lại.
- **`components.json` phải trỏ đúng thư mục**: mặc định shadcn dùng `@/components/ui` và `@/lib/utils`. Phải đổi các alias sang `@/shared/ui` và `@/shared/lib` để component mới được thêm vào đúng chỗ.
- **`ui/tsconfig.json` (file gốc) phải khai báo `paths` cho `@/*`**, giống `tsconfig.app.json`. CLI của shadcn chỉ đọc file gốc; nếu thiếu, nó không hiểu `@` là alias và tạo ra một thư mục tên `@` thật ở `ui/@/`.
- **Style `base-nova` dùng gói `cn` trên npm**: component do shadcn sinh ra import thẳng `import { cn } from "cn"`, không qua file `utils` trong repo. Mỗi lần `add` component mới đều như vậy.
- **Lệnh `shadcn` có thể sửa `ui/package.json`** và cài thêm package. Sau mỗi lần chạy, kiểm tra không có `ui/package-lock.json` riêng và chạy lại `npm install` từ thư mục gốc (xem ADR 0002).
- **Gói `shadcn` nằm trong `dependencies`** vì `index.css` import `shadcn/tailwind.css`, không chỉ là công cụ dòng lệnh.
- **JSX dài hơn** vì nhiều class. Có thể thêm `prettier-plugin-tailwindcss` để tự sắp xếp thứ tự class cho dễ đọc và dễ review.
