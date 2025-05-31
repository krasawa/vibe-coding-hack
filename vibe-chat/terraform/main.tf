provider "aws" {
  region = var.region
}

# Define common tags for all resources
locals {
  common_tags = {
    Owner       = var.owner
    Environment = var.environment
    Application = var.app_name
    ManagedBy   = "Terraform"
  }
}

# Random suffix for globally unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}

# VPC for your infrastructure
module "vpc" {
  source = "./modules/vpc"
  
  vpc_name         = "${var.app_name}-vpc"
  vpc_cidr         = var.vpc_cidr
  azs              = var.availability_zones
  private_subnets  = var.private_subnet_cidrs
  public_subnets   = var.public_subnet_cidrs
  database_subnets = var.database_subnet_cidrs
  
  tags = local.common_tags
}

# Security groups
module "security_groups" {
  source = "./modules/security_groups"
  
  vpc_id = module.vpc.vpc_id
  app_name = var.app_name
  
  tags = local.common_tags
}

# S3 bucket for storing uploaded images
module "s3" {
  source = "./modules/s3"
  
  bucket_name = "${var.app_name}-uploads-${random_id.suffix.hex}"
  region      = var.region
  
  tags = local.common_tags
}

# RDS PostgreSQL for your chat data
module "database" {
  source = "./modules/rds"
  
  identifier     = "${var.app_name}-db"
  engine         = "postgres"
  engine_version = "14"
  instance_class = "db.t3.small"
  
  allocated_storage = 20
  
  db_name     = "vibechat"
  username    = var.db_username
  password    = var.db_password
  
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.database_subnet_ids
  security_group_ids = [module.security_groups.database_sg_id]
  
  tags = local.common_tags
}

# ECS Cluster and Fargate Service for the Backend
module "backend" {
  source = "./modules/ecs"
  
  app_name        = "${var.app_name}-backend"
  container_image = var.backend_image
  container_port  = 3000
  cpu             = 512
  memory          = 1024
  
  environment_variables = [
    { name = "NODE_ENV", value = "production" },
    { name = "DATABASE_URL", value = "postgresql://${var.db_username}:${var.db_password}@${module.database.endpoint}/${module.database.db_name}" },
    { name = "AWS_REGION", value = var.region },
    { name = "AWS_S3_BUCKET", value = module.s3.bucket_name },
    { name = "JWT_SECRET", value = var.jwt_secret }
  ]
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  security_groups = [module.security_groups.backend_sg_id]
  public_subnet_ids = module.vpc.public_subnet_ids
  
  tags = local.common_tags
}

# ECS Cluster and Fargate Service for the Frontend
module "frontend" {
  source = "./modules/ecs"
  
  app_name        = "${var.app_name}-frontend"
  container_image = var.frontend_image
  container_port  = 80
  cpu             = 256
  memory          = 512
  
  environment_variables = [
    { name = "REACT_APP_API_URL", value = "http://${module.backend.service_url}/api" },
    { name = "REACT_APP_WS_URL", value = "ws://${module.backend.service_url}" }
  ]
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  security_groups = [module.security_groups.backend_sg_id]
  public_subnet_ids = module.vpc.public_subnet_ids
  
  tags = local.common_tags
} 