const generateLicense = (authorName) => {
  try {
    // =========================
    // 1. VALIDATION
    // =========================

    console.log("🔍 Validating author name:", authorName);
    if (!authorName || typeof authorName !== "string") {
      return "License unavailable: Invalid author name.";
    }

    // =========================
    // 2. CLEAN NAME
    // =========================
    const cleanName = authorName.trim();

    // =========================
    // 3. CURRENT YEAR
    // =========================
    const year = new Date().getFullYear();

    // =========================
    // 4. GENERATE LICENSE
    // =========================
    const license = `
© ${year} ${cleanName}. All rights reserved.

This dissertation is made available strictly for academic and research purposes only. 
No part of this work may be reproduced, distributed, or transmitted in any form 
or by any means without prior written permission from the author, 
except for brief quotations used in scholarly analysis or review.

Unauthorized use may result in legal consequences.
    `.trim();

    return { student_license : license};

  } catch (error) {
    console.error("❌ License generation error:", error);
    return "License generation failed.";
  }
};

module.exports = { generateLicense };