// utils/cloudinaryHelpers.js

function getDownloadUrl(secureUrl, filename = "") {
  if (!secureUrl) return "";

  if (filename) {
    return secureUrl.replace(
      "/upload/",
      `/upload/fl_attachment:${filename}/`
    );
  }

  return secureUrl.replace("/upload/", "/upload/fl_attachment/");
}

module.exports = { getDownloadUrl };