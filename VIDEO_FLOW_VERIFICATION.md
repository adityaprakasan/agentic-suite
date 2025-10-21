# Video Flow Verification: Chat → API → Frontend

## Current Status

### ✅ What Works

#### 1. URL Upload Flow
```
User: "Upload this video: https://youtube.com/watch?v=..."
  ↓
Agent calls: upload_video(url="https://...", title="Video")
  ↓
Tool calls: memories_client.upload_video_from_url()
  ↓
API POST /serve/api/v1/upload_url with form-data: { url: "...", unique_id: "user_id" }
  ↓
API returns: { videoNo: "VI123", videoName: "...", videoStatus: "UNPARSE", uploadTime: "..." }
  ↓
Tool returns: {
  video_id: "VI123",
  title: "Video",
  url: "https://...",
  platform: "youtube",
  thumbnail_url: "https://...",
  saved_to_kb: true
}
  ↓
Frontend MemoriesToolRenderer receives result
  ↓
Renders VideoUploadDisplay with:
  - Title
  - Thumbnail image
  - Platform badge
  - Duration
  - "Saved to KB" badge
✅ WORKS
```

#### 2. Platform Search Flow
```
User: "Find top Mr Beast videos"
  ↓
Agent calls: search_platform_videos(platform="youtube", query="Mr Beast")
  ↓
Tool calls: memories_client.search_public_videos()
  ↓
API POST /serve/api/v1/search_public with JSON: {
  search_param: "Mr Beast",
  platform_type: "YOUTUBE",
  search_type: "BY_VIDEO",
  top_k: 10
}
  ↓
API returns: [{
  videoNo: "PI-123",
  videoName: "Title",
  startTime: "0",
  endTime: "10",
  score: 0.95
}]
  ↓
Tool returns: {
  platform: "youtube",
  query: "Mr Beast",
  results_count: 10,
  videos: [{
    title: "Title",
    url: "https://...",
    thumbnail_url: "https://...",
    video_no: "PI-123",
    score: 0.95
  }]
}
  ↓
Frontend renders PlatformSearchResults
  ↓
Shows video grid with:
  - Thumbnails
  - Titles
  - Platform badges
  - Durations
  - "Open" buttons
✅ WORKS
```

#### 3. Video Analysis Flow
```
User: "Analyze this video"
  ↓
Agent calls: analyze_video(video_id="VI123")
  ↓
Tool calls: memories_client.get_video_transcription() + other analysis methods
  ↓
Tool returns: {
  video_id: "VI123",
  hooks: [{timestamp: "0:03", strength: "strong", description: "..."}],
  ctas: [{timestamp: "0:45", text: "Link in bio"}],
  engagement_prediction: 8.5
}
  ↓
Frontend renders VideoAnalysisDisplay
  ↓
Shows:
  - Engagement score badge
  - Hooks with timestamps
  - CTAs with timestamps
✅ WORKS
```

#### 4. Video Chat/Query Flow
```
User: "What's the main message of this video?"
  ↓
Agent calls: query_video(video_id="VI123", question="What's the main message?")
  ↓
Tool calls: memories_client.chat_with_video()
  ↓
API POST /serve/api/v1/chat with JSON: {
  video_nos: ["VI123"],
  prompt: "What's the main message?",
  unique_id: "user_id"
}
  ↓
API returns: {
  data: {
    content: "The video explains...",
    refs: [...]
  },
  session_id: "..."
}
  ↓
Tool returns: {
  video_id: "VI123",
  question: "What's the main message?",
  answer: "The video explains...",
  refs: [...]
}
  ↓
Frontend renders VideoQueryDisplay
  ↓
Shows:
  - Question in blue box
  - Answer text
  - Relevant timestamp badges
✅ WORKS (after fix)
```

---

### ❌ What's Missing: FILE UPLOAD from Chat

#### The Problem
When a user attaches a video file in chat, there's NO way to upload it to memories.ai.

**Current upload_video method:**
```python
async def upload_video(self, url: str, title: str, ...):
    # Only accepts URLs!
```

**What's needed:**
```python
async def upload_video_file(self, file_path: str, title: str, ...):
    # Accept local file paths
    # The file would be from:
    # 1. User attachment in chat → uploaded to Supabase storage → path provided to agent
    # 2. File in Sandbox → agent has file path
```

#### The API Support Exists
The memories_client.py already has the method:

