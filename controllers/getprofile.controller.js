const db = require("../config/db");

const getCompleteProfileData = async (req, res) => {
  try {
    console.log("Fetching profile data...");

    // 1. Get all campuses
    const [campuses] = await db.query("SELECT * FROM campuses");

    // 2. Get all faculties
    const [faculties] = await db.query("SELECT * FROM faculties");

    // 3. Get all courses
    const [courses] = await db.query("SELECT * FROM courses");

    // 4. Organize data
    const structuredData = campuses.map((campus) => {
      const campusFaculties = faculties
        .filter((f) => f.campus_id === campus.id)
        .map((faculty) => {
          const facultyCourses = courses.filter(
            (c) => c.faculty_id === faculty.id
          );

          return {
            id: faculty.id,
            name: faculty.name,
            courses: facultyCourses.map((course) => ({
              id: course.id,
              name: course.name,
            })),
          };
        });

      return {
        id: campus.id,
        name: campus.name,
        faculties: campusFaculties,
      };
    });

    return res.status(200).json({
      message: "Profile data fetched successfully",
      data: structuredData,
    });

  } catch (error) {
    console.error("❌ Error fetching profile data:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = { getCompleteProfileData };