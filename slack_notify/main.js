const fs = require("fs");
const os = require("os");
const userInfo = os.userInfo();
const { execSync } = require("child_process");
let isSomeTestsFailed = false;
const TEST_ENV = process.env.TEST_ENV || "Dev"; // Test environment name
const TEST_USERNAME = process.env.TEST_USERNAME || userInfo.username; // Test environment name
const CUSTOM_BLOCK = process.env.CUSTOM_BLOCK
  ? JSON.parse(process.env.CUSTOM_BLOCK)
  : null;
const generateSlackBlocks = (report) => {
  const blocks = [];
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `Test Environment: ${TEST_ENV} Requested For: ${TEST_USERNAME}`,
      emoji: true,
    },
  });
  blocks.push({ type: "divider" });
  if (CUSTOM_BLOCK !== null) {
    blocks.push(CUSTOM_BLOCK);
    blocks.push({ type: "divider" });
  }

  // Separate features into left and right groups
  const rightFeatures = report.filter((_, index) => index % 2 !== 0);
  const leftFeatures = report.filter((_, index) => index % 2 === 0);

  // Seen scenario tracker
  const seenScenarios = new Set();

  // Generate text for the left side
  const leftText = leftFeatures
    .map((feature) => {
      return `*${feature.name}*\n${feature.elements
        .map((scenario) => {
          const passed = scenario.steps.every(
            (step) => step.result.status === "passed",
          );
          if (!passed) {
            isSomeTestsFailed = true;
          }
          if (passed && seenScenarios.has(scenario.name)) return null;
          if (passed) seenScenarios.add(scenario.name);
          const statusEmoji = passed ? ":white_check_mark:" : ":x:";
          return `${statusEmoji} ${scenario.name}`;
        })
        .filter(Boolean)
        .join("\n")}`;
    })
    .join("\n\n");

  // Generate text for the right side
  const rightText = rightFeatures
    .map((feature) => {
      return `*${feature.name}*\n${feature.elements
        .map((scenario) => {
          const passed = scenario.steps.every(
            (step) => step.result.status === "passed",
          );
          if (!passed) {
            isSomeTestsFailed = true;
          }
          if (passed && seenScenarios.has(scenario.name)) return null;
          if (passed) seenScenarios.add(scenario.name);
          const statusEmoji = passed ? ":white_check_mark:" : ":x:";
          return `${statusEmoji} ${scenario.name}`;
        })
        .filter(Boolean)
        .join("\n")}`;
    })
    .join("\n\n");

  // Add left and right content to the block
  if (rightText !== "") {
    blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: leftText,
        },
        {
          type: "mrkdwn",
          text: rightText,
        },
      ],
    });
  } else {
    blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: leftText,
        },
      ],
    });
  }
  if (!isSomeTestsFailed) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*All tests passed!! Don't forget to thank the developers!! *",
      },
    });
  } else {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Oh no! Some tests couldn't handle the pressure!*",
      },
    });
  }
  return blocks;
};

// Function to split blocks into chunks of 50
const splitBlocks = (blocks, chunkSize = 50) => {
  const chunks = [];
  for (let i = 0; i < blocks.length; i += chunkSize) {
    chunks.push(blocks.slice(i, i + chunkSize));
  }
  return chunks;
};
function extractHostAndEndpoint(url) {
  try {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.origin, // Extracts protocol + host
      endpoint: parsedUrl.pathname, // Extracts everything after the host
    };
  } catch (error) {
    throw new Error("Invalid URL format");
  }
}
const postToSlack = (blocks, slack_webhook_url) => {
  const blockChunks = splitBlocks(blocks);
  for (const [index, chunk] of blockChunks.entries()) {
    try {
      const response = post(slack_webhook_url, { blocks: chunk });
      console.log(`Message chunk ${index + 1} sent: `, response.status);
    } catch (error) {
      console.error(`Error sending message chunk ${index + 1}: `, error);
    }
  }
};

function post(endpoint, data, header = { "Content-Type": "application/json" }) {
  console.log(
    `Hitting ${endpoint} with data ${JSON.stringify(data)} and header as ${JSON.stringify(header)}`,
  );

  try {
    // Convert headers object into curl format
    const headerString = Object.entries(header)
      .map(([key, value]) => `-H "${key}: ${value}"`)
      .join(" ");

    // Construct curl command with `-L` to follow redirects
    const curlCommand = `curl ${endpoint} -X POST ${headerString} -i -d ${JSON.stringify(JSON.stringify(data))}`;

    // Execute the command synchronously
    const response = execSync(curlCommand, { encoding: "utf-8" });

    // Split response body and status code
    const responseParts = response.trim().split("\n");
    const statusCode = parseInt(responseParts.pop(), 10); // Last line is status code
    const responseBody = responseParts.join("\n"); // Rest is the body

    return {
      body: responseBody,
      status: statusCode,
    };
  } catch (error) {
    console.error("Error making synchronous POST request:", error);
    return { body: null, status: 500 };
  }
}
function publish_to_slack(REPORT_PATH, SLACK_WEBHOOK_URL) {
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf-8"));
  const slackBlocks = generateSlackBlocks(report);
  postToSlack(slackBlocks, SLACK_WEBHOOK_URL);
}

module.exports = {
  publish_to_slack,
};
