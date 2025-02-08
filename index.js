#!/usr/bin/env node
"use strict";

const packageInfo = require("./package.json");
const jmerge = require("./report_merger/main.js");
const notifySlack = require("./slack_notify/main.js");
const { Command } = require("commander");

const program = new Command();

program
  .version(packageInfo.version)
  .option("-d, --dir <path>", "Merge all JSON files in the specified directory")
  .option("-C, --createDir", "Create the output directory if missing")
  .option(
    "-r, --recursive",
    "Recursively merge all JSON files in the directory",
  )
  .option("-s, --slack <slackwebhookurl>", "publish merged reports to slack")
  .option("-o, --out <mergedFile>", "Output file path")
  .arguments("<files...>")
  .parse(process.argv);
const options = program.opts();

// Set a dynamic default value for `--out`
if (!options.out) {
  options.out = options.dir
    ? `./${options.dir}/merged-test-results.json`
    : "./merged-test-results.json";
}
try {
  if (options.dir) {
    const jsonFiles = jmerge.getJsonFiles(options.dir, options.recursive);

    if (!jsonFiles.length) {
      console.error("ERROR!!! No files found in the directory !!!");
      process.exit(1);
    }

    const mergedData = jmerge.combineJsonFiles(jsonFiles);
    jmerge.saveMergedJson(options.out, mergedData, options.createDir);
  } else if (program.args.length) {
    const mergedData = jmerge.combineJsonFiles(program.args);
    jmerge.saveMergedJson(options.out, mergedData, options.createDir);
  } else {
    console.error("ERROR: No input files provided.");
    program.outputHelp();
    process.exit(1);
  }

  console.log(`Merged file saved to: ${options.out}`);
  if (options.slack) {
    notifySlack.publish_to_slack(`./${options.out}`, options.slack);
  }
} catch (error) {
  if (error.message === "Missing output directory") {
    console.error(
      "ERROR!!! Output directory is missing. Use --createDir to create it !!!",
    );
  } else {
    console.error(`ERROR: ${error.message}`);
  }
  process.exit(1);
}
