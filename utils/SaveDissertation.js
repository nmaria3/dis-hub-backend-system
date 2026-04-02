const db = require("../config/db"); // adjust path if needed

async function saveDissertation({
  title,
  author,
  abstract,
  methodology,
  supervisor,
  pages,
  fileSize,
  fileUrl,
  downloadUrl,
  imageUrl,
  license,
  citations,
  courseId,
  facultyId,
  campusId,
  uploadedBy,
  fileHash,
}) {
  try {
    const year = new Date().getFullYear();

    const query = `
      INSERT INTO dissertations (
        title,
        author_name,
        abstract,
        year,
        methodology,
        supervisor,
        pages,
        file_size,
        file_url,
        file_download_url,
        image_url,
        license,
        citations,
        courses_id,
        uploaded_by,
        faculty_id,
        campus_id,
        file_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      title,
      author,
      abstract,
      year,
      methodology,
      supervisor,
      pages,
      fileSize,
      fileUrl,
      downloadUrl,
      imageUrl,
      license,
      JSON.stringify(citations), // 🔥 store as JSON string
      courseId,
      uploadedBy,
      facultyId,
      campusId,
      fileHash,
    ];

    const [result] = await db.query(query, values);

    return {
      success: true,
      insertId: result.insertId,
    };
  } catch (err) {
    console.error("❌ DB INSERT ERROR:", err);
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = { saveDissertation };