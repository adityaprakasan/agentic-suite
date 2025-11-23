<!-- 010376ee-9435-4376-ae5a-41824c4f519b 29c3194a-96fc-415a-ac6a-d504d82a70b6 -->
# Implementation Plan: Bottom Menu & Agent Setup from Chat

## Overview

Port the bottom quick-action menu (Image, Slides, Data, Docs, People, Research) and implement natural language agent creation feature with optimized prompts.

---

## Phase 1: Bottom Menu Implementation

### 1.1 Analyze Upstream Menu Structure

- [ ] Examine `frontend copy/src/components/thread/` for menu components
- [ ] Identify the quick action buttons component
- [ ] Check for associated hooks and utilities
- [ ] Document props, state management, and API calls

### 1.2 Copy Menu Components

- [ ] Copy main menu component with all 6 buttons (Image, Slides, Data, Docs, People, Research)
- [ ] Copy associated styles and icons
- [ ] Copy any utility functions for menu actions
- [ ] Ensure TypeScript types are included

### 1.3 Wire Up Menu Functionality

- [ ] **Image**: Connect to image generation/upload tools
- [ ] **Slides**: Connect to presentation template system
- [ ] **Data**: Connect to data analysis/spreadsheet tools
- [ ] **Docs**: Connect to document generation templates
- [ ] **People**: Connect to people search tools
- [ ] **Research**: Connect to web search/research tools

### 1.4 Template Integration

- [ ] Verify presentation templates are accessible
- [ ] Verify document templates are accessible
- [ ] Test template selection flows
- [ ] Ensure template rendering works

---

## Phase 2: Agent Setup from Chat Feature

### 2.1 Backend Implementation

#### Copy Core Files

- [ ] Copy `backend copy/core/agent_setup.py` → `backend/core/agent_setup.py`
- [ ] Review dependencies (icon_generator, LLM service, version service)
- [ ] Check if all required utilities exist in your repo

#### API Endpoint

- [ ] Add route to `backend/api.py`: 
  ```python
  from core.agent_setup import router as agent_setup_router
  app.include_router(agent_setup_router)
  ```

- [ ] Test endpoint: `POST /agents/setup-from-chat`

#### Prompt Optimization

- [ ] Review `generate_agent_name_and_prompt()` function
- [ ] Improve system prompt for better agent generation:
  - Add examples of good agent names (concise, descriptive)
  - Add examples of good system prompts (clear, actionable)
  - Include guidelines for different agent types (research, creative, analytical)
- [ ] Test with various descriptions to validate quality

### 2.2 Frontend Implementation

#### Create UI Component

- [ ] Build agent creation from chat dialog/modal
- [ ] Add text input for natural language description
- [ ] Add loading state during generation (shows AI is working)
- [ ] Add success state showing generated agent details
- [ ] Add error handling for failures

#### Wire to Backend

- [ ] Create API client function for `/agents/setup-from-chat`
- [ ] Add React hook for agent setup mutation
- [ ] Handle responses (agent_id, name, system_prompt, icon details)
- [ ] Redirect to agent config page after creation

#### Integration Points

- [ ] Add "Create from description" button to agents page
- [ ] Add quick action in new chat flow
- [ ] Consider adding to onboarding flow
- [ ] Add tooltip/help text explaining the feature

### 2.3 Enhanced Prompts

#### System Prompt Template

```python
system_prompt = """You are an AI agent configuration expert. Generate a name and system prompt for an AI worker based on the user's description.

GUIDELINES:
- Name: 2-4 words, clear and descriptive (e.g., "Content Strategist", "Data Analyst", "Research Assistant")
- System Prompt: Specific instructions defining role, capabilities, and behavior
- Be concise but comprehensive
- Focus on actionable capabilities

EXAMPLES:

User: "I need help analyzing sales data and creating reports"
Response: {
  "name": "Sales Analytics Assistant",
  "system_prompt": "You are an expert sales data analyst. Help users analyze sales metrics, identify trends, create visualizations, and generate actionable insights. Always provide data-driven recommendations with clear explanations."
}

User: "Someone who can help me write blog posts about technology"
Response: {
  "name": "Tech Content Writer",
  "system_prompt": "You are a skilled technology content writer. Help users research, outline, and write engaging blog posts about technology topics. Focus on clarity, accuracy, and reader engagement. Provide SEO-optimized content with proper structure."
}

User: "I want an assistant for customer support emails"
Response: {
  "name": "Customer Support Specialist",
  "system_prompt": "You are a professional customer support specialist. Help draft empathetic, solution-oriented responses to customer inquiries. Always maintain a friendly tone, acknowledge concerns, and provide clear next steps or solutions."
}

Now generate a name and system prompt for the following description.

Respond ONLY with valid JSON in this exact format:
{"name": "Agent Name Here", "system_prompt": "Detailed system prompt here"}
"""
```

#### Icon Generation Prompt Enhancement

