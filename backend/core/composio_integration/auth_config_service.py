from typing import Optional, List, Dict, Any, Union
from composio_client import Composio
from core.utils.logger import logger
from pydantic import BaseModel

from .client import ComposioClient


class AuthConfig(BaseModel):
    id: str
    auth_scheme: str
    is_composio_managed: bool = True
    restrict_to_following_tools: List[str] = []
    toolkit_slug: str


class AuthConfigService:
    def __init__(self, api_key: Optional[str] = None):
        self.client = ComposioClient.get_client(api_key)
    
    def _convert_field_value(self, value: str, field_type: str) -> Union[str, bool, float]:
        if field_type == 'boolean':
            if isinstance(value, bool):
                return value
            return value.lower() in ('true', '1', 'yes', 'on')
        elif field_type == 'number' or field_type == 'double':
            try:
                return float(value)
            except (ValueError, TypeError):
                logger.warning(f"Failed to convert '{value}' to float, using as string")
                return str(value)
        else:
            return str(value)
    
    async def create_auth_config(
        self, 
        toolkit_slug: str, 
        initiation_fields: Optional[Dict[str, str]] = None,
        custom_auth_config: Optional[Dict[str, str]] = None,
        use_custom_auth: bool = False
    ) -> AuthConfig:
        try:
            logger.debug(f"Creating auth config for toolkit: {toolkit_slug}")
            logger.debug(f"Initiation fields: {initiation_fields}")
            logger.debug(f"Custom auth config provided: {bool(custom_auth_config)}")
            logger.debug(f"Use custom auth: {use_custom_auth}")
            
            # Fetch toolkit info to determine auth requirements
            toolkit_info = None
            toolkit_auth_schemes = []
            requires_user_credentials = False
            
            try:
                from .toolkit_service import ToolkitService
                toolkit_service = ToolkitService(api_key=None)
                toolkit_info = await toolkit_service.get_toolkit_by_slug(toolkit_slug)
                if toolkit_info:
                    toolkit_auth_schemes = toolkit_info.auth_schemes
                    requires_user_credentials = toolkit_info.requires_user_credentials
                    logger.debug(f"Toolkit {toolkit_slug} auth schemes: {toolkit_auth_schemes}, requires_user_credentials: {requires_user_credentials}")
            except Exception as e:
                logger.warning(f"Could not fetch toolkit info for {toolkit_slug}: {e}")
            
            # Determine if we should use custom auth:
            # 1. Explicitly requested via use_custom_auth flag
            # 2. Toolkit requires user credentials (no Composio-managed OAuth2 available)
            # 3. API_KEY is the only/primary auth scheme
            should_use_custom_auth = use_custom_auth or requires_user_credentials
            
            # Also force custom auth for toolkits that only support API_KEY
            USER_PROVIDABLE_AUTH_SCHEMES = ["API_KEY", "BASIC", "KEYS", "CUSTOM"]
            has_only_user_providable_auth = (
                toolkit_auth_schemes and 
                all(scheme in USER_PROVIDABLE_AUTH_SCHEMES for scheme in toolkit_auth_schemes)
            )
            if has_only_user_providable_auth:
                should_use_custom_auth = True
                logger.debug(f"Toolkit {toolkit_slug} only supports user-providable auth schemes, forcing custom auth")
            
            if should_use_custom_auth:
                logger.debug("Creating custom auth config with user-provided credentials")
                
                # Build credentials from custom_auth_config or initiation_fields
                credentials = {}
                source_fields = custom_auth_config if custom_auth_config else initiation_fields
                
                if source_fields:
                    for field_name, field_value in source_fields.items():
                        if field_value:
                            # Handle both string and list values from frontend
                            if isinstance(field_value, list):
                                field_value = field_value[0] if field_value else ""
                            credentials[field_name] = str(field_value)
                
                logger.debug(f"Using custom credentials (keys): {list(credentials.keys())}")
                
                # Determine the auth scheme from the toolkit
                auth_scheme = "API_KEY"  # Default for custom auth
                if toolkit_auth_schemes:
                    # Prefer user-providable auth schemes (API_KEY, BASIC, etc.) over OAUTH2
                    for scheme in USER_PROVIDABLE_AUTH_SCHEMES:
                        if scheme in toolkit_auth_schemes:
                            auth_scheme = scheme
                            break
                    # If no user-providable scheme found, use the first available scheme
                    if auth_scheme == "API_KEY" and "API_KEY" not in toolkit_auth_schemes and toolkit_auth_schemes:
                        auth_scheme = toolkit_auth_schemes[0]
                
                logger.debug(f"Using auth scheme: {auth_scheme} for toolkit {toolkit_slug}")
                
                response = self.client.auth_configs.create(
                    toolkit={
                        "slug": toolkit_slug
                    },
                    auth_config={
                        "type": "use_custom_auth",
                        "credentials": credentials,
                        "authScheme": auth_scheme
                    }
                )
            else:
                # Standard Composio-managed auth
                credentials = {"region": "ind"}
                
                if initiation_fields:
                    for field_name, field_value in initiation_fields.items():
                        if field_value:
                            # Handle both string and list values from frontend
                            if isinstance(field_value, list):
                                field_value = field_value[0] if field_value else ""
                            if field_name == "suffix.one":
                                credentials["extension"] = str(field_value)
                            else:
                                credentials[field_name] = str(field_value)
                
                logger.debug(f"Using composio-managed credentials: {credentials}")
                
                response = self.client.auth_configs.create(
                    toolkit={
                        "slug": toolkit_slug
                    },
                    auth_config={
                        "type": "use_composio_managed_auth",
                        "credentials": credentials
                    }
                )
            
            auth_config_obj = response.auth_config
            
            auth_config = AuthConfig(
                id=auth_config_obj.id,
                auth_scheme=auth_config_obj.auth_scheme,
                is_composio_managed=getattr(auth_config_obj, 'is_composio_managed', not use_custom_auth),
                restrict_to_following_tools=getattr(auth_config_obj, 'restrict_to_following_tools', []),
                toolkit_slug=toolkit_slug
            )
            
            logger.debug(f"Successfully created auth config: {auth_config.id}")
            return auth_config
            
        except Exception as e:
            logger.error(f"Failed to create auth config for {toolkit_slug}: {e}", exc_info=True)
            raise
    
    async def get_auth_config(self, auth_config_id: str) -> Optional[AuthConfig]:
        try:
            logger.debug(f"Fetching auth config: {auth_config_id}")
            
            response = self.client.auth_configs.get(auth_config_id)
            
            if not response:
                return None
            
            return AuthConfig(
                id=response.id,
                auth_scheme=response.auth_scheme,
                is_composio_managed=getattr(response, 'is_composio_managed', True),
                restrict_to_following_tools=getattr(response, 'restrict_to_following_tools', []),
                toolkit_slug=getattr(response, 'toolkit_slug', '')
            )
            
        except Exception as e:
            logger.error(f"Failed to get auth config {auth_config_id}: {e}", exc_info=True)
            raise
    
    async def list_auth_configs(self, toolkit_slug: Optional[str] = None) -> List[AuthConfig]:
        try:
            logger.debug(f"Listing auth configs for toolkit: {toolkit_slug}")
            
            if toolkit_slug:
                response = self.client.auth_configs.list(toolkit=toolkit_slug)
            else:
                response = self.client.auth_configs.list()
            
            auth_configs = []
            items = getattr(response, 'items', [])
            
            for item in items:
                auth_config = AuthConfig(
                    id=item.id,
                    auth_scheme=item.auth_scheme,
                    is_composio_managed=getattr(item, 'is_composio_managed', True),
                    restrict_to_following_tools=getattr(item, 'restrict_to_following_tools', []),
                    toolkit_slug=getattr(item, 'toolkit_slug', toolkit_slug or '')
                )
                auth_configs.append(auth_config)
            
            logger.debug(f"Successfully listed {len(auth_configs)} auth configs")
            return auth_configs
            
        except Exception as e:
            logger.error(f"Failed to list auth configs: {e}", exc_info=True)
            raise 