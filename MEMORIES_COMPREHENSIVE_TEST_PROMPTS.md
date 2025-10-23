# Memories.ai Comprehensive Testing Prompts

## 🎯 Complete Test Suite for All 29 Tools

This document provides detailed test prompts for every Memories.ai functionality, organized by category with expected outcomes.

---

## 📤 **UPLOAD OPERATIONS** (5 Tools)

### 1. Upload Video from URL
```
Test 1.1: TikTok Upload
"Please upload this TikTok video: https://www.tiktok.com/@nike/video/7425678901234567890 
Title it 'Nike Air Max Launch 2025' and save it to the 'Marketing/TikTok' folder for future analysis."

Expected: Video upload status → Embedded video player → Saved to KB
```

```
Test 1.2: YouTube Upload
"Upload this YouTube video: https://www.youtube.com/watch?v=dQw4w9WgxcQ
Title: 'Classic Rick Roll Analysis', folder: 'Videos/YouTube', add it to my knowledge base"

Expected: Video upload confirmation → Embedded video player → Video ID returned
```

```
Test 1.3: Instagram Upload
"Can you upload this Instagram video: https://www.instagram.com/p/DNu8_Fs4mSd/
Title: 'Instagram Fitness Reel', save to 'Marketing/Instagram'"

Expected: Upload success → Embedded video player → Metadata displayed
```

### 2. Upload Video from Platform Creator
```
Test 2.1: TikTok Creator (with @)
"Upload the 5 most recent videos from @mrbeast on TikTok"

Expected: Task created → Task ID returned → Message about checking status later
```

```
Test 2.2: TikTok Creator (URL)
"Please upload 10 videos from https://www.tiktok.com/@nike"

Expected: Async task started → Instructions to check task status
```

```
Test 2.3: Instagram Creator
"Get the latest 8 videos from https://www.instagram.com/nike/"

Expected: Task initiated → Task ID for tracking
```

### 3. Upload from Hashtag
```
Test 3.1: Single Hashtag
"Upload 5 TikTok videos with the hashtag #AIMarketing"

Expected: Task created → Videos being scraped → Task ID returned
```

```
Test 3.2: Multiple Hashtags
"Find and upload 3 videos for each of these hashtags: #Fitness, #HealthTips, #WorkoutMotivation"

Expected: Batch upload task → Task ID → Instructions for status check
```

### 4. Upload Video File
```
Test 4.1: Basic File Upload
"I'm uploading a video file called 'product_demo.mp4'. Please process it and save it as 'Product Demo Q1 2025' in the 'Demos' folder."

Expected: File upload confirmation → Processing status → Video embedded
```

### 5. Upload Image
```
Test 5.1: Image with Metadata
"Upload this image with tags: 'product', 'launch', 'event'. It was taken on 2025-01-15 at coordinates 40.7128, -74.0060 with a Canon EOS R5."

Expected: Image upload success → Metadata saved → Image displayed
```

---

## 🔍 **SEARCH OPERATIONS** (6 Tools)

### 6. Search Platform Videos
```
Test 6.1: TikTok Search
"Search TikTok for 'AI marketing strategies 2025' and show me the top 15 results"

Expected: Grid of embedded TikTok videos → Titles, views, likes → Scores
```

```
Test 6.2: YouTube Search
"Find me 10 YouTube videos about 'how to use ChatGPT for business'"

Expected: YouTube video grid → Thumbnails → Metadata → Embedded players
```

```
Test 6.3: Instagram Search
"Search Instagram for 'fitness transformation' content, limit 12 results"

Expected: Instagram video grid → Engagement metrics → Play buttons
```

### 7. Search Private Library (Videos)
```
Test 7.1: Search My Videos
"Search through my uploaded videos for anything related to 'product launch' or 'demo'"

Expected: Results from personal library → Video clips → Timestamps → Scores
```

