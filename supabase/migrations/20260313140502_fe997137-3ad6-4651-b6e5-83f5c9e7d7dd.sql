ALTER TABLE federation_competitions ADD COLUMN weigh_in_active boolean NOT NULL DEFAULT false;
ALTER TABLE federation_competitions ADD COLUMN weigh_in_started_at timestamptz;
ALTER TABLE federation_competitions ADD COLUMN weigh_in_ended_at timestamptz;