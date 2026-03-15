# Performance Comparison: inline vs useLayoutEffect vs refCallback

**Analysis Date:** 2026-03-15
**Test Conditions:** 4x CPU Throttling (simulating slower device)

## Executive Summary

| Metric                  | inline  | useLayoutEffect | refCallback | Winner |
| ----------------------- | ------- | --------------- | ----------- | ------ |
| **Trace Duration**      | 5,338ms | 5,670ms         | 5,699ms     | inline |
| **Dropped Frames**      | 493     | 521             | 525         | inline |
| **Total Blocking Time** | 2,233ms | 2,495ms         | 2,607ms     | inline |
| **Scripting Time**      | 4,691ms | 4,907ms         | 4,861ms     | inline |
| **GC Time**             | 832ms   | 971ms           | 1,066ms     | inline |
| **Tasks >200ms**        | 5       | 10              | 10          | inline |

**Overall Winner: `inline`** - Demonstrates the best performance across all key metrics.

---

## Detailed Breakdown

### 1. Frame Performance

| Metric              | inline    | useLayoutEffect | refCallback |
| ------------------- | --------- | --------------- | ----------- |
| Total Frames        | 643       | 684             | 695         |
| Dropped Frames      | 493       | 521             | 525         |
| **Frame Drop Rate** | **76.7%** | **76.2%**       | **75.5%**   |
| Presented Frames    | 33        | 32              | 30          |

**Analysis:** All three implementations show high frame drop rates due to heavy main thread work. The frame drop rates are similar (~75-77%), indicating that the rendering pipeline is similarly stressed in all cases. However, `inline` completes the work in fewer total frames, suggesting faster overall execution.

### 2. Main Thread Blocking

| Metric                        | inline      | useLayoutEffect | refCallback |
| ----------------------------- | ----------- | --------------- | ----------- |
| Total Tasks                   | 393         | 388             | 394         |
| Tasks >50ms (Long Tasks)      | 33          | 33              | 31          |
| Tasks >100ms                  | 16          | 16              | 15          |
| Tasks >200ms                  | 5           | 10              | 10          |
| **Total Blocking Time (TBT)** | **2,233ms** | **2,495ms**     | **2,607ms** |

**Analysis:**

- `inline` has the lowest Total Blocking Time (TBT), which is the sum of time beyond 50ms for all long tasks
- `inline` has only 5 tasks exceeding 200ms, compared to 10 for both alternatives
- This means `inline` distributes work more evenly, avoiding extremely long blocking periods

### 3. Timing Breakdown

| Category               | inline  | useLayoutEffect | refCallback |
| ---------------------- | ------- | --------------- | ----------- |
| **Scripting**          | 4,691ms | 4,907ms         | 4,861ms     |
| Style Calculations     | 70ms    | 67ms            | 65ms        |
| Rendering/Composite    | 32ms    | 28ms            | 24ms        |
| **Garbage Collection** | 832ms   | 971ms           | 1,066ms     |

**Analysis:**

- `inline` spends ~216ms less on scripting than `useLayoutEffect` (4.4% improvement)
- Most significantly, `inline` triggers 28% less garbage collection than `refCallback`
- The lower GC time for `inline` suggests it creates fewer temporary objects or manages memory more efficiently

### 4. Long Task Analysis (Top 5 by Duration)

#### inline

| Rank | Duration | Notes              |
| ---- | -------- | ------------------ |
| 1    | 266ms    | Peak blocking task |
| 2    | 229ms    |                    |
| 3    | 222ms    |                    |
| 4    | 204ms    |                    |
| 5    | 202ms    |                    |

#### useLayoutEffect

| Rank | Duration | Notes              |
| ---- | -------- | ------------------ |
| 1    | 256ms    | Peak blocking task |
| 2    | 246ms    |                    |
| 3    | 223ms    |                    |
| 4    | 218ms    |                    |
| 5    | 216ms    |                    |

#### refCallback

| Rank | Duration | Notes              |
| ---- | -------- | ------------------ |
| 1    | 255ms    | Peak blocking task |
| 2    | 240ms    |                    |
| 3    | 240ms    |                    |
| 4    | 229ms    |                    |
| 5    | 228ms    |                    |

**Analysis:** While `inline` has the longest single task (266ms), its subsequent tasks drop off more quickly. `useLayoutEffect` and `refCallback` have more consistently long tasks in the 215-245ms range.

### 5. Function Call Statistics

All three implementations show React's scheduler as the dominant function:

| Function                           | inline   | useLayoutEffect | refCallback |
| ---------------------------------- | -------- | --------------- | ----------- |
| `performWorkUntilDeadline` (total) | 4,580ms  | 4,805ms         | 4,743ms     |
| `performWorkUntilDeadline` (avg)   | 68.4ms   | 73.9ms          | 72.9ms      |
| `performWorkUntilDeadline` (max)   | 256ms    | 249ms           | N/A         |
| `performWorkUntilDeadline` (count) | 67 calls | 65 calls        | N/A         |

**Analysis:** The `inline` approach results in shorter average scheduler work batches (68.4ms vs 73.9ms), contributing to its lower Total Blocking Time.

---

## Performance Rankings

### By Total Blocking Time (Lower is Better)

1. **inline** - 2,233ms
2. useLayoutEffect - 2,495ms (+262ms / +11.7%)
3. refCallback - 2,607ms (+374ms / +16.8%)

### By Scripting Time (Lower is Better)

1. **inline** - 4,691ms
2. refCallback - 4,861ms (+170ms / +3.6%)
3. useLayoutEffect - 4,907ms (+216ms / +4.6%)

### By GC Pressure (Lower is Better)

1. **inline** - 832ms
2. useLayoutEffect - 971ms (+139ms / +16.7%)
3. refCallback - 1,066ms (+234ms / +28.1%)

### By Trace Duration (Lower is Better)

1. **inline** - 5,338ms
2. useLayoutEffect - 5,670ms (+332ms / +6.2%)
3. refCallback - 5,699ms (+361ms / +6.8%)

---

## Recommendations

### Use `inline` when:

- Performance is critical
- You want to minimize garbage collection overhead
- You need the shortest possible execution time
- You want to reduce Total Blocking Time (better interactivity)

### Considerations for `useLayoutEffect`:

- +11.7% higher Total Blocking Time than inline
- Higher GC pressure (+16.7%)
- May be necessary when you need synchronous DOM measurements before browser paint

### Considerations for `refCallback`:

- +16.8% higher Total Blocking Time than inline
- Highest GC pressure (+28.1%)
- Useful when you need to react to ref changes or when refs are set conditionally

---

## Technical Notes

- All traces recorded with **4x CPU throttling** to simulate mobile device performance
- Traces captured from Chrome DevTools Performance panel
- Total Blocking Time (TBT) measures time spent on tasks >50ms beyond the 50ms threshold
- Frame rate target: 60 FPS (16.67ms per frame)
- High frame drop rates across all implementations suggest the workload is CPU-intensive regardless of approach

---

## File Information

| File                    | Compressed Size | Uncompressed Size | Events    |
| ----------------------- | --------------- | ----------------- | --------- |
| inline.json.gz          | 14.5 MB         | 230 MB            | 1,200,296 |
| useLayoutEffect.json.gz | 15.7 MB         | 257 MB            | 1,351,518 |
| refCallback.json.gz     | 16.2 MB         | 268 MB            | 1,422,275 |
