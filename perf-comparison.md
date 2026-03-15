# Performance Comparison: inline vs useLayoutEffect vs refCallback

**Analysis Date:** 2026-03-15
**Test Conditions:** 4x CPU Throttling (simulating slower device)

## Executive Summary (Normalized)

Since trace durations varied (5,338ms to 5,699ms), metrics are normalized for fair comparison:

| Metric                      | inline | useLayoutEffect | refCallback | Winner      |
| --------------------------- | ------ | --------------- | ----------- | ----------- |
| **TBT % of Duration**       | 41.8%  | 44.0%           | 45.8%       | inline      |
| **GC % of Duration**        | 15.6%  | 17.1%           | 18.7%       | inline      |
| **Scripting % of Duration** | 87.9%  | 86.6%           | 85.3%       | refCallback |
| **Frame Drop Rate**         | 76.7%  | 76.2%           | 75.5%       | refCallback |
| **Long Tasks >200ms/sec**   | 0.94   | 1.76            | 1.75        | inline      |

**Overall Winner: `inline`** - Wins on blocking time (TBT), GC pressure, and severe long task frequency.

**Note:** `refCallback` technically has the lowest frame drop rate and scripting percentage, but the differences are marginal (~1-2%). The more significant differences are in TBT and GC overhead where `inline` has a clear advantage.

---

## Normalized Metrics (Per Second / Percentage)

| Metric                      | inline    | useLayoutEffect | refCallback |
| --------------------------- | --------- | --------------- | ----------- |
| Trace Duration              | 5,338ms   | 5,670ms         | 5,699ms     |
| Dropped Frames/sec          | 92.3      | 91.9            | 92.1        |
| Frame Drop Rate             | 76.7%     | 76.2%           | 75.5%       |
| **TBT/sec (ms)**            | **418**   | 440             | 458         |
| **TBT % of Duration**       | **41.8%** | 44.0%           | 45.8%       |
| Scripting % of Duration     | 87.9%     | 86.6%           | 85.3%       |
| **GC % of Duration**        | **15.6%** | 17.1%           | 18.7%       |
| Long Tasks (>50ms)/sec      | 6.18      | 5.82            | 5.44        |
| **Long Tasks (>200ms)/sec** | **0.94**  | 1.76            | 1.75        |

---

## Raw Metrics (Absolute Values)

| Metric              | inline  | useLayoutEffect | refCallback |
| ------------------- | ------- | --------------- | ----------- |
| Trace Duration      | 5,338ms | 5,670ms         | 5,699ms     |
| Total Frames        | 643     | 684             | 695         |
| Dropped Frames      | 493     | 521             | 525         |
| Total Blocking Time | 2,233ms | 2,495ms         | 2,607ms     |
| Scripting Time      | 4,691ms | 4,907ms         | 4,861ms     |
| GC Time             | 832ms   | 971ms           | 1,066ms     |
| Tasks >50ms         | 33      | 33              | 31          |
| Tasks >100ms        | 16      | 16              | 15          |
| Tasks >200ms        | 5       | 10              | 10          |

---

## Detailed Analysis

### Total Blocking Time (TBT)

TBT measures the sum of time beyond 50ms for all long tasks - a key interactivity metric.

| Approach        | TBT     | TBT % of Duration | vs inline |
| --------------- | ------- | ----------------- | --------- |
| **inline**      | 2,233ms | 41.8%             | baseline  |
| useLayoutEffect | 2,495ms | 44.0%             | +5.3%     |
| refCallback     | 2,607ms | 45.8%             | +9.6%     |

**Interpretation:** `inline` spends proportionally less time blocking the main thread, leading to better potential interactivity.

### Garbage Collection

| Approach        | GC Time | GC % of Duration | vs inline |
| --------------- | ------- | ---------------- | --------- |
| **inline**      | 832ms   | 15.6%            | baseline  |
| useLayoutEffect | 971ms   | 17.1%            | +9.6%     |
| refCallback     | 1,066ms | 18.7%            | +19.9%    |

**Interpretation:** `inline` creates less memory pressure. `refCallback` triggers ~20% more GC relative to its trace duration.

### Severe Long Tasks (>200ms)

| Approach        | Count | Per Second | vs inline |
| --------------- | ----- | ---------- | --------- |
| **inline**      | 5     | 0.94/sec   | baseline  |
| useLayoutEffect | 10    | 1.76/sec   | +87%      |
| refCallback     | 10    | 1.75/sec   | +86%      |

**Interpretation:** `inline` has half the rate of severe blocking tasks, meaning smoother execution with fewer major jank events.

### Frame Performance

| Approach        | Drop Rate | Dropped/sec |
| --------------- | --------- | ----------- |
| inline          | 76.7%     | 92.3        |
| useLayoutEffect | 76.2%     | 91.9        |
| **refCallback** | **75.5%** | 92.1        |

**Interpretation:** Frame drop rates are essentially equivalent (~1% difference). All approaches struggle equally with frame delivery due to heavy CPU work.

---

## Long Task Distribution (Top 5)

#### inline

| Rank | Duration |
| ---- | -------- |
| 1    | 266ms    |
| 2    | 229ms    |
| 3    | 222ms    |
| 4    | 204ms    |
| 5    | 202ms    |

#### useLayoutEffect

| Rank | Duration |
| ---- | -------- |
| 1    | 256ms    |
| 2    | 246ms    |
| 3    | 223ms    |
| 4    | 218ms    |
| 5    | 216ms    |

#### refCallback

| Rank | Duration |
| ---- | -------- |
| 1    | 255ms    |
| 2    | 240ms    |
| 3    | 240ms    |
| 4    | 229ms    |
| 5    | 228ms    |

**Analysis:** `inline` has one outlier (266ms) but its other long tasks are shorter. `useLayoutEffect` and `refCallback` have more consistently severe long tasks.

---

## Recommendations

### Use `inline` when:

- You want the lowest Total Blocking Time (best interactivity)
- You want to minimize GC overhead (-20% vs refCallback)
- You need fewer severe jank events (half the rate of >200ms tasks)

### Consider `useLayoutEffect` when:

- You need synchronous DOM measurements before browser paint
- Accept +5% higher TBT and +10% more GC overhead

### Consider `refCallback` when:

- You need to react to ref attachment/detachment
- Refs are conditionally rendered
- Accept +10% higher TBT and +20% more GC overhead

---

## Technical Notes

- All traces recorded with **4x CPU throttling** to simulate mobile device performance
- Traces captured from Chrome DevTools Performance panel
- Total Blocking Time (TBT) = sum of (task_duration - 50ms) for all tasks >50ms
- Frame rate target: 60 FPS (16.67ms per frame)
- High frame drop rates (~76%) across all implementations indicate CPU-bound workload

---

## File Information

| File                    | Compressed | Uncompressed | Events    | Duration |
| ----------------------- | ---------- | ------------ | --------- | -------- |
| inline.json.gz          | 14.5 MB    | 230 MB       | 1,200,296 | 5,338ms  |
| useLayoutEffect.json.gz | 15.7 MB    | 257 MB       | 1,351,518 | 5,670ms  |
| refCallback.json.gz     | 16.2 MB    | 268 MB       | 1,422,275 | 5,699ms  |
