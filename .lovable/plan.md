

## Update Content Filter Word List

Add the missing offensive words to the content filter to match the user's requirements.

### Changes

**File: `src/lib/contentFilter.ts`**

Update `BANNED_WORD_STEMS` array:

1. **Profanity section** - Add:
   - `dick` (separate from `dickhead`)
   - `ass`

2. **Sexual/explicit section** - Add new category after harassment-adjacent:
   - `porn`
   - `sexvideo`
   - `nudes`
   - `blowjob`
   - `handjob`
   - `sex`

The existing normalization logic (`text.toLowerCase().replace(/[^a-z]/g, "")`) already handles variations like `f*ck`, `sh1t`, `s3x`, etc. by stripping non-alphabetic characters before matching.

