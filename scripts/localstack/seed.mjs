/**
 * LocalStack Seed Script for The Aegis Project
 * 
 * Seeds CloudWatch Logs and S3 with realistic test data.
 * Run with: node scripts/localstack/seed.mjs
 * 
 * Prerequisites: LocalStack container running on localhost:4566
 */

import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ENDPOINT = "http://localhost:4566";
const REGION = "us-east-1";
const CREDS = { accessKeyId: "test", secretAccessKey: "test" };

const cwClient = new CloudWatchLogsClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: CREDS,
});

const s3Client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: CREDS,
  forcePathStyle: true,
});

// ════════════════════════════════════════════════════════════
//  CloudWatch Logs Seeding
// ════════════════════════════════════════════════════════════

const FUNCTIONS = [
  "image-processor-prod",
  "payment-webhook-handler",
  "user-auth-service",
  "data-pipeline-etl",
  "notification-sender",
  "search-indexer",
  "api-gateway-proxy",
];

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function hex(len) {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function generateLogEvents(functionName) {
  const events = [];
  const now = Date.now();

  for (let i = 0; i < 8; i++) {
    const reqId = uuid();
    const offsetMs = (8 - i) * 420_000 + Math.floor(Math.random() * 60_000);
    const ts = now - offsetMs;
    const duration = Math.floor(Math.random() * 800) + 50;
    const memUsed = Math.floor(Math.random() * 80) + 40;
    const billed = (Math.floor(duration / 100) + 1) * 100;

    // START
    events.push({ timestamp: ts, message: `START RequestId: ${reqId} Version: $LATEST` });

    // Function-specific logs
    switch (functionName) {
      case "image-processor-prod":
        if (i < 4) {
          events.push({ timestamp: ts + 50, message: `INFO  Downloading image from s3://media-uploads-prod/input-${i}.jpg` });
          events.push({ timestamp: ts + 3000, message: `ERROR S3 GetObject timeout: Failed to download 'input-${i}.jpg' from bucket 'media-uploads-prod' after 3 retries. Connection timed out after 12000ms.` });
          events.push({ timestamp: ts + 3005, message: `ERROR Task timed out after 30000 ms` });
        } else {
          events.push({ timestamp: ts + 50, message: `INFO  Processing image input-${i}.jpg (2048x1536, 4.2MB)` });
          events.push({ timestamp: ts + 3000, message: `INFO  Thumbnail generated and uploaded to s3://media-thumbnails-prod/thumb-${i}.jpg` });
        }
        break;

      case "payment-webhook-handler":
        if (i < 3) {
          events.push({ timestamp: ts + 50, message: `INFO  Received Stripe webhook event: payment_intent.succeeded` });
          events.push({ timestamp: ts + 2000, message: `ERROR Database connection pool exhausted. Max connections (20) reached. Retry 1/3...` });
          events.push({ timestamp: ts + 3000, message: `ERROR Database connection failed after 3 retries: ECONNREFUSED 10.0.1.42:5432` });
        } else {
          events.push({ timestamp: ts + 50, message: `INFO  Stripe webhook verified. Event: invoice.paid for customer cus_${hex(8)}` });
          events.push({ timestamp: ts + 2000, message: `INFO  Payment recorded. Amount: $${Math.floor(Math.random() * 500) + 10}.${Math.floor(Math.random() * 99)}` });
        }
        break;

      case "user-auth-service":
        events.push({ timestamp: ts + 50, message: `INFO  Auth request for user user-${hex(8)}@example.com` });
        if (i === 2) {
          events.push({ timestamp: ts + 2000, message: `WARN  Cold start detected. Init duration: 823ms. Consider provisioned concurrency.` });
        } else {
          events.push({ timestamp: ts + 2000, message: `INFO  JWT token issued. TTL: 3600s. Scopes: read,write` });
        }
        break;

      case "data-pipeline-etl":
        if (i < 3) {
          events.push({ timestamp: ts + 50, message: `INFO  Processing DynamoDB Stream shard shardId-${hex(12)}` });
          events.push({ timestamp: ts + 2000, message: `ERROR Unhandled exception: Cannot read properties of undefined (reading 'NewImage'). DynamoDB record missing expected schema.` });
          events.push({ timestamp: ts + 2010, message: `ERROR Stack trace: TypeError at ETLProcessor.transform (index.js:142:18) at Runtime.handler (index.js:28:12)` });
        } else {
          events.push({ timestamp: ts + 50, message: `INFO  ETL batch processing: 250 records from table 'user-events'` });
          events.push({ timestamp: ts + 2000, message: `INFO  Successfully transformed and loaded 250 records to Redshift cluster aegis-analytics` });
        }
        break;

      case "notification-sender":
        events.push({ timestamp: ts + 50, message: `INFO  Sending notification batch: ${Math.floor(Math.random() * 500) + 50} recipients via SES` });
        events.push({ timestamp: ts + 2000, message: `INFO  Batch sent successfully. Delivery rate: ${Math.floor(Math.random() * 5) + 95}%. Bounced: ${Math.floor(Math.random() * 3)}` });
        break;

      case "search-indexer":
        if (i < 2) {
          events.push({ timestamp: ts + 50, message: `INFO  Indexing batch of 10 documents to Elasticsearch cluster es-prod` });
          events.push({ timestamp: ts + 2000, message: `WARN  Batch size is 10 (expected 500). Config BATCH_SIZE may have been changed. Invocation count will increase 50x.` });
        } else {
          events.push({ timestamp: ts + 50, message: `INFO  Indexing batch of 500 documents to Elasticsearch cluster es-prod` });
          events.push({ timestamp: ts + 2000, message: `INFO  Bulk index complete. 500 docs indexed in ${duration}ms. No errors.` });
        }
        break;

      case "api-gateway-proxy":
        events.push({ timestamp: ts + 50, message: `INFO  Proxying request: GET /api/v2/users?page=${Math.floor(Math.random() * 50) + 1}` });
        events.push({ timestamp: ts + 2000, message: `INFO  Response: 200 OK (${duration}ms). Cache: ${Math.random() > 0.5 ? "HIT" : "MISS"}` });
        break;
    }

    // END + REPORT
    events.push({ timestamp: ts + 3500, message: `END RequestId: ${reqId}` });
    events.push({
      timestamp: ts + 3501,
      message: `REPORT RequestId: ${reqId}\tDuration: ${duration}.00 ms\tBilled Duration: ${billed} ms\tMemory Size: 256 MB\tMax Memory Used: ${memUsed} MB`,
    });
  }

  // Sort by timestamp (required by CloudWatch)
  return events.sort((a, b) => a.timestamp - b.timestamp);
}

async function seedCloudWatchLogs() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  Seeding CloudWatch Logs                        ║");
  console.log("╚══════════════════════════════════════════════════╝");

  for (const fn of FUNCTIONS) {
    const logGroupName = `/aws/lambda/${fn}`;
    const logStreamName = `2026/03/29/[$LATEST]${hex(32)}`;

    // Create log group
    try {
      await cwClient.send(new CreateLogGroupCommand({ logGroupName }));
      console.log(`  ✓ Created log group: ${logGroupName}`);
    } catch (e) {
      if (e.name === "ResourceAlreadyExistsException") {
        console.log(`  → Log group exists: ${logGroupName}`);
      } else throw e;
    }

    // Create log stream
    try {
      await cwClient.send(new CreateLogStreamCommand({ logGroupName, logStreamName }));
    } catch (e) {
      if (e.name !== "ResourceAlreadyExistsException") throw e;
    }

    // Generate and put events
    const events = generateLogEvents(fn);

    await cwClient.send(
      new PutLogEventsCommand({
        logGroupName,
        logStreamName,
        logEvents: events,
      })
    );

    console.log(`  ✓ ${fn}: ${events.length} log events seeded`);
  }

  console.log("\n✅ CloudWatch Logs seeding complete!\n");
}

