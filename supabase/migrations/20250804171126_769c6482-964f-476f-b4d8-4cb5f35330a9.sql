-- Δημιουργία trigger για νέες αποδείξεις
CREATE TRIGGER receipt_created_notification
  AFTER INSERT ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_receipt_created();