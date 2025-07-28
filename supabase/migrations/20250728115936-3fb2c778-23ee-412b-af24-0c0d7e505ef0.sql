-- Add used_in_payment_id column to discount_coupons to track which payment used the coupon
ALTER TABLE discount_coupons 
ADD COLUMN used_in_payment_id UUID DEFAULT NULL;