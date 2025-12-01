/*
  # Food Journey Recorder Database Schema

  ## Overview
  This migration creates the complete database schema for the Food Journey Recorder application,
  including tables for journeys, locations, and media with full Row Level Security.

  ## Tables Created

  ### 1. journeys
  Stores the main journey records created by users
  - `id` (uuid, primary key) - Unique journey identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `title` (text) - Journey title
  - `description` (text) - Journey description/story
  - `published_to_substack` (boolean) - Publication status
  - `substack_url` (text, nullable) - URL of published Substack post
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. locations
  Stores waypoints/locations for each journey
  - `id` (uuid, primary key) - Unique location identifier
  - `journey_id` (uuid, foreign key) - References journeys table
  - `place_name` (text) - Name of the place
  - `latitude` (numeric) - Geographic latitude
  - `longitude` (numeric) - Geographic longitude
  - `order_index` (integer) - Order of location in journey sequence
  - `notes` (text, nullable) - Optional notes about the location
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. media
  Stores photos and videos associated with journey locations
  - `id` (uuid, primary key) - Unique media identifier
  - `journey_id` (uuid, foreign key) - References journeys table
  - `location_id` (uuid, foreign key) - References locations table
  - `url` (text) - Storage URL for the media file
  - `type` (text) - Media type (image or video)
  - `caption` (text, nullable) - Optional media caption
  - `order_index` (integer) - Order of media in location gallery
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own journeys and related data
  - Authenticated users required for all operations
  - Policies enforce ownership checks for SELECT, INSERT, UPDATE, DELETE

  ## Indexes
  - Foreign key indexes for optimal query performance
  - Order index for efficient sorting
  - User ID index for fast user data retrieval
*/

CREATE TABLE IF NOT EXISTS journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  published_to_substack boolean DEFAULT false,
  substack_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid REFERENCES journeys(id) ON DELETE CASCADE NOT NULL,
  place_name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid REFERENCES journeys(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  caption text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journeys_user_id_idx ON journeys(user_id);
CREATE INDEX IF NOT EXISTS locations_journey_id_idx ON locations(journey_id);
CREATE INDEX IF NOT EXISTS locations_order_idx ON locations(journey_id, order_index);
CREATE INDEX IF NOT EXISTS media_journey_id_idx ON media(journey_id);
CREATE INDEX IF NOT EXISTS media_location_id_idx ON media(location_id);
CREATE INDEX IF NOT EXISTS media_order_idx ON media(location_id, order_index);

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journeys"
  ON journeys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journeys"
  ON journeys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journeys"
  ON journeys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journeys"
  ON journeys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view locations of own journeys"
  ON locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = locations.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create locations for own journeys"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = locations.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update locations of own journeys"
  ON locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = locations.journey_id
      AND journeys.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = locations.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete locations of own journeys"
  ON locations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = locations.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view media of own journeys"
  ON media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = media.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create media for own journeys"
  ON media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = media.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update media of own journeys"
  ON media FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = media.journey_id
      AND journeys.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = media.journey_id
      AND journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media of own journeys"
  ON media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = media.journey_id
      AND journeys.user_id = auth.uid()
    )
  );
