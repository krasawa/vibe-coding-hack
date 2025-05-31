variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "vibe-chat"
}

variable "environment" {
  description = "The environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "db_name" {
  description = "The name of the database"
  type        = string
  default     = "vibechat"
}

variable "db_username" {
  description = "The username for the database"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "The password for the database"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "The secret key for JWT tokens"
  type        = string
  sensitive   = true
}

variable "ecr_repository_url" {
  description = "The URL of the ECR repository for container images"
  type        = string
} 