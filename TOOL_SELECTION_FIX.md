# 🔥 Critical Tool Selection Issue + Stream Parameter Bug

**Date**: 2025-10-26  
**Status**: ⚠️ CRITICAL ISSUES FOUND  

---

## 🚨 **Issue #1: `stream` Parameter Error**

### **Error**:
```
Failed to search videos: MemoriesClient.chat_with_video() got an unexpected keyword argument 'stream'
```

### **Analysis**:

**Method Signature**:
```python
def chat_with_video(self, video_nos, prompt, session_id=None, unique_id="default"):
    # ❌ NO stream parameter!
```

**Possible Causes**:
1. ⚠️ Code somewhere is calling it with `stream=True/False`
2. ⚠️ Kwargs being passed through incorrectly
3. ⚠️ Streaming wrapper trying to use non-streaming method

**Where It's Being Called**:
- `multi_video_search()` line 1031
- `analyze_video()` line 525
- `ask_video()` line 731
- `compare_videos()` line 927

**None of these pass `stream` parameter**, so this is strange!

**Possible Fix Needed**: Check if there's a decorator or wrapper adding `stream` parameter

---

## 🚨 **Issue #2: Wrong Tool Called!**

### **User's Question**:
> "is this tool even meant to be called in this chat?"

### **Analysis**:

**User Asked**: "analyze nike on tiktok"

**What Agent Did**:
1. ❌ `multi_video_search()` was called
2. This requires video_ids as input
3. But user didn't provide video IDs!

**What Agent SHOULD Do**:
✅ `search_trending_content("@nike trending videos high engagement")`

