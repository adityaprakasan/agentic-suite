from core.prompts.prompt import SYSTEM_PROMPT

# Adentic default configuration - simplified and centralized
SUNA_CONFIG = {
    "name": "Adentic",
    "description": "Adentic is your AI assistant with access to various tools and integrations to help you with tasks across domains.",
    "model": "claude-sonnet-4.5",
    "system_prompt": SYSTEM_PROMPT,
    "configured_mcps": [],
    "custom_mcps": [],
    "agentpress_tools": {
        # Core file & shell operations
        "sb_files_tool": True,
        "sb_shell_tool": True,
        
        # Search & research
        "web_search_tool": True,
        "image_search_tool": True,
        "people_search_tool": True,
        "company_search_tool": True,
        "paper_search_tool": True,
        
        # AI & vision
        "sb_vision_tool": True,
        "sb_image_edit_tool": True,
        
        # Browser & web
        "browser_tool": True,
        "sb_browser_tool": True,
        "sb_web_dev_tool": True,
        
        # Presentation & docs
        "sb_presentation_tool": True,
        "sb_presentation_outline_tool": True,
        "sb_sheets_tool": True,
        "sb_docs_tool": True,
        "sb_design_tool": True,
        
        # Data & integrations
        "data_providers_tool": True,
        "sb_kb_tool": True,
        "sb_upload_file_tool": True,
        
        # Deployment & exposure
        "sb_expose_tool": True,
        "sb_deploy_tool": True,
        "sb_templates_tool": True,
        
        # Task management & messaging
        "task_list_tool": True,
        "expand_message_tool": True,
        "message_tool": True,
        
        # Agent management & config
        "agent_config_tool": True,
        "agent_creation_tool": True,
        "mcp_search_tool": True,
        "credential_profile_tool": True,
        "trigger_tool": True,
        "workflow_tool": True,
        
        # Video intelligence
        "memories_tool": True,
        
        # Advanced
        "computer_use_tool": True,
    },
    "is_default": True
}

