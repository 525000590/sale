const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(process.cwd(), 'data', 'database.db');
const db = new sqlite3.Database(dbPath);

const products = [
  {
    name: 'Laptop Dell Inspiron 15',
    price: '15.500.000đ',
    description: 'Core i5 Gen 12, RAM 8GB, SSD 512GB',
    icon: '💻',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    tag: 'Bán chạy',
  },
  {
    name: 'Laptop Asus Vivobook',
    price: '13.200.000đ',
    description: 'Core i3 Gen 11, RAM 8GB, SSD 256GB',
    icon: '💻',
    color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    tag: 'Giá tốt',
  },
  {
    name: 'PC Gaming RTX 3060',
    price: '22.000.000đ',
    description: 'Core i5, RTX 3060, RAM 16GB, SSD 512GB',
    icon: '🖥️',
    color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    tag: 'Hot',
  },
  {
    name: 'Laptop Lenovo ThinkPad',
    price: '18.700.000đ',
    description: 'Core i7 Gen 12, RAM 16GB, SSD 512GB',
    icon: '💻',
    color: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    tag: 'Doanh nhân',
  },
  {
    name: 'PC Văn Phòng Mini',
    price: '8.500.000đ',
    description: 'Core i3, RAM 8GB, SSD 256GB, nhỏ gọn',
    icon: '🖥️',
    color: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    tag: 'Tiết kiệm',
  },
  {
    name: 'MacBook Air M2',
    price: '26.900.000đ',
    description: 'Chip M2, RAM 8GB, SSD 256GB, siêu mỏng nhẹ',
    icon: '💻',
    color: 'linear-gradient(135deg, #d9afd9 0%, #97d9e1 100%)',
    tag: 'Cao cấp',
  },
  {
    name: 'PC Gaming RTX 4070',
    price: '35.000.000đ',
    description: 'Core i7, RTX 4070, RAM 32GB, SSD 1TB',
    icon: '🖥️',
    color: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
    tag: 'Cấu hình khủng',
  },
  {
    name: 'Laptop Acer Aspire',
    price: '11.900.000đ',
    description: 'Core i3 Gen 11, RAM 8GB, SSD 256GB',
    icon: '💻',
    color: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    tag: 'Sinh viên',
  },
];

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      tag TEXT
    );
  `);

  const stmt = db.prepare('INSERT INTO products (name, price, description, icon, color, tag) VALUES (?, ?, ?, ?, ?, ?)');
  for (const p of products) {
    stmt.run(p.name, p.price, p.description, p.icon, p.color, p.tag);
  }
  stmt.finalize();
});

db.close((err) => {
  if (err) {
    console.error('Error closing DB', err);
    process.exit(1);
  }
  console.log('Seed complete');
});
