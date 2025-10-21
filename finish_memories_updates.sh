#!/bin/bash
# Final comprehensive update for all remaining memories tool descriptions

cd /Users/aditya/Desktop/agentic-suite

# Create Python script to update
cat > /tmp/finish_updates.py << 'PYTHON_SCRIPT'
#!/usr/bin/env python3
import re

file_path = 'backend/core/tools/memories_tool.py'

with open(file_path, 'r') as f:
    content = f.read()

# Update get_transcript
content = content.replace(
    '"name": "get_transcript",\n            "description": "Get the full transcript of a video",',
    '"name": "get_transcript",\n            "description": "Extract the full transcript of a video with timestamps. Use this when user wants to read video content as text, search for specific quotes, create captions/subtitles, or needs the spoken content for documentation, analysis, or repurposing. Returns timestamped transcript segments for easy reference.",'
)

# Update query_video
content = content.replace(
    '"name": "query_video",\n            "description": "Chat with video - ask questions and get timestamped answers",',
    '"name": "query_video",\n            "description": "Ask specific questions about video content and get answers with precise timestamps. Use this for video Q&A when user wants to find where specific information appears, understand particular moments, or get explanations about video content without watching the entire video. Responses include exact timestamps where the answer is found, making it easy to jump to relevant sections.",'
)

content = content.replace(
    '"question": {\n                        "type": "string",\n                        "description": "Question to ask about the video"\n                    }',
    '"question": {\n                        "type": "string",\n                        "description": "Specific question about the video content. Be precise and contextual. Good examples: \'Where does the speaker mention pricing?\', \'What products are shown?\', \'When does the CTA appear?\', \'What is the main message?\', \'How is the product demonstrated?\' Avoid vague questions."\n                    }'
)

# Update search_in_video
content = content.replace(
    '"name": "search_in_video",\n            "description": "Search for specific moments within a video (clip search)",',
    '"name": "search_in_video",\n            "description": "Search for specific moments or clips within a video based on visual or audio content. Use this to find when particular products appear, when specific topics are discussed, or when certain scenes occur. Returns timestamp ranges (start/end) for each matching moment. Also called \'clip search\'.",'
)

content = content.replace(
    '"query": {\n                        "type": "string",\n                        "description": "What to search for in the video"\n                    }',
    '"query": {\n                        "type": "string",\n                        "description": "What to search for in the video. Be specific about visual or audio elements. Examples: \'scenes with the product\', \'when pricing is mentioned\', \'moments with text overlays\', \'scenes with people smiling\', \'segments about features\'"\n                    }'
)

# Update compare_videos
content = content.replace(
    '"name": "compare_videos",\n            "description": "Compare multiple videos for patterns and performance",',
    '"name": "compare_videos",\n            "description": "Compare multiple videos side-by-side to identify patterns, differences, and which performs best. Use this when user wants to understand what makes certain videos more effective, identify winning strategies across campaigns, or decide which video approach to use. Returns comparative analysis with scores and recommendations.",'
)

# Update multi_video_search
content = content.replace(
    '"name": "multi_video_search",\n            "description": "Search across multiple videos simultaneously",',
    '"name": "multi_video_search",\n            "description": "Search across multiple videos simultaneously for patterns, themes, or specific content. Use this to identify common elements across a campaign, find trend patterns, or analyze content strategies across multiple creators/videos. More powerful than individual searches when analyzing content at scale.",'
)

# Update human_reid
content = content.replace(
    '"name": "human_reid",\n            "description": "Track a specific person across multiple videos using re-identification",',
    '"name": "human_reid",\n            "description": "Track a specific person across multiple videos using re-identification technology. Use this when user wants to find all appearances of a person (influencer, spokesperson, competitor personality), analyze their presence across content, or track product placements involving specific people. Can work from image reference or video frame.",'
)

