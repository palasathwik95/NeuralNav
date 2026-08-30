-- Adds a per-waypoint "why this module" explanation, populated by the
-- Learning Path Generator (deterministic reason by default, optionally
-- rewritten by the model to match the student's stated interests/style).
alter table path_waypoints add column if not exists reason text not null default '';
