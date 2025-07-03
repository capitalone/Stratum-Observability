<!-- View the posted content here: URL -->

# Product and Monitoring
## TL;DR

Add a observables to every product that accomplishes 3x2 things:

### 3 Flows:
1. Was initiated, i.e. “sign up form shown"
2. Was interacted with, i.e. “sign up button clicked”
3. Had error, i.e. “sign up error”

### 2 Layers:
1. Logging
    1. Should include external Platform integration (New Relic, Amplitude, etc.)
1. Event pushing
    1. Can include marketing analytics, if this is a separate need, as is typical in the larger orgs I’ve been a part of.


## Background
A few notes on scratching the itch of knowing when something is “down” or “up” and what it means to me.

Pushing code to production can cause some stress. Whether through convoluted process or procedures, there comes a moment when all of the work you and a team have completed will meet the real world. At different scales I’ve found this to mean very different things.

I take notice of what stakeholders and team members question as products and features are built. These questions drive what I strive to monitor. Typically they’re obvious capabilities like “did a user successfully see this feature” though sometimes it is less obvious like “was this feature loaded above or below the fold.”

Each of these questions can have a counterpart event generated from monitoring and dashboard based systems. I’ve created similar dashboards through Amplitude, AWS CloudWatch, BugSnag, Google Analytics, Splunk and most recently New Relic. I’ve found all of these to have their own nuances, but each served the purposes very well.

For the case of users seeing features, I’ve tried to bake in three custom metrics:
1. Loaded
2. Errored
3. Interacted

Through these three events I’ve found most of the questions asked of a product can be monitored. In fact I’d go a step further and say each of these three logs should be just that, layers of logs in the functional code! These can be toggled in lower environments to enable more verbose logging, similar to a local a debug mode, but with far less ad-hoc print statements.
