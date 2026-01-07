# 🚀 Performance Benchmarks

To validate the efficiency of the Inverted Index Algorithm, I performed load testing using **Autocannon**. The benchmarks were executed in three stages to isolate CPU-bound algorithmic performance from network and database overhead. A small sample dataset (`sample_50k.csv`) is included to validate indexing and seeding logic, while performance benchmarks were run against a production-scale dataset of approximately one million records.

### ⚙️ Test Environment
To ensure reproducibility, the following configuration was used:
*   **Machine:** Intel i7-12650H, 32 GB RAM
*   **OS:** Ubuntu / Linux
*   **Node Version:** v20.x (Production Build)
*   **Autocannon Config:** 10 connections, 10-second duration.

*> Note: Results reflect the tested concurrency level and are not intended as a theoretical maximum. All tests were run on a single Node.js process using the default event loop (no worker threads).*


### 1. Baseline: Single-Term Query (Algorithm Only)
*   **Conditions:** In-memory search only (DB disabled). Query: `?q=echo`.
*   **Result:** The dominant operation is an **amortized O(1) hash lookup**, resulting in near-zero application-level latency.

```text
┌─────────┬──────┬───────┬───────┬──────────┐
│ Stat    │ 50%  │ 99%   │ Avg   │ Max      │
├─────────┼──────┼───────┼───────┼──────────┤
│ Latency │ 0 ms │ 0 ms  │ 0.01ms│ 17 ms    │
│ Req/Sec │ 43k  │ 44k   │ 42,464│ 35,824   │
└─────────┴──────┴───────┴───────┴──────────┘
```
**Outcome:** The engine handles **~42,400 requests per second** when the query complexity is low.


### 2. Stress Test: Complex Intersection (Algorithm Only)
*   **Conditions:** In-memory search only. Query: `?q=black cable`.
*   **Challenge:** This requires intersecting two massive datasets (approx. 100k IDs each).
*   **Optimization:** Implemented a **Set-based Intersection Algorithm** that sorts term frequencies from smallest to largest to minimize loop iterations.

```text
┌─────────┬───────┬────────┬──────────┬──────────┐
│ Stat    │ 50%   │ 99%    │ Avg      │ Max      │
├─────────┼───────┼────────┼──────────┼──────────┤
│ Latency │ 31 ms │ 126 ms │ 43.06 ms │ 151 ms   │
│ Req/Sec │ 210   │ 308    │ 229.1    │ 135      │
└─────────┴───────┴────────┴──────────┴──────────┘
```
**Outcome:** Even under heavy computational load (intersecting 200k+ integers per request), the node maintains **~229 req/sec**.


### 3. Real-World Scenario: End-to-End (Hybrid Architecture)
*   **Conditions:** Algorithm + Database Fetch (Supabase/Postgres). Query: `?q=black cable`.
*   **Context:** This includes the network round-trip from the API Server (Local) to the Database (Frankfurt, Germany).

```text
┌─────────┬───────┬────────┬──────────┬──────────┐
│ Stat    │ 50%   │ 99%    │ Avg      │ Max      │
├─────────┼───────┼────────┼──────────┼──────────┤
│ Latency │ 81 ms │ 160 ms │ 88.92 ms │ 792 ms   │
│ Req/Sec │ 121   │ 126    │ 111.1    │ 26       │
└─────────┴───────┴────────┴──────────┴──────────┘
```
*> Note: The Max Latency outlier (792ms) is attributed to occasional Garbage Collection (GC) pauses or cross-region network jitter during the test.*

### 📊 Latency Breakdown
By comparing the algorithm-only stress test with the end-to-end result, we can derive the cost breakdown:

*   **Total Avg Latency:** 89ms
*   **Algorithm Processing:** ~43ms *(Measured)*
*   **Infrastructure Overhead (Network + DB):** ~46ms *(Derived)*


### 4. Memory Optimization (The Free-Tier Challenge)

To deploy this architecture on a **Render Free Tier** instance (limited to 512MB RAM), I encountered a physical hardware constraint.

**The Problem:**
During initial testing with the String-based index (`Map<string, string[]>`), the application failed to handle the full dataset. The Node.js process encountered an **Out-Of-Memory (OOM) crash** when indexing reached approximately **800,000 rows**, as the overhead of storing millions of string references exceeded the container's memory limit.

**The Solution:**
I refactored the indexing architecture to implement an **Integer Mapping Strategy**:
1.  Created a "Rosetta Stone" array to map raw ASIN strings to internal **32-bit Integers**.
2.  Converted the Inverted Index to store lightweight `number[]` instead of heavy `string[]`.
3.  Deferred the retrieval of the actual string IDs until the final step of the search process.

**The Result:**
This optimization allowed the successful deployment of a **500,000-rows demo** on the free micro-instance.
*   **Final Heap Usage:** 185 MB (Stable)
*   **Status:** The system now runs with significant memory headroom, preventing Garbage Collection thrashing and ensuring consistent uptime.

#### **5. Optimization Case Study: Boot-time & Memory Management**
**Challenge:** Initial deployment on memory-constrained hardware (512MB) failed due to a 214s cold-start time and OOM (Out of Memory) crashes during index hydration.

**The Engineering Fixes:**

*   **I/O Bottleneck:** Migrated from offset-based pagination to **Keyset Pagination**, reducing database ingestion time by 93%.
*   **Memory Pressure:** Identified that synchronous processing was causing **Event Loop Starvation**, preventing the Node.js Garbage Collector from executing. 
*   **The Solution:** Implemented a **Micro-task yielding strategy** (using `setTimeout`) every 5k records. This allowed the GC to reclaim heap space during the ingestion process.
 
**Impact:** 
*   **Boot time:** 214s → 14.99s.
*   **Heap Stability:** Peak memory dropped from 287MB to 175MB.

