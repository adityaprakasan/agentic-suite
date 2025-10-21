# Complete Update for All Memories.ai Tool Descriptions

This file contains all the description updates needed for the remaining 10 methods in `memories_tool.py`.

## Already Updated:
- ✅ upload_video
- ✅ search_platform_videos

## Need to Update:

### 1. upload_video_file
**Current:** Generic description
**New:** "Upload and process a video file from local storage (e.g., user attachment or file in sandbox) for analysis. Use this when user has uploaded a video file directly (not a URL) or when you need to analyze a video file from the sandbox filesystem. The video will be processed for transcript, analysis, and Q&A."

Parameters:
- `file_path`: "Absolute or relative path to video file on the filesystem. Can be a user-uploaded attachment path, sandbox file path, or any accessible video file (.mp4, .mov, .avi, .mkv, .webm)"
- `title`: "Descriptive title for the video. If filename is descriptive, you can use it; otherwise create a meaningful title based on context (e.g., 'Client Campaign Upload', 'Team Meeting Recording', 'Product Demo Video')"
- `folder_name`: "Knowledge base folder to organize the video (e.g., 'Uploads', 'Client Files', 'Recordings'). Defaults to 'Videos'."
- `save_to_kb`: "Whether to save to knowledge base. Set true (default) to keep for future access, false for one-time analysis."

### 2. analyze_video
**Current:** Generic
**New:** "Analyze a video's content for marketing insights including hooks (attention-grabbing moments), CTAs (calls-to-action), visual elements, pacing, and engagement prediction. Use this when user wants to understand what makes a video effective, identify best practices, or get actionable feedback on video content. Best for marketing/campaign analysis."

Parameters:
- `video_id`: "Video identifier from previous upload or search operation. Format: 'VI-...' or 'PI-...'. Get this from upload_video, upload_video_file, or search_platform_videos results."

### 3. get_transcript
**Current:** Generic
**New:** "Extract the full transcript of a video with timestamps. Use this when user wants to read video content as text, search for specific quotes, create captions, or needs the spoken content for documentation/analysis. Returns timestamped transcript segments."

Parameters:
- `video_id`: "Video identifier. Format: 'VI-...' or 'PI-...'. Must be a video that's been uploaded/processed first."

### 4. query_video
**Current:** Generic
**New:** "Ask specific questions about video content and get answers with precise timestamps. Use this for video Q&A when user wants to find where specific information appears, understand particular moments, or get explanations about video content. Responses include exact timestamps where the answer is found, making it easy to jump to relevant sections."

Parameters:
- `video_id`: "Video identifier to query"
- `question`: "Specific question about the video content. Be precise and contextual. Good examples: 'Where does the speaker mention pricing?', 'What products are shown?', 'When does the CTA appear?', 'What's the main message of this video?'"

### 5. search_in_video
**Current:** Generic
**New:** "Search for specific moments or clips within a video based on visual or audio content. Use this to find when particular products appear, when specific topics are discussed, or when certain scenes occur. Returns timestamp ranges (start/end) for each matching moment. Also called 'clip search'."

Parameters:
- `video_id`: "Video to search within"
- `query`: "What to search for in the video. Be specific about visual or audio elements. Examples: 'scenes with the product', 'when pricing is mentioned', 'moments with text overlays', 'scenes with people smiling', 'segments about features'"

### 6. compare_videos
**Current:** Generic
**New:** "Compare multiple videos side-by-side to identify patterns, differences, and which performs best. Use this when user wants to understand what makes certain videos more effective, identify winning strategies across campaigns, or decide which video approach to use. Returns comparative analysis with scores and recommendations."

Parameters:
- `video_ids`: "Array of video IDs to compare (2-10 videos recommended for meaningful comparison). Use videos from same category/campaign for best insights."

### 7. multi_video_search
**Current:** Generic
**New:** "Search across multiple videos simultaneously for patterns, themes, or specific content. Use this to identify common elements across a campaign, find trend patterns, or analyze content strategies across multiple creators/videos. More powerful than individual searches when analyzing content at scale."

Parameters:
- `video_ids`: "Array of video IDs to search across (can handle 5-50 videos). Use when you have a collection of related videos (campaign series, competitor videos, trending content)"
- `query`: "What to search for across all videos. Focus on patterns or themes. Examples: 'common hook strategies', 'how products are presented', 'trending audio patterns', 'CTA placement strategies'"

### 8. human_reid
**Current:** Generic
**New:** "Track a specific person across multiple videos using re-identification technology. Use this when user wants to find all appearances of a person (influencer, spokesperson, competitor personality), analyze their presence across content, or track product placements involving specific people. Can work from image reference or video frame."

Parameters:
- `video_ids`: "Array of videos to search through"
- `person_reference`: "How to identify the person. Can be: description ('person in red shirt'), name if known ('John the spokesperson'), or reference to frame ('person at 0:23 in first video')"

### 9. analyze_creator
**Current:** "Analyze a TikTok/Instagram/YouTube creator's account..."
**New:** "Analyze a creator's account on TikTok, Instagram, or YouTube to generate a comprehensive insight report on their content strategy, stats, posting patterns, and audience engagement. Use this when user asks about a specific creator's strategy, wants to learn from successful creators, or needs competitive intelligence. Simply provide the creator's URL or @handle - the tool will pull and analyze their recent videos automatically."

Parameters:
- `creator_url`: "Creator's profile URL or handle. Formats: TikTok '@username' or 'tiktok.com/@username', Instagram '@username' or 'instagram.com/username', YouTube 'youtube.com/@channel' or 'youtube.com/channel/CHANNEL_ID'. The tool handles all platform-specific formats."
- `video_count`: "Number of recent videos to analyze for the report (default 10). Recommended: 10-15 for quick insights, 20-30 for comprehensive analysis of content patterns. More videos = more accurate pattern detection."

### 10. analyze_trend
**Current:** Generic
**New:** "Analyze trending content on TikTok or Instagram by hashtag(s) to identify what's currently viral, common content patterns, and trending formats. Use this when user asks what's trending with a topic, wants to understand hashtag performance, or needs to identify trending content strategies for campaign planning. The tool pulls recent trending videos using the hashtag(s) and analyzes patterns across them."

Parameters:
- `hashtags`: "Array of hashtag(s) to analyze (without # symbol). Can be single ['fitness'] or multiple ['fitness', 'gym', 'workout'] for broader analysis. Use trending or relevant hashtags for the user's industry/topic."
- `video_count`: "Number of trending videos to pull and analyze (default 10). Recommended: 15-20 for reliable trend identification, up to 30 for comprehensive trend mapping. More videos = better pattern detection."

---

## Implementation Instructions:

For each method above, update the @openapi_schema decorator with:
1. Updated "description" field with the new description
2. Updated parameter descriptions with the new detailed descriptions

This will help the LLM:
- Understand when to use each tool
- Know what parameters to provide and in what format
- Construct better queries and parameters from user intent
- Provide better explanations to users about what each tool does

