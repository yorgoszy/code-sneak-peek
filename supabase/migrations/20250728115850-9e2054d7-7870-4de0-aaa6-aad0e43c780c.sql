-- Add coupon_code column to discount_coupons for reference when using coupons
ALTER TABLE discount_coupons 
ADD COLUMN used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN used_in_payment_id UUID DEFAULT NULL;