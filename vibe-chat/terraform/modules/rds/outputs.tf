output "endpoint" {
  description = "The connection endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_name" {
  description = "The database name"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "The master username for the database"
  value       = aws_db_instance.main.username
  sensitive   = true
} 