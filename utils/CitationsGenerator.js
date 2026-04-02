// utils/citationGenerator.js

function generateCitations({
  title,
  author,
  year,
  platform,
  institution,
  dissertation_url,
}) {
  // 🧹 Basic cleanup
    const safe = (val) => {
        if (val === null || val === undefined) return "";
        return String(val).trim(); // ✅ force everything to string
    };

  const cleanTitle = safe(title);
  const cleanAuthor = safe(author);
  const cleanYear = safe(year);
  const cleanPlatform = safe(platform);
  const cleanInstitution = safe(institution);
  const cleanURL = safe(dissertation_url);

  // =========================
  // 📚 APA STYLE
  // =========================
  const apa = `${cleanAuthor} (${cleanYear}). *${cleanTitle}*. ${cleanInstitution}. ${cleanPlatform}. ${cleanURL}`;

  // =========================
  // 📚 MLA STYLE
  // =========================
  const mla = `${cleanAuthor}. "${cleanTitle}." ${cleanInstitution}, ${cleanYear}. ${cleanPlatform}, ${cleanURL}.`;

  // =========================
  // 📚 HARVARD STYLE
  // =========================
  const harvard = `${cleanAuthor} (${cleanYear}) '${cleanTitle}', ${cleanInstitution}. Available at: ${cleanURL} (Accessed: ${new Date().toLocaleDateString()}).`;

  // =========================
  // 📦 RETURN OBJECT
  // =========================
  return {
    raw: {
      title: cleanTitle,
      author: cleanAuthor,
      year: cleanYear,
      platform: cleanPlatform,
      institution: cleanInstitution,
      dissertation_url: cleanURL,
    },

    formatted: {
      apa,
      mla,
      harvard,
    },
  };
}

module.exports = { generateCitations };