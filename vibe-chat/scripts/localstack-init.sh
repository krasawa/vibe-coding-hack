#!/bin/bash

# Create S3 bucket for image storage
echo "Creating S3 bucket for image storage..."
awslocal s3 mb s3://vibe-chat-local

# Set public-read ACL for the bucket
echo "Setting bucket policy..."
awslocal s3api put-bucket-policy --bucket vibe-chat-local --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::vibe-chat-local/*"
    }
  ]
}'

echo "LocalStack S3 initialization complete!" 