# Update analyze_creator
content = content.replace(
    '"name": "analyze_creator",\n            "description": "Analyze a creator\'s account on TikTok, Instagram, or YouTube - generates full insight report on their stats, content style, posting patterns, and engagement trends. Use this when user asks about a specific creator, wants to understand their content strategy, or requests a creator analysis. Examples: \'analyze @nike on TikTok\', \'get insights on MrBeast YouTube channel\', \'what is @nike\'s content strategy\'",',
    '"name": "analyze_creator",\n            "description": "Analyze a creator\'s account on TikTok, Instagram, or YouTube to generate a comprehensive insight report on their content strategy, stats, posting patterns, and audience engagement. Use this when user asks about a specific creator\'s strategy, wants to learn from successful creators, or needs competitive intelligence. Simply provide the creator\'s URL or @handle - the tool will pull and analyze their recent videos automatically. Examples: \'analyze @nike on TikTok\', \'get insights on MrBeast YouTube channel\', \'what is @nike\'s content strategy\'",',
)

content = content.replace(
    '"creator_url": {\n                        "type": "string",\n                        "description": "Creator profile URL: TikTok (@username or full URL), Instagram (@username or full URL), or YouTube (channel URL or @handle)"\n                    }',
    '"creator_url": {\n                        "type": "string",\n                        "description": "Creator\'s profile URL or handle. Formats: TikTok \'@username\' or \'tiktok.com/@username\', Instagram \'@username\' or \'instagram.com/username\', YouTube \'youtube.com/@channel\' or \'youtube.com/channel/CHANNEL_ID\'. The tool handles all platform-specific formats."\n                    }'
)

content = content.replace(
    '"video_count": {\n                        "type": "integer",\n                        "description": "Number of recent videos to analyze for insights (default 10, recommended 10-20 for accurate patterns, max 30)",\n                        "default": 10\n                    }',
    '"video_count": {\n                        "type": "integer",\n                        "description": "Number of recent videos to analyze for the report (default 10). Recommended: 10-15 for quick insights, 20-30 for comprehensive analysis of content patterns. More videos = more accurate pattern detection.",\n                        "default": 10\n                    }'
)

# Update analyze_trend
content = content.replace(
    '"name": "analyze_trend",\n            "description": "Analyze trending content on TikTok or Instagram by hashtag - pulls recent videos to identify trending patterns, common elements, and engagement trends. Use this when user asks about trends, wants to understand hashtag performance, or research trending topics. Examples: \'what\'s trending with #fitness on TikTok\', \'analyze #skincare trend\', \'show me trending #nike videos\'",',
    '"name": "analyze_trend",\n            "description": "Analyze trending content on TikTok or Instagram by hashtag(s) to identify what\'s currently viral, common content patterns, and trending formats. Use this when user asks what\'s trending with a topic, wants to understand hashtag performance, or needs to identify trending content strategies for campaign planning. The tool pulls recent trending videos using the hashtag(s) and analyzes patterns across them. Examples: \'what\'s trending with #fitness on TikTok\', \'analyze #skincare trend\', \'show me trending #nike videos\'",',
)

content = content.replace(
    '"hashtags": {\n                        "type": "array",\n                        "items": {"type": "string"},\n                        "description": "Hashtags to analyze (without # symbol). Examples: [\'fitness\'], [\'skincare\', \'beauty\'], [\'nike\']. Can be single or multiple tags."\n                    }',
    '"hashtags": {\n                        "type": "array",\n                        "items": {"type": "string"},\n                        "description": "Array of hashtag(s) to analyze (without # symbol). Can be single [\'fitness\'] or multiple [\'fitness\', \'gym\', \'workout\'] for broader analysis. Use trending or relevant hashtags for the user\'s industry/topic."\n                    }'
)

# Write back
with open(file_path, 'w') as f:
    f.write(content)

print("✅ All methods updated successfully!")
PYTHON_SCRIPT

# Run the Python script
python3 /tmp/finish_updates.py

echo "✅ Complete! All 12 methods now have comprehensive descriptions."

