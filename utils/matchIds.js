// =========================
// 🎯 MATCH IDs FROM TEXT
// =========================
const matchIds = (data, lookups) => {
  const { campuses, faculties, courses } = lookups;

  // =========================
  // 🏫 CAMPUS
  // =========================
  const campus = campuses.find(c =>
    data.campus?.toLowerCase().includes(c.name.toLowerCase())
  );

  // =========================
  // 🏛 FACULTY (must match campus)
  // =========================
  const faculty = faculties.find(f =>
    data.faculty?.toLowerCase().includes(f.name.toLowerCase()) &&
    f.campus_id === campus?.id
  );

  // =========================
  // 📚 COURSE (must match faculty)
  // =========================
  const course = courses.find(c =>
    data.course?.toLowerCase().includes(c.name.toLowerCase()) &&
    c.faculty_id === faculty?.id
  );

  return {
    campus_id: campus?.id || null,
    faculty_id: faculty?.id || null,
    course_id: course?.id || null,
  };
};

module.exports = { matchIds };