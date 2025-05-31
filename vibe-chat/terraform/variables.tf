variable "region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  default     = "vibe-chat"
}

variable "environment" {
  description = "Deployment environment (production, staging, development)"
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnet_cidrs" {
  description = "Database subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "backend_image" {
  description = "Backend container image (repository:tag)"
  type        = string
  default     = "public.ecr.aws/my-repo/vibe-chat-backend:latest"
}

variable "frontend_image" {
  description = "Frontend container image (repository:tag)"
  type        = string
  default     = "public.ecr.aws/my-repo/vibe-chat-frontend:latest"
}

variable "db_name" {
  description = "The name of the database"
  type        = string
  default     = "vibechat"
}

variable "jwt_secret" {
  description = "The secret key for JWT tokens"
  type        = string
  sensitive   = true
}

variable "ecr_repository_url" {
  description = "The URL of the ECR repository for container images"
  type        = string
  default     = ""
}

variable "owner" {
  description = "The owner tag to apply to all AWS resources (required for compliance)"
  type        = string
  default     = "Maksym Marusetchenko"
} 