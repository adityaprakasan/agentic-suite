#!/usr/bin/env python3
"""
Verification script to check all memories_tool.py methods
against memories_client.py available methods
"""

import re

# Read memories_tool.py
with open('backend/core/tools/memories_tool.py', 'r') as f:
    tool_content = f.read()

# Read memories_client.py
with open('backend/core/services/memories_client.py', 'r') as f:
    client_content = f.read()

# Extract all async def methods from memories_tool.py
tool_methods = re.findall(r'async def ([a-z_]+)\(', tool_content)
tool_methods = [m for m in tool_methods if not m.startswith('_')]  # Remove private methods

# Extract all client method calls
client_calls = re.findall(r'self\.memories_client\.([a-z_]+)\(', tool_content)

# Extract available client methods
client_methods = re.findall(r'async def ([a-z_]+)\(', client_content)

print("=" * 80)
print("🔍 MEMORIES.AI METHOD VERIFICATION")
print("=" * 80)

print(f"\n📋 Tool Methods Found: {len(tool_methods)}")
for method in sorted(set(tool_methods)):
    print(f"   - {method}")

print(f"\n📞 Client Calls Made: {len(set(client_calls))}")
for call in sorted(set(client_calls)):
    print(f"   - {call}")

print(f"\n✅ Available Client Methods: {len(client_methods)}")
for method in sorted(set(client_methods)):
    print(f"   - {method}")

print("\n" + "=" * 80)
print("❌ INVALID CLIENT CALLS (methods that DON'T exist):")
print("=" * 80)

invalid_calls = []
for call in set(client_calls):
    if call not in client_methods:
        invalid_calls.append(call)
        print(f"   ❌ self.memories_client.{call}() - DOES NOT EXIST!")
        
        # Suggest replacement
        suggestions = []
        if 'transcript' in call:
            suggestions.append('get_video_transcription')
            suggestions.append('get_audio_transcription')
        if 'search' in call:
            suggestions.append('search_private_library')
            suggestions.append('search_public_videos')
        if 'analyze' in call:
            suggestions.append('chat_with_video')
        if 'reid' in call:
            suggestions.append('NOT AVAILABLE - requires special API key')
        
        if suggestions:
            print(f"      💡 Suggested: {', '.join(suggestions)}")

if not invalid_calls:
    print("   ✅ ALL CLIENT CALLS ARE VALID!")

print("\n" + "=" * 80)
print(f"✅ VALID: {len(set(client_calls)) - len(invalid_calls)}")
print(f"❌ INVALID: {len(invalid_calls)}")
print("=" * 80)

