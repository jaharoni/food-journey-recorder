/*
  # Add Test Mode Access Policies

  ## Overview
  This migration adds temporary RLS policies that allow access for a test user UUID,
  enabling testing without authentication while maintaining security for production.

  ## Changes
  1. Add policies for journeys table to allow test user access
  2. Add policies for locations table to allow test user access  
  3. Add policies for media table to allow test user access

  ## Security Note
  These policies should be removed or disabled when moving to production.
  The test user UUID is '00000000-0000-0000-0000-000000000000' which is set in test mode.
*/

CREATE POLICY "Test user can view test journeys"
  ON journeys FOR SELECT
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Test user can create test journeys"
  ON journeys FOR INSERT
  TO anon
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Test user can update test journeys"
  ON journeys FOR UPDATE
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Test user can delete test journeys"
  ON journeys FOR DELETE
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Test user can view test locations"
  ON locations FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = locations.journey_id
      AND journeys.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can create test locations"
  ON locations FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = locations.journey_id
      AND journeys.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can update test locations"
  ON locations FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = locations.journey_id
      AND journeys.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = locations.journey_id
      AND journeys.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can delete test locations"
  ON locations FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = locations.journey_id
      AND journeys.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can view test media"
  ON media FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = media.journey_id
      AND journeys.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can create test media"
  ON media FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = media.journey_id
      AND journeys.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can update test media"
  ON media FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = media.journey_id
      AND journeys.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = media.journey_id
      AND journeys.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

CREATE POLICY "Test user can delete test media"
  ON media FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = media.journey_id
      AND journeys.user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
  );
