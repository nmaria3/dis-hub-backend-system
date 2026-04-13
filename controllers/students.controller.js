const db = require("../config/db");
const { getUserFromClerk } = require("../utils/GetUserFromClerk");

const updateActivity = async (req, res) => {

    const clerkId = req.auth().userId;
    
    try {
        // 1. Get user
        const [user] = await db.query(
        "SELECT id, role FROM users WHERE clerkid = ?",
        [clerkId]
        );

        if (!user) return res.status(404).json({ message: "User not found" });

        // 2. Validate student role
        if (user[0].role !== "student") {
        return res.status(403).json({ message: "Not a student" });
        }

        const userId = user[0].id;

        // 3. Insert OR Update activity
        await db.query(`
        INSERT INTO activity (user_id, last_seen)
        VALUES (?, NOW())
        ON DUPLICATE KEY UPDATE last_seen = NOW()
        `, [userId]);

        res.json({ message: "Activity updated" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// ================= GET USER DOWNLOADS =================
const getStudentDownloads = async (req, res) => {
  try {
    const clerkId = req.auth().userId;

    // 1. Get user
    const user = await getUserFromClerk(clerkId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Get downloads + dissertation details
    const [downloads] = await db.query(`
      SELECT 
        d.id,
        d.dissertation_id,
        d.downloaded_at,

        dis.title,
        dis.author_name,
        dis.file_download_url

      FROM dissertation_downloads d
      JOIN dissertations dis 
        ON d.dissertation_id = dis.id

      WHERE d.user_id = ?
      ORDER BY d.downloaded_at DESC
    `, [user.id]);

    res.json({
      success: true,
      count: downloads.length,
      data: downloads.map(item => ({
        title: item.title,
        author: item.author_name,
        downloaded_at: item.downloaded_at,
        file_download_url: item.file_download_url
      }))
    });

  } catch (err) {
    console.error("Fetch downloads error:", err);
    res.status(500).json({ message: "Error fetching downloads" });
  }
};

// ================= GET USER BOOKMARKS =================
const getStudentBookmarks = async (req, res) => {
  try {
    const clerkId = req.auth().userId;

    // 1. Get user
    const user = await getUserFromClerk(clerkId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Get bookmarks + dissertation + course
    const [bookmarks] = await db.query(`
      SELECT 
        b.id AS bookmark_id,
        b.dissertation_id,
        b.created_at,

        d.title,
        d.author_name,
        d.year,
        d.abstract,
        d.image_url,
        d.file_download_url,

        c.name AS course_name

      FROM dissertation_bookmarks b

      JOIN dissertations d 
        ON b.dissertation_id = d.id

      LEFT JOIN courses c 
        ON d.courses_id = c.id

      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [user.id]);

    res.json({
      success: true,
      count: bookmarks.length,
      data: bookmarks.map(item => ({
        bookmark_id: item.bookmark_id,
        dissertation_id: item.dissertation_id,
        title: item.title,
        author: item.author_name,
        year: item.year,
        abstract: item.abstract,
        image_url: item.image_url,
        file_download_url: item.file_download_url,
        course: item.course_name,
        created_at: item.created_at
      }))
    });

  } catch (err) {
    console.error("Fetch bookmarks error:", err);
    res.status(500).json({ message: "Error fetching bookmarks" });
  }
};

// use when fetching the time in our timezone.
// SELECT 
//   id,
//   user_id,
//   CONVERT_TZ(last_seen, '+00:00', '+03:00') AS last_seen_eat
// FROM activity;

module.exports = { updateActivity, getStudentDownloads, getStudentBookmarks };