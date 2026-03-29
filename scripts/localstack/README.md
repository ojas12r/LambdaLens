# LocalStack Setup for The Aegis Project

This directory contains everything needed to run AWS services locally using [LocalStack](https://localstack.cloud) for development and testing.

## Prerequisites

- **Docker Desktop** installed and running
- **LocalStack Pro** trial/license (for Athena support)
  - Get your auth token from [app.localstack.cloud](https://app.localstack.cloud)

## Quick Start

### 1. Set your LocalStack Auth Token

```bash
# Add to your shell profile or .env.localstack
export LOCALSTACK_AUTH_TOKEN=your_token_here
```

### 2. Start LocalStack

```bash
# From the project root
npm run localstack:up
```

### 3. Verify the seed data

```bash
# Check CloudWatch log groups (should show 7 groups)
npm run localstack:logs

# Check S3 bucket
npm run localstack:s3

# Or use docker exec directly
docker exec aegis-localstack awslocal logs describe-log-groups
docker exec aegis-localstack awslocal s3 ls s3://finops-athena-results/ --recursive
docker exec aegis-localstack awslocal glue get-tables --database-name cost_reports
```

### 4. Run the app with LocalStack

```bash
npm run dev
```

Make sure your `.env.local` includes:
```env
USE_LOCALSTACK=true
LOCALSTACK_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

## What Gets Seeded

### CloudWatch Logs
| Log Group | Events | Content |
|-----------|--------|---------|
| `/aws/lambda/image-processor-prod` | 40+ | S3 timeouts, retry storms, successful processing |
| `/aws/lambda/payment-webhook-handler` | 40+ | DB connection failures, Stripe webhook handling |
| `/aws/lambda/user-auth-service` | 40+ | JWT issuance, cold start warnings |
| `/aws/lambda/data-pipeline-etl` | 40+ | DynamoDB Stream errors, ETL batch processing |
| `/aws/lambda/notification-sender` | 40+ | SES batch notifications |
| `/aws/lambda/search-indexer` | 40+ | Batch size warnings, Elasticsearch indexing |
| `/aws/lambda/api-gateway-proxy` | 40+ | HTTP proxy requests, cache hit/miss |

### S3 + Athena (via Glue Catalog)
- **Bucket**: `finops-athena-results`
- **Database**: `cost_reports`
- **Table**: `cost_and_usage_report`
- **Data**: 84 rows of Lambda cost data across 7 functions over 12 hours
- **Built-in spikes**: `image-processor-prod` (5x spike), `data-pipeline-etl` (5x spike), `payment-webhook-handler` (4x spike)

## Manage LocalStack

```bash
# Start
npm run localstack:up

# Stop
npm run localstack:down

# Restart (re-runs seed scripts)
npm run localstack:restart

# View container logs
docker logs -f aegis-localstack

# Check health
curl http://localhost:4566/_localstack/health
```

## Troubleshooting

### "Connection refused" errors
Make sure Docker Desktop is running and the container is healthy:
```bash
docker ps | grep aegis-localstack
```

### Athena queries not working
Athena requires **LocalStack Pro**. Verify your auth token:
```bash
docker logs aegis-localstack 2>&1 | grep -i "activation"
```

### Seed scripts didn't run
The seed scripts run automatically via LocalStack's init hooks (`/etc/localstack/init/ready.d/`). To re-run manually:
```bash
docker exec aegis-localstack bash /etc/localstack/init/ready.d/01-seed-cloudwatch.sh
docker exec aegis-localstack bash /etc/localstack/init/ready.d/02-seed-athena.sh
```
