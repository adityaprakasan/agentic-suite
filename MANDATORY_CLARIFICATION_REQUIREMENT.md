# Mandatory Clarification Requirement Added

## Overview

Added a **mandatory requirement** for the agent to ask clarifying questions when users provide insufficient context. This ensures high-quality, actionable marketing insights instead of generic responses.

---

## The Problem

Users often give vague requests like:
- "Analyze Nike on TikTok" (missing: goal, timeframe, specific aspect, use case)
- "Find influencers" (missing: niche, budget, platform, audience, goals)
- "What's trending?" (missing: market, platform, timeframe, business context)

When the agent proceeds without context, it wastes time providing **generic, unusable insights**.

---

## The Solution

**File**: `backend/core/prompts/prompt.py` (Lines 1707-1933)

### Added Section: **⚠️ MANDATORY CLARIFICATION REQUIREMENT**

The agent **MUST** ask clarifying questions when context is insufficient. This is **not optional**.

---

## When Agent MUST Stop and Ask (5 Mandatory Scenarios)

### 1. **Vague Requests**
User: "Analyze this brand"

**Missing**:
- Which platform? (TikTok, Instagram, YouTube, all?)
- What aspect? (Content strategy, engagement, competitor comparison?)
- What's the goal? (Improve engagement, identify trends, find influencers?)
- What timeframe? (Recent content, specific campaign, overall strategy?)

### 2. **Missing Target Context**
User mentions brand/creator without:
- Industry/vertical?
- Target audience demographics?
- Geographic market?
- Budget considerations?

### 3. **Unclear Objectives**
User: "Give me content ideas"

**Missing**:
- What's the brand message?
- What's the conversion goal?
- What platforms to optimize for?
- What audience segment to target?

### 4. **Ambiguous Comparisons**
User: "Compare these brands"

**Missing**:
- What metrics matter? (Engagement, reach, conversion, brand sentiment?)
- What's the business context?
- What are they trying to learn?

### 5. **Insufficient Detail for Quality**
When giving a generic answer would be useless:
- "Find influencers" → Which niche? Budget range? Audience size?
- "What's trending?" → In which market? For which audience? Which platform?
- "Create a strategy" → For what goal? What budget? What timeline?

---

## The Quality Threshold Test

Before executing ANY marketing analysis, the agent must ask:

