-- Enable required extensions for OpenMed
-- Run this first in Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector operations (for future ML/AI features)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable full text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable JSON operations
CREATE EXTENSION IF NOT EXISTS btree_gin;
