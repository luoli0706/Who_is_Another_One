import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'words.db');
const db = new sqlite3.Database(dbPath);

// Promisify SQLite methods
export const query = {
  run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  },
  get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T | undefined);
      });
    });
  }
};

export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_default: number;
  created_at: string;
  word_count?: number;
}

export interface WordPair {
  id: number;
  category_id: number;
  word_a: string;
  word_b: string;
  created_at: string;
}

// Initialize tables and default seed data
export async function initDb() {
  // Create tables
  await query.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS word_pairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      word_a TEXT NOT NULL,
      word_b TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // Seed default categories if database is empty
  const count = await query.get<{ total: number }>('SELECT count(*) as total FROM categories');
  if (count && count.total === 0) {
    console.log('Seeding default word categories and pairs...');

    const defaultCategories = [
      { name: '经典常用', desc: '适合新手的常见趣味词汇', isDefault: 1, pairs: [
        ['牛奶', '豆浆'],
        ['汉堡', '三明治'],
        ['自行车', '摩托车'],
        ['西瓜', '哈密瓜'],
        ['镜子', '玻璃'],
        ['钢笔', '圆珠笔'],
        ['被子', '毯子'],
        ['雨伞', '雨衣'],
        ['枕头', '抱枕'],
        ['可乐', '雪碧']
      ]},
      { name: '数码科技', desc: '极客、数码爱好者喜爱的技术词汇', isDefault: 1, pairs: [
        ['电脑', '平板'],
        ['鼠标', '触控板'],
        ['安卓', 'iOS'],
        ['蓝牙', 'Wi-Fi'],
        ['固态硬盘', '机械硬盘'],
        ['智能手表', '手环'],
        ['耳机', '音箱'],
        ['ChatGPT', 'Claude'],
        ['微信', '支付宝'],
        ['抖音', '快手']
      ]},
      { name: '动漫游戏', desc: '二次元与游戏玩家专属词汇库', isDefault: 1, pairs: [
        ['蜘蛛侠', '蝙蝠侠'],
        ['皮卡丘', '妙蛙种子'],
        ['王者荣耀', '英雄联盟'],
        ['原神', '崩坏：星穹铁道'],
        ['超级玛丽', '冒险岛'],
        ['火影忍者', '海贼王'],
        ['魂斗罗', '合金弹头'],
        ['我的世界', '泰拉瑞亚'],
        ['魔兽世界', '最终幻想14'],
        ['刺客信条', '古墓丽影']
      ]},
      { name: '互联网黑话', desc: '大厂打工人、职场黑话对决', isDefault: 1, pairs: [
        ['赋能', '助力'],
        ['对齐', '同步'],
        ['闭环', '落地'],
        ['抓手', '切入点'],
        ['痛点', '痒点'],
        ['方法论', '知识库'],
        ['敏捷开发', '瀑布模型'],
        ['前端', '后端'],
        ['产品经理', '项目经理'],
        ['日报', '周报']
      ]}
    ];

    for (const cat of defaultCategories) {
      const { lastID } = await query.run(
        'INSERT INTO categories (name, description, is_default) VALUES (?, ?, ?)',
        [cat.name, cat.desc, cat.isDefault]
      );
      for (const pair of cat.pairs) {
        await query.run(
          'INSERT INTO word_pairs (category_id, word_a, word_b) VALUES (?, ?, ?)',
          [lastID, pair[0], pair[1]]
        );
      }
    }
    console.log('Seeding complete!');
  }
}

// Database helper operations
export async function getCategories(): Promise<Category[]> {
  return query.all<Category>(`
    SELECT c.*, count(w.id) as word_count 
    FROM categories c
    LEFT JOIN word_pairs w ON c.id = w.category_id
    GROUP BY c.id
    ORDER BY c.is_default DESC, c.id DESC
  `);
}

export async function getWordsByCategory(categoryId: number): Promise<WordPair[]> {
  return query.all<WordPair>(
    'SELECT * FROM word_pairs WHERE category_id = ? ORDER BY id DESC',
    [categoryId]
  );
}

export async function createCategory(name: string, description: string | null): Promise<Category> {
  const result = await query.run(
    'INSERT INTO categories (name, description, is_default) VALUES (?, ?, 0)',
    [name, description]
  );
  const newCat = await query.get<Category>('SELECT * FROM categories WHERE id = ?', [result.lastID]);
  if (!newCat) throw new Error('Failed to create category');
  return { ...newCat, word_count: 0 };
}

export async function addWordPair(categoryId: number, wordA: string, wordB: string): Promise<WordPair> {
  const result = await query.run(
    'INSERT INTO word_pairs (category_id, word_a, word_b) VALUES (?, ?, ?)',
    [categoryId, wordA, wordB]
  );
  const newPair = await query.get<WordPair>('SELECT * FROM word_pairs WHERE id = ?', [result.lastID]);
  if (!newPair) throw new Error('Failed to add word pair');
  return newPair;
}
