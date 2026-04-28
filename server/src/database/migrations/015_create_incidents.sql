-- Create incidents table for tracking race incidents
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('off_track', 'crash', 'debris', 'mechanical', 'collision', 'spin', 'stall', 'other')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  location_lat FLOAT,
  location_lng FLOAT,
  location_geometry GEOMETRY(POINT, 4326),
  description TEXT,
  reported_by UUID REFERENCES users(id),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for incidents
CREATE INDEX idx_incidents_session_id ON incidents(session_id);
CREATE INDEX idx_incidents_participant_id ON incidents(participant_id);
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_reported_at ON incidents(reported_at);
CREATE INDEX idx_incidents_resolved_at ON incidents(resolved_at);
CREATE INDEX idx_incidents_location ON incidents USING GIST(location_geometry);
CREATE INDEX idx_incidents_tags ON incidents USING GIN(tags);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_incidents_updated_at();

-- Add comment to table
COMMENT ON TABLE incidents IS 'Stores race incidents including off-track, crashes, debris, and other events';
COMMENT ON COLUMN incidents.type IS 'Type of incident: off_track, crash, debris, mechanical, collision, spin, stall, other';
COMMENT ON COLUMN incidents.severity IS 'Severity level: minor, moderate, major, critical';
COMMENT ON COLUMN incidents.location_geometry IS 'PostGIS point geometry for spatial queries';
COMMENT ON COLUMN incidents.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN incidents.metadata IS 'Additional flexible data in JSONB format';
