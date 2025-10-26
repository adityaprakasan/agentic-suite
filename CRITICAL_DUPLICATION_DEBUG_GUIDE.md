# 🚨 CRITICAL: Text Duplication Bug - Debug & Fix Guide

**Date**: 2025-10-26  
**Bug**: Every word/character duplicated during streaming  
**Impact**: 🔥 BLOCKS ALL FUNCTIONALITY  

---

## 🐛 **The Bug**

**What You See**:
```
"Ad Adenticentic Video Video Intelligence Intelligence Analysis Analysis:: Nike Nike on on Tik TikTokTok"

"<<functionfunction_calls_calls>>"
```

**Expected**:
```
"Adentic Video Intelligence Analysis: Nike on TikTok"

"<function_calls>"
```

**Pattern**: Every word/character is duplicated!

---

## 🔍 **Diagnostic Steps**

### **Step 1: Test If It's Global or Video-Specific**

**Try a simple query**:
```
"hello, how are you?"
```

**If duplicated** → Global LLM/streaming issue
**If NOT duplicated** → Video intelligence specific

### **Step 2: Check Backend Logs**

Add this to `response_processor.py` line 366:
```python
if delta and hasattr(delta, 'content') and delta.content:
    chunk_content = delta.content
    print(f"🔍 CHUNK: '{chunk_content}'", flush=True)  # See raw LLM output
    logger.info(f"CHUNK: '{chunk_content}'")
    
    accumulated_content += chunk_content
    print(f"🔍 ACCUM (last 100): '{accumulated_content[-100:]}'", flush=True)
```

**This will show**:
- ✅ Is LLM sending duplicated chunks?
- ✅ Is accumulation logic broken?
- ✅ Where duplication starts?

### **Step 3: Check LLM Provider**

**Possible LLM Issues**:
1. Model generating duplicated tokens
2. Temperature too high causing repetition
3. Sampling parameters causing loops

**Check**: Which LLM is being used? (Anthropic, OpenAI, etc.)

---

## 🔧 **Potential Fixes**

### **Fix #1: If LLM Is Generating Duplicates**

**Check LLM settings** in `run.py` or config:
```python
# Look for:
temperature = ?  # Should be 0.7-1.0
top_p = ?        # Should be ~0.9
presence_penalty = ?  # Might cause repetition if too high
```

**Solution**: Adjust sampling parameters

### **Fix #2: If Streaming Logic Duplicates**

**Check** if there's double iteration:
```python
# In response_processor.py
async for chunk in llm_response:
    # Is this loop being run twice somehow?
    # Is chunk being yielded twice?
```

**Solution**: Ensure single yield per chunk

### **Fix #3: If Frontend Duplicates**

**Frontend might be rendering twice**. Check:
```tsx
// In ThreadContent.tsx or useAgentStream
// Is streamingTextContent being appended to itself?
setTextContent(prev => [...prev, newContent])  // ✅ Correct
// vs
setTextContent(prev => [...prev, ...prev, newContent])  // ❌ Would duplicate!
```

**Solution**: Fix accumulation logic

### **Fix #4: If It's a Known SSE Bug**

**Server-Sent Events might be duplicating**. Check:
```python
# In agent_runs.py line 454
for response in initial_responses:
    yield f"data: {json.dumps(response)}\n\n"

# Are initial_responses already duplicated?
# Is this being called twice?
```

**Solution**: Deduplicate or check Redis data

---

## 🎯 **Quick Workaround (Frontend)**

While debugging backend, you can clean duplicates in frontend:

```tsx
// In ThreadContent.tsx line 118, add de-duplication:
content = content.replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, '');

// Add this:
content = deduplicate TextStream(content);

function deduplicateTextStream(text: string): string {
  // Pattern: "Word Word" → "Word"
  return text.replace(/(\b\w+\b)\s+\1/g, '$1');
}
```

**This won't fix the root cause but will make it readable!**

---

## 🚨 **Most Likely Cause** (Based on Pattern)

Looking at "Ad Adenticentic Video Video", this suggests:

**Token-level duplication where each LLM token is being repeated:**
- Token 1: "Ad" → Appears as "Ad Ad"  
- Token 2: "entic" → Appears as "entic entic" → Combined: "Ad Adenticentic"

**This could be**:
1. ✅ **LLM provider issue** - Model hallucinating/repeating
2. ✅ **Prompt issue** - Something in prompt causing repetition
3. ✅ **Streaming wrapper** - Each chunk being yielded twice

---

## 📊 **Debugging Checklist**

- [ ] Test with simple query (not video intelligence)
- [ ] Check which LLM provider/model is being used
- [ ] Add logging to see raw LLM chunks
- [ ] Check if `yield chunk` is being called twice
- [ ] Check if Redis has duplicated data
- [ ] Inspect actual SSE stream in browser DevTools (Network tab)
- [ ] Test with different LLM model
- [ ] Check if this happens ONLY with tool calls or always

---

## 🎯 **Immediate Actions**

### **1. Check Browser DevTools**:
- Open Network tab
- Filter for "stream"
- Look at SSE events
- See if duplication is in the raw stream data

### **2. Check Backend Terminal**:
- Look for duplicated print statements
- See if chunks are being logged twice

### **3. Test Different Query**:
- Try: "what is 2+2?"
- If also duplicated → Global issue
- If NOT duplicated → Video tool specific

---

## 🔧 **Emergency Frontend Fix**

Add to `ThreadContent.tsx` after line 118:

```typescript
// Clean up verbose function call content for better UX
content = content.replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, '');

// 🚨 EMERGENCY FIX: Remove word-level duplication
content = content.replace(/(\b\w+\b)(\s+)\1/g, '$1$2');  // "Word Word" → "Word "
content = content.replace(/([<>\/\w]+)\1/g, '$1');  // "<<tag>>" → "<tag>"
```

**This is a BAND-AID but will make it readable while you debug the root cause!**

---

## 📝 **Summary**

**Bug**: Text duplicated word-by-word during streaming  
**Impact**: Chat completely unreadable  
**Status**: 🚨 CRITICAL - Blocks all functionality  
**Root Cause**: Unknown (needs debugging)  
**Likely Source**: LLM provider, streaming wrapper, or prompt issue  
**Quick Fix**: Frontend de-duplication regex  
**Proper Fix**: Find where duplication starts in backend  

---

**PRIORITY**: **Fix this BEFORE anything else!** Nothing else matters if users can't read the output! 🔥

