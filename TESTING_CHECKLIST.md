# 🧪 Manual Testing Checklist for Agent Icon & Tools Changes

## Overview
This document provides a comprehensive testing checklist to verify all changes work correctly in production.

---

## ✅ Backend Tests

### Test 1: Default Tools Configuration
**What to verify:** All new agents get 26 tools enabled by default

**Steps:**
1. Create a new agent via API or UI
2. Check the agent's configuration
3. Verify all 26 tools are enabled

**Expected Result:**
- ✅ 26 tools enabled: sb_shell_tool, sb_files_tool, sb_expose_tool, sb_upload_file_tool, web_search_tool, image_search_tool, data_providers_tool, people_search_tool, company_search_tool, paper_search_tool, sb_vision_tool, sb_image_edit_tool, sb_designer_tool, sb_docs_tool, sb_presentation_tool, sb_kb_tool, message_tool, task_list_tool, vapi_voice_tool, memories_tool, browser_tool, agent_config_tool, agent_creation_tool, mcp_search_tool, credential_profile_tool, trigger_tool

---

### Test 2: Adentic Logo Default Icon
**What to verify:** New agents show Adentic logo by default

**Steps:**
1. Create a new agent without specifying an icon
2. Check the database: `SELECT icon_name FROM agents WHERE agent_id = 'xxx'`
3. Check the frontend display

**Expected Result:**
- ✅ Database shows: `icon_name = 'adentic-logo'`
- ✅ Frontend displays the Adentic logo
- ✅ No null constraint violations

---

### Test 3: Adentic Agent Editability
**What to verify:** The default Adentic agent can be edited

**Steps:**
1. Open the default Adentic agent
2. Try to edit the system prompt
3. Try to edit the name
4. Try to edit the description
5. Try to modify tools
6. Try to add MCPs

**Expected Result:**
- ✅ All fields are editable
- ✅ No "locked" or "restricted" warnings
- ✅ Changes save successfully

---

## ✅ Frontend Tests

### Test 4: Agent Avatar Display
**What to verify:** Agent avatars display correctly in all scenarios

**Test Cases:**

#### Case 4.1: New Agent with Default Icon
- Create new agent without custom icon
- **Expected:** Shows Adentic logo

#### Case 4.2: Existing Adentic Default Agent
- View the default Adentic agent
- **Expected:** Shows Adentic logo (even though DB might have 'bot')

#### Case 4.3: Custom Agent with Lucide Icon
- View agent with custom icon (e.g., 'rocket', 'bot', 'briefcase')
- **Expected:** Shows the selected Lucide icon

#### Case 4.4: Agent List View
- Open agent list/sidebar
- **Expected:** All agents show correct icons

---

### Test 5: Icon Editor Dialog
**What to verify:** Icon editor works correctly with Adentic logo

**Steps:**
1. Open a new agent with default Adentic logo
2. Click "Edit Icon" button
3. Verify the Adentic logo is pre-selected in the icon picker
4. Change to a different icon (e.g., 'rocket')
5. Save changes
6. Re-open icon editor
7. Change back to Adentic logo from the "Default Icon" section
8. Save changes

**Expected Result:**
- ✅ Adentic logo appears in "Default Icon" section at top
- ✅ Adentic logo is selected when agent has default icon
- ✅ Can switch between Adentic logo and Lucide icons
- ✅ Changes persist correctly

---

### Test 6: Icon Picker Component
**What to verify:** Icon picker shows all options correctly

**Steps:**
1. Open icon picker
2. Check "Default Icon" section at top
3. Check "Popular Icons" section
4. Search for an icon (e.g., "rocket")

**Expected Result:**
- ✅ "Default Icon" section visible with Adentic logo
- ✅ Popular icons section shows common icons
- ✅ Search works correctly
- ✅ All icons are clickable and selectable

---

## ✅ Integration Tests

### Test 7: Agent Creation via UI
**What to verify:** UI agent creation uses new defaults

**Steps:**
1. Click "Create New Agent" in UI
2. Enter name and description only
3. Don't select a custom icon
4. Save agent

**Expected Result:**
- ✅ Agent created successfully
- ✅ Shows Adentic logo
- ✅ Has 26 tools enabled
- ✅ Database has `icon_name = 'adentic-logo'`

---

### Test 8: Agent Creation via AI Tool
**What to verify:** AI-created agents use new defaults

**Steps:**
1. Ask the AI: "Create a new agent called 'Test Agent' that helps with research"
2. Approve the creation
3. Check the created agent