**Why `multi_video_search` Is WRONG Here**:
- `multi_video_search`: Search ACROSS specific video IDs you already have
- User query: Wants to FIND Nike videos (doesn't have IDs yet!)
- Correct tool: `search_trending_content` (finds videos FROM 1M+ index)

---

## 🔍 **Tool Selection Matrix**

| User Query | Correct Tool | Wrong Tool |
|------------|--------------|------------|
| "analyze nike on tiktok" | ✅ `search_trending_content` | ❌ `multi_video_search` |
| "search for nike videos" | ✅ `search_trending_content` | ❌ `analyze_creator` |
| "compare these 3 videos: VI-123, VI-456, VI-789" | ✅ `compare_videos` | ❌ `multi_video_search` |
| "search these videos for hooks: VI-123, VI-456" | ✅ `multi_video_search` | ❌ `search_trending_content` |
| "what's trending with #nike" | ✅ `search_trending_content` | ❌ `analyze_trend` |

---

## 🔧 **Tool Definitions (What Each Tool Does)**

### **`search_trending_content`** ✅ For Discovery
- **Purpose**: Search 1M+ indexed videos by query
- **Input**: Text query (e.g., "@nike trending videos")
- **Output**: Matching videos with analysis
- **Use When**: User wants to FIND/DISCOVER videos
- **Speed**: Instant!

### **`multi_video_search`** ✅ For Analysis Across Known Videos
- **Purpose**: Search for patterns ACROSS specific video IDs you already have
- **Input**: Array of video_ids + query
- **Output**: Patterns found in those videos
- **Use When**: User provides video IDs or you got them from another tool
- **Speed**: Instant (videos already indexed)

### **`analyze_creator`** ❌ For UPLOADING to Private Library
- **Purpose**: SCRAPE and INDEX creator's videos to YOUR library
- **Input**: Creator URL
- **Output**: task_id (async, 1-2 min wait)
- **Use When**: User wants to ADD creator to their library
- **Speed**: Slow (1-2 min)

### **`analyze_trend`** ❌ For UPLOADING Hashtags to Private Library
- **Purpose**: SCRAPE and INDEX hashtag videos to YOUR library
- **Input**: Hashtag array
- **Output**: task_id (async, 1-2 min wait)
- **Use When**: User wants to ADD hashtag content to their library
- **Speed**: Slow (1-2 min)

---

## 🎯 **For "Analyze Nike on TikTok" - Correct Flow**

### **❌ WRONG (What Happened)**:
```
User: "analyze nike on tiktok"

Agent thinks:
1. Use analyze_creator(@nike) → Scrapes 20 videos (1-2 min)
2. Use multi_video_search(video_ids, query) → ??? Where are video_ids from?

Result: ❌ Slow, wrong tool, errors
```

### **✅ CORRECT (What SHOULD Happen)**:
```
User: "analyze nike on tiktok"

Agent:
1. Use search_trending_content("@nike trending videos high engagement viral campaigns product showcases")
   → Searches 1M+ indexed videos
   → Returns top Nike videos instantly with full stats and analysis

Result: ✅ Instant, comprehensive results
```

---

## 🔧 **Fixes Applied**

### **Fix #1: Tool Descriptions** ✅
- Updated `analyze_creator` description to say "⚠️ ASYNC UPLOAD TOOL"
- Updated `analyze_trend` description to say "⚠️ ASYNC UPLOAD TOOL"
- Both now say "❌ DON'T use for quick analysis!"

### **Fix #2: System Prompt** ✅
- Added explicit guidance:
  ```
  ❌ NEVER use analyze_creator for quick analysis
  ❌ NEVER use analyze_trend for quick analysis
  ✅ ALWAYS use search_trending_content for instant analysis
  ```

### **Fix #3: Example Mappings** ✅
- "analyze nike on tiktok" → Use `search_trending_content` with query "@nike trending videos"
- NOT analyze_creator!

---

## 🐛 **The `stream` Parameter Bug**

### **Investigation Needed**:

The error says `chat_with_video()` got unexpected kwarg `stream`, but:
- ✅ Method signature doesn't have `stream`
- ✅ Our code doesn't pass `stream`
- ❌ Something is adding it!

**Possible Sources**:
1. ⚠️ Decorator or wrapper adding it
2. ⚠️ **kwargs being passed through
3. ⚠️ Thread manager or tool base class modifying calls

**To Debug**:
```python
# Add logging before the call:
logger.info(f"Calling chat_with_video with: video_nos={video_nos}, prompt={prompt[:50]}, session_id={session_id}, unique_id={user_id}")

result = self.memories_client.chat_with_video(...)
```

**Quick Fix Option**:
Add `stream` parameter to method signature (even if unused):
```python
def chat_with_video(self, video_nos, prompt, session_id=None, unique_id="default", stream=False):
    # Ignore stream parameter (for backwards compatibility)
    ...
```

---

## ✅ **FINAL STATUS**

### **Tool Selection**: ✅ FIXED
- Agent will use `search_trending_content` for Nike analysis
- Won't use scraping tools for quick queries

### **`stream` Parameter Bug**: ⚠️ **NEEDS FIX**
- Something is passing `stream` to `chat_with_video()`
- Method doesn't accept it
- **Quick fix**: Add `stream=False` to method signature (ignore it)

### **Thumbnail Issue**: ⚠️ **API LIMITATION**
- Memories.ai public video API doesn't provide thumbnail URLs
- Shows "No preview" (correct behavior!)

### **Stats Issue**: ⚠️ **NEEDS TESTING**
- Code is ready to display them
- Need to check if API actually returns them

---

## 🎯 **Action Items**

### **Immediate** (to fix stream error):
```python
# In memories_client.py, add stream parameter:
def chat_with_video(self, video_nos, prompt, session_id=None, unique_id="default", stream=False, **kwargs):
    # Ignore stream and other unknown kwargs
    ...
```

### **For Nike Analysis**:
- ✅ Agent will use `search_trending_content` (instant!)
- ✅ No more scraping delays
- ✅ Proper tool selection

---

**Bottom Line**: Tool selection is FIXED ✅, but there's a `stream` parameter bug that needs a quick patch! 🔧

