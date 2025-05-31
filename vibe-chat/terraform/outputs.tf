output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "database_endpoint" {
  description = "The endpoint of the database"
  value       = module.database.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for uploads"
  value       = module.s3.bucket_name
}

output "backend_service_url" {
  description = "URL for the backend service"
  value       = module.backend.service_url
}

output "frontend_service_url" {
  description = "URL for the frontend service"
  value       = module.frontend.service_url
}

output "next_steps" {
  description = "Next steps after deploying infrastructure"
  sensitive   = true
  value       = <<EOF
Infrastructure successfully deployed!

Next steps:
1. Push your Docker images to ECR:
   - Backend: ${var.backend_image}
   - Frontend: ${var.frontend_image}

2. Connect to your database: 
   - Endpoint: ${module.database.endpoint}
   - Username: ${var.db_username}
   - Database: ${module.database.db_name}

3. Configure your application with:
   - S3 Bucket for uploads: ${module.s3.bucket_name}
   - Backend service URL: ${module.backend.service_url}
   - Frontend service URL: ${module.frontend.service_url}
EOF
} 