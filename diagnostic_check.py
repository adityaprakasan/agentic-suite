"""Full diagnostic of MemoriesTool"""
import sys
sys.path.insert(0, 'backend')

print("=" * 80)
print("MEMORIES.AI TOOL DIAGNOSTIC")
print("=" * 80)

# 1. Check if code has super().__init__()
print("\n1. Checking MemoriesTool.__init__()...")
with open('backend/core/tools/memories_tool.py', 'r') as f:
    content = f.read()
    if 'super().__init__()' in content:
        print("   ✅ super().__init__() present")
    else:
        print("   ❌ super().__init__() MISSING")

# 2. Check tool_groups.py has memories_tool
print("\n2. Checking tool_groups.py registration...")
with open('backend/core/utils/tool_groups.py', 'r') as f:
    content = f.read()
    if '"memories_tool"' in content:
        print("   ✅ memories_tool in TOOL_GROUPS")
        # Count methods
        import re
        matches = re.findall(r'name="(\w+)"', content[content.find('"memories_tool"'):content.find('"memories_tool"')+3000])
        print(f"   ✅ Found {len(matches)} methods registered")
    else:
        print("   ❌ memories_tool NOT in TOOL_GROUPS")

# 3. Check for type errors in schemas
print("\n3. Checking for type mismatches in openapi_schema...")
import re
schema_blocks = re.findall(r'@openapi_schema\(\{[^}]+\}\)', content, re.DOTALL)
print(f"   Found {len(schema_blocks)} @openapi_schema decorators")

# Check for common type issues
for i, block in enumerate(schema_blocks[:3], 1):  # Check first 3
    if '"type": "array"' in block and 'items' in block:
        print(f"   Schema {i}: Has array type (potential issue)")
    
# 4. Check analyze_trend method specifically
print("\n4. Checking analyze_trend method (uses array parameter)...")
if 'def analyze_trend' in content:
    trend_start = content.find('def analyze_trend')
    trend_section = content[trend_start-500:trend_start+1000]
    
    if '"type": "array"' in trend_section:
        print("   ✅ analyze_trend has array parameter")
        if '"items": {"type": "string"}' in trend_section or '"items": {\\n                        "type": "string"' in trend_section:
            print("   ✅ Array items type defined")
        else:
            print("   ⚠️  Array items type might be malformed")

# 5. Check for string concatenation bugs
print("\n5. Scanning for string concatenation issues...")
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if '+' in line and ('str(' in line or 'f"' in line or "f'" in line):
        if 'hashtags' in line.lower() or 'list' in line.lower():
            print(f"   ⚠️  Line {i}: {line.strip()[:80]}")

print("\n" + "=" * 80)
print("DIAGNOSTIC COMPLETE")
print("=" * 80)