// ════════════════════════════════════════════════════════════
//  S3 Seeding (Cost & Usage Report data)
// ════════════════════════════════════════════════════════════

async function seedS3() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  Seeding S3 Cost Data                           ║");
  console.log("╚══════════════════════════════════════════════════╝");

  const bucket = "finops-athena-results";

  // Create bucket
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`  ✓ Created bucket: ${bucket}`);
  } catch (e) {
    if (e.name === "BucketAlreadyOwnedByYou" || e.name === "BucketAlreadyExists") {
      console.log(`  → Bucket exists: ${bucket}`);
    } else throw e;
  }

  // Upload CUR CSV
  const csvPath = join(__dirname, "data", "cost_and_usage_report.csv");
  const csvContent = readFileSync(csvPath, "utf-8");

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: "cur-data/cost_and_usage_report.csv",
      Body: csvContent,
      ContentType: "text/csv",
    })
  );

  console.log(`  ✓ Uploaded cost_and_usage_report.csv (${csvContent.split("\n").length} rows)`);
  console.log("\n✅ S3 seeding complete!\n");
}

// ════════════════════════════════════════════════════════════
//  Main
// ════════════════════════════════════════════════════════════

async function main() {
  console.log("\n🚀 Aegis LocalStack Seed Script\n");
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Region:   ${REGION}\n`);

  try {
    await seedCloudWatchLogs();
    await seedS3();

    console.log("═══════════════════════════════════════════════════");
    console.log("  All test data seeded successfully! 🎉");
    console.log("  Run 'bun run dev' with USE_LOCALSTACK=true");
    console.log("═══════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
    console.error("   Is LocalStack running? Try: docker ps | grep aegis-localstack");
    process.exit(1);
  }
}

main();