```
Test 7.2: Audio-based Search
"Find moments in my videos where someone says 'thank you' or 'appreciate'"

Expected: Audio transcript matches → Video clips → Time ranges
```

### 8. Search in Specific Video
```
Test 8.1: Visual Search
"In video VI123456789, find all moments where someone is smiling or celebrating"

Expected: Specific timestamps → Clip ranges → Embedded video with markers
```

```
Test 8.2: Audio Search in Video
"In the same video, find where they mention 'revenue' or 'growth'"

Expected: Transcript matches → Timestamps → Video player with time markers
```

### 9. Search Images
```
Test 9.1: Search My Images
"Find images in my library that show outdoor scenes or nature"

Expected: Grid of matching images → Thumbnails → Metadata → Scores
```

```
Test 9.2: Image Search with Filters
"Show me images from January 2025 taken with a Canon camera"

Expected: Filtered results → Images with metadata → Location if available
```

### 10. Search Trending Content
```
Test 10.1: Trending by Topic
"What's trending on TikTok right now related to 'AI tools' or 'productivity'?"

Expected: Trending hashtags → Topic analysis → Referenced videos embedded → Metrics
```

```
Test 10.2: Trending by Hashtag
"Show me trending content for #FitnessMotivation on TikTok"

Expected: Trend analysis → Video count → Engagement stats → Sample videos playing
```

### 11. Human Reid (Person Re-identification)
```
Test 11.1: Find Person Across Videos
"In my uploaded videos, find all appearances of the person wearing a red jacket in video VI123456789 at timestamp 05:30"

Expected: List of videos → Timestamps where person appears → Confidence scores
```

---

## 🎬 **VIDEO ANALYSIS** (7 Tools)

### 12. Analyze Video
```
Test 12.1: General Analysis
"Analyze this video VI123456789 and tell me: What's the main message? Who's the target audience? What emotions does it evoke? How effective is the hook in the first 3 seconds?"

Expected: Embedded video player → Detailed analysis → Insights → Recommendations
```

```
Test 12.2: Marketing Analysis
"For video https://www.tiktok.com/@nike/video/7425678901234567890, analyze the marketing strategy: hooks, CTAs, storytelling, editing style, and music choice"

Expected: Video playing → Comprehensive marketing breakdown → Timestamp references
```

### 13. Compare Videos
```
Test 13.1: Head-to-Head Comparison
"Compare these 3 videos: VI111111, VI222222, VI333333. Which one has the best editing? Most engaging content? Better call-to-action?"

Expected: Grid of 3 videos playing → Side-by-side comparison → Winner analysis
```

```
Test 13.2: Style Comparison
"Compare the filming styles between videos VI444444 and VI555555 - which one uses better lighting and composition?"

Expected: Both videos embedded → Technical analysis → Pros/cons for each
```

### 14. Multi-Video Search
```
Test 14.1: Cross-Video Search
"Across all my uploaded videos, find scenes where products are being demonstrated"

Expected: Multiple videos displayed → Specific clip timestamps → Relevance scores
```

```
Test 14.2: Theme-Based Search
"Find all moments across my video library that show customer testimonials or reviews"

Expected: Video grid → Timestamp markers → Clips from multiple sources
```

### 15. Query Video (Q&A)
```
Test 15.1: Content Questions
"For video VI123456789: What products are mentioned? What's the price point discussed? When do they show the demo?"

Expected: Video playing → Answers with timestamps → Clickable time references
```

```
Test 15.2: Deep Dive Questions
"In the same video, what emotions does the speaker convey? Are there any visual effects used? What's the pacing like?"

Expected: Video embedded → Detailed answers → Time-stamped evidence
```

### 16. Analyze Creator
```
Test 16.1: TikTok Creator Analysis
"Analyze the content strategy of @garyvee on TikTok - what themes do they focus on? How often do they post? What's their engagement rate?"

Expected: Task started → Task ID → Instructions to check status → Eventually shows creator videos + analysis
```

