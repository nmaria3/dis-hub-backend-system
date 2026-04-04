const extract = require("pdf-text-extract");

const processSinglePDF = async (filePath, campuses) => {
  try {
    console.log("\n📄 Processing File:", filePath);

    // ===============================
    // 1. EXTRACT FIRST PAGE
    // ===============================
    const rawText = await new Promise((resolve, reject) => {
      extract(filePath, { firstPage: true, lastPage: 1 }, (err, pages) => {
        if (err) return reject(err);

        let text = pages.join(" ");

        // Clean text
        text = text
          .replace(/\r\n/g, "\n")
          .replace(/\n+/g, "\n")
          .replace(/\s+/g, " ")
          .trim();

        resolve(text);
      });
    });

    // ===============================
    // 2. CUT AFTER CAMPUS
    // ===============================
    const relevantMatch = rawText.match(/(Title:.*?Campus:.*?)(\n|$)/i);
    const cleanText = relevantMatch ? relevantMatch[1] : rawText;

    // ===============================
    // 3. FIELD EXTRACTOR
    // ===============================
    const getField = (label) => {
      const regex = new RegExp(
        `${label}:\\s*([\\s\\S]*?)(?=\\b[A-Z][a-z]+\\s?:|$)`,
        "i"
      );
      const match = cleanText.match(regex);
      return match ? match[1].trim() : null;
    };

    // ===============================
    // 4. EXTRACT RAW DATA
    // ===============================
    const rawCampus = getField("Campus");

    // ===============================
    // 5. MATCH CAMPUS FROM DB
    // ===============================
    let cleanCampus = null;

    if (rawCampus && campuses && campuses.length > 0) {
      const lowerText = rawCampus.toLowerCase();

      for (const campus of campuses) {
        if (lowerText.includes(campus.name.toLowerCase())) {
          cleanCampus = campus.name;
          break;
        }
      }
    }

    // ===============================
    // 6. FINAL OBJECT
    // ===============================
    const finalData = {
      title: getField("Title"),
      author_name: getField("Author Name"),
      abstract: getField("Abstract"),
      methodology: getField("Methodology"),
      supervisor: getField("Supervisor"),
      course: getField("Course"),
      faculty: getField("Faculty"),
      campus: cleanCampus, // ✅ CLEAN VALUE
    };

    // ===============================
    // 7. DEBUG OUTPUT
    // ===============================
    // console.log("\n📝 RAW TEXT:\n", rawText);
    // console.log("\n✂️ FILTERED TEXT:\n", cleanText);
    // console.log("\n✅ FINAL CLEAN DATA:\n", finalData);

    return finalData;

  } catch (error) {
    console.error("❌ Error processing PDF:", error);
    return null;
  }
};

module.exports = { processSinglePDF };