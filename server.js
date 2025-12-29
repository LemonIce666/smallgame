const express = require('express');
const path = require('path');
const { initDb } = require('./src/db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

app.get('/api/students', async (_req, res) => {
  const students = await db.all('SELECT id, name, email, major FROM students ORDER BY name');
  res.json(students);
});

app.post('/api/students', async (req, res) => {
  const { name, email, major } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  try {
    const result = await db.run(
      'INSERT INTO students (name, email, major) VALUES (?, ?, ?)',
      name,
      email,
      major || 'Undeclared'
    );
    const student = await db.get('SELECT id, name, email, major FROM students WHERE id = ?', result.lastID);
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, major } = req.body;
  const existing = await db.get('SELECT id FROM students WHERE id = ?', id);
  if (!existing) return res.status(404).json({ message: 'Student not found' });
  await db.run('UPDATE students SET name = ?, email = ?, major = ? WHERE id = ?', name, email, major, id);
  const student = await db.get('SELECT id, name, email, major FROM students WHERE id = ?', id);
  res.json(student);
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM enrollments WHERE student_id = ?', id);
  const result = await db.run('DELETE FROM students WHERE id = ?', id);
  if (result.changes === 0) return res.status(404).json({ message: 'Student not found' });
  res.json({ message: 'Student deleted' });
});

app.get('/api/courses', async (_req, res) => {
  const courses = await db.all('SELECT id, code, title, credits FROM courses ORDER BY code');
  res.json(courses);
});

app.post('/api/courses', async (req, res) => {
  const { code, title, credits } = req.body;
  if (!code || !title) return res.status(400).json({ message: 'Code and title are required' });
  try {
    const result = await db.run(
      'INSERT INTO courses (code, title, credits) VALUES (?, ?, ?)',
      code.toUpperCase(),
      title,
      Number(credits) || 3
    );
    const course = await db.get('SELECT id, code, title, credits FROM courses WHERE id = ?', result.lastID);
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { code, title, credits } = req.body;
  const existing = await db.get('SELECT id FROM courses WHERE id = ?', id);
  if (!existing) return res.status(404).json({ message: 'Course not found' });
  await db.run('UPDATE courses SET code = ?, title = ?, credits = ? WHERE id = ?', code, title, Number(credits) || 3, id);
  const course = await db.get('SELECT id, code, title, credits FROM courses WHERE id = ?', id);
  res.json(course);
});

app.delete('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM enrollments WHERE course_id = ?', id);
  const result = await db.run('DELETE FROM courses WHERE id = ?', id);
  if (result.changes === 0) return res.status(404).json({ message: 'Course not found' });
  res.json({ message: 'Course deleted' });
});

app.get('/api/enrollments', async (_req, res) => {
  const enrollments = await db.all(
    `SELECT e.id, e.term, e.grade, s.name as student_name, s.email, c.code, c.title
     FROM enrollments e
     JOIN students s ON s.id = e.student_id
     JOIN courses c ON c.id = e.course_id
     ORDER BY e.term DESC, c.code`
  );
  res.json(enrollments);
});

app.post('/api/enrollments', async (req, res) => {
  const { student_id, course_id, term } = req.body;
  if (!student_id || !course_id || !term) return res.status(400).json({ message: 'Student, course, and term are required' });
  try {
    const result = await db.run(
      'INSERT INTO enrollments (student_id, course_id, term) VALUES (?, ?, ?)',
      student_id,
      course_id,
      term
    );
    const enrollment = await db.get('SELECT * FROM enrollments WHERE id = ?', result.lastID);
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/enrollments/:id/grade', async (req, res) => {
  const { id } = req.params;
  const { grade } = req.body;
  const existing = await db.get('SELECT id FROM enrollments WHERE id = ?', id);
  if (!existing) return res.status(404).json({ message: 'Enrollment not found' });
  await db.run('UPDATE enrollments SET grade = ? WHERE id = ?', grade, id);
  const enrollment = await db.get('SELECT * FROM enrollments WHERE id = ?', id);
  res.json(enrollment);
});

app.delete('/api/enrollments/:id', async (req, res) => {
  const { id } = req.params;
  const result = await db.run('DELETE FROM enrollments WHERE id = ?', id);
  if (result.changes === 0) return res.status(404).json({ message: 'Enrollment not found' });
  res.json({ message: 'Enrollment deleted' });
});

const port = process.env.PORT || 3000;

initDb()
  .then((database) => {
    db = database;
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
