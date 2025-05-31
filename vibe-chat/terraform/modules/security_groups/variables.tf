variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "backend_port" {
  description = "Port that the backend application listens on"
  type        = number
  default     = 3000
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
} 