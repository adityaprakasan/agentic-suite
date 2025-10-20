import asyncio
import sys
sys.path.insert(0, '.')

from core.utils.config import config
from core.tools.memories_tool import MemoriesTool
from core.agentpress.thread_manager import ThreadManager

async def test_tool():
    print(f"✅ MEMORIES_AI_API_KEY present: {bool(config.MEMORIES_AI_API_KEY)}")
    print(f"   Key (first 10 chars): {config.MEMORIES_AI_API_KEY[:10] if config.MEMORIES_AI_API_KEY else 'None'}...")
    
    # Mock thread manager
    class MockThreadManager:
        def __init__(self):
            self.agent_config = {'account_id': 'test'}
            self.tools = []
        
        def add_tool_instance(self, tool):
            self.tools.append(tool)
    
    # Try to instantiate the tool
    try:
        tm = MockThreadManager()
        tool = MemoriesTool(thread_manager=tm)
        schemas = tool.get_schemas()
        print(f"\n✅ MemoriesTool initialized successfully")
        print(f"   Number of methods: {len(schemas)}")
        print(f"   Methods available:")
        for schema in schemas:
            method_name = schema['function']['name']
            print(f"      - {method_name}")
    except Exception as e:
        print(f"\n❌ Failed to initialize MemoriesTool: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tool())
