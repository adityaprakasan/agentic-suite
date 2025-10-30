# New Agent Defaults Configuration - REVISED PLAN

## Investigation Phase

### 1. Total Tool Count

From `backend/core/utils/tool_groups.py`, **ALL available tools**:

1. sb_files_tool
2. sb_shell_tool
3. web_search_tool
4. sb_vision_tool
5. sb_image_edit_tool
6. browser_tool
7. sb_presentation_tool
8. sb_sheets_tool
9. task_list_tool
10. expand_message_tool
11. sb_deploy_tool
12. sb_expose_tool
13. image_search_tool
14. data_providers_tool
15. agent_config_tool
16. mcp_search_tool
17. credential_profile_tool
18. workflow_tool
19. trigger_tool
20. sb_kb_tool
21. sb_design_tool
22. sb_presentation_outline_tool
23. sb_upload_file_tool
24. sb_docs_tool
25. agent_creation_tool
26. sb_browser_tool
27. people_search_tool
28. company_search_tool
29. paper_search_tool
30. sb_web_dev_tool
31. sb_templates_tool
32. computer_use_tool
33. message_tool
34. memories_tool

**Count: 34 tools**

User says 36 - need to find the 2 missing tools.

**Possible missing tools**:
- vapi_voice_tool? (exists in backend/core/tools/vapi_voice_tool.py but not in TOOL_GROUPS)
- Any other tool files not registered?

### 2. Current Defaults

From `backend/core/config_helper.py` line 201-219:

**Currently enabled by default (16 tools)**:
- sb_shell_tool ✅
- sb_files_tool ✅
- sb_expose_tool ✅
- web_search_tool ✅
- image_search_tool ✅
- sb_vision_tool ✅
- sb_image_edit_tool ✅
- sb_presentation_tool ✅
- browser_tool ✅
- data_providers_tool ✅
- agent_config_tool ✅
- mcp_search_tool ✅
- credential_profile_tool ✅
- agent_creation_tool ✅
- trigger_tool ✅

**Currently disabled by default (1 tool shown, but 18+ more not listed)**:
- people_search_tool ❌

**Not listed in defaults (need to be added)**:
- sb_sheets_tool
- task_list_tool
- expand_message_tool
- sb_deploy_tool
- workflow_tool
- sb_kb_tool
- sb_design_tool
- sb_presentation_outline_tool
- sb_upload_file_tool
- sb_docs_tool
- sb_browser_tool
- company_search_tool
- paper_search_tool
- sb_web_dev_tool
- sb_templates_tool
- computer_use_tool
- message_tool
- memories_tool
- *(+ any other missing tools)*

### 3. Icon System

**Current System**: Uses Lucide React icons
- Icons referenced by kebab-case names: 'bot', 'sparkles', 'sun', 'zap', etc.
- Stored in: `frontend/src/components/agents/config/icon-picker.tsx`

**Current default icon** (`backend/core/agent_crud.py` line 564):
```python
"icon_name": "bot",
"icon_color": "#000000", 
"icon_background": "#F3F4F6"
```

**Adentic logo file**: `/frontend/public/adentic-icon.avif` (image file)
- BUT: Agent icon picker uses Lucide icons, not custom images

**❓ QUESTION FOR USER**: Which Lucide icon represents "Adentic logo"?
- Options: `sparkles`, `zap`, `stars`, `wand-2`, `rocket`, `brain`, `cpu`, etc.
- Or do you want a custom icon added to the icon picker?

---

## Proposed Changes (PENDING ICON NAME)

### Change 1: Update Default Icon to Adentic Branding

**Files**:
- `backend/core/agent_crud.py` (lines 564-566)
- `backend/core/tools/agent_creation_tool.py` (lines 147-150)

**Change from**:
```python
"icon_name": agent_data.icon_name or "bot",
"icon_color": agent_data.icon_color or "#000000",
"icon_background": agent_data.icon_background or "#F3F4F6",
```

**Change to** (PENDING ICON NAME):
```python
"icon_name": agent_data.icon_name or "[WHAT_ICON_NAME?]",  # Adentic logo
"icon_color": agent_data.icon_color or "#F59E0B",  # Adentic orange
"icon_background": agent_data.icon_background or "#FFF3CD",  # Adentic yellow
```

**Colors match Adentic's suna_default_agent** (sun icon with amber/yellow theme)

---

### Change 2: Enable ALL 34+ Tools by Default

**File**: `backend/core/config_helper.py` (lines 201-219)

**Replace entire function** with:

```python
def _get_default_agentpress_tools() -> Dict[str, bool]:
    """
    Return default tools configuration for new agents.
    All tools are enabled by default.
    """
    return {
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
    }
```

---

## Next Steps

**BEFORE IMPLEMENTATION**:

1. ❓ **User**: What icon name should represent "Adentic logo"?
   - Suggestion: "sparkles" (✨ - commonly used for AI magic)
   - Alternative: "zap" (⚡), "stars" (⭐), "wand-2" (🪄), "rocket" (🚀)
   
2. ❓ **Verify**: Are there really 36 tools, or 34?
   - Need to check if vapi_voice_tool or other tools should be included
   - Need to check if any tools are missing from TOOL_GROUPS

**AFTER CLARIFICATION**:

3. ✅ Update default icon to Adentic brand icon (with confirmed icon name)
4. ✅ Enable all 34+ tools in _get_default_agentpress_tools()
5. ✅ Test agent creation
6. ✅ Verify all tools appear in agent settings

---

## Files to Modify (After Clarification)

1. `backend/core/agent_crud.py` - Update create_agent function default icon
2. `backend/core/tools/agent_creation_tool.py` - Update agent_creation_tool default icon  
3. `backend/core/config_helper.py` - Enable all tools in _get_default_agentpress_tools()

---

## Expected Result

After implementation:
- ✅ **All new agents** will have the Adentic brand icon with orange/yellow colors
- ✅ **All new agents** will have ALL 34+ tools enabled immediately
- ✅ **Existing agents** remain unchanged
- ✅ Users can still customize individual agents after creation

