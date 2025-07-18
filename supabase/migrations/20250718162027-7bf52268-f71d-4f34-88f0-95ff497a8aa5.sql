-- Προσωρινή απενεργοποίηση του trigger
DROP TRIGGER IF EXISTS update_workout_completions_attendance ON workout_completions;

-- Δημιουργία χαμένων προπονήσεων για τον χρήστη Niovi
INSERT INTO workout_completions (
  assignment_id, user_id, program_id, scheduled_date, week_number, day_number, status, status_color
) VALUES 
('be57300f-fdc5-4eb3-98d2-bba8fcf53dd9', '90123e18-96bb-4b8d-8ed3-e71ea5a50119', '31db99e5-d39d-4b7e-9ddd-e69790dcae29', '2025-06-26', 1, 2, 'missed', 'red'),
('be57300f-fdc5-4eb3-98d2-bba8fcf53dd9', '90123e18-96bb-4b8d-8ed3-e71ea5a50119', '31db99e5-d39d-4b7e-9ddd-e69790dcae29', '2025-06-30', 1, 3, 'missed', 'red'),
('be57300f-fdc5-4eb3-98d2-bba8fcf53dd9', '90123e18-96bb-4b8d-8ed3-e71ea5a50119', '31db99e5-d39d-4b7e-9ddd-e69790dcae29', '2025-07-03', 2, 1, 'missed', 'red'),
('be57300f-fdc5-4eb3-98d2-bba8fcf53dd9', '90123e18-96bb-4b8d-8ed3-e71ea5a50119', '31db99e5-d39d-4b7e-9ddd-e69790dcae29', '2025-07-07', 2, 2, 'missed', 'red'),
('be57300f-fdc5-4eb3-98d2-bba8fcf53dd9', '90123e18-96bb-4b8d-8ed3-e71ea5a50119', '31db99e5-d39d-4b7e-9ddd-e69790dcae29', '2025-07-10', 2, 3, 'missed', 'red'),
('be57300f-fdc5-4eb3-98d2-bba8fcf53dd9', '90123e18-96bb-4b8d-8ed3-e71ea5a50119', '31db99e5-d39d-4b7e-9ddd-e69790dcae29', '2025-07-14', 3, 1, 'missed', 'red'),
('be57300f-fdc5-4eb3-98d2-bba8fcf53dd9', '90123e18-96bb-4b8d-8ed3-e71ea5a50119', '31db99e5-d39d-4b7e-9ddd-e69790dcae29', '2025-07-17', 3, 2, 'missed', 'red');

-- Επανενεργοποίηση του trigger
CREATE TRIGGER update_workout_completions_attendance
  AFTER INSERT OR UPDATE OR DELETE ON workout_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_attendance();