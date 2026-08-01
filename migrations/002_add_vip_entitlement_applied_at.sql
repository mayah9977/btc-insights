BEGIN;

ALTER TABLE public.vip_payments
ADD COLUMN entitlement_applied_at bigint;

COMMENT ON COLUMN public.vip_payments.entitlement_applied_at IS
  'Epoch milliseconds when the paid order entitlement was applied to vip_users';

COMMIT;
