# VideoRemix Auth

Authentication and API key management library for VideoRemix VIP Streamlit applications.

## Overview

This Python package provides seamless authentication and API key management for Streamlit apps integrated with the VideoRemix VIP platform. Users authenticate once via Supabase JWT tokens, and API keys are securely fetched from the VideoRemix database.

## Features

- **JWT Authentication**: Verify Supabase JWT tokens from dashboard
- **API Key Management**: Securely fetch user API keys from Supabase
- **Streamlit Integration**: Seamless integration with Streamlit's session management
- **Provider Support**: OpenAI (primary), with legacy support for Firecrawl, and specialized integrations
- **Dashboard Embedding**: Utilities for iframe embedding in VideoRemix dashboard

## Installation

```bash
pip install videoremix-auth
```

Or from source:
```bash
git clone https://github.com/deangilmoreremix/videoremix-auth
cd videoremix-auth
pip install -e .
```

## Quick Start

### Basic Usage

```python
import streamlit as st
from videoremix_auth import auth, require_openai_key, require_api_key

# Initialize Supabase (reads from environment variables)
auth.init_supabase()

# Require authentication
user = auth.require_auth()

# Require OpenAI key (all apps need this)
openai_key = require_openai_key()

# Require additional keys as needed
firecrawl_key = require_api_key("firecrawl")

# Set environment variables for existing code
import os
os.environ["OPENAI_API_KEY"] = openai_key
if firecrawl_key:
    os.environ["FIRECRAWL_API_KEY"] = firecrawl_key
```

### Dashboard Integration

For apps embedded in the VideoRemix VIP dashboard:

```python
from videoremix_auth.dashboard_integration import setup_iframe_auth

# Set up authentication from dashboard JWT
jwt_token = st.query_params.get("jwt")
if jwt_token:
    setup_iframe_auth(jwt_token)
```

## Environment Variables

Set these environment variables in your Streamlit deployment:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## API Reference

### VideoRemixAuth Class

#### Methods

- `init_supabase(url=None, key=None)`: Initialize Supabase client
- `get_user_from_jwt(jwt_token)`: Verify JWT and get user info
- `get_user_from_session()`: Get user from Streamlit session
- `require_auth()`: Require authentication (stops execution if not authenticated)
- `get_api_key(provider, user_id=None)`: Fetch user's API key
- `save_api_key(provider, api_key, user_id=None)`: Save user's API key
- `has_api_key(provider, user_id=None)`: Check if user has API key
- `get_required_providers(app_id)`: Get required providers for app

### Convenience Functions

- `require_openai_key(user_id=None)`: Require OpenAI key (all apps)
- `require_api_key(provider, user_id=None)`: Require specific API key
- `optional_api_key(provider, user_id=None)`: Get optional API key
- `get_current_user()`: Get current authenticated user
- `is_authenticated()`: Check authentication status

### Dashboard Integration

- `get_iframe_embed_code(app_id, width, height, user_jwt)`: Generate iframe HTML
- `handle_iframe_messages()`: Handle postMessage from embedded apps
- `send_message_to_parent(message)`: Send message to parent dashboard
- `setup_iframe_auth(jwt_token)`: Set up auth from dashboard JWT
- `validate_app_access(app_id, user_jwt)`: Check if user can access app

## Error Handling

The library handles authentication and API key errors gracefully:

- **No authentication**: Shows login prompt with link to VideoRemix VIP
- **Missing API key**: Shows modal to add the required key
- **Invalid JWT**: Shows authentication error

## Security

- API keys are stored encrypted in Supabase
- JWT tokens are verified server-side
- Row Level Security (RLS) ensures users only access their own keys
- No sensitive data is logged or exposed

## Development

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black src/
isort src/

# Type checking
mypy src/
```

## License

MIT License - see LICENSE file for details.</content>
<parameter name="filePath">packages/videoremix-auth/README.md