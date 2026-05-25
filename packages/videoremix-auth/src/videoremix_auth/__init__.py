"""
VideoRemix VIP Authentication and API Key Management.

This library provides authentication and API key management for VideoRemix VIP Streamlit apps.
Users authenticate via Supabase JWT, and API keys are fetched from the secure user_api_keys table.

Usage:
    from videoremix_auth import auth, require_openai_key, require_api_key

    auth.init_supabase()
    user = auth.require_auth()
    openai_key = require_openai_key()
    firecrawl_key = require_api_key("firecrawl")
"""

import os
from typing import Dict, Optional, Any, List
import streamlit as st
from supabase import create_client, Client


class VideoRemixAuth:
    """
    Manages user authentication and API key retrieval for VideoRemix VIP Streamlit apps.
    """

    def __init__(self):
        self.supabase: Optional[Client] = None
        self._user_id: Optional[str] = None
        self._access_token: Optional[str] = None
        self._user_info: Optional[Dict[str, Any]] = None

    def init_supabase(self, url: Optional[str] = None, key: Optional[str] = None) -> Client:
        """
        Initialize Supabase client.

        Args:
            url: Supabase URL (defaults to SUPABASE_URL env var)
            key: Supabase anon key (defaults to SUPABASE_ANON_KEY env var)

        Returns:
            Supabase client instance
        """
        if not self.supabase:
            supabase_url = url or os.getenv("SUPABASE_URL")
            supabase_key = key or os.getenv("SUPABASE_ANON_KEY")

            if not supabase_url or not supabase_key:
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_ANON_KEY must be set as environment variables "
                    "or passed to init_supabase()"
                )

            self.supabase = create_client(supabase_url, supabase_key)

        return self.supabase

    def get_user_from_jwt(self, jwt_token: str) -> Optional[Dict[str, Any]]:
        """
        Verify JWT token and return user info.

        Args:
            jwt_token: JWT access token from Supabase

        Returns:
            User info dict or None if invalid
        """
        try:
            supabase = self.init_supabase()
            response = supabase.auth.get_user(jwt_token)

            if response.user:
                self._user_id = response.user.id
                self._access_token = jwt_token
                self._user_info = {
                    "id": response.user.id,
                    "email": response.user.email,
                    "metadata": response.user.user_metadata,
                }
                return self._user_info

        except Exception as e:
            st.error(f"Authentication failed: {e}")

        return None

    def get_user_from_session(self) -> Optional[Dict[str, Any]]:
        """
        Try to get user from Streamlit session state.

        Checks for 'supabase_jwt' in st.session_state (set by dashboard iframe).

        Returns:
            User info dict or None
        """
        if 'supabase_jwt' in st.session_state:
            return self.get_user_from_jwt(st.session_state.supabase_jwt)
        return None

    def require_auth(self) -> Dict[str, Any]:
        """
        Require authentication, showing login prompt if not authenticated.

        Returns:
            User info dict

        Raises:
            Stops execution if user not authenticated
        """
        user = self.get_user_from_session()
        if not user:
            self._show_login_prompt()
            st.stop()
        return user

    def _show_login_prompt(self):
        """Show a login button that redirects to VideoRemix VIP dashboard."""
        st.warning("🔒 Sign in to access this app")
        st.markdown("""
        This app requires authentication through VideoRemix VIP.

        Please visit [VideoRemix VIP](https://videoremix.vip) to sign in and access this app.
        """)

        # If embedded in iframe, try to communicate with parent
        if st.query_params.get("embedded", False):
            st.markdown("""
            <script>
            window.parent.postMessage({
                type: 'AUTH_REQUIRED',
                appId: window.location.pathname.split('/').pop()
            }, '*');
            </script>
            """, unsafe_allow_html=True)

    def get_api_key(self, provider: str, user_id: Optional[str] = None) -> Optional[str]:
        """
        Fetch user's API key from Supabase user_api_keys table.

        Args:
            provider: API provider name ('openai', 'firecrawl', etc.)
            user_id: Optional user ID (uses authenticated user if not provided)

        Returns:
            API key string or None if not found
        """
        if not user_id and self._user_id:
            user_id = self._user_id
        if not user_id:
            user = self.require_auth()
            user_id = user["id"]

        try:
            supabase = self.init_supabase()
            response = supabase.table("user_api_keys").select("encrypted_api_key").eq(
                "user_id", user_id
            ).eq("provider", provider).single()

            if response.data:
                return response.data["encrypted_api_key"]

        except Exception as e:
            st.error(f"Failed to fetch {provider} API key: {e}")

        return None

    def save_api_key(self, provider: str, api_key: str, user_id: Optional[str] = None) -> bool:
        """
        Save user's API key to Supabase.

        Args:
            provider: API provider name
            api_key: The API key to save
            user_id: Optional user ID

        Returns:
            True if saved successfully, False otherwise
        """
        if not user_id and self._user_id:
            user_id = self._user_id
        if not user_id:
            user = self.require_auth()
            user_id = user["id"]

        try:
            supabase = self.init_supabase()
            supabase.table("user_api_keys").upsert({
                "user_id": user_id,
                "provider": provider,
                "encrypted_api_key": api_key,
                "updated_at": "now()"
            }).execute()
            return True

        except Exception as e:
            st.error(f"Failed to save {provider} API key: {e}")
            return False

    def has_api_key(self, provider: str, user_id: Optional[str] = None) -> bool:
        """
        Check if user has added the specified API key.

        Args:
            provider: API provider name
            user_id: Optional user ID

        Returns:
            True if key exists, False otherwise
        """
        return self.get_api_key(provider, user_id) is not None

    def get_required_providers(self, app_id: str) -> List[str]:
        """
        Get list of required API providers for an app.

        Args:
            app_id: Application identifier

        Returns:
            List of required provider names
        """
        try:
            supabase = self.init_supabase()
            response = supabase.table("app_api_requirements").select("required_providers").eq(
                "app_id", app_id
            ).single()

            if response.data and response.data["required_providers"]:
                return response.data["required_providers"]

        except Exception as e:
            st.error(f"Failed to fetch requirements for {app_id}: {e}")

        return []


