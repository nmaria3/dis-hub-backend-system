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

// ================= DASHBOARD ANALYTICS =================
const getStudentDashboardAnalytics = async (req, res) => {
  try {
    const clerkId = req.auth().userId;

    // ================= USER =================
    const user = await getUserFromClerk(clerkId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const userObj = {
      id: user.id,
      clerkId
    };

    // ================= DOWNLOADS =================
    const [[totalDownloads]] = await db.query(
      "SELECT COUNT(*) as total FROM dissertation_downloads WHERE user_id = ?",
      [user.id]
    );

    const [[monthlyDownloads]] = await db.query(`
      SELECT COUNT(*) as total 
      FROM dissertation_downloads 
      WHERE user_id = ?
      AND MONTH(downloaded_at) = MONTH(NOW())
      AND YEAR(downloaded_at) = YEAR(NOW())
    `, [user.id]);

    const downloads = {
      total: totalDownloads.total,
      this_month: monthlyDownloads.total
    };

    console.log("Downloads:", downloads);

    // ================= BOOKMARKS =================
    const [[totalBookmarks]] = await db.query(
      "SELECT COUNT(*) as total FROM dissertation_bookmarks WHERE user_id = ?",
      [user.id]
    );

    const [[latestBookmark]] = await db.query(`
      SELECT created_at 
      FROM dissertation_bookmarks 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [user.id]);

    const bookmarks = {
      total: totalBookmarks.total,
      latest: latestBookmark?.created_at || null
    };

    // ================= VIEWS (THIS MONTH) =================
    const [[viewsThisMonth]] = await db.query(`
      SELECT COUNT(*) as total 
      FROM dissertation_views
      WHERE user_id = ?
      AND MONTH(viewed_at) = MONTH(NOW())
      AND YEAR(viewed_at) = YEAR(NOW())
    `, [user.id]);

    const views = {
      this_month: viewsThisMonth.total
    };

    // ================= RECENT DOWNLOADS (5) =================
    const [recentDownloads] = await db.query(`
      SELECT 
        d.dissertation_id,
        dis.title,
        dis.author_name,
        dis.pages,
        dis.year,
        c.name AS course
      FROM dissertation_downloads d
      JOIN dissertations dis ON d.dissertation_id = dis.id
      LEFT JOIN courses c ON dis.courses_id = c.id
      WHERE d.user_id = ?
      ORDER BY d.downloaded_at DESC
      LIMIT 5
    `, [user.id]);

    // ================= TOP DOWNLOADED =================
    const [[topDissertation]] = await db.query(`
      SELECT 
        d.dissertation_id,
        dis.title,
        COUNT(*) as downloads
      FROM dissertation_downloads d
      JOIN dissertations dis ON d.dissertation_id = dis.id
      GROUP BY d.dissertation_id
      ORDER BY downloads DESC
      LIMIT 1
    `);

    const [[totalAllDownloads]] = await db.query(
      "SELECT COUNT(*) as total FROM dissertation_downloads"
    );

    const top = topDissertation
      ? {
          ...topDissertation,
          percentage: totalAllDownloads.total
            ? ((topDissertation.downloads / totalAllDownloads.total) * 100).toFixed(2)
            : 0
        }
      : null;

    // ================= WEEKLY ACTIVITY =================
    const [weeklyActivity] = await db.query(`
      SELECT DATE(viewed_at) as day, COUNT(*) as count
      FROM dissertation_views
      WHERE user_id = ?
      AND viewed_at >= NOW() - INTERVAL 7 DAY
      GROUP BY DATE(viewed_at)
    `, [user.id]);

    const activityMap = {};
    weeklyActivity.forEach(d => {
      activityMap[d.day] = true;
    });

    const activity = {
      days_active: Object.keys(activityMap).length,
      raw: activityMap
    };

    // ================= RECENT BOOKMARKS =================
    const [recentBookmarks] = await db.query(`
      SELECT 
        b.dissertation_id,
        d.title,
        d.abstract,
        c.name AS course,
        TIMESTAMPDIFF(SECOND, b.created_at, NOW()) as seconds_ago
      FROM dissertation_bookmarks b
      JOIN dissertations d ON b.dissertation_id = d.id
      LEFT JOIN courses c ON d.courses_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
      LIMIT 5
    `, [user.id]);

    // ================= TRENDING (THIS WEEK) =================
    const [trending] = await db.query(`
      SELECT 
        dis.id AS dissertation_id,
        dis.title,

        COUNT(DISTINCT v.id) as views,
        COUNT(DISTINCT dl.id) as downloads

      FROM dissertations dis

      LEFT JOIN dissertation_views v 
        ON dis.id = v.dissertation_id 
        AND v.viewed_at >= NOW() - INTERVAL 7 DAY

      LEFT JOIN dissertation_downloads dl 
        ON dis.id = dl.dissertation_id 
        AND dl.downloaded_at >= NOW() - INTERVAL 7 DAY

      GROUP BY dis.id
      ORDER BY (views + downloads) DESC
      LIMIT 5
    `);

    // ================= FINAL RESPONSE =================
    res.json({
      success: true,
      user: userObj,
      downloads,
      bookmarks,
      views,
      recentDownloads,
      topDissertation: top,
      activity,
      recentBookmarks,
      trending
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Error fetching dashboard analytics" });
  }
};

// use when fetching the time in our timezone.
// SELECT 
//   id,
//   user_id,
//   CONVERT_TZ(last_seen, '+00:00', '+03:00') AS last_seen_eat
// FROM activity;

module.exports = { updateActivity, getStudentDownloads, getStudentBookmarks, getStudentDashboardAnalytics };