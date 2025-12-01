/*
  # Complete Food Journey Recorder Schema

  ## Overview
  Complete database schema for GPS-tracked food journeys with real-time recording,
  stops, media, and AI-generated narratives.

  ## New Tables

  ### 1. routes
  Main table for recorded food journeys
  - `id` (uuid, primary key) - Unique route identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `title` (text) - Route title
  - `description` (text) - User description
  - `status` (text) - recording, paused, completed
  - `started_at` (timestamptz) - When recording started
  - `finished_at` (timestamptz) - When recording finished
  - `total_distance` (numeric) - Distance in meters
  - `total_duration` (integer) - Duration in seconds
  - `ai_narrative` (text) - Generated story
  - `substack_url` (text) - Published URL
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. route_points
  GPS points captured during route recording
  - `id` (uuid, primary key)
  - `route_id` (uuid, foreign key) - References routes
  - `latitude` (numeric) - GPS latitude
  - `longitude` (numeric) - GPS longitude
  - `sequence` (integer) - Order in route
  - `recorded_at` (timestamptz) - Timestamp of recording
  - `created_at` (timestamptz)

  ### 3. stops
  Marked locations along route with photos and notes
  - `id` (uuid, primary key)
  - `route_id` (uuid, foreign key) - References routes
  - `latitude` (numeric) - Stop location latitude
  - `longitude` (numeric) - Stop location longitude
  - `place_name` (text) - Name of the location
  - `notes` (text) - User notes
  - `rating` (integer) - 1-5 rating
  - `sequence` (integer) - Order in route
  - `recorded_at` (timestamptz) - When stop was created
  - `created_at` (timestamptz)

  ### 4. stop_media
  Photos and videos for each stop
  - `id` (uuid, primary key)
  - `stop_id` (uuid, foreign key) - References stops
  - `route_id` (uuid, foreign key) - References routes
  - `url` (text) - Storage URL
  - `type` (text) - image or video
  - `created_at` (timestamptz)

  ### 5. user_profiles
  Extended user data including head cutout
  - `id` (uuid, primary key) - References auth.users
  - `email` (text)
  - `head_cutout_url` (text) - Profile photo URL for animated marker
  - `display_name` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Test mode policies included
*/

-- Drop old tables if they exist
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS journeys CASCADE;

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'recording' CHECK (status IN ('recording', 'paused', 'completed')),
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  total_distance numeric DEFAULT 0,
  total_duration integer DEFAULT 0,
  ai_narrative text,
  substack_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create route_points table
CREATE TABLE IF NOT EXISTS route_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  sequence integer NOT NULL DEFAULT 0,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create stops table
CREATE TABLE IF NOT EXISTS stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  place_name text NOT NULL,
  notes text DEFAULT '',
  rating integer CHECK (rating >= 1 AND rating <= 5),
  sequence integer NOT NULL DEFAULT 0,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create stop_media table
CREATE TABLE IF NOT EXISTS stop_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id uuid REFERENCES stops(id) ON DELETE CASCADE NOT NULL,
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY,
  email text,
  head_cutout_url text,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS routes_user_id_idx ON routes(user_id);
CREATE INDEX IF NOT EXISTS routes_status_idx ON routes(status);
CREATE INDEX IF NOT EXISTS route_points_route_id_idx ON route_points(route_id);
CREATE INDEX IF NOT EXISTS route_points_sequence_idx ON route_points(route_id, sequence);
CREATE INDEX IF NOT EXISTS stops_route_id_idx ON stops(route_id);
CREATE INDEX IF NOT EXISTS stops_sequence_idx ON stops(route_id, sequence);
CREATE INDEX IF NOT EXISTS stop_media_stop_id_idx ON stop_media(stop_id);
CREATE INDEX IF NOT EXISTS stop_media_route_id_idx ON stop_media(route_id);

-- Enable RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE stop_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Routes policies
CREATE POLICY "Users can view own routes"
  ON routes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own routes"
  ON routes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own routes"
  ON routes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own routes"
  ON routes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Test mode routes policies
CREATE POLICY "Test user can view test routes"
  ON routes FOR SELECT
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Test user can create test routes"
  ON routes FOR INSERT
  TO anon
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Test user can update test routes"
  ON routes FOR UPDATE
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Test user can delete test routes"
  ON routes FOR DELETE
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Route points policies
CREATE POLICY "Users can view points of own routes"
  ON route_points FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_points.route_id
      AND routes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create points for own routes"
  ON route_points FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_points.route_id
      AND routes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete points of own routes"
  ON route_points FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_points.route_id
      AND routes.user_id = auth.uid()
    )
  );

-- Test mode route points policies
CREATE POLICY "Test user can view test route points"
  ON route_points FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_points.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can create test route points"
  ON route_points FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_points.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can delete test route points"
  ON route_points FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_points.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

-- Stops policies (authenticated)
CREATE POLICY "Users can view stops of own routes"
  ON stops FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stops.route_id
      AND routes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create stops for own routes"
  ON stops FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stops.route_id
      AND routes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stops of own routes"
  ON stops FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stops.route_id
      AND routes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stops.route_id
      AND routes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stops of own routes"
  ON stops FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stops.route_id
      AND routes.user_id = auth.uid()
    )
  );

-- Test mode stops policies
CREATE POLICY "Test user can view test stops"
  ON stops FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stops.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can create test stops"
  ON stops FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stops.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can update test stops"
  ON stops FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stops.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stops.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can delete test stops"
  ON stops FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stops.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

-- Stop media policies (authenticated)
CREATE POLICY "Users can view media of own routes"
  ON stop_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stop_media.route_id
      AND routes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create media for own routes"
  ON stop_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stop_media.route_id
      AND routes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media of own routes"
  ON stop_media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stop_media.route_id
      AND routes.user_id = auth.uid()
    )
  );

-- Test mode stop media policies
CREATE POLICY "Test user can view test media"
  ON stop_media FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stop_media.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can create test media"
  ON stop_media FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stop_media.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can delete test media"
  ON stop_media FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = stop_media.route_id
      AND routes.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

-- User profiles policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Test mode user profiles policies
CREATE POLICY "Test user can view test profile"
  ON user_profiles FOR SELECT
  TO anon
  USING (id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Test user can insert test profile"
  ON user_profiles FOR INSERT
  TO anon
  WITH CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Test user can update test profile"
  ON user_profiles FOR UPDATE
  TO anon
  USING (id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid);
