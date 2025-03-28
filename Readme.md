# Cucumber Reporter Sync

`cucumber_reporter_sync` is an npm library designed to merge multiple Cucumber JSON reports and optionally post the results to a Slack channel. It helps streamline the process of aggregating Cucumber test results and sharing them in a team communication platform like Slack.

## Features

- Merge multiple Cucumber JSON reports into a single report.
- Recursively search for reports in subdirectories.
- Generate a merged report in a specified output file.
- Optionally post the merged report to a Slack channel using a Slack webhook.

## Installation

To install the `cucumber_reporter_sync` package, run the following command:

```bash
npm install cucumber_reporter_sync --save-dev
```

## Usage

## Merging and posting test report to Slack

You can also configure the library to post the merged report to a Slack channel. To do this, add the --slack <webhook-url> option with your Slack Incoming Webhook URL:

```bash
npx cucumber_reporter_sync merge --recursive --dir reports --slack https://hooks.slack.com/{YOUR WEBHOOK URL}
```

### Parameters:

- --recursive (optional)
  Recursively search for report files in subdirectories.

- --dir <directory> (required)
  The directory where the Cucumber JSON reports are located. You can specify the root directory and the program will find all relevant files.

- -o <output-file> (required)
  The file path where the merged report should be saved. It will save the merged JSON to the specified file.

- --slack <webhook-url> (optional)
  The Slack webhook URL where the merged report will be posted. You'll need to create an Incoming Webhook in your Slack workspace to get this URL.

#### Example:

```bash
npx cucumber_reporter_sync merge --dir ./reports -o ./reports/merged-report.json --slack https://hooks.slack.com/services/XXX/YYY/ZZZ
```

## Change The Username and Environment

In order to change the username and environment, you can use set the following environment variables:

### Username

```bash
export TEST_USERNAME={YOUR USERNAME}
```

#### Example:

```bash
export TEST_USERNAME=siddharth23
```

### Environment

```bash
export TEST_ENV={YOUR ENVIRONMENT}
```

#### Example:

```bash
export TEST_ENV=staging
```

### Slack Formatting

The merged Cucumber report will be posted to Slack with key information, such as:
Total number of tests
Passed and failed tests scenarios side by side view

![Sample Slack Report](./assets/slacksample.png)

# Collaborators

This project is currently maintained by:

- [@siddharth23](https://github.com/siddharth23)
- ![Siddharth Kala](./assets/collaborator.jpg)

Feel free to contribute if you'd like to help improve this project!
