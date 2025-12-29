const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbPath = path.join(__dirname, '..', 'data', 'school.db');

async function initDb() {
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  await db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      major TEXT DEFAULT 'Undeclared'
    );
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      credits INTEGER DEFAULT 3
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      term TEXT NOT NULL,
      grade TEXT DEFAULT NULL,
      UNIQUE(student_id, course_id, term),
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `);

  const studentCount = await db.get('SELECT COUNT(*) as count FROM students');
  if (studentCount.count === 0) {
    await seedData(db);
  }
  return db;
}

async function seedData(db) {
  const students = [
    ['Alice Zhang', 'alice@example.com', 'Computer Science'],
    ['Brian Lee', 'brian@example.com', 'Mathematics'],
    ['Carmen Diaz', 'carmen@example.com', 'History']
  ];
  const courses = [
    ['CS101', 'Intro to Programming', 4],
    ['MATH201', 'Linear Algebra', 3],
    ['HIST110', 'World Civilizations', 3]
  ];

  for (const [name, email, major] of students) {
    await db.run('INSERT INTO students (name, email, major) VALUES (?, ?, ?)', name, email, major);
  }

  for (const [code, title, credits] of courses) {
    await db.run('INSERT INTO courses (code, title, credits) VALUES (?, ?, ?)', code, title, credits);
  }

  await db.run(
    'INSERT INTO enrollments (student_id, course_id, term, grade) VALUES (1, 1, ?, ?)',
    'Fall 2024',
    'A'
  );
  await db.run('INSERT INTO enrollments (student_id, course_id, term) VALUES (2, 2, ?)', 'Spring 2025');
}

module.exports = { initDb };
