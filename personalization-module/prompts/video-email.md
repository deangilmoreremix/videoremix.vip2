# Video Email Prompt

Use this prompt to craft a personalized outreach email that references the prospect's online presence and the selected VideoRemix app.

## Prompt

Create a short, high-converting email for the prospect. Mention their public profile context and explain how the VideoRemix app can help them achieve a specific outcome.

### Data
- Username: {{username}}
- App ID: {{appId}}
- Mode: {{mode}}
- Profile summary: {{profileSummary}}

### Output
Return JSON with:
- `outputType`: "email"
- `title`
- `content`
