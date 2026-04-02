const db = require("../config/db");
const dotenv = require("dotenv").config();
const { generateCitations } = require("../utils/CitationsGenerator");
const { formatFileSize } = require("../utils/FileSizeFormatter");
const { getDownloadUrl } = require("../utils/CloudinaryHelper");
const { saveDissertation } = require("../utils/SaveDissertation");
const generateFileHash = require("../utils/GenerateFileHash");

const getImages = async (req, res) => {
  try {
    // =========================
    // 🔐 GET USER FROM CLERK TOKEN
    // =========================
    // console.log("Request Auth:", req.auth()); Debug report

    // console.log("User ID:", req.auth().userId); Debug report

    const clerkId = req.auth().userId;

    // console.log("Clerk ID:", clerkId); Debug report

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // =========================
    // 🔍 CHECK USER IN DATABASE
    // =========================
    const [users] = await db.query(
      "SELECT * FROM users WHERE clerkid = ?",
      [clerkId]
    );

    if (users.length === 0) {
      return res.status(403).json({
        message: "Intruder detected. User not found in database.",
      });
    }

    const user = users[0];

    // =========================
    // 🛡️ CHECK ADMIN ROLE
    // =========================
    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }

    // =========================
    // 📸 FETCH IMAGES
    // =========================
    const [images] = await db.query(
      "SELECT id, image_url, created_at FROM images ORDER BY created_at DESC"
    );

    // =========================
    // ✅ RETURN RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });

  } catch (error) {
    console.error("❌ GET IMAGES ERROR:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadDissertation = async (req, res) => {
  try {
    console.log("📥 REQUEST RECEIVED");

    const clerkId = req.auth().userId;

    // =========================
    // 🧾 LOG DATA
    // =========================
    // console.log("📦 BODY:", req.body);

    // Set current year if not provided
    const currentYear = new Date().getFullYear();


    const {
      title,
      author,
      methodology,
      abstract,
      campus,
      faculty,
      course,
      supervisor,
      pages,
      license,
      image_url,
    } = req.body;

    // 🔥 REQUIRED FIELDS CHECK
    if (
      !title?.trim() ||
      !author?.trim() ||
      !methodology?.trim() ||
      !abstract?.trim() ||
      !campus ||
      !faculty ||
      !course ||
      !supervisor?.trim() ||
      !pages ||
      !license?.trim() ||
      !image_url?.trim()
    ) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    // 🔢 NUMBER VALIDATION
    if (isNaN(Number(pages)) || Number(pages) <= 0) {
      return res.status(400).json({
        message: "Pages must be a valid number",
      });
    }

    // 📂 FILE CHECK
    if (!req.file) {
      return res.status(400).json({
        message: "PDF file is required",
      });
    }

    const file = req.file;

    // 📂 FILE BUFFER
    const fileBuffer = req.file.buffer;

    // console.log("📂 FILE INFO:");
    // console.log("Name:", file.originalname);
    // console.log("Size:", file.size);
    // console.log("MIME Type:", file.mimetype);
    // console.log("Buffer:", fileBuffer); // Debug report
    //

    // 🔑 Generate hash
    const fileHash = generateFileHash(fileBuffer);

    // console.log("Generated File Hash:", fileHash); // Debug report

    // 🔍 Check DB BEFORE upload
    const [existing] = await db.query(
      "SELECT id FROM dissertations WHERE file_hash = ?",
      [fileHash]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "❌ Duplicate file detected. This dissertation already exists.",
      });
    }

    // 🔐 CHECK USER
    const [users] = await db.query(
      "SELECT * FROM users WHERE clerkid = ?",
      [clerkId]
    );

    if (users.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = users[0];

    // Get Admin Id
    const adminId = user.id;

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    // IF NO FILE
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Extract clean file name (without extension)
    const fileName = path.parse(file.originalname).name;

    // =========================
    // 🚀 UPLOAD TO CLOUDINARY
    // =========================
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto", // supports pdf, video, etc
            folder: "Dissertations",
            public_id: fileName, // use clean file name as public_id
            unique_filename: false, // prevent Cloudinary from adding random suffix
            overwrite: true, // overwrite if file exists
            invalidate: true, // invalidate cached versions if overwritten
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await uploadToCloudinary();

    const number_of_pages = result.pages || pages; // fallback to user input if Cloudinary doesn't return pages

    const cloudinary_url = result.secure_url;

    // Get download URL with proper attachment flag
    const download = getDownloadUrl(cloudinary_url, fileName);

    const fileSize = formatFileSize(req.file.size);

   const citations = generateCitations({
      title,
      author,
      year: new Date().getFullYear(),
      platform: "Dis-Hub",
      institution: "Uganda Martyrs University",
      dissertation_url: cloudinary_url,
    });

    const getResult = await saveDissertation({
      title,
      author,
      abstract,
      methodology,
      supervisor,
      pages: number_of_pages,
      fileSize,
      fileUrl: cloudinary_url,
      downloadUrl: download,
      imageUrl: image_url,
      license,
      citations: citations.formatted,
      courseId: course,
      uploadedBy: adminId,
      facultyId: faculty,
      campusId: campus,
      year: currentYear,
      fileHash,
    });

    if (!getResult) {
      return res.status(500).json({
        message: "Failed to save dissertation to database",
      });
    }

    return res.json({
      message: "Dissertation uploaded successfully",
      file_url: cloudinary_url,
      finalResult: getResult,
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const fs = require("fs");
const {PDFParse} = require('pdf-parse');

const testExtract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 📂 Read file buffer
    // const buffer = fs.readFileSync(req.file.path);

    async function run() {
      const parser = new PDFParse({ url: 'https://res.cloudinary.com/dkqxz5dql/image/upload/v1775055382/Dissertations/DIS-press-release-2018-0620.pdf' });

      const result = await parser.getText();
      console.log(result);
      return result;
    }

    const result = await run();

    // 📄 Parse PDF
    // const data = await pdf(buffer);

    console.log("📄 RAW TEXT:");
    // console.log(data.text);

    // 👉 Get ONLY first page (simple trick)
    const firstPageText = result.pages[0].text;

    console.log("📄 FIRST PAGE:");
    console.log(firstPageText);

    const extractField = (text, field) => {
      const regex = new RegExp(`${field}:\\s*(.*)`);
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };

    const extracted = {
      title: extractField(firstPageText, "TITLE"),
      author: extractField(firstPageText, "AUTHOR"),
      methodology: extractField(firstPageText, "METHODOLOGY"),
      abstract: extractField(firstPageText, "ABSTRACT"),
      campus: extractField(firstPageText, "CAMPUS"),
      faculty: extractField(firstPageText, "FACULTY"),
      course: extractField(firstPageText, "COURSE"),
      supervisor: extractField(firstPageText, "SUPERVISOR"),
      pages: extractField(firstPageText, "PAGES"),
    };

    return res.json({
      message: "PDF parsed successfully",
      preview: extracted,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to extract PDF" });
  }
};

const extract = require("pdf-text-extract");

const localPdfTestExtract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("📂 FILE:", req.file);

    const filePath = req.file.path;

    console.log("📂 FILE PATH:", filePath);

    // 📄 Extract ONLY first page
    extract(filePath, { firstPage: 0, lastPage: 0 }, (err, pages) => {
      if (err) {
        console.error("❌ Extraction error:", err);
        return res.status(500).json({ message: "Extraction failed" });
      }

      const firstPageText = pages[0];

      console.log("📄 FIRST PAGE:");
      console.log(firstPageText);

      // =========================
      // 🔍 FIELD EXTRACTION
      // =========================
      const extractField = (text, field) => {
        const regex = new RegExp(`${field}:\\s*([\\s\\S]*?)(?=\\n[A-Z]+:|$)`);
        const match = text.match(regex);
        return match ? match[1].trim() : null;
      };

      const extracted = {
        title: extractField(firstPageText, "TITLE"),
        author: extractField(firstPageText, "AUTHOR"),
        methodology: extractField(firstPageText, "METHODOLOGY"),
        abstract: extractField(firstPageText, "ABSTRACT"),
        campus: extractField(firstPageText, "CAMPUS"),
        faculty: extractField(firstPageText, "FACULTY"),
        course: extractField(firstPageText, "COURSE"),
        supervisor: extractField(firstPageText, "SUPERVISOR"),
        pages: extractField(firstPageText, "PAGES"),
      };

      console.log("🎯 EXTRACTED DATA:");
      console.log("--------------------------------");
      Object.entries(extracted).forEach(([key, value]) => {
        console.log(`${key.toUpperCase()}: ${value}`);
      });
      console.log("--------------------------------");

      return res.json({
        message: "Local PDF extraction successful",
        extracted,
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getImages, uploadDissertation, testExtract, localPdfTestExtract };