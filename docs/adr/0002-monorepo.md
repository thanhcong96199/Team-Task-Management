Team-Task-Management/
├── package.json              ← gốc: khai báo workspaces và các script chung
├── package-lock.json         ← file lock DUY NHẤT (sinh ra khi chạy npm install ở gốc)
├── node_modules/             ← DUY NHẤT
├── .gitignore                ← mới, ở gốc
├── server/
│   ├── package.json          ← thêm dependency "@ttm/shared"
│   └── (không còn node_modules/ và package-lock.json riêng)
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts
│       │   └── auth.schema.ts
│       └── dist/             ← do tsc sinh ra, không commit
├── ui/                       ← sẽ làm ở F0.3
└── docs/adr/
