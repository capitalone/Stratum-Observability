> You can view the shared version of this here: https://medium.com/@jasonvanderslice/stratum-at-a-high-level-4d78a3bdd67a

## Stratum at a High Level

### Before I begin...
After 12 years of coding for many organizations, I’ve finally found a path to clean, observable data. Here’s a high-level look at that journey—and how Stratum feels like finding the perfect resolution and frame rate for your soon-to-be favorite display.

<!-- ![Spectrum of observability](8.gif) -->

### 1. Acknowledging the Chaos

I'm convinced that our gateway logs are trapping us. Fixating on requests and responses has created a banking system of deposits (our releases) and withdrawals (our KPIs). Yet, if you sat a sample-sized version of your user base in a room and asked, “Is the app/service we provide you working?” you'd hear a storm of feedback. These responses are hidden from our out-of-the-box logs and metrics.

These people want to be heard; they want to be seen, but how can we find them in our messy streams of logging? Keeping track of what each feature is meant to achieve can feel like chasing a moving target.

Often, bogged down by ideas, processes, and deadlines, I play in a field of paying lip service to best practices. The first few whispers are to full test coverage and observability. But why test something non-existent or worry about its functionality? How can we even measure success when we do not yet agree on what each word means?

One of my North Stars in collaborating on apps is to listen to the answer to the question, “What about this keeps you up at night?” Is it infrastructure? Is it lost intentions drowned by the noise of developer lifecycles? Each day can feel like a tornado of tasks, priorities, and my own hopes and dreams. The last place I want to find myself is fueling the storms keeping me from focusing on the through-lines.

Without a clear structure, important insights get lost, and developers spend precious time untangling data rather than delivering impactful features, increasing the risk of data chaos and missed opportunities.

The most pain from the code I write seems to be when it negatively affects those who consume or answer for it. These can be perception issues or obvious errors—sometimes the result of shaky decisions or too many rabbit holes. Like a messy kitchen that has never had mise en place at the forefront.

### 2. Auto Metrics and Custom Metrics

Clamoring for an easy solution (auto metrics) while playing closer to pragmatism with custom-rolled code in each app. Most teams have opted for out-of-the-box solutions, while some teams chose to make their own paths. None of these teams, however, survived the realities of deadlines and shifting requirements.

Custom metrics are great; they can bolster a shaky understanding of the fundamentals of what a codebase is doing. They’re little explorers for those who write them—unfortunately, they often become nightmares for those who didn’t.

With data points being auto-generated for JavaScript errors and API calls, some teams are able to stitch together service health reports, alerts, and dashboards that convey meaningful insights for components of a system. These buckets would fill and provide insights they could track, but they didn’t provide signals of what people were truly experiencing. It’s like tracking the time it takes a page to load, but ignoring the time a user spends completing their main task.

Wait, what do they really do, and how do they accomplish it? We’ve always had KPIs to understand the app’s intent (albeit unclearly), but these were driven by long-term reports. Such insights are useless for real-time deployment health or A/B testing across different user contexts. Since the original intent was to try to capture everything, there were long processing times, many failure points, and, most of all, auto-generated logs that were a disaster to understand and query. The complexity was pushed to the bottom end of the data flow.

<!-- ![Auto eventing illustrated with complex queries](3.png) -->

This forced investment from each team to roll their own logging, metrics, and events. Each team innovated in a silo, giving themselves insights from "their side" of integrations. Velocity was no concern here. Rapid iteration on behind-the-scenes ideas and flashy rollouts across many teams.

Teams often find themselves forced to create custom metrics, which work temporarily for them but rarely scale across contexts. They navigate an endless maze of inconsistent data, each team speaking its own language and paying the cost of that inconsistency later.

<!-- ![Custom events limiting confusion from auto eventing, but still driving cost/confusion upwards](4.png) -->

### 3. Unconnected tissues, causing confusion

Streams and streams of incoherent data were piling up, creating confusion around what “healthy” even looked like. Important tags and ignored tags were treated the same, infusing debt into the data at the time of creation. No teams could single-handedly understand which way was up—let alone deliver a change to production. Each function thrived on its own, but fell silently into chaos when measuring what people had experienced.

### 4. Source of Truth

At a certain level, most people want simplicity, clear ownership, and a place to understand growth. By default, there are no standardized places in applications to see, “This is all the data my app can emit.” One of the core tenets of reusability is to keep everything in a single place. Somewhere to “import” references, versus redefining the same information in multiple places. This reduces long-term upkeep and improves the agility of application changes with new requirements.

In the illustration above, notice how each stage of event handling—from auto metrics to custom metrics—reveals a gradual shift toward clarity. Each step represents a progression toward Stratum’s end goal: data simplicity at scale.

<!-- ![Stratum's catalogs standardizing at the time of creation](5.png) -->

Each line of code has an opportunity to work in harmony with the last or redefine the future. Lacking boundaries for what best practice looks like at a code level, we’re left without real-time measures of success. How can we know that we’re emitting the correct event when the emission of that event is “fire and forget” (at best)?

With a Stratum Catalog, you can easily view what observability events an application can emit; we’ve even used them to create meta-reporting to know if the events are healthy.

### 5. Stratum Publishing

I’ve developed code in dozens of teams and had the opportunity to work in many organizations. This spectrum of silence and chaos followed me through all. Capital One is the first organization to realize the true power of standardized data at scale, and Stratum is living proof of that.

Stratum’s Catalog and `.publish()` method act like allies on this journey, helping developers standardize and simplify the data landscape. With a single command, `.publish()` turns intention into action, making data speak the same language across teams.

In our ever-evolving landscape of distributed and component-based code, it becomes possible again to understand if integrations between apps are really behaving. Not waiting until a failed web request hits the log, but finding it as the person gets stuck at the JavaScript input validator.

Ready to feel the difference that unified, meaningful metrics can make? Try Stratum today and transform how your applications handle data.

Please go ahead and give it a whirl. Convert your expectations of what the application does to Stratum Catalogs. Orchestrate the publishing of those events with Stratum’s `.publish()` method. Most of all, enjoy the consistency of clean queries that give each of your applications the ability to speak in the same voice.

#### About the writer
I'm [Jason Vanderslice](https://github.com/jasonvanderslice) a writer of observable code, staring down the boughs of occasional success to find rough edges of the next failure... ideally when it’s a visible blip.
