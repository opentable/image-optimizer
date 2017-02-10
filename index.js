const hash = require('hash-files');
const sharp = require('sharp');
const async = require('async');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');

const DIGEST_FILENAME = '__imageDigest.json';
const SUPPORTED_FORMATS = ['.jpeg', '.jpg', '.png'];

const optimiseImage = (filePath, format, callback) => {
  let tempPath = filePath + '.tmp';

  sharp(filePath)
    .quality(75)
    .toFormat(format)
    .toFile(tempPath, (err, result) => {
      if (err) {
        return callback(err, null);
      }

      let hash = generateHashOfFile(tempPath);

      fs.renameSync(tempPath, filePath);

      return callback(null, { filePath, hash });
    });
};

const saveDigest = (digestRoot, digest) => {
  let filePath = path.join(digestRoot, DIGEST_FILENAME);
  fs.writeFileSync(filePath, JSON.stringify(digest, null, 4), { encoding: 'utf8' });
};

const loadDigest = (digestRoot) => {
  let filePath = path.join(digestRoot, DIGEST_FILENAME);

  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  return [];
};

const isOptimised = (filePath, digest) => {
  let hash = generateHashOfFile(filePath);
  return hash === digest[filePath];
};

const generateHashOfFile = (filePath) => {
  return hash.sync({ files: [filePath], algorithm: 'sha1' });
};

const isFileSupported = (filePath) => {
  let extension = path.extname(filePath).toLowerCase();
  return SUPPORTED_FORMATS.includes(extension);
};

const isDirectory = (filePath) => {
  return fs.statSync(filePath).isDirectory();
};

const isJpeg = (filePath) => {
  let extension = path.extname(filePath).toLowerCase();
  return extension === '.jpeg' || extension === '.jpg';
};

const getImagePathsInDirectory = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    let filePath = path.join(dir, file);

    if (isDirectory(filePath)) {
      getImagePathsInDirectory(path.join(dir, file), filelist);
    } else if (isFileSupported(filePath)) {
      filelist = filelist.concat(path.join(dir, file));
    }
  });

  return filelist;
};

module.exports = (options, callback) => {
  let filePaths = getImagePathsInDirectory(options.root);
  let digest = loadDigest(options.root);

  let optimiseTasks = _(filePaths)
    .filter(filePath => {
      return !isOptimised(filePath, digest);
    })
    .map(filePath => {
      let format = isJpeg(filePath) ? sharp.format.jpeg : sharp.format.png;
      return (callback) => optimiseImage(filePath, format, callback);
    }).value();

  async.parallel(optimiseTasks, (err, result) => {
    if (err) {
      return callback(err, null);
    }
    saveDigest(options.root, _.assign(digest, result));
  });

  return callback(null, null);
};