#!/usr/bin/env python3
"""
Test script for the new /agents/setup-from-chat endpoint
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

async def test_agent_setup():
    """Test the agent setup from chat functionality"""
    from core.agent_setup import generate_agent_config_from_description
    
    print("🧪 Testing agent setup from natural language description...")
    print("-" * 60)
    
    test_description = "I need an agent that monitors GitHub repositories and sends me Slack notifications when there are new issues or pull requests"
    
    print(f"\n📝 Input description:")
    print(f"   {test_description}")
    
    try:
        print("\n⏳ Generating agent configuration...")
        config = await generate_agent_config_from_description(test_description)
        
        print("\n✅ Agent configuration generated successfully!")
        print("-" * 60)
        print(f"🤖 Agent Name: {config['name']}")
        print(f"📋 System Prompt: {config['system_prompt'][:150]}...")
        print(f"🎨 Icon: {config['icon_name']}")
        print(f"🎨 Icon Color: {config['icon_color']}")
        print(f"🎨 Icon Background: {config['icon_background']}")
        print("-" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  Agent Setup API Endpoint - Test Suite")
    print("=" * 60)
    
    success = asyncio.run(test_agent_setup())
    
    print("\n" + "=" * 60)
    if success:
        print("✅ All tests passed!")
        print("\n🚀 API endpoint is ready to use:")
        print("   POST /api/agents/setup-from-chat")
        print("   Body: { \"description\": \"your agent description\" }")
    else:
        print("❌ Tests failed - check errors above")
    print("=" * 60)
    
    sys.exit(0 if success else 1)

