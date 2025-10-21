#!/usr/bin/env python3
"""
Comprehensive test for memories.ai integration
Run this on AWS: cd /home/ubuntu/agentic-suite/backend && python3 ../comprehensive_test.py
"""

import sys
import os
sys.path.insert(0, '/home/ubuntu/agentic-suite/backend')

print("="*80)
print("COMPREHENSIVE MEMORIES.AI DIAGNOSTIC")
print("="*80)

# Test 1: Check if code is up to date
print("\n1. Checking git status...")
os.chdir('/home/ubuntu/agentic-suite')
os.system("git log --oneline -1")
print("   Expected: 2f8a3a17 or later")

# Test 2: Check if super().__init__() is present
print("\n2. Checking super().__init__() in MemoriesTool...")
with open('/home/ubuntu/agentic-suite/backend/core/tools/memories_tool.py', 'r') as f:
    content = f.read()
    if 'super().__init__()' in content:
        print("   ✅ super().__init__() present")
    else:
        print("   ❌ super().__init__() MISSING")

# Test 3: Import and instantiate tool
print("\n3. Testing tool import and instantiation...")
os.chdir('/home/ubuntu/agentic-suite/backend')
try:
    from core.tools.memories_tool import MemoriesTool
    from core.agentpress.tool import Tool
    
    print(f"   ✅ MemoriesTool imports successfully")
    print(f"   ✅ Is Tool subclass: {issubclass(MemoriesTool, Tool)}")
    
    # Create instance
    class MockTM:
        agent_config = {'account_id': 'test'}
    
    tool = MemoriesTool(thread_manager=MockTM())
    print(f"   ✅ Tool instantiated successfully")
    
    # Check schemas
    schemas = tool.get_schemas()
    print(f"   ✅ Tool has {len(schemas)} methods")
    
    if len(schemas) == 0:
        print("   ❌ NO SCHEMAS - Tool broken!")
        sys.exit(1)
    
    print("\n   Methods registered:")
    for name in sorted(schemas.keys()):
        print(f"      - {name}")
    
    # Test one schema
    print("\n4. Testing search_platform_videos schema...")
    if 'search_platform_videos' in schemas:
        schema_obj = schemas['search_platform_videos'][0]
        openapi = schema_obj.schema
        func_def = openapi['function']
        print(f"   ✅ Function name: {func_def['name']}")
        print(f"   ✅ Description: {func_def['description'][:100]}...")
        
        # Check for problematic types
        params = func_def['parameters']['properties']
        for pname, pdef in params.items():
            ptype = pdef.get('type')
            if ptype == 'array':
                items_type = pdef.get('items', {}).get('type', 'unknown')
                print(f"   ⚠️  Param '{pname}' is array of {items_type}")
            else:
                print(f"   ✅ Param '{pname}' is {ptype}")
    else:
        print("   ❌ search_platform_videos NOT FOUND")
        sys.exit(1)
    
    # Test analyze_trend (has array parameter)
    print("\n5. Testing analyze_trend schema (has array parameter)...")
    if 'analyze_trend' in schemas:
        schema_obj = schemas['analyze_trend'][0]
        openapi = schema_obj.schema
        func_def = openapi['function']
        params = func_def['parameters']['properties']
        
        if 'hashtags' in params:
            htag_def = params['hashtags']
            print(f"   ✅ hashtags param found")
            print(f"   ✅ Type: {htag_def['type']}")
            print(f"   ✅ Items: {htag_def.get('items', {})}")
            
            # Check if items is properly formatted
            items = htag_def.get('items')
            if isinstance(items, dict) and items.get('type') == 'string':
                print("   ✅ Array items properly defined")
            else:
                print(f"   ❌ Array items malformed: {items}")
        else:
            print("   ❌ hashtags parameter not found")
    
except Exception as e:
    print(f"   ❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 6: Check tool_groups.py
print("\n6. Checking tool_groups.py...")
count = os.popen('grep -c "memories_tool" /home/ubuntu/agentic-suite/backend/core/utils/tool_groups.py').read().strip()
print(f"   Found {count} occurrences of 'memories_tool'")
if int(count) >= 1:
    print("   ✅ memories_tool in tool_groups.py")
else:
    print("   ❌ memories_tool NOT in tool_groups.py")

# Test 7: Check agent configuration
print("\n7. Checking agent configurations in database...")
print("   Run this SQL in Supabase to check:")
print("   SELECT agent_id, name, agentpress_tools->'memories_tool' FROM agents;")

# Test 8: Check logs
print("\n8. Checking recent backend logs for tool registration...")
os.system("sudo journalctl -u adentic-backend --since '5 minutes ago' | grep -i 'video\\|memories' | tail -10")

print("\n" + "="*80)
print("DIAGNOSTIC COMPLETE")
print("="*80)
print("\nNext steps:")
print("1. If super().__init__() missing: git pull and restart")
print("2. If schemas empty: Tool decorators not working")
print("3. If agent config missing: Enable tool in UI and save")
print("4. If no registration log: Tool crashing during registration")

