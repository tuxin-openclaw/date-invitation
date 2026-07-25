const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3456;

// 中间件
app.use(express.json());
app.use(express.static(__dirname)); // 提供静态文件（HTML、图片、音乐等）

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data', 'records.json');

// 确保 data 目录和文件存在
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, 'null', 'utf-8'); // null 表示无记录
  }
}

// 读记录（单条，无记录时返回 null）
function readRecord() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  return raw === 'null' || raw === '' ? null : JSON.parse(raw);
}

// 写记录（最多保存最近 3 次，防止恶意刷）
function writeRecord(record) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(record, null, 2), 'utf-8');
}

// ========== API 路由 ==========

// 获取当前记录
app.get('/api/records', (req, res) => {
  const record = readRecord();
  res.json(record);
});

// 保存记录（始终覆盖，只保留一条）
app.post('/api/records', (req, res) => {
  const { date, time, foods } = req.body;

  if (!date || !time || !foods || foods.length === 0) {
    return res.status(400).json({ error: '缺少必填字段：date, time, foods' });
  }

  const record = {
    date,
    time,
    foods,
    createdAt: Date.now()
  };

  writeRecord(record);
  res.status(201).json(record);
});

// 删除记录
app.delete('/api/records', (req, res) => {
  writeRecord(null);
  res.json({ success: true });
});

// ========== 启动服务 ==========
app.listen(PORT, '127.0.0.1', () => {
  console.log(`💕 约会邀请服务器已启动 → http://localhost:${PORT}`);
  ensureDataFile();
});
