output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.uploads.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.uploads.arn
}

output "s3_access_policy_arn" {
  description = "ARN of the IAM policy for S3 access"
  value       = aws_iam_policy.s3_access.arn
} 