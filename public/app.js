const dialog = document.getElementById('dialog');
const dialogTitle = document.getElementById('dialog-title');
const dialogForm = document.getElementById('dialog-form');
const dialogClose = document.getElementById('dialog-close');

dialogClose.addEventListener('click', closeDialog);
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) closeDialog();
});

function openDialog(title, formContent, onSubmit) {
  dialogTitle.textContent = title;
  dialogForm.innerHTML = '';
  dialogForm.appendChild(formContent);
  dialog.classList.remove('hidden');

  dialogForm.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(dialogForm);
    const payload = Object.fromEntries(formData.entries());
    await onSubmit(payload);
    closeDialog();
    refreshAll();
  };
}

function closeDialog() {
  dialog.classList.add('hidden');
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    alert(error.message || '请求失败');
    throw new Error(error.message);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function loadStudents() {
  const tbody = document.querySelector('#students-table tbody');
  const students = await fetchJSON('/api/students');
  tbody.innerHTML = '';
  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">暂无学生</td></tr>';
    return;
  }
  for (const s of students) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.name}</td><td>${s.email}</td><td>${s.major}</td>`;
    const actions = document.createElement('td');
    actions.className = 'table-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '编辑';
    editBtn.onclick = () => showStudentForm(s);

    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.className = 'danger';
    delBtn.onclick = async () => {
      if (confirm('确定删除该学生？其选课记录也会被删除。')) {
        await fetchJSON(`/api/students/${s.id}`, { method: 'DELETE' });
        refreshAll();
      }
    };

    actions.append(editBtn, delBtn);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  }
}

async function loadCourses() {
  const tbody = document.querySelector('#courses-table tbody');
  const courses = await fetchJSON('/api/courses');
  tbody.innerHTML = '';
  if (courses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">暂无课程</td></tr>';
    return;
  }
  for (const c of courses) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.code}</td><td>${c.title}</td><td>${c.credits}</td>`;
    const actions = document.createElement('td');
    actions.className = 'table-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '编辑';
    editBtn.onclick = () => showCourseForm(c);

    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.className = 'danger';
    delBtn.onclick = async () => {
      if (confirm('确定删除该课程？')) {
        await fetchJSON(`/api/courses/${c.id}`, { method: 'DELETE' });
        refreshAll();
      }
    };

    actions.append(editBtn, delBtn);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  }
}

async function loadEnrollments() {
  const tbody = document.querySelector('#enrollments-table tbody');
  const enrollments = await fetchJSON('/api/enrollments');
  tbody.innerHTML = '';
  if (enrollments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">暂无选课记录</td></tr>';
    return;
  }
  for (const e of enrollments) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${e.term}</td><td>${e.student_name} (${e.email})</td><td>${e.code} - ${e.title}</td><td>${e.grade || '—'}</td>`;
    const actions = document.createElement('td');
    actions.className = 'table-actions';

    const gradeBtn = document.createElement('button');
    gradeBtn.textContent = '录入成绩';
    gradeBtn.onclick = () => showGradeForm(e.id, e.grade);

    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.className = 'danger';
    delBtn.onclick = async () => {
      if (confirm('确定删除该选课记录？')) {
        await fetchJSON(`/api/enrollments/${e.id}`, { method: 'DELETE' });
        refreshAll();
      }
    };

    actions.append(gradeBtn, delBtn);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  }
}

function showStudentForm(student = null) {
  const template = document.getElementById('student-form-template');
  const formContent = template.content.cloneNode(true);
  if (student) {
    formContent.querySelector('[name=name]').value = student.name;
    formContent.querySelector('[name=email]').value = student.email;
    formContent.querySelector('[name=major]').value = student.major;
  }
  openDialog(student ? '编辑学生' : '新增学生', formContent, async (data) => {
    const method = student ? 'PUT' : 'POST';
    const url = student ? `/api/students/${student.id}` : '/api/students';
    await fetchJSON(url, { method, body: JSON.stringify(data) });
  });
}

function showCourseForm(course = null) {
  const template = document.getElementById('course-form-template');
  const formContent = template.content.cloneNode(true);
  if (course) {
    formContent.querySelector('[name=code]').value = course.code;
    formContent.querySelector('[name=title]').value = course.title;
    formContent.querySelector('[name=credits]').value = course.credits;
  }
  openDialog(course ? '编辑课程' : '新增课程', formContent, async (data) => {
    data.credits = Number(data.credits) || 3;
    const method = course ? 'PUT' : 'POST';
    const url = course ? `/api/courses/${course.id}` : '/api/courses';
    await fetchJSON(url, { method, body: JSON.stringify(data) });
  });
}

async function showEnrollmentForm() {
  const template = document.getElementById('enrollment-form-template');
  const formContent = template.content.cloneNode(true);
  const students = await fetchJSON('/api/students');
  const courses = await fetchJSON('/api/courses');
  const studentSelect = formContent.querySelector('select[name=student_id]');
  const courseSelect = formContent.querySelector('select[name=course_id]');
  students.forEach((s) => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = `${s.name} (${s.email})`;
    studentSelect.appendChild(option);
  });
  courses.forEach((c) => {
    const option = document.createElement('option');
    option.value = c.id;
    option.textContent = `${c.code} - ${c.title}`;
    courseSelect.appendChild(option);
  });

  openDialog('新增选课', formContent, async (data) => {
    await fetchJSON('/api/enrollments', { method: 'POST', body: JSON.stringify(data) });
  });
}

function showGradeForm(id, currentGrade) {
  const template = document.getElementById('grade-form-template');
  const formContent = template.content.cloneNode(true);
  if (currentGrade) formContent.querySelector('[name=grade]').value = currentGrade;
  openDialog('录入成绩', formContent, async (data) => {
    await fetchJSON(`/api/enrollments/${id}/grade`, { method: 'PUT', body: JSON.stringify(data) });
  });
}

function refreshAll() {
  loadStudents();
  loadCourses();
  loadEnrollments();
}

function initButtons() {
  document.getElementById('add-student-btn').onclick = () => showStudentForm();
  document.getElementById('add-course-btn').onclick = () => showCourseForm();
  document.getElementById('add-enrollment-btn').onclick = () => showEnrollmentForm();
}

initButtons();
refreshAll();
