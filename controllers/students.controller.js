const db = require("../config/db")

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

// use when fetching the time in our timezone.
// SELECT 
//   id,
//   user_id,
//   CONVERT_TZ(last_seen, '+00:00', '+03:00') AS last_seen_eat
// FROM activity;

module.exports = { updateActivity  };