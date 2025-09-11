-- Function που θα δημιουργεί magic boxes για νέους χρήστες σε ενεργές καμπάνιες
CREATE OR REPLACE FUNCTION public.assign_magic_boxes_to_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  campaign RECORD;
  box_count INTEGER := 0;
BEGIN
  -- Εύρεση όλων των ενεργών magic box καμπάνιων
  FOR campaign IN 
    SELECT id, name, max_participations_per_user
    FROM public.magic_box_campaigns 
    WHERE is_active = true 
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      AND start_date <= CURRENT_DATE
  LOOP
    -- Έλεγχος αν ο χρήστης έχει ήδη magic box για αυτή την καμπάνια
    IF NOT EXISTS (
      SELECT 1 FROM public.user_magic_boxes 
      WHERE user_id = NEW.id AND campaign_id = campaign.id
    ) THEN
      -- Δημιουργία magic box για τον νέο χρήστη
      INSERT INTO public.user_magic_boxes (
        user_id, 
        campaign_id, 
        is_opened,
        created_at,
        updated_at
      ) VALUES (
        NEW.id, 
        campaign.id, 
        false,
        NOW(),
        NOW()
      );
      
      box_count := box_count + 1;
      
      -- Log για debugging
      RAISE LOG 'Assigned magic box for campaign % to user %', campaign.name, NEW.id;
    END IF;
  END LOOP;
  
  -- Log συνολικού αριθμού magic boxes που δημιουργήθηκαν
  IF box_count > 0 THEN
    RAISE LOG 'Total % magic boxes assigned to new user %', box_count, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger που θα εκτελείται όταν δημιουργείται νέος χρήστης στον πίνακα app_users
CREATE OR REPLACE TRIGGER trigger_assign_magic_boxes_to_new_user
  AFTER INSERT ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_magic_boxes_to_new_user();

-- Σχόλιο για την function
COMMENT ON FUNCTION public.assign_magic_boxes_to_new_user() IS 'Αυτόματη ανάθεση magic boxes σε νέους χρήστες για όλες τις ενεργές καμπάνιες';