#!/usr/bin/env python3
"""Test direct access to basejump.accounts with memories_user_id"""

import asyncio
import os
from supabase import create_client, Client

async def test_accounts_access():
    """Test if we can access basejump.accounts.memories_user_id"""
    
    # Get Supabase credentials from env
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return
    
    print(f"📡 Connecting to: {supabase_url}")
    
    # Create client
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print("\n🧪 Test 1: Query basejump.accounts without schema()")
    try:
        result = supabase.table('accounts').select('id, memories_user_id').limit(1).execute()
        print(f"✅ Success (should fail): {result.data}")
    except Exception as e:
        print(f"❌ Expected error: {e}")
    
    print("\n🧪 Test 2: Query basejump.accounts WITH schema()")
    try:
        result = supabase.schema('basejump').table('accounts').select('id, memories_user_id').limit(1).execute()
        print(f"✅ Success: {len(result.data)} rows")
        if result.data:
            print(f"   First row: id={result.data[0].get('id')}, memories_user_id={result.data[0].get('memories_user_id')}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n🧪 Test 3: Check if column exists")
    try:
        # Use RPC to query information_schema
        result = supabase.rpc('exec_sql', {
            'query': """
                SELECT column_name, data_type 
                FROM information_schema.columns
                WHERE table_schema = 'basejump'
                  AND table_name = 'accounts'
                  AND column_name = 'memories_user_id'
            """
        }).execute()
        print(f"✅ Column check: {result.data}")
    except Exception as e:
        print(f"⚠️  RPC not available (normal): {e}")
    
    print("\n🧪 Test 4: Try UPDATE with schema()")
    try:
        # Get first account
        accounts = supabase.schema('basejump').table('accounts').select('id').limit(1).execute()
        if accounts.data:
            test_id = accounts.data[0]['id']
            print(f"   Testing with account: {test_id}")
            
            # Try update
            result = supabase.schema('basejump').table('accounts').update({
                'memories_user_id': 'test_12345'
            }).eq('id', test_id).execute()
            
            print(f"✅ Update success: {result.data}")
        else:
            print("⚠️  No accounts found to test")
    except Exception as e:
        print(f"❌ Update error: {e}")

if __name__ == "__main__":
    asyncio.run(test_accounts_access())


