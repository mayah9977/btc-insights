BEGIN;

CREATE TABLE public.vip_users (
  user_id text NOT NULL,
  level text NOT NULL,
  expired_at bigint NOT NULL,
  grace_until bigint,
  updated_at bigint NOT NULL,
  price_id text,
  addons jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT vip_users_pkey
    PRIMARY KEY (user_id),
  CONSTRAINT vip_users_level_check
    CHECK (
      level = ANY (
        ARRAY[
          'FREE'::text,
          'VIP'::text
        ]
      )
    )
);

CREATE INDEX idx_vip_users_expired_at
  ON public.vip_users
  USING btree (expired_at);

CREATE INDEX idx_vip_users_grace_until
  ON public.vip_users
  USING btree (grace_until);

CREATE INDEX idx_vip_users_level
  ON public.vip_users
  USING btree (level);

CREATE TABLE public.vip_payments (
  order_id text NOT NULL,
  user_id text NOT NULL,
  provider text NOT NULL DEFAULT 'TOSS'::text,
  plan text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL,
  payment_key text,
  failure_reason text,
  created_at bigint NOT NULL,
  paid_at bigint,
  failed_at bigint,
  CONSTRAINT vip_payments_pkey
    PRIMARY KEY (order_id),
  CONSTRAINT vip_payments_plan_check
    CHECK (
      plan = ANY (
        ARRAY[
          'MONTHLY'::text,
          'HALF'::text,
          'YEAR'::text,
          'ADMIN'::text
        ]
      )
    ),
  CONSTRAINT vip_payments_status_check
    CHECK (
      status = ANY (
        ARRAY[
          'PENDING'::text,
          'PAID'::text,
          'FAILED'::text,
          'DUPLICATE'::text
        ]
      )
    )
);

CREATE INDEX idx_vip_payments_status
  ON public.vip_payments
  USING btree (status);

CREATE INDEX idx_vip_payments_user_id
  ON public.vip_payments
  USING btree (user_id);

COMMIT;
