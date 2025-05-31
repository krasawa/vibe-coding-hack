resource "aws_db_subnet_group" "default" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.identifier}-subnet-group"
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier             = var.identifier
  engine                 = var.engine
  engine_version         = var.engine_version
  instance_class         = var.instance_class
  allocated_storage      = var.allocated_storage
  storage_type           = "gp2"
  
  db_name                = var.db_name
  username               = var.username
  password               = var.password
  
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = var.security_group_ids
  
  skip_final_snapshot    = true
  multi_az               = var.environment == "production"
  
  backup_retention_period = var.environment == "production" ? 7 : 1
  
  tags = {
    Name        = var.identifier
    Environment = var.environment
  }
} 