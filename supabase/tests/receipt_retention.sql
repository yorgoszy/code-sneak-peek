DO $$
DECLARE
 target uuid:=gen_random_uuid(); owner_id uuid; type_id uuid;
 subscription_id uuid:=gen_random_uuid(); receipt_id uuid:=gen_random_uuid();
BEGIN
 SELECT st.id,st.coach_id INTO type_id,owner_id FROM public.subscription_types st
 JOIN public.app_users u ON u.id=st.coach_id LIMIT 1;
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Test requires an existing coach subscription type'; END IF;
 BEGIN
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  INSERT INTO public.app_users(id,name,email,role,coach_id)
  VALUES(target,'Retention regression',target::text||'@example.invalid','general',owner_id);
  INSERT INTO public.coach_subscriptions(id,user_id,coach_id,subscription_type_id,start_date,end_date)
  VALUES(subscription_id,target,owner_id,type_id,CURRENT_DATE,CURRENT_DATE+30);
  INSERT INTO public.coach_receipts(id,user_id,coach_id,subscription_id,subscription_type_id,receipt_number,amount)
  VALUES(receipt_id,target,owner_id,subscription_id,type_id,'REG-'||receipt_id::text,50);
  PERFORM public.admin_delete_athlete(target);
  IF EXISTS(SELECT 1 FROM public.app_users WHERE id=target) THEN RAISE EXCEPTION 'User survived deletion'; END IF;
  IF EXISTS(SELECT 1 FROM public.coach_subscriptions WHERE id=subscription_id) THEN RAISE EXCEPTION 'Subscription survived deletion'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.coach_receipts WHERE id=receipt_id
   AND user_id IS NULL AND subscription_id IS NULL AND coach_id=owner_id
   AND receipt_number='REG-'||receipt_id::text AND amount=50
   AND customer_name='Retention regression' AND customer_email=target::text||'@example.invalid'
   AND subscription_type_name IS NOT NULL) THEN RAISE EXCEPTION 'Receipt or original recipient was lost'; END IF;
  RAISE EXCEPTION USING ERRCODE='ZZ001',MESSAGE='Rollback receipt retention regression';
 EXCEPTION WHEN SQLSTATE 'ZZ001' THEN RAISE NOTICE 'User and subscription removed; receipt and recipient retained; fixtures rolled back';
 END;
 IF EXISTS(SELECT 1 FROM public.coach_receipts WHERE id=receipt_id) THEN RAISE EXCEPTION 'Fixture was not rolled back'; END IF;
END $$;