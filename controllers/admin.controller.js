const db = require("../config/db");
const dotenv = require("dotenv").config();
const { generateCitations } = require("../utils/CitationsGenerator");
const { formatFileSize } = require("../utils/FileSizeFormatter");
const { getDownloadUrl } = require("../utils/CloudinaryHelper");
const { saveDissertation } = require("../utils/SaveDissertation");
const { generateFileHash}  = require("../utils/GenerateFileHash");
const { setStatus } = require("../utils/StatusManager");
const { processSinglePDF } = require("../utils/PDFExtractor");
const { getAdminAndRandomImage } = require("../utils/GetAdminAndImage");
const { generateLicense } = require("../utils/LicenseGenerator");
const { getStatus } = require("../utils/StatusScore");
const { getAllLookups } = require("../utils/dbLookUps");
const { matchIds } = require("../utils/matchIds");
const { clearUploadsFolder } = require("../utils/ClearUploadsFolder");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const streamifier = require("streamifier");
const path = require("path");
const fs = require("fs");

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
    // console.log("File Data:", file)

    const fileSize = formatFileSize(req.file.size);

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

    // console.log(result);
    // console.log(`Public Id: ${result.public_id}`);

    const number_of_pages = result.pages || pages; // fallback to user input if Cloudinary doesn't return pages

    const cloudinary_url = result.secure_url;

    // Get download URL with proper attachment flag
    const download = getDownloadUrl(cloudinary_url, fileName);

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
      public_id: result.public_id
    });

    if (!getResult) {
      return res.status(500).json({
        message: "Failed to save dissertation to database",
      });
    }

    // Clear up all files in the uploads folder
    clearUploadsFolder();

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

const multipleUploadHandler = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    console.log("📥 MULTIPLE FILES RECEIVED");

    const filesData = req.files.map((file) => {
      const sizeMB =
        file.size / 1024 / 1024 >= 1
          ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
          : `${(file.size / 1024).toFixed(2)} KB`;

      const fileInfo = {
        name: file.originalname,
        saved_as: file.filename,
        path: file.path,
        size: sizeMB,
        type: file.mimetype,
      };

      // console.log("📂 FILE:", fileInfo);

      return fileInfo;
    });

    return res.json({
      message: "Files uploaded successfully",
      files: filesData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

const getUploadedFiles = (req, res) => {
  try {
    const directoryPath = path.join(__dirname, "../uploads");

    const files = fs.readdirSync(directoryPath);

    const fileData = files.map((file) => {
      const filePath = path.join(directoryPath, file);
      const stats = fs.statSync(filePath);

      const size =
        stats.size / 1024 / 1024 >= 1
          ? `${(stats.size / 1024 / 1024).toFixed(2)} MB`
          : `${(stats.size / 1024).toFixed(2)} KB`;

      return {
        name: file,
        size,
        created_at: stats.birthtime,
      };
    });

    return res.json({ files: fileData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to read files" });
  }
};

const deleteFile = (req, res) => {
  try {
    const { filename } = req.params;

    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    fs.unlinkSync(filePath);

    return res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};


// 🔥 Get all campuses
const getCampusesFromDB = async () => {
  const [rows] = await db.query("SELECT id, name FROM campuses");
  return rows; // [{id:1, name:"Nkozi"}, ...]
};

// 🔥 Simulated background process (we improve later)
const processUploads = async () => {
  try {
    const uploadFolder = path.join(__dirname, "../uploads");
    const files = fs.readdirSync(uploadFolder);

    // console.log("📂 Files found:", files);

    // =========================
    // 🚨 CHECK IF EMPTY
    // =========================
    if (!files || files.length === 0) {
      setStatus({
        status: "error",
        progress: 0,
        message: "No files found in upload folder",
      });
      return {message: "No files found in upload folder"};
    }

    let processed = 0;

    const lookups = await getAllLookups(); // ✅ fetch once

    for (const file of files) {
      console.log(`📄 Processing: ${file}`);

      const filePath = path.join(uploadFolder, file);

      try {
        // =========================
        // 1. EXTRACT DATA
        // =========================
        const campuses = await getCampusesFromDB();
        const extractedData = await processSinglePDF(filePath, campuses);

        // console.log("\n🧠 EXTRACTED:", extractedData);

          // =========================
          // 🎯 MATCH IDs
          // =========================
          const ids = matchIds(extractedData, lookups);

          // console.log("\n\n\n\n📌 MATCHED IDs:", ids, "\n\n\n\n");

        // =========================
        // 2. READ FILE BUFFER
        // =========================
        const fileBuffer = fs.readFileSync(filePath);

        // 🔑 Generate hash
        const fileHash = generateFileHash(fileBuffer);

        // console.log("Generated File Hash:", fileHash); // Debug report

        // 🔍 Check DB BEFORE upload
        const [existing] = await db.query(
          "SELECT id FROM dissertations WHERE file_hash = ?",
          [fileHash]
        );

        if (existing.length > 0) {
            console.log("❌ Duplicate file detected. This dissertation already exists.");
        }

        const fileName = file.replace(".pdf", "");

        // =========================
        // 3. UPLOAD TO CLOUDINARY
        // =========================
        const uploadToCloudinary = () =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                resource_type: "auto",
                folder: "Dissertations",
                public_id: fileName,
                unique_filename: false,
                overwrite: true,
                invalidate: true,
              },
              (error, result) => {
                if (result) resolve(result);
                else reject(error);
              }
            );

            streamifier.createReadStream(fileBuffer).pipe(stream);
          });

        const cloudinaryResult = await uploadToCloudinary();

        // console.log("\n☁️ CLOUDINARY RESULT:");
        // console.log(cloudinaryResult.secure_url);

        const number_of_pages = cloudinaryResult.pages || extractedData.pages || "N/A";
        // console.log("📄 Number of Pages:", number_of_pages);

        const thisYear = new Date().getFullYear();
        // console.log("📅 Year:", thisYear);

        // Get download URL with proper attachment flag
        const download = getDownloadUrl(cloudinaryResult.secure_url, fileName);
        // console.log("🔗 Download URL:", download);

        const adminandImage = await getAdminAndRandomImage();

        // console.log("\n👤 Admin ID:", adminandImage?.adminId);
        // console.log("🖼️ Random Image:", adminandImage?.imageUrl);

        const citations = generateCitations({
            title: extractedData.title,
            author: extractedData.author,
            year: thisYear,
            platform: "Dis-Hub",
            institution: "Uganda Martyrs University",
            dissertation_url: cloudinaryResult.secure_url,
        });

        // console.log("\n📚 Generated Citations:");
        // console.log(citations.formatted);

        // =========================
        // 4. FINAL OBJECT (NOT SAVING YET)
        // =========================
        const finalObject = {
          ...extractedData,
          file_url: cloudinaryResult.secure_url,
          file_size: `${(fileBuffer.length / 1024).toFixed(2)} KB`,
        };

        // console.log("\n🎯 FINAL OBJECT:");
        // console.log(finalObject);

        const license = generateLicense(finalObject.author_name);

        // console.log("\n📄 Generated License:");
        // console.log(license.student_license);

        const fileSize = formatFileSize(fileBuffer.length);
        // console.log("📂 Formatted File Size:", fileSize);

        // Save to DB (we can optimize by batching later)
        const saveResult = await saveDissertation({
          title: finalObject.title,
          author: finalObject.author_name,
          abstract: finalObject.abstract,
          methodology: finalObject.methodology,
          supervisor: finalObject.supervisor,
          pages: number_of_pages,
          fileSize: fileSize,
          fileUrl: cloudinaryResult.secure_url,
          downloadUrl: download,
          imageUrl: adminandImage.imageUrl,
          license: license.student_license,
          citations: citations.formatted,
          courseId: ids.course_id,
          uploadedBy: adminandImage.adminId,
          facultyId: ids.faculty_id,
          campusId: ids.campus_id,
          year: thisYear,
          fileHash: fileHash,
          public_id: cloudinaryResult.public_id
        });

          // console.log("\n💾 Save Result:");
          console.log(saveResult);

        if(saveResult.success) 
        {
          console.log(" ✅ File has been saved to the database Successfully.")
        }
        else
        {
          console.log("Error: ❌ File could not be saved into the database!!!")
        }

        processed++;

        // =========================
        // 5. UPDATE STATUS
        // =========================
        setStatus({
          status: "processing",
          progress: Math.round((processed / files.length) * 100),
          totalFiles: files.length,
          processedFiles: processed,
          message: `Processed ${file}`,
        });

      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error);
      }
    }
    
    setStatus({
      status: "completed",
      progress: 100,
      totalFiles: files.length,
      processedFiles: files.length,
      message: "All uploads completed",
    });

    console.log("✅ Upload process complete");

    clearUploadsFolder();

  } catch (error) {
    console.error("❌ Processing error:", error);

    setStatus({
      status: "error",
      progress: 0,
      totalFiles: 0,
      processedFiles: 0,
      message: "Something went wrong",
    });
  }
};

