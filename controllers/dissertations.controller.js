const db = require("../config/db");
const { createNotification } = require("../utils/notification");

// ===============================
// 📚 GET ALL DISSERTATIONS (FULL DATA)
// ===============================
const getAllDissertations = async (req, res) => {
  try {
    const query = `
      SELECT 
        d.*,

        -- Course
        c.id AS course_id,
        c.name AS course_name,

        -- Faculty
        f.id AS faculty_id,
        f.name AS faculty_name,

        -- Campus
        cp.id AS campus_id,
        cp.name AS campus_name,

        -- Uploaded By (User)
        u.id AS uploader_id,
        u.clerkid,
        u.role

      FROM dissertations d

      LEFT JOIN courses c ON d.courses_id = c.id
      LEFT JOIN faculties f ON d.faculty_id = f.id
      LEFT JOIN campuses cp ON d.campus_id = cp.id
      LEFT JOIN users u ON d.uploaded_by = u.id
    `;

    const [results] = await db.query(query);

    // ===============================
    // 🧠 STRUCTURE DATA FOR FRONTEND
    // ===============================
    const structuredData = results.map((row) => ({
      id: row.id,

      // 📄 BASIC INFO
      title: row.title,
      author_name: row.author_name,
      abstract: row.abstract,
      year: row.year,
      methodology: row.methodology,
      supervisor: row.supervisor,
      pages: row.pages,

      // 📁 FILE INFO
      file: {
        size: row.file_size,
        url: row.file_url,
        download_url: row.file_download_url,
        hash: row.file_hash,
      },

      // 🖼️ EXTRA
      image_url: row.image_url,
      license: row.license,
      citations: row.citations,

      // 🎓 RELATIONS
      academic: {
        campus: {
          id: row.campus_id,
          name: row.campus_name,
        },
        faculty: {
          id: row.faculty_id,
          name: row.faculty_name,
        },
        course: {
          id: row.course_id,
          name: row.course_name,
        },
      },

      // 👤 UPLOADER
      uploaded_by: {
        id: row.uploader_id,
        clerkId: row.clerkid,
        role: row.role,
      },

      // 🕒 TIMESTAMP
      updated_at: row.updated_at,
    }));

    // ===============================
    // 🖨️ DEBUG LOG
    // ===============================
    // console.log("\n📚 ALL DISSERTATIONS:");
    // console.dir(structuredData, { depth: null });

    // ===============================
    // 📤 RESPONSE
    // ===============================
    return res.status(200).json({
      message: "Dissertations fetched successfully",
      count: structuredData.length,
      data: structuredData,
    });

  } catch (error) {
    console.error("❌ Error fetching dissertations:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const cloudinary = require("cloudinary").v2;

const deleteDissertation = async (req, res) => {
  try {
    const { id } = req.params;

    // =========================
    // 🔍 VALIDATE ID
    // =========================
    if (!id) {
      return res.status(400).json({
        message: "Dissertation ID is required",
      });
    }

    // =========================
    // 🔎 CHECK IF EXISTS
    // =========================
    const [rows] = await db.query(
      "SELECT * FROM dissertations WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Dissertation not found",
      });
    }

    const dissertation = rows[0];

    const publicId = dissertation.public_id; // 🔥 IMPORTANT

    // =========================
    // ☁️ DELETE FROM CLOUDINARY
    // =========================
    if (publicId) {
      try {
        const result = await cloudinary.uploader.destroy(
          publicId, {
          resource_type: "image", // ⚠️ PDFs use "raw"
        });

        console.log("☁️ Cloudinary delete result:", result);

        if (result.result !== "ok" && result.result !== "not found") {
          return res.status(500).json({
            message: "Failed to delete file from Cloudinary",
          });
        }

      } catch (cloudErr) {
        console.error("❌ Cloudinary error:", cloudErr);
        return res.status(500).json({
          message: "Cloudinary deletion failed",
        });
      }
    }

    // =========================
    // 🗑️ DELETE FROM DATABASE
    // =========================
    await db.query(
      "DELETE FROM dissertations WHERE id = ?",
      [id]
    );

    await createNotification("dissertation", {
      action: "deleted",
      title: dissertation.title,
      author: dissertation.author_name,
    });

    // =========================
    // ✅ SUCCESS RESPONSE
    // =========================
    return res.json({
      message: "Dissertation deleted successfully",
      deletedId: id,
    });

  } catch (err) {
    console.error("❌ DELETE ERROR:", err);
    await createNotification("system", {
      action: "danger",
      message: `Failed to Delete Dissertation`
    });
    return res.status(500).json({
      message: "Server error while deleting dissertation",
    });
  }
};

const getDissertationById = async (req, res) => {
  try {
    const { id } = req.params;

    // =========================
    // 🔍 GET DISSERTATION
    // =========================
    const [rows] = await db.query(
      `SELECT 
        id,
        title,
        author_name,
        abstract,
        methodology,
        supervisor,
        image_url,
        license,
        citations,
        campus_id,
        faculty_id,
        courses_id
      FROM dissertations
      WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Dissertation not found",
      });
    }

    const dissertation = rows[0];

    // =========================
    // 📚 FETCH RELATED DATA
    // =========================
    const [campuses] = await db.query("SELECT * FROM campuses");
    const [faculties] = await db.query("SELECT * FROM faculties");
    const [courses] = await db.query("SELECT * FROM courses");
    const [images] = await db.query("SELECT * FROM images");

    return res.json({
      dissertation,
      campuses,
      faculties,
      courses,
      images,
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateDissertation = async (req, res) => {
  const { id } = req.params;

  const {
    title,
    author_name,
    abstract,
    methodology,
    supervisor,
    image_url,
    license,
    citations,
    campus_id,
    faculty_id,
    course_id,
  } = req.body;
  try {

    // =========================
    // 🔍 VALIDATION
    // =========================
    if (
      !title ||
      !author_name ||
      !abstract ||
      !methodology ||
      !supervisor ||
      !image_url ||
      !license ||
      !citations ||
      !campus_id ||
      !faculty_id ||
      !course_id
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // =========================
    // 🔎 CHECK IF EXISTS
    // =========================
    const [existing] = await db.query(
      "SELECT id FROM dissertations WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Dissertation not found",
      });
    }

    // =========================
    // 📝 UPDATE
    // =========================
    await db.query(
      `UPDATE dissertations SET
        title = ?,
        author_name = ?,
        abstract = ?,
        methodology = ?,
        supervisor = ?,
        image_url = ?,
        license = ?,
        citations = ?,
        campus_id = ?,
        faculty_id = ?,
        courses_id = ?
      WHERE id = ?`,
      [
        title,
        author_name,
        abstract,
        methodology,
        supervisor,
        image_url,
        license,
        citations,
        campus_id,
        faculty_id,
        course_id,
        id,
      ]
    );

    await createNotification("dissertation", {
      action: "updated",
      title: title,
      author: author_name,
    });

    return res.json({
      message: "✅ Dissertation updated successfully",
      id,
    });

  } catch (err) {
    console.error("❌ UPDATE ERROR:", err);
    await createNotification("system", {
      action: "danger",
      message: `Failed to Update Dissertation ${title} by ${author_name}`
    });
    res.status(500).json({
      message: "Server error while updating",
    });
  }
};

module.exports = { getAllDissertations, deleteDissertation, getDissertationById, updateDissertation };