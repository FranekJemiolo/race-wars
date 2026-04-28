-- Create necessary extensions for the database
-- This file runs when the database is first initialized

-- Enable PostGIS for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable unaccent for better text search
CREATE EXTENSION IF NOT EXISTS unaccent;
