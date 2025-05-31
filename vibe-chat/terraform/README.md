# Vibe Chat AWS Deployment

This directory contains Terraform configurations to deploy the Vibe Chat application to AWS.

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
- [Terraform](https://www.terraform.io/downloads.html) v1.0.0+ installed
- [Docker](https://www.docker.com/get-started) installed
- An AWS account with appropriate permissions

## Deployment Architecture

The deployment includes:

- VPC with public, private, and database subnets
- RDS PostgreSQL database
- S3 bucket for storing uploaded images
- ECS Fargate for running containerized services
- Application Load Balancer (ALB) for routing traffic

## Quick Deployment

You can use the improved deployment script to automate the entire process:

```bash
cd vibe-chat

# Test Docker builds locally without deploying to AWS
./deploy.sh --local-only

# Full deployment to AWS
./deploy.sh
```

The script will:
1. Build Docker images for the frontend and backend
2. When not using --local-only:
   - Create an ECR repository if it doesn't exist
   - Push Docker images to ECR
   - Create a terraform.tfvars file with appropriate values
   - Initialize and apply Terraform configuration
   - Handle AWS credentials if not already configured

## Docker Build Improvements

The deployment script and Dockerfiles include several improvements:
- Backend uses Node.js 18 with ts-node for TypeScript execution in development mode
- Frontend uses Node.js 20 to support React Router and modern dependencies
- Both containers are optimized for production use in AWS ECS

## Manual Deployment

### 1. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend image
docker build -t YOUR_ECR_REPOSITORY_URI:backend-latest ./backend
docker push YOUR_ECR_REPOSITORY_URI:backend-latest

# Build and push frontend image
docker build -t YOUR_ECR_REPOSITORY_URI:frontend-latest ./frontend
docker push YOUR_ECR_REPOSITORY_URI:frontend-latest
```

### 2. Configure Terraform Variables

Create a `terraform.tfvars` file in the terraform directory:

```hcl
region          = "us-east-1"
app_name        = "vibe-chat"
environment     = "production"
db_username     = "postgres"
db_password     = "your-secure-password"
backend_image   = "YOUR_ECR_REPOSITORY_URI:backend-latest"
frontend_image  = "YOUR_ECR_REPOSITORY_URI:frontend-latest"
ecr_repository_url = "YOUR_ECR_REPOSITORY_URI"
jwt_secret      = "your-secure-jwt-secret"
```

### 3. Apply Terraform Configuration

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Post-Deployment Steps

After deployment:

1. Use the RDS endpoint from the Terraform outputs to run database migrations:
   ```bash
   export DATABASE_URL="postgresql://postgres:your-password@your-db-endpoint:5432/vibechat"
   cd backend
   npx prisma migrate deploy
   ```

2. Access your application using the load balancer URL from the Terraform outputs

## Cleanup

To destroy all resources:

```bash
cd terraform
terraform destroy
```

## Troubleshooting

- **Database Connection Issues**: Ensure security groups allow traffic from ECS tasks to RDS
- **Image Upload Errors**: Check IAM permissions for S3 access
- **Container Crashes**: Review CloudWatch logs for the ECS services
- **Terraform Output Sensitivity**: Sensitive outputs are now marked with `sensitive = true` to protect credentials 