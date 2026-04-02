// utils/fileSizeFormatter.js

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "0 KB";

  const kb = bytes / 1024;
  const mb = bytes / (1024 * 1024);

  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }

  return `${kb.toFixed(2)} KB`;
}

module.exports = { formatFileSize };