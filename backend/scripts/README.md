# Backend Scripts

This directory contains utility scripts for setting up and managing the backend infrastructure.

## Setup Scripts

### `setup_developer_integrations.py`

Creates auth configs for developer-managed Composio integrations (e.g., MetaAds, Google Ads).

**What are developer-managed integrations?**
These are integrations where we (the developers) provide OAuth credentials, allowing users to connect seamlessly without setting up their own developer apps. It's a hybrid approach between fully Composio-managed (Composio provides credentials) and fully custom (each user provides credentials).

**Prerequisites:**
1. Set up your environment variables:
   ```bash
   export COMPOSIO_API_KEY=your_composio_api_key
   export META_APP_ID=your_meta_app_id
   export META_APP_SECRET=your_meta_app_secret
   ```

**Usage:**
```bash
cd backend
python scripts/setup_developer_integrations.py
```

**Output:**
The script will:
1. Create an auth config on Composio using your Meta app credentials
2. Print the `auth_config_id` (starts with `ac_...`)
3. You then add this ID to your environment as `METAADS_AUTH_CONFIG_ID`

**Example:**
```bash
$ python scripts/setup_developer_integrations.py

================================================================================
Developer-Managed Composio Integrations Setup
================================================================================

🚀 Creating MetaAds auth config on Composio...
   Using Meta App ID: 2969925359859469
✅ Successfully created MetaAds auth config!

📋 Auth Config ID: ac_abc123xyz...

🔧 Next Steps:
   1. Add this to your environment (AWS or .env):
      METAADS_AUTH_CONFIG_ID=ac_abc123xyz...

   2. Restart your backend server
   3. MetaAds will now appear in your integrations list!
```

**Adding More Integrations:**

To add Google Ads or other integrations in the future:

1. Update `core/composio_integration/developer_managed_integrations.py`:
   ```python
   DEVELOPER_MANAGED_INTEGRATIONS: Dict[str, str] = {
       "metaads": "METAADS_AUTH_CONFIG_ID",
       "googleads": "GOOGLE_ADS_AUTH_CONFIG_ID",  # Add this
   }
   ```

2. Update this script to create the Google Ads auth config

3. Run the script and add the resulting ID to your environment

That's it! The infrastructure is already in place to support any number of developer-managed integrations.

