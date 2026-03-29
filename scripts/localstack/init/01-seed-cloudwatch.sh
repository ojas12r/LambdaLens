#!/bin/bash
# ============================================================
# CloudWatch Logs Seeder for Aegis / FinOps Detective
# Creates log groups + streams for each Lambda function
# and populates them with realistic log events.
# ============================================================

set -euo pipefail

ENDPOINT="http://localhost:4566"
REGION="us-east-1"
AWS="aws --endpoint-url=$ENDPOINT --region=$REGION"

FUNCTIONS=(
  "image-processor-prod"
  "payment-webhook-handler"
  "user-auth-service"
  "data-pipeline-etl"
  "notification-sender"
  "search-indexer"
  "api-gateway-proxy"
)

echo "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—"
echo "â•‘  Seeding CloudWatch Logs for Aegis              â•‘"
echo "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•"

# Current time in ms
NOW_MS=$(date +%s%3N 2>/dev/null || python3 -c "import time; print(int(time.time()*1000))")

for fn in "${FUNCTIONS[@]}"; do
  LOG_GROUP="/aws/lambda/${fn}"
  STREAM_NAME="2026/03/29/[\$LATEST]$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 32)"

  echo ""
  echo "â†’ Creating log group: $LOG_GROUP"
  $AWS logs create-log-group --log-group-name "$LOG_GROUP" 2>/dev/null || true

  echo "  Creating stream: $STREAM_NAME"
  $AWS logs create-log-stream \
    --log-group-name "$LOG_GROUP" \
    --log-stream-name "$STREAM_NAME"

  # Build log events array
  EVENTS="["

  # Generate a unique request ID per invocation batch
  for i in $(seq 1 8); do
    REQ_ID=$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 8)-$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 4)-$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 4)-$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 4)-$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 12)

    OFFSET_MS=$(( (8 - i) * 420000 + RANDOM % 60000 ))
    TS=$(( NOW_MS - OFFSET_MS ))
    TS2=$(( TS + 50 ))
    TS3=$(( TS + RANDOM % 5000 + 100 ))
    TS4=$(( TS3 + 20 ))
    DURATION=$(( RANDOM % 800 + 50 ))
    MEM_USED=$(( RANDOM % 80 + 40 ))
    BILLED=$(( (DURATION / 100 + 1) * 100 ))

    # START
    EVENTS+="{\"timestamp\":$TS,\"message\":\"START RequestId: $REQ_ID Version: \$LATEST\"},"

    # Function-specific log lines
    case "$fn" in
      image-processor-prod)
        if [ $i -le 4 ]; then
          EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  Downloading image from s3://media-uploads-prod/input-$i.jpg\"},"
          EVENTS+="{\"timestamp\":$TS3,\"message\":\"ERROR S3 GetObject timeout: Failed to download 'input-$i.jpg' from bucket 'media-uploads-prod' after 3 retries. Connection timed out after 12000ms.\"},"
          EVENTS+="{\"timestamp\":$((TS3+5)),\"message\":\"ERROR Task timed out after 30000 ms\"},"
        else
          EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  Processing image input-$i.jpg (2048x1536, 4.2MB)\"},"
          EVENTS+="{\"timestamp\":$TS3,\"message\":\"INFO  Thumbnail generated and uploaded to s3://media-thumbnails-prod/thumb-$i.jpg\"},"
        fi
        ;;
      payment-webhook-handler)
        if [ $i -le 3 ]; then
          EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  Received Stripe webhook event: payment_intent.succeeded\"},"
          EVENTS+="{\"timestamp\":$TS3,\"message\":\"ERROR Database connection pool exhausted. Max connections (20) reached. Retry 1/3...\"},"
          EVENTS+="{\"timestamp\":$((TS3+1000)),\"message\":\"ERROR Database connection failed after 3 retries: ECONNREFUSED 10.0.1.42:5432\"},"
        else
          EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  Stripe webhook verified. Event: invoice.paid for customer cus_$(cat /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 8)\"},"
          EVENTS+="{\"timestamp\":$TS3,\"message\":\"INFO  Payment recorded. Amount: \$$(( RANDOM % 500 + 10 )).$(( RANDOM % 99 ))\"},"
        fi
        ;;
      user-auth-service)
        EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  Auth request for user user-$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 8)@example.com\"},"
        if [ $i -eq 2 ]; then
          EVENTS+="{\"timestamp\":$TS3,\"message\":\"WARN  Cold start detected. Init duration: 823ms. Consider provisioned concurrency.\"},"
        else
          EVENTS+="{\"timestamp\":$TS3,\"message\":\"INFO  JWT token issued. TTL: 3600s. Scopes: read,write\"},"
        fi
        ;;
      data-pipeline-etl)
        if [ $i -le 3 ]; then
          EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  Processing DynamoDB Stream shard shardId-$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 12)\"},"
          EVENTS+="{\"timestamp\":$TS3,\"message\":\"ERROR Unhandled exception: Cannot read properties of undefined (reading 'NewImage'). DynamoDB record missing expected schema.\"},"
          EVENTS+="{\"timestamp\":$((TS3+10)),\"message\":\"ERROR Stack trace: TypeError at ETLProcessor.transform (index.js:142:18) at Runtime.handler (index.js:28:12)\"},"
        else
          EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  ETL batch processing: 250 records from table 'user-events'\"},"
          EVENTS+="{\"timestamp\":$TS3,\"message\":\"INFO  Successfully transformed and loaded 250 records to Redshift cluster aegis-analytics\"},"
        fi
        ;;
      notification-sender)
        EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  Sending notification batch: $(( RANDOM % 500 + 50 )) recipients via SES\"},"
        EVENTS+="{\"timestamp\":$TS3,\"message\":\"INFO  Batch sent successfully. Delivery rate: $(( RANDOM % 5 + 95 ))%. Bounced: $(( RANDOM % 3 ))\"},"
        ;;
      search-indexer)
        if [ $i -le 2 ]; then
          EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  Indexing batch of 10 documents to Elasticsearch cluster es-prod\"},"
          EVENTS+="{\"timestamp\":$TS3,\"message\":\"WARN  Batch size is 10 (expected 500). Config BATCH_SIZE may have been changed. Invocation count will increase 50x.\"},"
        else
          EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  Indexing batch of 500 documents to Elasticsearch cluster es-prod\"},"
          EVENTS+="{\"timestamp\":$TS3,\"message\":\"INFO  Bulk index complete. 500 docs indexed in ${DURATION}ms. No errors.\"},"
        fi
        ;;
      api-gateway-proxy)
        EVENTS+="{\"timestamp\":$TS2,\"message\":\"INFO  Proxying request: GET /api/v2/users?page=$(( RANDOM % 50 + 1 ))\"},"
        EVENTS+="{\"timestamp\":$TS3,\"message\":\"INFO  Response: 200 OK (${DURATION}ms). Cache: $([ $(( RANDOM % 2 )) -eq 0 ] && echo 'HIT' || echo 'MISS')\"},"
        ;;
    esac

    # END
    EVENTS+="{\"timestamp\":$TS4,\"message\":\"END RequestId: $REQ_ID\"},"

    # REPORT
    EVENTS+="{\"timestamp\":$((TS4+1)),\"message\":\"REPORT RequestId: $REQ_ID\tDuration: ${DURATION}.00 ms\tBilled Duration: ${BILLED} ms\tMemory Size: 256 MB\tMax Memory Used: ${MEM_USED} MB\"},"
  done

  # Remove trailing comma and close array
  EVENTS="${EVENTS%,}]"

  echo "  Putting $(echo "$EVENTS" | grep -o '"timestamp"' | wc -l) log events..."
  $AWS logs put-log-events \
    --log-group-name "$LOG_GROUP" \
    --log-stream-name "$STREAM_NAME" \
    --log-events "$EVENTS" > /dev/null

  echo "  âœ“ Done: $fn"
done

echo ""
echo "âœ… CloudWatch Logs seeding complete!"
echo ""
