#!/bin/bash
# Test script to run on AWS server
# Usage: ssh ubuntu@your-aws-ip 'bash -s' < test_on_aws.sh

echo "=============================================="
echo "MEMORIES.AI TOOL DIAGNOSTIC ON AWS"
echo "=============================================="

cd /home/ubuntu/agentic-suite/backend

echo -e "\n1. Testing tool import and schema generation..."
python3 << 'PYEOF'
import sys
sys.path.insert(0, '.')

try:
    from core.tools.memories_tool import MemoriesTool
    from core.agentpress.tool import Tool
    
    # Check class hierarchy
    print(f"✅ MemoriesTool is Tool subclass: {issubclass(MemoriesTool, Tool)}")
    
    # Create instance with mock thread manager
    class MockTM:
        agent_config = {'account_id': 'test-account'}
    
    tool = MemoriesTool(thread_manager=MockTM())
    
    # Check schemas
    schemas = tool.get_schemas()
    print(f"✅ Tool initialized with {len(schemas)} methods")
    
    if len(schemas) == 0:
        print("❌ NO SCHEMAS - Decorators not working!")
        import inspect
        print("\nChecking methods for tool_schemas attribute:")
        for name, method in inspect.getmembers(tool, predicate=inspect.ismethod):
            if not name.startswith('_') and 'response' not in name:
                has_attr = hasattr(method, 'tool_schemas')
                print(f"  {name}: {'✅' if has_attr else '❌'} has tool_schemas")
    else:
        print("\nRegistered methods:")
        for method_name in sorted(schemas.keys()):
            schema_count = len(schemas[method_name])
            print(f"  - {method_name} ({schema_count} schemas)")
        
        # Try to get OpenAPI schemas for LLM
        print("\n2. Testing OpenAPI schema format...")
        for method_name, schema_list in list(schemas.items())[:2]:  # Test first 2
            for schema in schema_list:
                openapi_schema = schema.schema
                print(f"\n  Method: {method_name}")
                print(f"    - Type: {openapi_schema['type']}")
                print(f"    - Function name: {openapi_schema['function']['name']}")
                print(f"    - Description length: {len(openapi_schema['function']['description'])}")
                
                # Check for problematic types
                params = openapi_schema['function']['parameters']
                for param_name, param_def in params.get('properties', {}).items():
                    param_type = param_def.get('type')
                    if param_type == 'array':
                        items = param_def.get('items', {})
                        print(f"    - Param '{param_name}': array of {items.get('type', 'unknown')}")

except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
PYEOF

echo -e "\n3. Checking if tool is registered in tool_groups.py..."
grep -c '"memories_tool"' core/utils/tool_groups.py

echo -e "\n4. Checking recent backend logs for tool registration..."
sudo journalctl -u adentic-backend --since "5 minutes ago" | grep -i "video\|memories" | tail -20

echo -e "\n=============================================="
echo "DIAGNOSTIC COMPLETE"
echo "=============================================="

