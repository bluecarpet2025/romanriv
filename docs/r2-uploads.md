# Admin image uploads

The media migration to Cloudflare R2 is complete. Active media reads and writes
use R2, including photo uploads, photo deletion, and anime cover uploads.
Supabase remains the PostgreSQL database and authentication provider. Photos
store relative R2 keys; anime covers store R2 public URLs.

## Environment

Copy the R2 variables from `.env.example` to `.env.local` and the Vercel environments
where uploads should work. Keep these four variables server-only:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME=romanriv-media`

Create an R2 **Object Read & Write** API token scoped to `romanriv-media`. Use its
S3 access key ID and secret access key, not a general Cloudflare API bearer token.
The existing `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` must point to this bucket's public
base URL. No Supabase service-role key is needed. Restart locally or redeploy
after configuring the variables.

## Bucket CORS

Merge this rule into the bucket's existing CORS policy in the Cloudflare dashboard;
keep any existing rules needed for image reads. Include only origins where the
admin uploader will be used (add a specific preview origin if needed):

```json
[
  {
    "AllowedOrigins": [
      "https://romanriv.com",
      "https://www.romanriv.com",
      "https://romanriv.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "If-None-Match"],
    "MaxAgeSeconds": 3600
  }
]
```

Keep public access enabled. Uploads use the signed S3 endpoint, while public reads
use `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`. See [Cloudflare presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
and [CORS configuration](https://developers.cloudflare.com/r2/buckets/cors/).

## Flow and recovery

1. `/api/uploads/presign` checks the cookie-authenticated Supabase user using
   `auth.getUser()` and verifies `public.admins.user_id`. Cross-origin browser
   requests are rejected. Only `food`, `car`, and `anime-covers` are accepted.
2. JPEG, PNG, WebP, GIF, and AVIF files must be nonempty and at most 20 MiB.
   The server creates the object key and signs a PUT for 120 seconds, including
   the exact MIME type, byte length, and `If-None-Match: *`. The browser supplies
   Content-Length automatically from the File body. An existing object cannot
   be overwritten using the same upload URL.
3. The browser PUTs the file directly to R2. No image body passes through Vercel.
4. `/api/uploads/complete` repeats the admin check and verifies a signed,
   user-bound receipt (valid for 15 minutes). It checks R2 object size/type,
   reads the first 64 bytes to check the image signature, and verifies HTTP 200
   at the public URL before saving to Supabase using the user's RLS permissions.
5. Photos retain relative keys and category/folder alignment. Filenames retain
   the timestamp and sanitized original basename, with a UUID suffix to avoid
   collisions. Anime covers use `anime-covers/<anime-id>/<uuid>.<extension>`.
   Cover saves compare the previous DB URL so a concurrent replacement is not
   silently overwritten. The UI stays on the selected anime during upload.

The old cover is never overwritten or deleted. Failed verification or a failed
DB save leaves its existing reference intact. Failed saves may leave an
unreferenced R2 object; retain it for recovery rather than deleting an object
after an ambiguous network failure. A sequential completion retry checks for
an already-saved photo/cover. Photo completion is not guaranteed idempotent for
simultaneous duplicate requests without a database uniqueness constraint.

The photo uploader retains the Anime/Business category options but disables
new uploads for those folders under the current folder allowlist. Existing management
pages and manual anime cover URL editing remain available.

Active media flows do not fall back to Supabase Storage, and the legacy Supabase
Storage image allowance has been removed. The old Supabase `media` and
`anime-covers` buckets remain pending separate cleanup; they have not been deleted
as part of the migration.

## Verification

Run `npm run test:uploads`, `npx tsc --noEmit --incremental false`, and
`npm run build`. Tests use fake R2 credentials and mocked storage/database calls.
After configuring credentials and CORS, smoke-test one food upload, one car
upload, and an anime cover replacement while signed in as an admin. Verify the
public images and DB reference formats, and check that signed-out requests
return 401 and non-admin requests return 403.
