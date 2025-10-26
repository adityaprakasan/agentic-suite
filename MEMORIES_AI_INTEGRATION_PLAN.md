# 🎬 Memories.ai Integration Analysis & Planning Document

**Date**: 2025-10-25  
**Status**: Planning Phase - NO CHANGES YET  
**Repository**: agentic-suite

---

## 📊 Current Implementation Status

### ✅ What's Already Implemented (30 Tools)

The backend has excellent coverage of Memories.ai APIs:

#### Upload APIs (All Working ✅)
1. **upload_video** - Upload from URL (direct streamable URL)
2. **upload_video_file** - Upload from local file
3. **Platform URLs (Private)** - `upload_from_platform_urls` (TikTok/YouTube/Instagram)
4. **Platform URLs (Public)** - `upload_from_platform_urls_public`
5. **Creator URLs (Private)** - `upload_from_creator_url` (e.g., @nike)
6. **Creator URLs (Public)** - `upload_from_creator_url_public`
7. **Hashtag Upload (Private)** - `upload_from_hashtag` (e.g., #Nike)
8. **Hashtag Upload (Public)** - `upload_from_hashtag_public`
9. **upload_image** - Upload images with metadata (camera, GPS, datetime)

#### Search APIs (Working ✅)
10. **search_platform_videos** - Search 1M+ indexed videos (TikTok/YouTube/Instagram)
11. **search_trending_content** - Video Marketer with AI analysis
12. **search_in_video** - Find moments within a video
13. **search_similar_images** - Find visually similar content (private/public)
14. **search_audio** - Search audio transcripts (private/public)
15. **search_clips_by_image** - Find video moments matching an image

#### Chat APIs (Working ✅)
16. **analyze_video** - AI-powered video analysis with hooks/CTAs
17. **query_video** - Q&A with a specific video
18. **compare_videos** - Side-by-side comparison
19. **multi_video_search** - Analyze multiple videos simultaneously
20. **chat_with_media** - Chat with personal library (videos + images)
21. **get_session_history** - Retrieve full conversation history

#### Transcription APIs (Working ✅)
22. **get_transcript** - Video transcription (visual + audio)
23. **get_audio_transcript** - Audio-only transcription
24. **update_transcription** - Regenerate transcription with custom prompt
25. **get_video_summary** - Generate chapters or topic summaries

#### Utils APIs (Working ✅)
26. **list_my_videos** - List videos with filtering
27. **list_my_images** - List uploaded images
28. **get_video_details** - Get full video metadata (duration, fps, resolution)
29. **delete_videos** - Delete videos from library
30. **download_video_file** - Download video to sandbox
31. **check_task_status** - Monitor async upload tasks
32. **list_video_chat_sessions** - List Video Chat sessions
33. **list_trending_sessions** - List Video Marketer sessions

#### Advanced APIs (Partially Working ⚠️)
34. **human_reid** - Human re-identification (basic implementation)
35. **analyze_creator** - Analyze creator's content strategy
36. **analyze_trend** - Trend analysis across videos

---

## ❌ What's Missing from Documentation

### 1. **Caption & Human ReID APIs** (security.memories.ai) 🔒

**Status**: NOT IMPLEMENTED  
**Impact**: HIGH - Premium feature for advanced video understanding  
**Base URL**: `https://security.memories.ai` (different from main API)

#### Missing Endpoints:
- **POST /v1/understand/upload** - Video Caption (upload by URL)
- **POST /v1/understand/uploadFile** - Video Caption (upload by file)
- **POST /v1/understand/uploadImg** - Image Caption (upload by URL)
- **POST /v1/understand/uploadImgFile** - Image Caption (upload by file)
- **POST /v1/understand/uploadImgFileBase64** - Image Caption (base64)

**Key Features**:
- Advanced video/image understanding with custom prompts
- Human re-identification with reference images (up to 5 people)
- Async results via callback URL
- System prompt customization
- "Thinking" mode for detailed reasoning

**Use Cases**:
- Security monitoring (identify people in surveillance footage)
- E-commerce (generate product descriptions from video)
- Accessibility (automatic video captioning)
- Content moderation (detect specific individuals)

**Why Important**:
- Different endpoint (security subdomain) - requires authentication check
- Unique callback-based workflow
- Premium feature not available in basic API key

---

## 🔧 Technical Issues & Improvements Needed

### Upload Features Analysis

#### ✅ **Working Perfectly**:
1. **File Upload** (`upload_video_file`)
   - Multipart form-data handling ✅
   - Callback support ✅
   - Metadata (datetime, GPS, camera) ✅
   - unique_id scoping ✅

2. **URL Upload** (`upload_video`)
   - Direct streamable URLs ✅
   - Platform URLs (TikTok/YouTube/Instagram) ✅
   - Creator URLs ✅
   - Hashtag crawling ✅
   - Public vs Private library distinction ✅

3. **Image Upload** (`upload_image`)
   - Multiple image support ✅
   - Metadata fields (GPS, camera, datetime) ✅

#### ⚠️ **Potential Improvements**:

1. **Error Handling**:
   ```python
   # Current: Basic try/catch
   # Better: Retry logic for network errors, exponential backoff
   ```

2. **Callback Management**:
   ```python
   # Current: User provides callback URL
   # Better: Automatic webhook setup + status polling fallback
   ```

3. **Upload Progress**:
   ```python
   # Missing: Progress tracking for large files
   # Add: Streaming upload with progress callbacks
   ```

4. **Validation**:
   ```python
   # Current: Basic format checks
   # Better: Pre-upload validation (file size, codec, duration)
   ```

5. **Quality Selection**:
   ```python
   # Current: Default 720p for YouTube scraping
   # Better: Let user choose (1080p, 720p, 480p, 260p)
   ```

---

## 🚀 Feature Enhancement Opportunities

### 1. **Batch Upload with Queue Management** 🆕

**Problem**: Currently uploading 50 videos = 50 separate API calls  
**Solution**: Batch management system

```python
@openapi_schema({
    "name": "batch_upload_videos",
    "description": "Upload multiple videos in a batch with progress tracking",
    "parameters": {
        "urls": ["https://...", "https://..."],
        "batch_name": "Nike Campaign Analysis",
        "max_concurrent": 5,
        "callback": "https://..."
    }
})
async def batch_upload_videos(...):
    # Features:
    # - Progress tracking (3/50 complete)
    # - Parallel uploads (max_concurrent)
    # - Batch summary report
    # - Automatic retry on failures
    pass
```

**UX Impact**:
- Show batch progress in UI
- Pause/resume batch uploads
- Batch success/failure report

---

### 2. **Video Library Management** 🆕

**Problem**: No way to organize videos into folders/projects  
**Solution**: Folder/project system

```python
@openapi_schema({
    "name": "create_video_collection",
    "description": "Create a collection to organize related videos",
    "parameters": {
        "name": "Nike TikTok Campaign 2025",
        "description": "All Nike videos from Q1 2025",
        "tags": ["nike", "campaign", "q1-2025"]
    }
})
async def create_video_collection(...):
    # Features:
    # - Organize videos into collections
    # - Tag-based filtering
    # - Bulk move/copy videos
    # - Collection-level analytics
    pass
```

**UX Impact**:
- Sidebar with collections/folders
- Drag-and-drop to organize
- Search within collections
- Collection dashboard

---

### 3. **Advanced Caption & ReID Integration** 🆕

**Problem**: Missing security.memories.ai endpoints  
**Solution**: Implement caption + human ReID

```python
@openapi_schema({
    "name": "caption_video_advanced",
    "description": "Generate detailed captions with custom prompts and person identification",
    "parameters": {
        "video_no": "VI123456",
        "user_prompt": "Describe this video as a product demo",
        "system_prompt": "You are an e-commerce AI",
        "persons": [
            {"name": "Alice", "reference_image": "..."},
            {"name": "Bob", "reference_image": "..."}
        ],
        "thinking_mode": True
    }
})
async def caption_video_advanced(...):
    # Features:
    # - Custom prompts for specific use cases
    # - Identify up to 5 people
    # - "Thinking" mode for reasoning
    # - Async with callback
    pass
```

**UX Impact**:
- Upload reference images of people
- See reasoning process ("thinking" mode)
- Person tracking timeline
- Exportable captions

---

### 4. **Real-Time Video Analysis Dashboard** 🆕

**Problem**: Async uploads = no visibility into processing  
**Solution**: Real-time dashboard

**Features**:
- Live upload queue
- Processing status per video
- Estimated completion time
- Error alerts with retry options
- Resource usage (credits, storage)

**UX Design**:
```
┌────────────────────────────────────────┐
│  📊 Video Processing Dashboard         │
├────────────────────────────────────────┤
│  Queue: 12 videos | Processing: 3/12   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 25%      │
│                                         │
│  ✅ video1.mp4 (PARSE) - 2m ago        │
│  ⏳ video2.mp4 (PARSING) - 30% - 1m    │
│  ❌ video3.mp4 (FAILED) - Retry?       │
│  ⏸️  video4.mp4 (QUEUED) - Waiting     │
│                                         │
│  [Pause All] [Retry Failed] [Clear]    │
└────────────────────────────────────────┘
```

---

### 5. **Trend Analysis Studio** 🆕

**Problem**: Marketer Chat is powerful but results aren't persisted  
**Solution**: Trend Analysis Studio

**Features**:
- Save Marketer Chat analyses as "reports"
- Compare trends over time
- Export to PDF/PPT
- Schedule recurring analyses
- Alert on new trending content

**UX Flow**:
1. User: "Find trending Nike content on TikTok"
2. AI: Analyzes 50 videos, generates insights
3. User: "Save this as 'Nike Q1 2025 Report'"
4. System: Creates report with charts, video clips, insights
5. User: Schedule weekly updates
6. System: Auto-runs analysis, emails report

---

### 6. **Video Collaboration & Sharing** 🆕

**Problem**: No way to share analyses with team  
**Solution**: Collaboration features

```python
@openapi_schema({
    "name": "share_video_analysis",
    "description": "Share a video analysis with team members or external stakeholders",
    "parameters": {
        "video_no": "VI123456",
        "share_with": ["user@company.com"],
        "permissions": "view",  # view | comment | edit
        "expiration": "7d"
    }
})
async def share_video_analysis(...):
    pass
```

**Features**:
- Share individual videos or collections
- Shareable links with expiration
- Commenting on video moments
- Version history of analyses

---

### 7. **Automated Workflows** 🆕

**Problem**: Repetitive tasks (e.g., daily competitor analysis)  
**Solution**: Workflow automation

**Example Workflows**:

**Workflow 1: Daily Competitor Monitoring**
```yaml
name: "Track Nike Competitors"
trigger: schedule(daily, 9am)
steps:
  - scrape_hashtags: ["#adidas", "#puma", "#underarmour"]
  - analyze_trends: {platform: "TIKTOK"}
  - generate_report: {format: "pdf"}
  - notify: {email: "team@company.com"}
```

**Workflow 2: New Video Alert**
```yaml
name: "Nike New Video Alert"
trigger: new_video_from_creator("@nike")
steps:
  - analyze_video: {extract: ["hooks", "ctas", "sentiment"]}
  - compare_to_previous: {days: 30}
  - notify_if: {engagement_spike: "> 20%"}
```

---

## 🎨 UX/UI Design Recommendations

### Current State:
- Tools are functional but not visually organized
- No dedicated "Video Library" view
- Marketer Chat results are ephemeral
- Upload status hidden in tool output

### Proposed Improvements:

#### 1. **Video Library View** (New Page)
```
┌─────────────────────────────────────────────────┐
│ 📹 Video Library                  [+ Upload ▼]  │
├─────────────────────────────────────────────────┤
│ 📁 Collections          │  🔍 Search            │
│   ├─ 📂 All Videos (47) │  ┌──────────────────┐ │
│   ├─ 📂 Nike Campaign   │  │ 📹 nike_ad.mp4   │ │
│   ├─ 📂 Competitors     │  │ ⏱️  2:15 • 5MB   │ │
│   └─ 📂 Trending        │  │ ✅ Analyzed       │ │
│                         │  │ [👁️][💬][📊][🗑️]│ │
│ 🏷️  Tags               │  └──────────────────┘ │
│   • Campaign (12)       │  ┌──────────────────┐ │
│   • TikTok (23)         │  │ 📹 competitor.mp4│ │
│   • Analyzed (34)       │  │ ...               │ │
└─────────────────────────────────────────────────┘
```

#### 2. **Upload Flow Redesign**
```
Step 1: Choose Upload Method
┌────────────────────────────────────┐
│ 📁 Local File                      │
│ 🔗 Direct URL                      │
│ 🎬 Platform URL (TikTok/YouTube)   │
│ 👤 Creator (@username)             │
│ #️⃣  Hashtag (#nike)                │
└────────────────────────────────────┘

Step 2: Configure Upload
┌────────────────────────────────────┐
│ Videos: 5 selected                 │
│ Collection: [Nike Campaign ▼]      │
│ Tags: [campaign] [q1-2025]        │
│ Quality: [1080p ▼]                 │
│ Auto-analyze: [✓] Yes              │
│                                    │
│ [Cancel] [Upload & Analyze]        │
└────────────────────────────────────┘
```

#### 3. **Video Analysis View**
```
┌─────────────────────────────────────────────────┐
│ 📹 nike_ad.mp4                    [Download][🗑️]│
├─────────────────────────────────────────────────┤
│ ▶️ [Video Player]                               │
│                                                 │
│ 📊 Analysis                                     │
│ ├─ 🎣 Hooks (3)                                │
│ │   • 0:03 - "Just Do It" text overlay         │
│ │   • 0:15 - Athlete close-up                  │
│ │   • 1:45 - Product showcase                  │
│ ├─ 📣 CTAs (2)                                 │
│ │   • 1:20 - "Shop now at nike.com"            │
│ │   • 2:10 - "Follow us on Instagram"          │
│ └─ 📈 Engagement Score: 8.5/10                 │
│                                                 │
│ 💬 Q&A                                          │
│ [Ask a question about this video...]            │
└─────────────────────────────────────────────────┘
```

#### 4. **Trend Analysis Dashboard**
```
┌─────────────────────────────────────────────────┐
│ 📈 Trend Analysis: Nike on TikTok               │
├─────────────────────────────────────────────────┤
│ 📊 Insights                                     │
│ • 23 new videos this week                       │
│ • Avg engagement: +15% vs last week            │
│ • Top hashtag: #NikeAir (1.2M views)           │
│                                                 │
│ 🎥 Top Performing Videos                       │
│ [Grid of top 6 videos with stats]              │
│                                                 │
│ 🎯 Recommendations                              │
│ • Post time: 6-8 PM gets 2x engagement         │
│ • Content type: Behind-the-scenes +40%         │
│ • Video length: 15-30s performs best           │
│                                                 │
│ [Save Report] [Schedule Updates] [Share]        │
└─────────────────────────────────────────────────┘
```

---

## 🚨 Critical Issues to Fix

### 1. **Upload File Feature Verification** ⚠️

**Issue**: Need to verify `upload_video_file` is properly exposed  
**Check**:
- Is the tool registered in `ToolViewRegistry.tsx`? ✅ (Already done)
- Is the backend endpoint working? ✅ (Code looks good)
- Is the frontend renderer handling file uploads? ⚠️ (Need to check)

**Test Case**:
```python
# User uploads video.mp4 via UI
# Expected: File uploads, returns videoNo
# Expected: Progress indicator shown
# Expected: Video appears in library after PARSE
```

### 2. **Callback URL Management** ⚠️

**Issue**: Users must provide callback URLs for async operations  
**Problem**: Most users won't have a public URL

**Solutions**:
1. **Built-in webhook server** (ngrok-style tunneling)
2. **Polling fallback** (check status every 10s)
3. **WebSocket notifications** (real-time updates)

**Recommended**: Implement polling + WebSocket combo

---

## 💡 Feature Prioritization

### **Phase 1: Fix & Verify** (1 week)
- ✅ Verify all upload methods work end-to-end
- ✅ Test file upload with large files (>100MB)
- ✅ Implement polling for async operations
- ✅ Add upload progress indicators

### **Phase 2: UX Improvements** (2 weeks)
- 🆕 Video Library view
- 🆕 Upload flow redesign
- 🆕 Real-time dashboard
- 🆕 Better error messages

### **Phase 3: Advanced Features** (3 weeks)
- 🆕 Batch upload
- 🆕 Collections/folders
- 🆕 Caption & ReID integration
- 🆕 Trend Analysis Studio

### **Phase 4: Collaboration** (2 weeks)
- 🆕 Sharing & permissions
- 🆕 Commenting
- 🆕 Team workspaces

### **Phase 5: Automation** (2 weeks)
- 🆕 Workflow builder
- 🆕 Scheduled analyses
- 🆕 Alerts & notifications

---

## 🎯 Quick Wins (Implement First)

1. **Upload Progress Indicator** (2 hours)
   - Show "Uploading... 45%" in UI
   - Use existing tool output mechanism

2. **Task Status Polling** (4 hours)
   - Auto-poll `check_task_status` every 10s
   - Show "Processing... 2/5 videos complete"

3. **Video Preview Cards** (3 hours)
   - Show thumbnail in video list
   - Add duration, upload date, status badge

4. **Quick Actions** (2 hours)
   - "Analyze" button on each video
   - "Delete" with confirmation
   - "Download" link

5. **Search Improvements** (3 hours)
   - Filter by status (PARSE, UNPARSE, FAILED)
   - Filter by date range
   - Search by video name or tags

---

## 📝 Implementation Checklist

### Upload Features Verification

- [ ] Test `upload_video_file` with various file sizes
- [ ] Test `upload_video` with direct URLs
- [ ] Test `upload_from_platform_urls` (TikTok/YouTube/Instagram)
- [ ] Test `upload_from_creator_url` (creator pages)
- [ ] Test `upload_from_hashtag` (hashtag crawling)
- [ ] Test `upload_image` with metadata
- [ ] Verify callback handling for async operations
- [ ] Add file size validation (warn if >20MB)
- [ ] Add duration validation (warn if <20s or >300s)
- [ ] Test concurrent uploads (10+ videos at once)

### Missing API Integration

- [ ] Implement Caption API (security.memories.ai)
- [ ] Implement Image Caption API
- [ ] Enhanced Human ReID with reference images
- [ ] Test with premium API key (if available)

### UX Improvements

- [ ] Create Video Library page
- [ ] Redesign upload flow with wizard
- [ ] Add batch upload support
- [ ] Add collection/folder management
- [ ] Create real-time dashboard
- [ ] Add progress indicators everywhere

---

## 🔐 Security & Cost Considerations

### Rate Limits (Per Documentation)
- **Free Tier**: Limited requests/month
- **Paid Tier**: Higher limits
- **Solution**: Implement rate limit detection + graceful degradation

### API Key Management
- **Current**: Single API key in env var ✅
- **Better**: Per-user API keys (future)
- **Security**: Never expose API key client-side ✅

### Cost Optimization
- **Problem**: Each upload/analysis costs credits
- **Solutions**:
  1. Warn user before expensive operations
  2. Show cost estimate before batch upload
  3. Implement caching (re-use analysis for 24h)
  4. Dedup: Don't re-upload same video

---

## 🎓 Documentation Needs

### User Guide
- [ ] "Getting Started with Video Intelligence"
- [ ] "How to Upload Videos"
- [ ] "Understanding Video Analysis Results"
- [ ] "Best Practices for Trend Analysis"

### Developer Guide
- [ ] API Reference (all 30+ tools)
- [ ] Error Handling Guide
- [ ] Rate Limit Management
- [ ] Webhook/Callback Setup

### Video Tutorials
- [ ] "Upload Your First Video" (2 min)
- [ ] "Analyze Trending Content" (5 min)
- [ ] "Compare Competitor Videos" (4 min)
- [ ] "Build a Trend Report" (8 min)

---

## 🚀 Conclusion

### **Current State**: 
✅ Excellent backend implementation (30+ working tools!)  
⚠️ Basic UX (tool outputs, no library view)  
❌ Missing Caption & ReID APIs

### **Next Steps**:
1. **Verify upload features work end-to-end** ✅
2. **Implement polling for async operations** 🆕
3. **Create Video Library UI** 🆕
4. **Add Caption & ReID APIs** 🆕
5. **Build Trend Analysis Dashboard** 🆕

### **Impact**:
With these improvements, users will have a **world-class video intelligence platform** that rivals dedicated tools like TubeBuddy, VidIQ, and HypeAuditor—all integrated seamlessly into the agentic suite.

---

**Ready to implement? Let's start with Phase 1! 🚀**

