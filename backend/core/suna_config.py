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
        # Core file and shell operations
        "sb_shell_tool": True,
        "sb_files_tool": True,
        "sb_expose_tool": True,
        "sb_upload_file_tool": True,
        
        # Search and research tools
        "web_search_tool": True,
        "image_search_tool": True,
        "data_providers_tool": True,
        "people_search_tool": True,
        "company_search_tool": True,
        "paper_search_tool": True,
        
        # AI vision and image tools
        "sb_vision_tool": True,
        "sb_image_edit_tool": True,
        "sb_design_tool": True,  # Fixed: was sb_designer_tool
        
        # Document and content creation
        "sb_docs_tool": True,
        "sb_presentation_tool": True,
        "sb_presentation_outline_tool": True,
        "sb_kb_tool": True,
        "sb_sheets_tool": True,
        "sb_templates_tool": True,
        
        # Development tools
        "sb_web_dev_tool": True,
        "sb_deploy_tool": True,
        
        # Communication and tasks
        "message_tool": True,
        "task_list_tool": True,
        "vapi_voice_tool": True,
        "memories_tool": True,
        
        # Browser automation
        "browser_tool": True,
        "sb_browser_tool": True,
        
        # Workflow and automation
        "workflow_tool": True,
        "computer_use_tool": True,
        
        # Agent builder tools
        "agent_config_tool": True,
        "agent_creation_tool": True,
        "mcp_search_tool": True,
        "credential_profile_tool": True,
        "trigger_tool": True
    },
    "is_default": True
}

