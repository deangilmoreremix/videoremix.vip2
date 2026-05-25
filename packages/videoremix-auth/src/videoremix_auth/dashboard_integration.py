"""
Dashboard integration utilities for VideoRemix VIP Streamlit apps.

This module provides utilities for embedding Streamlit apps in the VideoRemix VIP dashboard
via iframes with proper authentication and API key management.
"""

import streamlit as st
from typing import Optional, Dict, Any
import os


def get_iframe_embed_code(
    app_id: str,
    width: str = "100%",
    height: str = "600px",
    user_jwt: Optional[str] = None
) -> str:
    """
    Generate iframe embed code for a Streamlit app.

    Args:
        app_id: The app identifier
        width: CSS width for iframe
        height: CSS height for iframe
        user_jwt: Optional JWT token for authentication

    Returns:
        HTML iframe embed code
    """
    base_url = os.getenv("STREAMLIT_BASE_URL", "https://share.streamlit.io")
    app_url = f"{base_url}/user/{app_id}"

    # Add JWT if provided
    if user_jwt:
        app_url += f"?jwt={user_jwt}"

    # Mark as embedded
    app_url += "&embedded=true" if "?" in app_url else "?embedded=true"

    iframe_html = f"""
    <iframe
        src="{app_url}"
        width="{width}"
        height="{height}"
        frameborder="0"
        allowfullscreen
        style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
    ></iframe>
    """

    return iframe_html


def handle_iframe_messages():
    """
    Handle postMessage events from embedded Streamlit apps.

    This should be called in the parent dashboard to handle auth requests
    and other messages from embedded apps.
    """
    # JavaScript to handle iframe messages
    js_code = """
    <script>
    window.addEventListener('message', function(event) {
        if (event.origin !== window.location.origin) return;

        const message = event.data;

        if (message.type === 'AUTH_REQUIRED') {
            // Handle authentication required
            console.log('Streamlit app requires authentication:', message.appId);
            // Redirect to key management or show auth modal
        } else if (message.type === 'API_KEY_MISSING') {
            // Handle missing API key
            console.log('Missing API key for provider:', message.provider);
            // Show key addition modal
        }
    });
    </script>
    """

    st.markdown(js_code, unsafe_allow_html=True)


def send_message_to_parent(message: Dict[str, Any]):
    """
    Send a message to the parent dashboard window (when embedded).

    Args:
        message: Message object to send
    """
    js_code = f"""
    <script>
    if (window.parent !== window) {{
        window.parent.postMessage({message}, '*');
    }}
    </script>
    """

    st.markdown(js_code, unsafe_allow_html=True)


def setup_iframe_auth(jwt_token: str):
    """
    Set up authentication for an embedded Streamlit app.

    Args:
        jwt_token: JWT token from dashboard
    """
    # Store JWT in session state for the auth module to use
    st.session_state.supabase_jwt = jwt_token


def get_app_requirements(app_id: str) -> Dict[str, Any]:
    """
    Get app requirements from Supabase.

    Args:
        app_id: Application identifier

    Returns:
        App requirements dict
    """
    from . import auth

    try:
        supabase = auth.init_supabase()
        response = supabase.table("app_api_requirements").select("*").eq(
            "app_id", app_id
        ).single()

        if response.data:
            return response.data

    except Exception as e:
        st.error(f"Failed to fetch app requirements: {e}")

    return {}


def validate_app_access(app_id: str, user_jwt: Optional[str] = None) -> bool:
    """
    Validate that user has access to an app (has required API keys).

    Args:
        app_id: Application identifier
        user_jwt: Optional JWT token

    Returns:
        True if user has access, False otherwise
    """
    from . import auth

    if user_jwt:
        auth.get_user_from_jwt(user_jwt)

    requirements = get_app_requirements(app_id)
    required_providers = requirements.get("required_providers", [])

    # Check if user has all required keys
    for provider in required_providers:
        if not auth.has_api_key(provider):
            return False

    return True</content>
<parameter name="filePath">packages/videoremix-auth/src/videoremix_auth/dashboard_integration.py