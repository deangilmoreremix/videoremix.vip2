# App Registry for Personalization

The personalization module is designed to support many VideoRemix apps through a central registry.

## Registry fields

- `app_id` — unique app identifier
- `app_name` — display name
- `app_url` — deep link or landing page URL
- `app_category` — content category or use case
- `default_mode` — personalization mode for this app
- `output_types` — expected output formats
- `prompt_profile` — mapping of data fields for prompt generation
- `theme` — optional styling metadata

## Usage

The frontend widget can look up an app by `appId` and use registry metadata to choose the best prompt template and output type.

## Example

```json
{
  "app_id": "ai-personalized-content",
  "app_name": "AI Personalized Content",
  "default_mode": "creative",
  "output_types": ["video_script", "email", "proposal"]
}
```