// ===============================
// 🚀 PUBLISH ENDPOINT
// ===============================
const publishDissertations = async (req, res) => {
  try {
    console.log("🚀 Publish endpoint hit");
    
    const uploadFolder = path.join(__dirname, "../uploads");
    const files = fs.readdirSync(uploadFolder);

    // console.log("📂 Files found:", files);
    
    // =========================
    // 🚨 CHECK IF EMPTY
    // =========================
    if (!files || files.length === 0) {
      return res.status(404).json({
        message: "No files found in upload folder",
      });
    }

    // Set initial status
    setStatus({
      status: "processing",
      progress: 0,
      totalFiles: 0,
      processedFiles: 0,
      message: "Starting upload...",
    });

    // 🔥 Run in background (VERY IMPORTANT)
    processUploads();


    // ✅ Immediate response
    return res.status(200).json({
      message: "Upload started successfully",
      status: "processing",
    });

  } catch (error) {
    console.error("❌ Publish error:", error);

    return res.status(500).json({
      message: "Failed to start upload",
    });
  }
};

// =========================
// 📡 GET UPLOAD STATUS
// =========================
const getUploadStatus = (req, res) => {
  try {
    const status = getStatus();

    // console.log("📊 Current Status:", status);

    return res.status(200).json({
      status: status.status,
      progress: status.progress,
      message: status.message,
    });

  } catch (error) {
    console.error("❌ Error fetching status:", error);

    return res.status(500).json({
      status: "error",
      progress: 0,
      message: "Failed to fetch upload status",
    });
  }
};

module.exports = { getImages, uploadDissertation, multipleUploadHandler, getUploadedFiles, deleteFile, publishDissertations, getUploadStatus  };