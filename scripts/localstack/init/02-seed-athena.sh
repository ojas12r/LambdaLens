#!/bin/bash
# ============================================================
# S3 + Glue Catalog Seeder for Athena queries
# Creates the S3 bucket, uploads CUR data, and sets up
# the Glue database + table so Athena queries work.
# ============================================================

set -euo pipefail

ENDPOINT="http://localhost:4566"
REGION="us-east-1"
AWS="aws --endpoint-url=$ENDPOINT --region=$REGION"
BUCKET="finops-athena-results"
DATABASE="cost_reports"

echo "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—"
echo "â•‘  Seeding S3 + Glue for Athena                   â•‘"
echo "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•"

# â”€â”€ 1. Create S3 bucket for Athena results + CUR data â”€â”€
echo ""
echo "â†’ Creating S3 bucket: $BUCKET"
$AWS s3 mb "s3://$BUCKET" 2>/dev/null || true

# â”€â”€ 2. Upload cost data CSV â”€â”€
echo "â†’ Uploading cost_and_usage_report.csv to S3"
$AWS s3 cp /seed-data/cost_and_usage_report.csv \
  "s3://$BUCKET/cur-data/cost_and_usage_report.csv"

echo "  âœ“ Uploaded CUR data"

# â”€â”€ 3. Create Glue database â”€â”€
echo ""
echo "â†’ Creating Glue database: $DATABASE"
$AWS glue create-database \
  --database-input "{\"Name\":\"$DATABASE\",\"Description\":\"Aegis FinOps cost reports\"}" \
  2>/dev/null || true

# â”€â”€ 4. Create Glue table pointing to S3 data â”€â”€
echo "â†’ Creating Glue table: cost_and_usage_report"
$AWS glue create-table \
  --database-name "$DATABASE" \
  --table-input '{
    "Name": "cost_and_usage_report",
    "StorageDescriptor": {
      "Columns": [
        {"Name": "line_item_resource_id", "Type": "string"},
        {"Name": "line_item_unblended_cost", "Type": "double"},
        {"Name": "line_item_usage_start_date", "Type": "timestamp"},
        {"Name": "line_item_product_code", "Type": "string"}
      ],
      "Location": "s3://'"$BUCKET"'/cur-data/",
      "InputFormat": "org.apache.hadoop.mapred.TextInputFormat",
      "OutputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
      "SerdeInfo": {
        "SerializationLibrary": "org.apache.hadoop.hive.serde2.OpenCSVSerde",
        "Parameters": {
          "separatorChar": ",",
          "quoteChar": "\"",
          "skip.header.line.count": "1"
        }
      }
    },
    "TableType": "EXTERNAL_TABLE",
    "Parameters": {
      "classification": "csv",
      "skip.header.line.count": "1"
    }
  }' 2>/dev/null || true

# â”€â”€ 5. Create Athena workgroup â”€â”€
echo "â†’ Creating Athena workgroup"
$AWS athena create-work-group \
  --name "primary" \
  --configuration "{\"ResultConfiguration\":{\"OutputLocation\":\"s3://$BUCKET/query-results/\"}}" \
  2>/dev/null || true

echo ""
echo "âœ… S3 + Glue + Athena seeding complete!"
echo "   Database: $DATABASE"
echo "   Table:    cost_and_usage_report"
echo "   Bucket:   s3://$BUCKET"
echo ""
