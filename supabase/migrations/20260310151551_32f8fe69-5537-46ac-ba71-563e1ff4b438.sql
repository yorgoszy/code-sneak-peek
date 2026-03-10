
-- Set first 9 athletes as male with adult birth dates
UPDATE app_users SET gender = 'male', birth_date = '1995-01-15' WHERE id = 'b1000001-0000-0000-0000-000000000001';
UPDATE app_users SET gender = 'male', birth_date = '1996-03-20' WHERE id = 'b1000001-0000-0000-0000-000000000002';
UPDATE app_users SET gender = 'male', birth_date = '1997-05-10' WHERE id = 'b1000001-0000-0000-0000-000000000003';
UPDATE app_users SET gender = 'male', birth_date = '1994-07-25' WHERE id = 'b1000001-0000-0000-0000-000000000004';
UPDATE app_users SET gender = 'male', birth_date = '1998-09-12' WHERE id = 'b1000001-0000-0000-0000-000000000005';
UPDATE app_users SET gender = 'male', birth_date = '1993-11-30' WHERE id = 'b1000001-0000-0000-0000-000000000006';
UPDATE app_users SET gender = 'male', birth_date = '1995-02-18' WHERE id = 'b1000001-0000-0000-0000-000000000009';
UPDATE app_users SET gender = 'male', birth_date = '1996-04-05' WHERE id = 'b1000001-0000-0000-0000-000000000010';
UPDATE app_users SET gender = 'male', birth_date = '1997-08-22' WHERE id = 'b1000002-0000-0000-0000-000000000001';

-- Set next 9 athletes as female with adult birth dates
UPDATE app_users SET gender = 'female', birth_date = '1995-06-10' WHERE id = 'b1000002-0000-0000-0000-000000000002';
UPDATE app_users SET gender = 'female', birth_date = '1996-01-25' WHERE id = 'b1000002-0000-0000-0000-000000000003';
UPDATE app_users SET gender = 'female', birth_date = '1994-12-15' WHERE id = 'b1000002-0000-0000-0000-000000000006';
UPDATE app_users SET gender = 'female', birth_date = '1997-03-08' WHERE id = 'b1000002-0000-0000-0000-000000000007';
UPDATE app_users SET gender = 'female', birth_date = '1998-07-20' WHERE id = 'b1000002-0000-0000-0000-000000000009';
UPDATE app_users SET gender = 'female', birth_date = '1993-10-05' WHERE id = 'b1000003-0000-0000-0000-000000000001';
UPDATE app_users SET gender = 'female', birth_date = '1995-05-12' WHERE id = 'b1000003-0000-0000-0000-000000000002';
UPDATE app_users SET gender = 'female', birth_date = '1996-09-28' WHERE id = 'b1000003-0000-0000-0000-000000000004';
UPDATE app_users SET gender = 'female', birth_date = '1994-11-18' WHERE id = 'b1000003-0000-0000-0000-000000000005';

-- Register 9 males in Ενήλικοι -71kg (d4773829)
INSERT INTO federation_competition_registrations (competition_id, category_id, club_id, athlete_id, is_paid, registration_status)
VALUES
('f9dbd59b-3549-4d1c-942e-7866b948b463', 'd4773829-4d04-4f19-b2a0-96ed5f9d0292', 'a1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000001', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', 'd4773829-4d04-4f19-b2a0-96ed5f9d0292', 'a1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000002', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', 'd4773829-4d04-4f19-b2a0-96ed5f9d0292', 'a1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000003', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', 'd4773829-4d04-4f19-b2a0-96ed5f9d0292', 'a1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000004', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', 'd4773829-4d04-4f19-b2a0-96ed5f9d0292', 'a1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000005', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', 'd4773829-4d04-4f19-b2a0-96ed5f9d0292', 'a1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000006', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', 'd4773829-4d04-4f19-b2a0-96ed5f9d0292', 'a1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000009', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', 'd4773829-4d04-4f19-b2a0-96ed5f9d0292', 'a1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000010', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', 'd4773829-4d04-4f19-b2a0-96ed5f9d0292', 'a1000001-0000-0000-0000-000000000002', 'b1000002-0000-0000-0000-000000000001', true, 'confirmed');

-- Register 9 females in Ενήλικοι -57kg (66ece9ec)
INSERT INTO federation_competition_registrations (competition_id, category_id, club_id, athlete_id, is_paid, registration_status)
VALUES
('f9dbd59b-3549-4d1c-942e-7866b948b463', '66ece9ec-cfe7-489d-bd6d-66cc5f96d5e8', 'a1000001-0000-0000-0000-000000000002', 'b1000002-0000-0000-0000-000000000002', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', '66ece9ec-cfe7-489d-bd6d-66cc5f96d5e8', 'a1000001-0000-0000-0000-000000000002', 'b1000002-0000-0000-0000-000000000003', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', '66ece9ec-cfe7-489d-bd6d-66cc5f96d5e8', 'a1000001-0000-0000-0000-000000000002', 'b1000002-0000-0000-0000-000000000006', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', '66ece9ec-cfe7-489d-bd6d-66cc5f96d5e8', 'a1000001-0000-0000-0000-000000000002', 'b1000002-0000-0000-0000-000000000007', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', '66ece9ec-cfe7-489d-bd6d-66cc5f96d5e8', 'a1000001-0000-0000-0000-000000000002', 'b1000002-0000-0000-0000-000000000009', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', '66ece9ec-cfe7-489d-bd6d-66cc5f96d5e8', 'a1000001-0000-0000-0000-000000000003', 'b1000003-0000-0000-0000-000000000001', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', '66ece9ec-cfe7-489d-bd6d-66cc5f96d5e8', 'a1000001-0000-0000-0000-000000000003', 'b1000003-0000-0000-0000-000000000002', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', '66ece9ec-cfe7-489d-bd6d-66cc5f96d5e8', 'a1000001-0000-0000-0000-000000000003', 'b1000003-0000-0000-0000-000000000004', true, 'confirmed'),
('f9dbd59b-3549-4d1c-942e-7866b948b463', '66ece9ec-cfe7-489d-bd6d-66cc5f96d5e8', 'a1000001-0000-0000-0000-000000000003', 'b1000003-0000-0000-0000-000000000005', true, 'confirmed');
