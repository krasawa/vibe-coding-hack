#!/bin/bash
set -e

# Configuration
AWS_REGION="us-east-1"
ECR_REPOSITORY_NAME="vibe-chat"
APP_NAME="vibe-chat"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}====== Vibe Chat Deployment Script ======${NC}"

# Parse command line arguments
LOCAL_ONLY=false
DESTROY=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --local-only) LOCAL_ONLY=true; shift ;;
        --destroy) DESTROY=true; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
done

# If destroy flag is set, run terraform destroy
if [ "$DESTROY" = true ]; then
    echo -e "${YELLOW}Destroying AWS resources...${NC}"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
        exit 1
    fi

    # Check if logged in to AWS
    echo -e "${YELLOW}Checking AWS credentials...${NC}"
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${YELLOW}AWS credentials not found or invalid. Running aws configure...${NC}"
        aws configure
        
        # Check again after configuration
        if ! aws sts get-caller-identity &> /dev/null; then
            echo -e "${RED}AWS credentials still not valid. Please check your configuration.${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}AWS credentials verified.${NC}"

    # Run Terraform destroy
    echo -e "${YELLOW}Running Terraform destroy...${NC}"
    cd terraform
    if [ ! -f .terraform/terraform.tfstate ]; then
        echo -e "${YELLOW}Initializing Terraform...${NC}"
        terraform init
    fi
    
    echo -e "${RED}WARNING: This will destroy all AWS resources created by Terraform.${NC}"
    echo -e "${RED}Type 'yes' to confirm or press Ctrl+C to cancel.${NC}"
    terraform destroy
    
    echo -e "${GREEN}Infrastructure destroyed successfully.${NC}"
    
    # Optionally delete ECR repository
    read -p "Do you want to delete the ECR repository as well? (y/n): " delete_ecr
    if [[ "$delete_ecr" == "y" || "$delete_ecr" == "Y" ]]; then
        echo -e "${YELLOW}Deleting ECR repository...${NC}"
        aws ecr delete-repository --repository-name ${ECR_REPOSITORY_NAME} --region ${AWS_REGION} --force
        echo -e "${GREEN}ECR repository deleted.${NC}"
    fi
    
    echo -e "${GREEN}Clean-up complete!${NC}"
    exit 0
fi

# Build Docker images locally
echo -e "${YELLOW}Building Docker images locally...${NC}"

# Backend
echo -e "${YELLOW}Building backend image...${NC}"
docker build -t vibe-chat-backend:latest ./backend
echo -e "${GREEN}Backend image built.${NC}"

# Frontend
echo -e "${YELLOW}Building frontend image...${NC}"
docker build -t vibe-chat-frontend:latest ./frontend
echo -e "${GREEN}Frontend image built.${NC}"

# If local-only flag is set, exit here
if [ "$LOCAL_ONLY" = true ]; then
    echo -e "${GREEN}Local builds completed. Skipping AWS deployment.${NC}"
    exit 0
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if logged in to AWS
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${YELLOW}AWS credentials not found or invalid. Running aws configure...${NC}"
    aws configure
    
    # Check again after configuration
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}AWS credentials still not valid. Please check your configuration.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}AWS credentials verified.${NC}"

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}Creating/checking ECR repository...${NC}"
if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY_NAME} --region ${AWS_REGION} &> /dev/null; then
    echo -e "${YELLOW}Creating ECR repository ${ECR_REPOSITORY_NAME}${NC}"
    aws ecr create-repository --repository-name ${ECR_REPOSITORY_NAME} --region ${AWS_REGION}
fi
echo -e "${GREEN}ECR repository ready.${NC}"

# Get ECR repository URI
ECR_REPOSITORY_URI=$(aws ecr describe-repositories --repository-names ${ECR_REPOSITORY_NAME} --region ${AWS_REGION} --query 'repositories[0].repositoryUri' --output text)
echo -e "${GREEN}ECR Repository URI: ${ECR_REPOSITORY_URI}${NC}"

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPOSITORY_URI}
echo -e "${GREEN}Logged in to ECR.${NC}"

# Tag and push Docker images
echo -e "${YELLOW}Tagging and pushing Docker images...${NC}"

# Backend
echo -e "${YELLOW}Tagging and pushing backend image...${NC}"
docker tag vibe-chat-backend:latest ${ECR_REPOSITORY_URI}:backend-latest
docker push ${ECR_REPOSITORY_URI}:backend-latest
echo -e "${GREEN}Backend image pushed.${NC}"

# Frontend
echo -e "${YELLOW}Tagging and pushing frontend image...${NC}"
docker tag vibe-chat-frontend:latest ${ECR_REPOSITORY_URI}:frontend-latest
docker push ${ECR_REPOSITORY_URI}:frontend-latest
echo -e "${GREEN}Frontend image pushed.${NC}"

# Terraform deployment
echo -e "${YELLOW}Starting Terraform deployment...${NC}"

# Create terraform.tfvars file
cat > ./terraform/terraform.tfvars <<EOF
region          = "${AWS_REGION}"
app_name        = "${APP_NAME}"
environment     = "production"
db_username     = "postgres"
db_password     = "$(openssl rand -base64 12)"
backend_image   = "${ECR_REPOSITORY_URI}:backend-latest"
frontend_image  = "${ECR_REPOSITORY_URI}:frontend-latest"
ecr_repository_url = "${ECR_REPOSITORY_URI}"
jwt_secret      = "$(openssl rand -base64 32)"
owner           = "Maksym Marusetchenko"
EOF

echo -e "${GREEN}Created terraform.tfvars file.${NC}"

# Initialize Terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
cd terraform
terraform init

# Apply Terraform
echo -e "${YELLOW}Applying Terraform configuration...${NC}"
terraform apply -auto-approve

echo -e "${GREEN}====== Deployment complete! ======${NC}"
echo -e "${YELLOW}Check the outputs above for your application URLs and other details.${NC}" 