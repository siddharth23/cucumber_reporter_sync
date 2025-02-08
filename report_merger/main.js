"use strict";

const fs = require("fs");
const fspath = require("path");
const readDirRecursive = require("fs-readdir-recursive");
const makeDir = require("mkdirp");
function getJsonFiles(dirPath, isRecursive) {
  try {
    var fileList = isRecursive
      ? readDirRecursive(dirPath)
      : fs.readdirSync(dirPath);

    var jsonFileList = fileList
      .filter(function (fileName) {
        // Skip 'merged-test-results.json' file
        return fileName !== "merged-test-results.json";
      })
      .map(function (fileName) {
        return fspath.join(dirPath, fileName);
      })
      // Filter out non-files
      .filter(function (filePath) {
        return fs.statSync(filePath).isFile();
      })
      // Only return files ending in '.json'
      .filter(function (filePath) {
        return filePath.slice(-5) === ".json";
      });
    // No files returned
    if (!jsonFileList.length > 0) {
      return new Error("No JSON files found");
    } else {
      // Return the array of files ending in '.json'
      return jsonFileList;
    }
  } catch (error) {
    throw error;
  }
}

function combineJsonFiles(jsonFiles) {
  let aggregatedData = [];
  jsonFiles.forEach(function (jsonFile) {
    try {
      let fileContent = fs.readFileSync(jsonFile);
      let parsedData = JSON.parse(fileContent);
      aggregatedData.push(parsedData);
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error("Invalid JSON content");
      } else {
        throw err;
      }
    }
  });
  return JSON.stringify(aggregatedData.concat.apply([], aggregatedData));
}

function saveMergedJson(outputFile, jsonData, createDirIfMissing) {
  try {
    // Check if the output file exists and delete it
    if (fs.existsSync(outputFile)) {
      console.log(outputFile);
      console.log("here");
      fs.unlinkSync(outputFile); // Delete the file if it exists
    }

    // If the directory doesn't exist and createDirIfMissing is true, create the directory
    if (createDirIfMissing) {
      makeDir.sync(outputFile.substr(0, outputFile.lastIndexOf("/")));
    }

    // Write the new file
    fs.writeFileSync(outputFile, jsonData, { flag: "w" });
  } catch (error) {
    if (error.code === "ENOENT") {
      // If the error is because of missing directories, create the directories
      if (createDirIfMissing) {
        makeDir.sync(outputFile.substr(0, outputFile.lastIndexOf("/")));
        fs.writeFileSync(outputFile, jsonData, { flag: "w" });
      } else {
        throw new Error("Missing output directory");
      }
    } else {
      // Throw any other error
      throw error;
    }
  }
}

module.exports = {
  getJsonFiles,
  combineJsonFiles,
  saveMergedJson,
};
