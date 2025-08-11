-- Optional: add usernames for demo accounts
UPDATE users SET username = 'teacher_demo' WHERE id = 't_demo' AND (username IS NULL OR username = '');
UPDATE users SET username = 'student_demo' WHERE id = 'st_demo' AND (username IS NULL OR username = '');