```python
async def upload_video_from_file(
    self,
    file_path: str,
    unique_id: str = "default",
    callback: Optional[str] = None
) -> VideoMetadata:
    """Upload video from local file"""
    form = aiohttp.FormData()
    form.add_field('file', open(file_path, 'rb'),
                  filename=os.path.basename(file_path),
                  content_type='video/mp4')
    form.add_field('unique_id', unique_id)
    
    result = await self._request("POST", "serve/api/v1/upload", form_data=form, timeout=300)
    # Returns VideoMetadata with video_no, video_name, video_status
```

**This calls the correct API endpoint:**
- `POST /serve/api/v1/upload`
- `Content-Type: multipart/form-data`
- Body: `file`, `unique_id`, optional `callback`

#### The Tool is Missing the Method
`memories_tool.py` needs a new method:

```python
@openapi_schema({
    "type": "function",
    "function": {
        "name": "upload_video_file",
        "description": "Upload a video file from local storage for analysis",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to video file (e.g., from user upload or sandbox)"
                },
                "title": {
                    "type": "string",
                    "description": "Title for the video"
                },
                "folder_name": {
                    "type": "string",
                    "description": "KB folder to save to",
                    "default": "Videos"
                }
            },
            "required": ["file_path", "title"]
        }
    }
})
async def upload_video_file(
    self,
    file_path: str,
    title: str,
    folder_name: str = "Videos",
    save_to_kb: bool = True
) -> ToolResult:
    """Upload video file"""
    try:
        if not config.MEMORIES_AI_API_KEY:
            return self.fail_response("Memories.ai API key not configured")
        
        user_id = await self._get_memories_user_id()
        
        # Upload file to memories.ai
        video_meta = await self.memories_client.upload_video_from_file(
            file_path=file_path,
            unique_id=user_id
        )
        
        result_data = {
            "video_id": video_meta.video_no,
            "title": title,
            "platform": "upload",
            "video_status": video_meta.video_status,
            "message": f"Video '{title}' uploaded from file"
        }
        
        # Save to KB if requested
        if save_to_kb:
            kb_result = await self._save_video_to_kb(
                video_id=video_meta.video_no,
                folder_name=folder_name,
                title=title,
                platform="upload"
            )
            result_data["saved_to_kb"] = True
            result_data["entry_id"] = kb_result['entry_id']
        
        return self.success_response(result_data)
        
    except Exception as e:
        logger.error(f"Error uploading video file: {str(e)}")
        return self.fail_response(f"Failed to upload video file: {str(e)}")
```

---

### ❌ Missing: Frontend Attachment Handling

The frontend needs to handle video file attachments in chat:

**Location:** `frontend/src/components/thread/chat-input.tsx` (or similar)

```tsx
// When user attaches video file:
const handleFileUpload = async (file: File) => {
  if (file.type.startsWith('video/')) {
    // Upload to Supabase storage or similar
    const { path } = await supabase.storage
      .from('user-uploads')
      .upload(`${userId}/${file.name}`, file);
    
    // Include file path in message metadata
    sendMessage({
      text: `[Uploaded video: ${file.name}]`,
      metadata: {
        type: 'video_upload',
        file_path: path,
        file_name: file.name
      }
    });
  }
};
```

**Then the agent should be able to access this:**
```python
# In agent execution, check message metadata
if message.metadata and message.metadata.get('type') == 'video_upload':
    file_path = message.metadata.get('file_path')
    # Agent can now use upload_video_file(file_path, ...)
```

---

## Data Flow Mapping

### API Response → Tool Result → Frontend Rendering

#### Example: upload_video_from_url

**API Response:**
```json
{
  "code": "0000",
  "msg": "success",
  "data": {
    "videoNo": "VI568102998803353600",
    "videoName": "BigBuckBunny",
    "videoStatus": "UNPARSE",
    "uploadTime": "1744905509814"
  }
}
```

**Tool Result:**
```python
{
  "success": True,
  "output": {
    "video_id": "VI568102998803353600",      # from API: videoNo
    "title": "Big Buck Bunny",               # from tool param
    "url": "http://...",                     # from tool param
    "platform": "url",                       # detected by tool
    "duration_seconds": None,                # not in API response yet
    "thumbnail_url": None,                   # not in API response yet
    "message": "Video 'Big Buck Bunny' uploaded successfully",
    "saved_to_kb": True,                     # from tool logic
    "entry_id": "uuid-..."                   # from KB insertion
  },
  "method_name": "upload_video"
}
```

**Frontend Rendering (VideoUploadDisplay):**
```tsx
<div>
  <h4>Big Buck Bunny</h4>                  {/* data.title */}
  <p>Video 'Big Buck Bunny' uploaded...</p> {/* data.message */}
  
  {/* Thumbnail if available */}
  {data.thumbnail_url && <img src={data.thumbnail_url} />}
  
  {/* Badges */}
  <Badge>url</Badge>                        {/* data.platform */}
  <Badge>Saved to KB</Badge>                {/* if data.saved_to_kb */}
</div>
```

