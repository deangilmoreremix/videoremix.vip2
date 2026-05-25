# Creative Video Prompt

Use this template to generate a personalized video script or storyboard.

## Prompt

Create a personalized video script for the prospect using the profile information below. Keep the tone professional but approachable, highlight the prospect's public profile signals, and link the message to the selected VideoRemix app.

### Data
- Username: {{username}}
- App ID: {{appId}}
- Mode: {{mode}}
- Profile summary: {{profileSummary}}

### Instructions
1. Open with a hook that references the prospect's known profile or business.
2. Describe a high-level video idea that solves a pain point.
3. Include a clear value proposition and next step.
4. Output a JSON object with:
   - `outputType`: "video_script"
   - `title`
   - `content`
