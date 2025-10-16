# MetaAds Integration Setup Instructions

## ✅ Implementation Complete!

All code changes have been implemented. Here's what was done:

### Files Created:
1. ✅ `backend/scripts/setup_developer_integrations.py` - Script to create auth configs
2. ✅ `backend/core/composio_integration/developer_managed_integrations.py` - Registry for developer-managed integrations
3. ✅ `backend/scripts/README.md` - Documentation for setup scripts

### Files Modified:
1. ✅ `backend/core/composio_integration/toolkit_service.py` - Updated filtering to include developer-managed integrations
2. ✅ `backend/core/composio_integration/composio_service.py` - Uses pre-configured auth configs when available

---

## 🚀 Next Steps (You Need to Do This)

### Step 1: Add Environment Variables

Add these to your backend `.env` file (or AWS environment):

```bash
# Meta Developer App Credentials
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here

# Composio API Key
COMPOSIO_API_KEY=your_composio_api_key_here

# This will be populated by the setup script (leave empty for now)
METAADS_AUTH_CONFIG_ID=
```

### Step 2: Run the Setup Script

```bash
cd backend
export COMPOSIO_API_KEY=your_composio_api_key_here
export META_APP_ID=your_meta_app_id_here
export META_APP_SECRET=your_meta_app_secret_here

python3 scripts/setup_developer_integrations.py
```

The script will output something like:
```
✅ Successfully created MetaAds auth config!
📋 Auth Config ID: ac_abc123xyz...
```

### Step 3: Add the Auth Config ID to Environment

Copy the `auth_config_id` from the script output and add it to your environment:

**For local development** (backend/.env):
```bash
METAADS_AUTH_CONFIG_ID=ac_abc123xyz...
```

**For AWS/Production**:
Add the environment variable through your AWS console or deployment pipeline.

### Step 4: Restart Your Backend

```bash
# If running locally
cd backend
uv run api.py

# If running with Docker
docker compose restart backend
```

---

## ✨ What Happens Next

1. **MetaAds will appear in your integrations list** - Users will see it alongside GitHub, Slack, etc.
2. **Users can connect seamlessly** - They click "Connect MetaAds" and go through OAuth using YOUR app
3. **No setup required from users** - They don't need to create a Meta Developer app
4. **Tools become available** - Once connected, users get access to all 16 MetaAds tools:
   - `METAADS_GET_INSIGHTS` - Get ad performance data
   - `METAADS_CREATE_CAMPAIGN` - Create campaigns
   - `METAADS_CREATE_AD_SET` - Create ad sets
   - `METAADS_CREATE_AD` - Create ads
   - And 12 more tools for managing Facebook Ads

---

## 🔮 Adding More Integrations Later

To add Google Ads (or any other integration) later:

1. **Get Google Ads OAuth credentials** (client_id, client_secret)

2. **Update the registry** (`backend/core/composio_integration/developer_managed_integrations.py`):
   ```python
   DEVELOPER_MANAGED_INTEGRATIONS: Dict[str, str] = {
       "metaads": "METAADS_AUTH_CONFIG_ID",
       "googleads": "GOOGLE_ADS_AUTH_CONFIG_ID",  # Add this line
   }
   ```

3. **Update the setup script** to create Google Ads auth config (similar to MetaAds)

4. **Run the script** and add the new auth_config_id to your environment

5. **Deploy** - Google Ads will now appear in your integrations list!

---

## 🧪 Testing

After setup, test the integration:

1. **Check MetaAds appears in list:**
   ```bash
   curl http://localhost:8000/api/composio/toolkits | jq '.toolkits[] | select(.slug == "metaads")'
   ```

2. **Create a profile:**
   - Go to your frontend
   - Navigate to integrations
   - Click "Connect MetaAds"
   - Complete OAuth flow

3. **Test tools:**
   - Create an agent with MetaAds tools enabled
   - Ask it to fetch ad insights
   - Verify it can access your Facebook Ad account data

---

## 📝 Notes

- **Rate Limits**: All users share YOUR Meta app's rate limits
- **Approval**: Your Meta app must be approved for production use
- **Security**: Keep `META_APP_SECRET` and `COMPOSIO_API_KEY` secure
- **Scopes**: Default scopes are `ads_read,ads_management`
- **Each user gets their own connection** to their Facebook Ad account
- **Data privacy**: Each user only sees their own ad data

---

## ❓ Troubleshooting

**MetaAds doesn't appear in list:**
- Check `METAADS_AUTH_CONFIG_ID` is set in environment
- Restart backend server
- Check logs for errors

**OAuth fails:**
- Verify Meta app credentials are correct
- Check redirect URI is set to `https://backend.composio.dev/api/v1/auth-apps/add`
- Ensure Meta app is approved

**Tools don't work:**
- Check user completed OAuth flow successfully
- Verify user has access to a Facebook Ad account
- Check Composio logs for API errors

---

## 🎉 You're All Set!

Once you complete steps 1-4 above, MetaAds will be available to all your users. The infrastructure is now in place to easily add more developer-managed integrations in the future!