```
Test 16.2: Instagram Creator Deep Dive
"Study @nike on Instagram - what's their visual style? Color palette? Average video length? Posting frequency?"

Expected: Async task → Later shows grid of videos → Comprehensive analysis
```

### 17. Analyze Trend
```
Test 17.1: Hashtag Trend
"Analyze the #AIMarketing trend on TikTok - what's the typical content style? Who's the audience? What's working?"

Expected: Task initiated → Trend analysis report → Sample videos → Metrics
```

### 18. Get Transcript
```
Test 18.1: Full Transcript
"Get me the complete transcript of video VI123456789 with timestamps"

Expected: Video playing above → Full transcript below → Word count → Timestamps
```

```
Test 18.2: Transcript for Captions
"I need the transcript of video VI987654321 to create subtitles"

Expected: Video embedded → Timestamped transcript → Downloadable format
```

---

## 💬 **CHAT & PERSONAL MEDIA** (4 Tools)

### 19. Video Chat (Single Video)
```
Test 19.1: First Question
"Let's chat about video VI123456789. What's the main topic discussed?"

Expected: Video playing → Answer → Session created → Can continue conversation
```

```
Test 19.2: Follow-up Questions
"What specific products are mentioned? Can you summarize the key points?"

Expected: Continued conversation → Context maintained → Same video playing
```

### 20. Chat with Media (Personal Library)
```
Test 20.1: General Question
"Based on all my uploaded videos and images, what are the common themes in my content?"

Expected: Analysis of entire library → Referenced media shown embedded → Insights
```

```
Test 20.2: Specific Search
"Show me all content in my library from January 2025 that mentions 'product launch'"

Expected: Filtered results → Videos and images → Embedded players → Metadata
```

### 21. List Video Chat Sessions
```
Test 21.1: Recent Sessions
"Show me my recent video chat sessions"

Expected: List of sessions → Video thumbnails → Timestamps → Session IDs
```

### 22. List Trending Sessions
```
Test 22.1: Trending Chats
"What trending content have I been exploring recently?"

Expected: List of trending topic sessions → Dates → Topics → Access links
```

---

## 🛠️ **UTILITY OPERATIONS** (7 Tools)

### 23. Check Task Status
```
Test 23.1: Creator Upload Status
"Check the status of task {task_id_from_creator_upload}"

Expected: Task status (processing/completed) → Progress → Video count if complete
```

```
Test 23.2: Completed Task
"What's the status of task {completed_task_id}?"

Expected: Completed status → Results summary → Videos embedded → Analysis shown
```

### 24. List My Videos
```
Test 24.1: All Videos
"Show me all videos in my knowledge base"

Expected: Complete list → Thumbnails → Titles → Upload dates → Durations
```

```
Test 24.2: Filtered Videos
"List videos in the 'Marketing/TikTok' folder uploaded in the last 30 days"

Expected: Filtered list → Video metadata → Status → Quick access
```

### 25. Get Video Detail
```
Test 25.1: Detailed Info
"Get me the complete details for video VI123456789"

Expected: Full metadata → Duration → Upload date → Tags → Status → URLs
```

### 26. Delete Video
```
Test 26.1: Remove Video
"Delete video VI987654321 from my library"

Expected: Confirmation message → Video removed → Cannot be accessed anymore
```

### 27. Get Captions
```
Test 27.1: Auto-Generated Captions
"Generate captions for video VI123456789"

Expected: SRT/VTT format captions → Timestamped text → Downloadable
```

### 28. Add Video to Knowledge Base
```
Test 28.1: Save to KB
"Add video VI555555 to my knowledge base in folder 'Archive/2025'"

Expected: Video saved → Confirmation → Accessible in future searches
```

### 29. Search Audio Transcripts
```
Test 29.1: Transcript Search
"Search my audio transcripts for mentions of 'customer feedback' or 'user testimonials'"

Expected: Matching transcript snippets → Video references → Timestamps → Play links
```