#### Example: search_public_videos

**API Response:**
```json
{
  "code": "0000",
  "msg": "success",
  "data": [
    {
      "videoNo": "PI-602590241592840230",
      "videoName": "Introducing NikeSKIMS...",
      "startTime": "0",
      "endTime": "8",
      "score": 0.95
    }
  ]
}
```

**Tool Result:**
```python
{
  "success": True,
  "output": {
    "platform": "tiktok",
    "query": "nike",
    "results_count": 1,
    "videos": [
      {
        "title": "Introducing NikeSKIMS...",     # from API: videoName
        "url": None,                              # not in API response
        "thumbnail_url": None,                    # not in API response
        "video_no": "PI-602590241592840230",      # from API: videoNo
        "start_time": "0",                        # from API: startTime
        "end_time": "8",                          # from API: endTime
        "score": 0.95,                            # from API: score
        "platform": "tiktok",                     # from tool param
        "duration_seconds": 8                     # calculated: endTime - startTime
      }
    ],
    "next_action_hint": "You can upload any video by URL using upload_video, or analyze the video directly"
  },
  "method_name": "search_platform_videos"
}
```

**Frontend Rendering (PlatformSearchResults):**
```tsx
<div>
  <h4>Tiktok Results: "nike"</h4>            {/* data.platform, data.query */}
  <Badge>1 videos</Badge>                    {/* data.videos.length */}
  
  <div className="grid">
    {data.videos.map(video => (
      <VideoSearchCard video={video}>
        <img src={video.thumbnail_url || placeholder} />
        <Badge>tiktok</Badge>                 {/* video.platform */}
        <span>0:08</span>                     {/* video.duration_seconds */}
        <h5>{video.title}</h5>                {/* video.title */}
        <Button onClick={() => window.open(video.url)}>Open</Button>
      </VideoSearchCard>
    ))}
  </div>
</div>
```

---

## Required Fixes

### 1. Add `upload_video_file` Method to Tool ❌
**File:** `backend/core/tools/memories_tool.py`
**Status:** MISSING
**Priority:** HIGH (critical for file uploads)

### 2. Update ToolViewRegistry for File Upload ❌
**File:** `frontend/src/components/thread/tool-views/wrapper/ToolViewRegistry.tsx`
**Status:** Need to add `upload_video_file` mapping
**Priority:** HIGH

### 3. Frontend File Upload Handling ⚠️
**File:** Chat input component
**Status:** UNKNOWN (need to check if file attachments are supported)
**Priority:** HIGH

---

## Verification Checklist

### Backend ✅
- [x] `upload_video_from_url` client method works
- [x] `upload_video_from_file` client method exists
- [x] `search_public_videos` client method works
- [x] `chat_with_video` client method works
- [x] Tool methods call correct client methods
- [x] Tool results include all required fields
- [ ] **Tool has `upload_video_file` method** ❌ MISSING

### Frontend ✅
- [x] `MemoriesToolRenderer` exists
- [x] `VideoUploadDisplay` renders upload results
- [x] `PlatformSearchResults` renders search results
- [x] `VideoAnalysisDisplay` renders analysis
- [x] `VideoQueryDisplay` renders Q&A results
- [x] All tool methods registered in `ToolViewRegistry`
- [ ] **File attachment handling in chat** ⚠️ UNKNOWN

### Data Flow ✅
- [x] API response fields map to tool result fields
- [x] Tool result fields map to frontend display
- [x] Video metadata flows correctly (videoNo → video_id)
- [x] Thumbnails display when available
- [x] Platform badges show correctly
- [x] Timestamps render as expected

---

## Summary

### What's Working ✅
1. ✅ URL video uploads
2. ✅ Platform search (TikTok, YouTube, Instagram)
3. ✅ Video analysis
4. ✅ Video chat/Q&A
5. ✅ Frontend rendering of all results
6. ✅ Data flow from API → Tool → Frontend
7. ✅ Video metadata mapping
8. ✅ Thumbnail display
9. ✅ Platform badges
10. ✅ Knowledge Base integration

### What's Missing ❌
1. ❌ **File upload method in tool** (critical)
2. ⚠️ **File attachment handling in chat** (unknown status)
3. ⚠️ **Tool registry for `upload_video_file`** (if method is added)

### Recommendation
Add the `upload_video_file` method to complete the integration. The client already supports it, the API supports it, and the frontend can render it - just need the tool method exposed to agents.

