-- Only seed if users table is empty
DO $$
DECLARE
  coach1_id INTEGER;
  coach2_id INTEGER;
  swimmer_ids INTEGER[] := ARRAY[]::INTEGER[];
  swimmer_user_ids INTEGER[] := ARRAY[]::INTEGER[];
  event_ids INTEGER[] := ARRAY[]::INTEGER[];
  password_hash TEXT := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; -- password123
BEGIN
  IF (SELECT COUNT(*) FROM users) > 0 THEN
    RETURN;
  END IF;

  INSERT INTO users (name, email, password_hash, role) VALUES ('Coach Sarah Mitchell', 'sarah@marlins.com', password_hash, 'coach') RETURNING id INTO coach1_id;
  INSERT INTO users (name, email, password_hash, role) VALUES ('Coach David Torres', 'david@marlins.com', password_hash, 'coach') RETURNING id INTO coach2_id;

  INSERT INTO coaches (user_id, bio, years_experience) VALUES (coach1_id, 'Sarah has 12 years of competitive swimming coaching experience. Former NCAA Division I swimmer at UNC. Specializes in butterfly and individual medley.', 12);
  INSERT INTO coaches (user_id, bio, years_experience) VALUES (coach2_id, 'David is a USA Swimming certified coach with a focus on sprint freestyle and backstroke. He brings energy and technical precision to every practice.', 7);

  WITH inserted AS (
    INSERT INTO users (name, email, password_hash, role) VALUES
      ('Emma Johnson',  'emma@marlins.com',   password_hash, 'swimmer'),
      ('Liam Park',     'liam@marlins.com',    password_hash, 'swimmer'),
      ('Olivia Chen',   'olivia@marlins.com',  password_hash, 'swimmer'),
      ('Noah Williams', 'noah@marlins.com',    password_hash, 'swimmer'),
      ('Ava Martinez',  'ava@marlins.com',     password_hash, 'swimmer'),
      ('Ethan Brown',   'ethan@marlins.com',   password_hash, 'swimmer'),
      ('Sophia Davis',  'sophia@marlins.com',  password_hash, 'swimmer'),
      ('Mason Wilson',  'mason@marlins.com',   password_hash, 'swimmer')
    RETURNING id
  )
  SELECT array_agg(id ORDER BY id) INTO swimmer_user_ids FROM inserted;

  WITH inserted AS (
    INSERT INTO swimmers (user_id, age, stroke_specialty) VALUES
      (swimmer_user_ids[1], 14, 'freestyle'),
      (swimmer_user_ids[2], 13, 'backstroke'),
      (swimmer_user_ids[3], 15, 'butterfly'),
      (swimmer_user_ids[4], 12, 'breaststroke'),
      (swimmer_user_ids[5], 14, 'freestyle'),
      (swimmer_user_ids[6], 16, 'backstroke'),
      (swimmer_user_ids[7], 13, 'individual medley'),
      (swimmer_user_ids[8], 15, 'butterfly')
    RETURNING id
  )
  SELECT array_agg(id ORDER BY id) INTO swimmer_ids FROM inserted;

  INSERT INTO records (swimmer_id, stroke, distance, time_seconds) VALUES
    (swimmer_ids[1], 'freestyle',        100, 58.42),
    (swimmer_ids[1], 'freestyle',        200, 128.31),
    (swimmer_ids[2], 'backstroke',       100, 61.15),
    (swimmer_ids[2], 'backstroke',       200, 134.88),
    (swimmer_ids[3], 'butterfly',        100, 63.02),
    (swimmer_ids[3], 'butterfly',         50, 28.77),
    (swimmer_ids[4], 'breaststroke',     100, 67.45),
    (swimmer_ids[5], 'freestyle',        100, 59.81),
    (swimmer_ids[5], 'freestyle',         50, 26.33),
    (swimmer_ids[6], 'backstroke',       100, 59.90),
    (swimmer_ids[7], 'individual medley',200, 142.10),
    (swimmer_ids[8], 'butterfly',        100, 62.44);

  INSERT INTO meets (name, date, location, results_summary) VALUES
    ('Spring Invitational', '2026-03-15', 'Riverside Aquatic Center', '2nd place overall — 4 individual event wins, 1 relay championship'),
    ('County Championships', '2026-04-22', 'Westfield Natatorium', '1st place — team scored 312 points, 6 personal records broken'),
    ('Tri-City Dual Meet', '2026-05-08', 'Lakeside YMCA', 'Won 58-42 — strong showing in backstroke and butterfly events');

  WITH inserted AS (
    INSERT INTO events (title, description, event_date, location, event_type, created_by) VALUES
      ('Morning Practice',    'Regular weekday morning practice. Focus on turns and underwaters.',                 '2026-07-07T07:00', 'Riverside Aquatic Center',    'practice', coach1_id),
      ('Evening Practice',    'Technique and endurance sets. All strokes.',                                       '2026-07-08T18:00', 'Riverside Aquatic Center',    'practice', coach1_id),
      ('Summer Splash Meet',  'Home meet. All swimmers expected to compete in at least 2 events.',                '2026-07-12T09:00', 'Riverside Aquatic Center',    'meet',     coach1_id),
      ('Dryland Training',    'Strength and conditioning — no pool needed. Bring workout clothes.',               '2026-07-14T09:00', 'Riverside Community Center',  'practice', coach1_id),
      ('Regional Qualifier',  'Away meet. Top 3 finishes advance to state championships.',                        '2026-07-19T08:00', 'Northside Natatorium',        'meet',     coach1_id),
      ('Morning Practice',    'Sprint sets and race prep for Regional Qualifier.',                                '2026-07-21T07:00', 'Riverside Aquatic Center',    'practice', coach1_id),
      ('End-of-Season Banquet','Team celebration and awards. Families welcome!',                                  '2026-08-02T18:00', 'Riverside Community Center',  'other',    coach1_id)
    RETURNING id
  )
  SELECT array_agg(id ORDER BY id) INTO event_ids FROM inserted;

  INSERT INTO event_signups (event_id, user_id) VALUES
    (event_ids[1], swimmer_user_ids[1]),
    (event_ids[1], swimmer_user_ids[2]),
    (event_ids[1], swimmer_user_ids[3]),
    (event_ids[3], swimmer_user_ids[1]),
    (event_ids[3], swimmer_user_ids[4]),
    (event_ids[3], swimmer_user_ids[5]);
END $$;