- [ ] Review `icon_generator.py` prompts
- [ ] Ensure icon selection matches agent purpose
- [ ] Validate color palette generation

---

## Phase 3: Testing & Validation

### 3.1 Menu Testing

- [ ] Test each button (Image, Slides, Data, Docs, People, Research)
- [ ] Verify presentation templates load correctly
- [ ] Verify document templates load correctly
- [ ] Test on different screen sizes
- [ ] Verify keyboard shortcuts (if any)

### 3.2 Agent Setup Testing

- [ ] Test with simple descriptions: "Help me write emails"
- [ ] Test with complex descriptions: "I need an agent that can research companies, analyze their financials, and create investment reports"
- [ ] Test with vague descriptions: "Something for marketing"
- [ ] Test with technical descriptions: "Python code review assistant"
- [ ] Verify generated agents work correctly
- [ ] Test against agent count limits

### 3.3 Edge Cases

- [ ] Empty description
- [ ] Very long descriptions (500+ words)
- [ ] Non-English descriptions (if i18n is active)
- [ ] Special characters in descriptions
- [ ] Duplicate agent names

---

## Phase 4: UX Enhancements

### 4.1 Onboarding Flow

- [ ] Add "Create your first agent" prompt using natural language
- [ ] Show example descriptions as placeholders
- [ ] Add tooltips explaining what makes a good description

### 4.2 Visual Feedback

- [ ] Show AI generation progress ("Generating name...", "Creating icon...", "Setting up agent...")
- [ ] Display preview of generated agent before final creation
- [ ] Allow user to regenerate or edit before confirming

### 4.3 Documentation

- [ ] Add help text explaining the feature
- [ ] Create examples of good descriptions
- [ ] Add to user documentation

---

## Technical Requirements

### Dependencies Check

- [ ] Verify `core.utils.icon_generator` exists
- [ ] Verify `core.services.llm.make_llm_api_call` works
- [ ] Verify `core.versioning.version_service` exists
- [ ] Verify `core.config_helper._get_default_agentpress_tools` exists
- [ ] Verify `core.ai_models.model_manager` exists

### API Model

```python
class AgentSetupFromChatRequest(BaseModel):
    description: str

class AgentSetupFromChatResponse(BaseModel):
    agent_id: str
    name: str
    system_prompt: str
    icon_name: str
    icon_color: str
    icon_background: str
```

---

## Success Criteria

### Menu

✅ All 6 buttons visible and styled correctly

✅ Presentation templates accessible and working

✅ Document templates accessible and working

✅ Each button triggers correct action

✅ Mobile responsive

### Agent Setup from Chat

✅ API endpoint responds successfully

✅ Generated agent names are descriptive (2-4 words)

✅ Generated system prompts are clear and actionable (100-200 words)

✅ Icons and colors match agent purpose

✅ Created agents function correctly

✅ Feature accessible from agents page

✅ Loading states work

✅ Error handling works

---

## File Changes Summary

### Backend

- `backend/core/agent_setup.py` (new file, 266 lines)
- `backend/api.py` (add router import)
- `backend/core/utils/icon_generator.py` (verify/enhance)

### Frontend

- `frontend/src/components/thread/quick-action-menu.tsx` (new/copied)
- `frontend/src/components/agents/agent-setup-from-chat-dialog.tsx` (new)
- `frontend/src/hooks/use-agent-setup.ts` (new)
- `frontend/src/lib/api/agents.ts` (add setup-from-chat function)
- `frontend/src/app/(dashboard)/agents/page.tsx` (add button)

---

## Questions to Resolve Before Implementation

1. **Menu Icons**: Are the template systems (presentation, docs) already connected to the agents/tools?
2. **LLM Model**: Which model should be used for agent generation? (default: gpt-4o-mini for speed)
3. **Credit Cost**: Should agent setup from chat consume credits?
4. **Limits**: Should there be a limit on regenerations per user?
5. **Preview**: Should users preview generated agent config before confirming?

---

## Estimated Timeline

- Phase 1 (Menu): 2-3 hours
- Phase 2 (Agent Setup): 4-5 hours
- Phase 3 (Testing): 2 hours
- Phase 4 (Polish): 1-2 hours
- **Total**: 9-12 hours

---

## Next Steps

Once approved, I will:

1. Read the upstream menu component to understand exact implementation
2. Copy and adapt to your codebase structure
3. Implement agent setup backend with enhanced prompts
4. Build frontend UI with loading states
5. Test thoroughly and handle edge cases

### To-dos

- [ ] Analyze upstream bottom menu structure and components
- [ ] Copy menu UI components with all 6 buttons
- [ ] Connect menu buttons to presentation/docs templates
- [ ] Copy agent_setup.py and register API endpoint
- [ ] Improve agent generation prompts with examples
- [ ] Create frontend dialog for natural language agent creation
- [ ] Test all menu buttons and template functionality
- [ ] Test agent creation with various descriptions