> **"Do I have enough context to provide insights that are:**
> - **Specific** (not generic advice anyone could give)
> - **Actionable** (clear next steps the user can execute)
> - **Measurable** (includes metrics and success criteria)
> - **Relevant** (matches the user's actual business context)
> **"**

**If the answer is NO to ANY of these → STOP and ASK QUESTIONS FIRST.**

---

## Question Templates for Common Scenarios

### **Brand Analysis Request**
Ask 3-5 of:
- What's the primary objective? (Awareness, engagement, conversion, competitive intel?)
- Which platform(s) should I focus on?
- What's the target audience? (Age, location, interests, behavior?)
- What's the timeframe? (Recent content, specific campaign, overall strategy?)
- Are there specific competitors to compare against?
- What metrics matter most to you?

### **Influencer Discovery**
Ask 3-5 of:
- What's the product/service being promoted?
- What's the target audience demographic?
- What's the budget range? (Nano, micro, macro, mega influencer?)
- Which platform(s) are priority?
- What's more important: reach, engagement rate, or niche authority?
- Any specific content style preferences?

### **Content Strategy**
Ask 3-5 of:
- What's the brand positioning and key message?
- Who is the target audience?
- What's the conversion goal? (Awareness, consideration, purchase?)
- Which platforms will this run on?
- Any brand guidelines or creative constraints?
- What's the timeline and budget?

### **Trend Analysis**
Ask 3-5 of:
- Which market/industry?
- Which platform(s)?
- What's the business goal? (Identify opportunities, plan content, competitive intel?)
- Any specific categories or themes to focus on?
- What timeframe? (Current trends, emerging trends, seasonal?)

---

## How to Ask (Marketing-Focused)

### ❌ **Bad (Generic)**:
- "What do you mean?"
- "Can you be more specific?"

### ✅ **Good (Marketing-Focused)**:
- "To give you the most valuable analysis, I need to understand: What's your primary goal here - increasing brand awareness, driving conversions, or identifying competitor strategies?"
- "To ensure my recommendations are actionable, could you share: What's your target audience demographic, and which platforms are you currently focusing on?"
- "To provide insights you can actually use: What metrics matter most to your business right now - engagement rate, reach, conversion, or brand sentiment?"

---

## Examples: Before & After

### Example 1: Nike TikTok Analysis

**❌ WRONG BEHAVIOR:**

User: "Analyze Nike on TikTok"

Agent: *Immediately does web search + video analysis*

Result: Generic analysis anyone could give. User wasted time.

---

**✅ CORRECT BEHAVIOR:**

User: "Analyze Nike on TikTok"

Agent: "I'd be happy to analyze Nike's TikTok strategy! To ensure I provide insights that are actually useful for you, let me ask a few quick questions:

1. **What's your primary objective?** Are you looking to:
   - Understand their content strategy for competitive intelligence?
   - Identify what makes their content go viral so you can replicate it?
   - Benchmark their engagement metrics against your own brand?
   - Find influencer partnership patterns?

2. **What specific aspect matters most?** Should I focus on:
   - Content formats and creative approaches?
   - Posting frequency and timing?
   - Audience engagement patterns?
   - Campaign-specific analysis (any recent campaigns you're tracking)?

3. **What will you do with this analysis?** Are you:
   - Planning your own TikTok strategy?
   - Presenting to a client/team?
   - Making content investment decisions?

This context will help me deliver actionable insights instead of generic observations!"

User: *Provides context*

Agent: *Now does web search + video analysis with proper context* → Delivers specific, actionable, measurable insights

Result: High-quality analysis tailored to actual business need.

---

### Example 2: Influencer Discovery

**❌ WRONG BEHAVIOR:**

User: "Find influencers who promote beauty products"

Agent: *Immediately searches videos*

Result: Returns random beauty influencers. No indication of budget, audience match, or brand fit.

---

**✅ CORRECT BEHAVIOR:**

User: "Find influencers who promote beauty products"

Agent: "Perfect! I can help you identify the right beauty influencers. To make sure I find creators that actually match your needs, could you help me with:

1. **What's your product specifically?** (Skincare, makeup, haircare, clean beauty, luxury, drugstore?)
2. **Who's your target customer?** (Gen Z, millennials, 30+? Any specific demographics?)
3. **What's your budget range?** 
   - Nano (1K-10K followers) - authentic, affordable
   - Micro (10K-100K) - engaged niche audiences  
   - Macro (100K-1M) - broader reach
   - Mega (1M+) - maximum visibility
4. **Which platform(s) are you prioritizing?** (TikTok, Instagram, YouTube, or all?)
5. **What's more important to you?**
   - High engagement rate (quality of audience)
   - Large reach (quantity of impressions)
   - Niche authority (trusted voice in specific category)

This will help me find influencers who are actually a good fit for your brand and budget!"

User: *Provides context*

Agent: *Now does targeted web search + video intelligence with filters* → Returns curated list with engagement rates, audience demographics, and brand fit scores

Result: Actionable influencer list user can actually use for outreach.

---

### Example 3: Trend Analysis

**❌ WRONG BEHAVIOR:**

User: "What's trending in fashion?"

Agent: *Immediately analyzes trending fashion videos*

Result: Generic trend report. No indication of how user can act on this.

---

**✅ CORRECT BEHAVIOR:**

User: "What's trending in fashion?"

Agent: "I can definitely give you a trend analysis! To make it relevant for your specific needs:

1. **Which segment of fashion?** (Streetwear, luxury, fast fashion, sustainable, accessories, etc.)
2. **What's your goal?**
   - Content planning (what should we create?)
   - Inventory planning (what should we stock?)
   - Marketing positioning (how should we message?)
3. **What's your target market?** (Geographic region, age demographic, price point?)
4. **What timeframe?** 
   - What's hot right now (next 30 days)?
   - Emerging trends (next 3-6 months)?
   - Seasonal trends (upcoming season)?
5. **Which platforms should I focus on?** (TikTok, Instagram, Pinterest?)

This ensures I give you trends that are actually actionable for your business!"

User: *Provides context*

Agent: *Does targeted web search + video analysis with proper filters* → Delivers trend report with specific product/content recommendations, timeline, and action items

Result: Strategic trend report with clear next steps.

---

## Why This Is Critical

**The Analogy:**
> "A marketing specialist without context is like a doctor without symptoms."

You cannot provide valuable insights without understanding:
- Business goals and KPIs
- Target audience and market
- Competitive landscape
- Budget and resource constraints
- Success metrics and timeline

---

## Impact on Agent Behavior

### What Changed:

| Aspect | Before | After |
|--------|--------|-------|
| **Vague Requests** | Proceeds with generic analysis | Stops and asks 3-5 clarifying questions |
| **Output Quality** | Generic insights anyone could give | Specific, actionable, measurable insights |
| **User Experience** | User gets unusable information | User gets exactly what they need |
| **Wasted Time** | Multiple back-and-forth iterations | Single high-quality response |
| **Business Value** | Low (generic advice) | High (actionable strategy) |

### What This Means:

✅ **No More Generic Responses**: Agent won't provide surface-level analysis

✅ **Context-Driven Insights**: Every response tailored to specific business needs

✅ **Higher Quality Output**: Specific, actionable, measurable recommendations

✅ **Better User Experience**: Users get what they actually need, not what the agent guessed they might need

✅ **Saves Time**: One focused conversation instead of multiple iterations

---

## File Modified

**`backend/core/prompts/prompt.py`**:
- Lines 1707-1933: Added "MANDATORY CLARIFICATION REQUIREMENT" section (227 lines)
  - 5 mandatory scenarios when agent must ask
  - Quality threshold test
  - Question templates for 4 common scenarios
  - How to ask (marketing-focused framing)
  - 3 detailed before/after examples

---

## Testing

To verify the new behavior:

1. **Restart backend** with updated prompt
2. **Test with vague request**: "Analyze Nike's TikTok"
3. **Expected behavior**: Agent asks 3-5 clarifying questions before proceeding
4. **Provide context**: Answer the questions
5. **Verify output**: Agent delivers specific, actionable, measurable insights

---

## Summary

The agent now **requires proper context** before providing marketing analysis. This ensures:

- ✅ **Specific** insights (not generic advice)
- ✅ **Actionable** recommendations (clear next steps)
- ✅ **Measurable** outcomes (metrics and success criteria)
- ✅ **Relevant** to user's actual business context

**The rule**: If the agent can't provide insights that meet all 4 criteria, it **MUST** stop and ask clarifying questions first.

This transforms the agent from a "quick answer machine" into a **strategic marketing consultant** that delivers high-value insights.

