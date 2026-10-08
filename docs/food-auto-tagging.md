# Food ingredient tagging

Set these server-side variables in Vercel (Production and any Preview environment that needs tagging) and in ignored `.env.local` for local use:

- `OPENAI_API_KEY`: your OpenAI API credential.
- `FOOD_TAGGING_MODEL`: a vision model supporting Responses with strict JSON-schema output, for example `gpt-4.1-mini`.
- `FOOD_TAGGING_PROVIDER`: optional; defaults to `openai`.

For another compatible provider, set `FOOD_TAGGING_PROVIDER=openai-compatible`, `FOOD_TAGGING_API_KEY`, `FOOD_TAGGING_BASE_URL` (HTTPS API base, typically ending in `/v1`), and `FOOD_TAGGING_MODEL`. The provider must support image URL inputs and strict `json_schema`. Existing `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` remains required for image URLs. Never put credentials in `NEXT_PUBLIC_` variables.

The OpenAI provider calls `/v1/responses` using `instructions`, `input_text`/`input_image`, and strict `text.format` JSON schema. Response storage is disabled (`store: false`); the configured model is preserved. `openai-compatible` continues to use `/chat/completions` and its existing request/response format.

The server sends the existing public R2 image URL directly; it does not download or re-upload the image. One analysis request has a 45-second timeout and a 500-token output limit. No automatic AI request retries are made. The model is instructed to identify only clearly visible ingredients/components, aim for 5–8 tags when warranted, and omit uncertain/hidden ingredients. Results are capped at 10 canonical, lowercase, deduplicated tags; generic meal/course tags are removed.

Provider errors are classified by HTTP status and parsed error fields. Server logs contain only status, error type/code, and a sanitized message (credentials, bearer tokens, and URL query/credential components are redacted). Admin responses contain actionable error messages and stable application codes, never raw provider payloads. Quota exhaustion and rate limits are distinguished; auth/model/request/provider outage errors pause the batch. Invalid-image errors are per-photo failures. Refused, incomplete, and invalid output cannot write tags.

OpenAI strict schemas require an object at the transport root. The only permitted transport field is `tags`, containing the ingredient array. The application validates/extracts that array and saves only it to `photos.tags`; explanations and other fields are rejected.

`POST /api/photos/[id]/auto-tag` requires the existing verified Supabase user + admin check and a JSON body `{}`. It rejects non-food rows. Existing nonempty tags are returned without an AI call. An explicit `{ "force": true }` permits replacement, but the update still compares the original tags, image path, and category so concurrent manual changes are retained. Empty, refused, truncated, or invalid AI output never modifies the row.

In Manage Photos, select Food and use **Auto-tag untagged food**. It handles all currently loaded untagged food rows (including rows hidden by search), sequentially with progress for processed/remaining/failed. Saved tags update each card immediately. Unsaved manual tags are skipped. **Stop tagging** aborts the current client request and stops dispatching more photos. An already-committed server result may still appear on refresh; default skipping makes resumption safe. Configuration/authentication errors and rate limits pause the batch. Other failures are recorded once per row without automatic retries. Resume by starting again: only remaining untagged rows are considered.

Future successful food uploads return the inserted/existing `photoId` and call the same endpoint. A tagging error is returned separately and logged as a warning; the uploaded R2 image and photo row remain saved. Car uploads and anime covers never invoke food tagging.

For diagnostics or a one-photo smoke test, use the **Auto-tag** action on an untagged Food card. It makes one request to that row's endpoint, uses the same default non-force behavior, and never starts the batch. Read `[food-tagging] provider_error` in Vercel runtime logs for the upstream HTTP status/type/code and sanitized message when the admin-facing error needs more detail.