---

## 🔄 **COMPLEX WORKFLOW TESTS**

### Workflow 1: Complete Content Analysis Pipeline
```
Step 1: "Upload this TikTok: https://www.tiktok.com/@nike/video/7425678901234567890"
Step 2: "Now analyze what makes this video engaging"
Step 3: "Get the transcript"
Step 4: "Compare it with video VI123456 in my library"
Step 5: "Search for similar content on TikTok"

Expected: Complete workflow → Each step shows embedded videos → Comprehensive analysis
```

### Workflow 2: Creator Study
```
Step 1: "Upload 10 videos from @garyvee"
Step 2: "Check the upload status"
Step 3: "Once complete, analyze his content strategy"
Step 4: "Find trending topics he covers"
Step 5: "Search for similar creators"

Expected: Async task handling → Status checks → Analysis with videos → Trend insights
```

### Workflow 3: Competitive Analysis
```
Step 1: "Search TikTok for 'fitness motivation' - top 15 videos"
Step 2: "Analyze the top 3 performers"
Step 3: "Compare their hooks in the first 3 seconds"
Step 4: "What's trending in #FitnessMotivation?"
Step 5: "Upload 5 videos from the top creator"

Expected: Search results → Analysis → Comparisons → Trend data → Creator videos
```

---

## ✅ **SUCCESS CRITERIA CHECKLIST**

For each test, verify:
- [ ] **Tool executes** without errors
- [ ] **Data is returned** in correct format
- [ ] **Videos are EMBEDDED** (not just links)
- [ ] **Frontend renders** appropriately
- [ ] **Metadata is displayed** (views, likes, duration, etc.)
- [ ] **Error handling** works gracefully
- [ ] **Follow-up actions** are suggested
- [ ] **Session continuity** maintained (for chat)
- [ ] **Task IDs** work for async operations
- [ ] **Multiple videos** show in grids where applicable

---

## 🎯 **PRIORITY TESTING ORDER**

### High Priority (Core Functionality):
1. Upload video from URL (TikTok, YouTube, Instagram)
2. Search platform videos
3. Analyze video
4. Get transcript
5. Query video (Q&A)

### Medium Priority (Advanced Features):
6. Upload from creator
7. Compare videos
8. Multi-video search
9. Search trending content
10. Analyze creator

### Lower Priority (Utility):
11. List videos
12. Check task status
13. Get video detail
14. Delete video
15. Session management

---

## 📊 **EXPECTED RENDERING PATTERNS**

### When Videos ARE Embedded:
- Upload results
- Search results (when URLs available)
- Analysis results
- Transcript view
- Comparison view
- Creator analysis results
- Chat responses

### When Thumbnails Are Shown:
- Search results (when embed URLs unavailable)
- List views
- Session history

### When Text Only:
- Task status (until completed)
- Session lists
- Metadata displays

---

## 🚨 **COMMON ISSUES TO WATCH FOR**

1. **Empty video URLs** → Should show thumbnail fallback
2. **API failures** → Should show friendly error messages
3. **Long-running tasks** → Should return task ID promptly
4. **Session management** → Should maintain context across chat turns
5. **Multiple videos** → Should render in grid layout
6. **Platform differences** → TikTok/YouTube/Instagram may behave differently

---

## 📝 **REPORTING RESULTS**

For each test, document:
```
Test: [Test number and name]
Prompt: [Exact prompt used]
Expected: [What should happen]
Actual: [What actually happened]
Status: ✅ Pass / ❌ Fail / ⚠️ Partial
Videos Embedded: Yes/No
Screenshot: [If relevant]
Notes: [Any observations]
```

---

**Happy Testing! 🎉**

This comprehensive test suite covers all 29 Memories.ai tools across 5 major categories. Use these prompts to verify that every functionality works correctly and all videos are properly embedded in the UI.

