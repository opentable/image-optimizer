const hash = require('hash-files');
const sharp = require('sharp');
const async = require('async');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');

const DIGEST_FILENAME = '__image-digest.json';
const SUPPORTED_FORMATS = ['.jpeg', '.jpg', '.png'];

const generateFileHash = filePath => hash.sync({ files: [filePath], algorithm: 'sha1' });
const isOptimised = (filePath, digest) => generateFileHash(filePath) === digest[filePath];
const isDirectory = filePath => fs.statSync(filePath).isDirectory();
const getDigestPath = digestRoot => path.join(digestRoot, DIGEST_FILENAME);

const isFileSupported = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  return SUPPORTED_FORMATS.includes(extension);
};

const optimiseImage = (filePath, format, callback) => {
  const tempPath = `${filePath}.tmp`;

  sharp(filePath)
    .quality(75)
    .toFormat(format)
    .toFile(tempPath, (err) => {
      if (err) {
        return callback(err, null);
      }

      fs.renameSync(tempPath, filePath);

      return callback(null, { filePath, hash: generateFileHash(tempPath) });
    });
};

const saveDigest = (digestRoot, digest) => {
  return fs.writeFileSync(getDigestPath(digestRoot), JSON.stringify(digest, null, 4), { encoding: 'utf8' });
};

const loadDigest = (digestRoot) => {
  const filePath = getDigestPath(digestRoot);

  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  return [];
};

const isJpeg = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  return extension === '.jpeg' || extension === '.jpg';
};

const getImagePathsInDirectory = (dir, filelist = []) => {
  let files = filelist;
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (isDirectory(filePath)) {
      getImagePathsInDirectory(path.join(dir, file), filelist);
    } else if (isFileSupported(filePath)) {
      files = files.concat(path.join(dir, file));
    }
  });

  return filelist;
};

module.exports = (options, callback) => {
  const filePaths = getImagePathsInDirectory(options.root);
  const digest = loadDigest(options.root);

  const optimiseTasks = _(filePaths)
    .filter(filePath => !isOptimised(filePath, digest))
    .map(filePath => cb =>
      optimiseImage(filePath,
        isJpeg(filePath) ? sharp.format.jpeg : sharp.format.png,
        cb)).value();

  async.parallel(optimiseTasks, (err, result) => {
    if (err) {
      return callback(err, null);
    }
    return saveDigest(options.root, _.assign(digest, result));
  });
  return callback(null, null);
};
