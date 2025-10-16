#!/usr/bin/env python3
"""
Setup script for creating developer-managed Composio integrations.

This script creates auth configs for integrations where we provide OAuth credentials
(e.g., MetaAds, Google Ads) so users can seamlessly connect without setting up their own apps.

Usage:
    python scripts/setup_developer_integrations.py
"""

import os
import sys
from composio import Composio


def create_metaads_auth_config():
    """Create MetaAds auth config using developer's Meta app credentials."""
    
    # Get Composio API key
    composio_api_key = os.getenv('COMPOSIO_API_KEY')
    if not composio_api_key:
        print("❌ Error: COMPOSIO_API_KEY environment variable not set")
        sys.exit(1)
    
    # Get Meta app credentials
    meta_app_id = os.getenv('META_APP_ID')
    meta_app_secret = os.getenv('META_APP_SECRET')
    
    if not meta_app_id or not meta_app_secret:
        print("❌ Error: META_APP_ID and META_APP_SECRET environment variables must be set")
        print("\nPlease add these to your .env file:")
        print("  META_APP_ID=your_app_id")
        print("  META_APP_SECRET=your_app_secret")
        sys.exit(1)
    
    print("🚀 Creating MetaAds auth config on Composio...")
    print(f"   Using Meta App ID: {meta_app_id}")
    
    try:
        composio = Composio(api_key=composio_api_key)
        
        # Create the auth config
        auth_config = composio.auth_configs.create(
            toolkit="metaads",
            options={
                "name": "Meta Ads",
                "type": "use_custom_auth",
                "auth_scheme": "OAUTH2",
                "credentials": {
                    "client_id": meta_app_id,
                    "client_secret": meta_app_secret,
                    "scopes": "ads_read,ads_management",
                },
            },
        )
        
        auth_config_id = auth_config.id
        
        print(f"✅ Successfully created MetaAds auth config!")
        print(f"\n📋 Auth Config ID: {auth_config_id}")
        print(f"\n🔧 Next Steps:")
        print(f"   1. Add this to your environment (AWS or .env):")
        print(f"      METAADS_AUTH_CONFIG_ID={auth_config_id}")
        print(f"\n   2. Restart your backend server")
        print(f"   3. MetaAds will now appear in your integrations list!")
        
        return auth_config_id
        
    except Exception as e:
        print(f"❌ Error creating auth config: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def verify_auth_config(auth_config_id: str):
    """Verify the auth config was created successfully."""
    try:
        composio_api_key = os.getenv('COMPOSIO_API_KEY')
        composio = Composio(api_key=composio_api_key)
        
        # Try to retrieve the auth config
        auth_config = composio.auth_configs.get(auth_config_id)
        print(f"\n✅ Verification: Auth config {auth_config_id} exists and is accessible")
        
    except Exception as e:
        print(f"\n⚠️  Warning: Could not verify auth config: {e}")


def main():
    """Main entry point."""
    print("=" * 80)
    print("Developer-Managed Composio Integrations Setup")
    print("=" * 80)
    print()
    
    # Create MetaAds auth config
    auth_config_id = create_metaads_auth_config()
    
    # Verify it was created
    verify_auth_config(auth_config_id)
    
    print("\n" + "=" * 80)
    print("Setup Complete! 🎉")
    print("=" * 80)


if __name__ == "__main__":
    main()

