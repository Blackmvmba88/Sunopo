# Secrets & Environment Configuration

This document lists the recommended GitHub Secrets and environment variables for running Sunopo in production securely, plus an example minimal IAM policy for S3.

## Recommended Repository Secrets
- `SESSION_FERNET_KEY` — Fernet key used to encrypt session values stored in Redis (required for production to avoid storing raw cookies in Redis). Generate with:

```bash
python tools/generate_fernet_key.py
```

- `REDIS_URL` — Connection string for the production Redis instance (e.g., `redis://:password@redis-host:6379/0`).

- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` — Credentials for S3 uploads. Use least-privilege IAM user.

- `SUNOPO_S3_BUCKET` (or `S3_BUCKET`) — Name of the S3 bucket used for exports.

- `SENTRY_DSN` (optional) — Error tracking DSN for Sentry or similar.

## CI / Runtime env mapping
- In CI, set `SESSION_FERNET_KEY` as a secret and export it into the job environment (we already generate a key for CI tests). For production, set `SESSION_FERNET_KEY` in the deployment environment.
- `REDIS_URL` should point to a secure Redis endpoint (or use managed Redis), and access should be restricted to the application hosts.

## Minimal IAM policy for S3 (least privilege)
Below is an example IAM policy for a user that only needs to upload and list objects in a specific bucket and prefix. Apply an appropriate prefix and tighten conditions as needed.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

Notes:
- Prefer restricting uploads to a specific prefix (e.g., `arn:aws:s3:::your-bucket-name/exports/*`).
- Enable server-side encryption on the bucket (SSE) and enforce HTTPS-only access for added security.

## Rotation & Operational Notes
- Rotate `SESSION_FERNET_KEY` and AWS credentials periodically. When rotating the Fernet key, coordinate the rotation plan (re-encrypting stored session data is complex—consider short session TTLs to mitigate this).
- Use `AWS IAM` key rotation best practices and apply least-privilege policies.

If you want, I can add a short script to validate that required secrets exist in the current environment and a `secrets-check` CI job to fail early if missing.
