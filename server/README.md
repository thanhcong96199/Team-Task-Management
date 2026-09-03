# Chạy migration sau khi đã viết prisma xong
npx prisma validate
npx prisma migrate dev --name init

# Để vào postgres trong ubuntu thực hiện câu lệnh
sudo -u postgres psql

# Để xem db giao diện trưc quan hơn thì dùng prisma studio
npx prisma studio

# Chay app
npm run dev