**Expected Result:**
- ✅ Agent created successfully
- ✅ Shows Adentic logo
- ✅ Has 26 tools enabled
- ✅ Success message mentions "Adentic Logo (default)"

---

### Test 9: Marketplace Template Installation
**What to verify:** Templates work with new icon system

**Test Cases:**

#### Case 9.1: Template with Custom Icon
- Install a template that has a custom icon defined
- **Expected:** Uses template's custom icon

#### Case 9.2: Template without Icon
- Install a template without icon definition
- **Expected:** Uses Adentic logo as default

---

### Test 10: Existing Agents
**What to verify:** Existing agents are not affected

**Steps:**
1. View existing agents created before these changes
2. Check their icons
3. Edit their configurations

**Expected Result:**
- ✅ Existing custom icons still display correctly
- ✅ No unexpected icon changes
- ✅ All existing functionality preserved

---

## ✅ Database Tests

### Test 11: Database Constraints
**What to verify:** No constraint violations occur

**SQL Checks:**
```sql
-- Check all agents have non-null icon_name
SELECT COUNT(*) FROM agents WHERE icon_name IS NULL;
-- Should return: 0

-- Check agents using new default
SELECT COUNT(*) FROM agents WHERE icon_name = 'adentic-logo';
-- Should return: > 0 (for newly created agents)

-- Check all agents
SELECT agent_id, name, icon_name, icon_color, icon_background FROM agents LIMIT 10;
```

**Expected Result:**
- ✅ No NULL icon_name values
- ✅ New agents have 'adentic-logo'
- ✅ Old agents retain their custom icons

---

## ✅ Edge Cases

### Test 12: Null/Empty Handling
**What to verify:** Null and empty values handled gracefully

**Test Cases:**
- Create agent with `icon_name = null` in API → Should save as 'adentic-logo'
- Create agent with `icon_name = ''` in API → Should save as 'adentic-logo'
- Edit agent and clear icon → Should revert to 'adentic-logo'

---

### Test 13: Backward Compatibility
**What to verify:** Old data still works

**Test Cases:**
- Agent with `icon_name = 'bot'` → Should show bot icon, not Adentic logo
- Agent with `icon_name = 'rocket'` → Should show rocket icon
- Default Adentic agent → Should show Adentic logo (special case)

---

## 🚨 Critical Failure Scenarios

### Scenario 1: Database Constraint Violation
**Symptom:** Error when creating agent: "icon_name violates not-null constraint"
**Cause:** Backend not setting 'adentic-logo' for null values
**Check:** Verify all three backend files use `or 'adentic-logo'` pattern

### Scenario 2: Wrong Icon Display
**Symptom:** Custom agents showing Adentic logo incorrectly
**Cause:** Frontend logic too broad
**Check:** Verify `isDefaultIcon` excludes `is_suna_default` agents

### Scenario 3: Icon Editor Not Working
**Symptom:** Opening icon editor shows wrong icon selected
**Cause:** State initialization incorrect
**Check:** Verify `useEffect` maps 'adentic-logo' correctly

### Scenario 4: Tool Count Wrong
**Symptom:** Agent shows "21/31 tools" instead of "26/26"
**Cause:** Config mismatch between files
**Check:** Verify `_get_default_agentpress_tools` and `SUNA_CONFIG` match

---

## ✅ Final Validation

Before deploying to production:

1. ✅ All automated tests pass
2. ✅ Backend tests (8/8) pass
3. ✅ Frontend tests (11/11) pass
4. ✅ Manual smoke tests completed
5. ✅ Database constraints verified
6. ✅ No TypeScript errors
7. ✅ No Python linter errors
8. ✅ Git status clean (no unintended changes)

---

## 📝 Post-Deployment Monitoring

After deployment, monitor for:

1. **Database Errors:** Check logs for constraint violations
2. **Frontend Errors:** Check browser console for React errors
3. **User Reports:** Monitor for icon display issues
4. **Agent Creation:** Verify new agents get correct defaults

---

## 🔄 Rollback Plan

If issues occur:

1. Revert commits (git log to find commit hash)
2. Database should be fine (no schema changes)
3. Clear browser cache for users
4. No data migration needed

---

## 📊 Success Metrics

After 24 hours:
- ✅ No new error logs related to agents or icons
- ✅ Agent creation rate unchanged or improved
- ✅ No user support tickets about icons
- ✅ All new agents have 26 tools enabled

---

**Last Updated:** 2025-10-30  
**Changes:** Agent icon defaults to Adentic logo, 26 tools enabled, Adentic agent editable

