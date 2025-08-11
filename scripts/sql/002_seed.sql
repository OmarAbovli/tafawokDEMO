-- Minimal seed: one admin (demo), one teacher, one student, a subscription, a video, and a live session.

INSERT INTO users (id, role, name, email) VALUES
  ('ad_demo', 'admin', 'Super Admin', 'admin@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, role, name, email) VALUES
  ('t_demo', 'teacher', 'Demo Teacher', 'teacher@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, role, name, phone, guardian_phone, grade) VALUES
  ('st_demo', 'student', 'Demo Student', '+100000000', '+100000001', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO teacher_subscriptions (id, student_id, teacher_id, status)
VALUES ('sub_demo', 'st_demo', 't_demo', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO videos (id, teacher_id, title, description, grades, url)
VALUES ('v_demo', 't_demo', 'Introduction to Algebra', 'Basics of algebraic expressions.', '{1}', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
ON CONFLICT (id) DO NOTHING;

INSERT INTO live_sessions (id, teacher_id, title, start_at, embed_url)
VALUES ('ls_demo', 't_demo', 'Live Q&A: Algebra I', NOW() + INTERVAL '2 days', 'https://www.youtube.com/embed/5qap5aO4i9A')
ON CONFLICT (id) DO NOTHING;
