"""
Registry for developer-managed Composio integrations.

Developer-managed integrations are those where we (the developers) provide
OAuth credentials, allowing users to connect seamlessly without setting up
their own developer apps.

This is a hybrid approach between:
- Fully Composio-managed (Composio provides OAuth credentials)
- Fully custom (each user provides their own OAuth credentials)

Example integrations: MetaAds, Google Ads, LinkedIn Ads, etc.
"""

from typing import Dict, Optional
import os


# Registry of integrations where we provide OAuth credentials
# Key: toolkit slug (lowercase)
# Value: environment variable name containing the auth_config_id
DEVELOPER_MANAGED_INTEGRATIONS: Dict[str, str] = {
    "metaads": "METAADS_AUTH_CONFIG_ID",
    # Future additions:
    # "googleads": "GOOGLE_ADS_AUTH_CONFIG_ID",
    # "linkedinads": "LINKEDIN_ADS_AUTH_CONFIG_ID",
}


def get_auth_config_id(toolkit_slug: str) -> Optional[str]:
    """
    Get pre-configured auth config ID for a toolkit if available.
    
    Args:
        toolkit_slug: The slug of the toolkit (e.g., "metaads")
        
    Returns:
        The auth_config_id if this is a developer-managed integration and
        the environment variable is set, otherwise None
    """
    env_var = DEVELOPER_MANAGED_INTEGRATIONS.get(toolkit_slug.lower())
    if env_var:
        return os.getenv(env_var)
    return None


def is_developer_managed(toolkit_slug: str) -> bool:
    """
    Check if a toolkit is developer-managed.
    
    Args:
        toolkit_slug: The slug of the toolkit (e.g., "metaads")
        
    Returns:
        True if this toolkit is in our developer-managed registry
    """
    return toolkit_slug.lower() in DEVELOPER_MANAGED_INTEGRATIONS


def get_all_developer_managed() -> Dict[str, str]:
    """
    Get all developer-managed integrations.
    
    Returns:
        Dictionary mapping toolkit slugs to their auth config environment variable names
    """
    return DEVELOPER_MANAGED_INTEGRATIONS.copy()

