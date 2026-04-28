resource "aws_elasticache_subnet_group" "race_wars" {
  name       = "${var.cluster_name}-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-redis-subnet-group"
  })
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.cluster_name}-redis-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-redis-sg"
  })
}

resource "aws_elasticache_replication_group" "race_wars" {
  replication_group_id          = "${var.cluster_name}-redis"
  replication_group_description  = "Race Wars Redis cluster"
  node_type                      = "cache.t3.micro"
  number_cache_clusters          = 1
  engine                         = "redis"
  engine_version                 = "7.0"
  automatic_failover_enabled     = false
  subnet_group_name              = aws_elasticache_subnet_group.race_wars.name
  security_group_ids             = [aws_security_group.redis.id]
  at_rest_encryption_enabled     = true
  transit_encryption_enabled     = true

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-redis"
  })
}