# Singleton instance
auth = VideoRemixAuth()


# Convenience functions
def require_openai_key(user_id: Optional[str] = None) -> str:
    """
    Require OpenAI API key (all apps need this).

    Returns:
        OpenAI API key string

    Raises:
        Stops execution if key not available
    """
    key = auth.get_api_key("openai", user_id)
    if not key:
        _show_api_key_prompt("openai")
        st.stop()
    return key


def require_api_key(provider: str, user_id: Optional[str] = None) -> str:
    """
    Require a specific API key.

    Args:
        provider: API provider name
        user_id: Optional user ID

    Returns:
        API key string

    Raises:
        Stops execution if key not available
    """
    key = auth.get_api_key(provider, user_id)
    if not key:
        _show_api_key_prompt(provider)
        st.stop()
    return key


def optional_api_key(provider: str, user_id: Optional[str] = None) -> Optional[str]:
    """
    Get an optional API key (doesn't stop execution if missing).

    Args:
        provider: API provider name
        user_id: Optional user ID

    Returns:
        API key string or None
    """
    return auth.get_api_key(provider, user_id)


def _show_api_key_prompt(provider: str):
    """Show modal prompt to add missing API key."""
    provider_names = {
        "openai": "OpenAI",
        "firecrawl": "Firecrawl",
        "anthropic": "Anthropic",
        "google": "Google Gemini",
        "groq": "Groq",
    }

    display_name = provider_names.get(provider, provider.upper())

    st.error(f"🔑 {display_name} API key required")

    with st.form(f"add_{provider}_key"):
        st.markdown(f"Please add your {display_name} API key:")
        new_key = st.text_input(
            f"{display_name} API Key",
            type="password",
            help=f"Get your API key from the {display_name} platform"
        )

        submitted = st.form_submit_button(f"Save {display_name} Key")

        if submitted and new_key:
            if auth.save_api_key(provider, new_key):
                st.success(f"✅ {display_name} API key saved! Reloading...")
                st.rerun()
            else:
                st.error(f"❌ Failed to save {display_name} API key. Please try again.")


def get_current_user() -> Optional[Dict[str, Any]]:
    """
    Get currently authenticated user info.

    Returns:
        User info dict or None
    """
    return auth._user_info


def is_authenticated() -> bool:
    """
    Check if user is currently authenticated.

    Returns:
        True if authenticated, False otherwise
    """
    return auth._user_id is not None</content>
<parameter name="filePath">packages/videoremix-auth/src/videoremix_auth/__init__.py