# **MASTER\_SPEC.md**

# **Celebration Atlas — Master System Specification**

## **Project Vision**

Celebration Atlas is building a long-term cultural intelligence platform centered around public gathering events.

The system is designed to discover, preserve, analyze, and understand festivals, fairs, parades, conventions, carnivals, seasonal attractions, and community events.

The platform combines:

* event discovery  
* cultural archiving  
* intelligence gathering  
* semantic normalization  
* AI-assisted analysis  
* long-term historical preservation

The system is intended to evolve into a statewide and potentially national event intelligence layer.

---

# **CORE PHILOSOPHY**

Celebration Atlas is not merely collecting event listings.

The platform is designed to:

* preserve cultural memory  
* identify patterns in human gathering behavior  
* support future intelligence systems  
* support semantic querying  
* preserve uncertainty rather than forcing false certainty  
* separate raw signals from verified truth  
* create an extensible foundation for future agents

The system should think like an investigator, archivist, and intelligence platform rather than a simple scraper.

---

# **PRIMARY SYSTEM OBJECTIVES**

1. Discover all meaningful public gathering events.  
2. Preserve source lineage.  
3. Normalize event identity.  
4. Reduce duplicate fragmentation.  
5. Build canonical verified event records.  
6. Support future enrichment and intelligence agents.  
7. Preserve historical discovery snapshots.  
8. Support semantic and vector search.  
9. Build long-term operational intelligence.  
10. Create scalable event infrastructure.

---

# **EVENT DEFINITION**

An “event” may include:

* festivals  
* fairs  
* parades  
* carnivals  
* conventions  
* expos  
* concerts  
* art fairs  
* food events  
* races  
* holiday events  
* seasonal attractions  
* community celebrations  
* agricultural events  
* cultural gatherings  
* unique Michigan events

The system should not narrowly interpret “festival.”

---

# **CORE ARCHITECTURE PRINCIPLE**

The system separates:

candidate discovery

from:

canonical verified truth

Core pipeline:

discovery\_sources  
→ discovery\_runs  
→ event\_candidates  
→ duplicate review  
→ verified events  
→ enrichment/intelligence layers

This separation is critical.

Unverified discovery data must never automatically become canonical event data.

---

# **AGENT ARCHITECTURE**

The platform is designed around modular agents.

---

# **AGENT 1 — EVENT DISCOVERY AGENT**

Purpose:

* discover statewide event candidates  
* preserve source evidence  
* normalize event identity  
* identify duplicates  
* prepare future enrichment

Responsibilities:

* source discovery  
* event candidate extraction  
* basic normalization  
* duplicate signaling  
* source lineage preservation

Agent 1 prioritizes breadth over depth.

---

# **FUTURE AGENTS**

Future agents may include:

* Verification Agent  
* Event Intelligence Agent  
* Social Intelligence Agent  
* Vendor Intelligence Agent  
* Economic Intelligence Agent  
* Spatial Intelligence Agent  
* Field Intelligence Agent  
* Sensor Intelligence Agent  
* Reporting & Export Agent

Future agents should extend the architecture rather than replace it.

---

# **SOURCE DISCOVERY PHILOSOPHY**

The system prioritizes:

Tier 1:

* official event websites  
* municipal websites  
* chamber sites  
* tourism bureaus  
* official social pages

Tier 2:

* local news  
* regional tourism sites  
* Eventbrite  
* FestivalNet  
* event calendars

Tier 3:

* blogs  
* forums  
* social posts  
* community calendars

Weak signals should be preserved when potentially valuable.

---

# **STRATEGIC DISCOVERY INFRASTRUCTURE**

The platform recognizes certain discovery sources as especially valuable.

Examples:

* carnival route calendars  
* midway provider schedules  
* convention center calendars  
* tourism master calendars  
* chamber event systems  
* fair association schedules  
* vendor networks

These sources often expose hidden or overlooked events.

---

# **SOURCE LINEAGE REQUIREMENT**

All major discoveries should preserve:

* source URL  
* source type  
* discovery timestamp  
* source confidence  
* excerpts when possible

Lineage is considered critical system intelligence.

---

# **SEMANTIC NORMALIZATION**

The system should normalize:

* event names  
* location naming  
* recurrence patterns  
* event types  
* relationships  
* source classifications

Normalization should preserve ambiguity rather than hide uncertainty.

---

# **DISCOVERY SNAPSHOTS**

Discovery runs generate JSON snapshots.

Snapshots are considered first-class intelligence artifacts.

Snapshots must:

* never overwrite prior runs  
* preserve historical state  
* support future auditing  
* support future reprocessing

Recommended storage path:

events/discovery/\[YYYY-MM-DD\]-discovery.json

---

# **DATABASE PRINCIPLES**

The database must support:

* extensibility  
* source traceability  
* candidate separation  
* semantic search  
* vector search  
* future agent interoperability  
* historical preservation

The schema should avoid over-engineering while remaining expandable.

---

# **COST GOVERNANCE**

The system must support operational cost tracking.

Discovery runs should support:

* estimated\_cost  
* actual\_cost  
* approval workflows  
* over-budget protection

Early versions may use manual governance.

---

# **REVIEW-FIRST PRINCIPLE**

The system should prefer:

human review

over:

aggressive automation

Especially for:

* duplicate merging  
* event verification  
* canonical promotion  
* ambiguous discoveries

Automation may increase later after confidence improves.

---

# **CURRENT MVP SCOPE**

Version one should support:

* source management  
* manual JSON snapshot import  
* event candidate review  
* duplicate review  
* verified event promotion  
* source lineage preservation

Version one should NOT include:

* autonomous crawling  
* uncontrolled scraping  
* real-time monitoring  
* social media ingestion  
* field sensors  
* heatmaps  
* advanced enrichment systems

These systems come later.

---

# **LONG-TERM SYSTEM GOALS**

Long-term goals may include:

* statewide event intelligence  
* economic pattern analysis  
* vendor ecosystems  
* tourism analysis  
* crowd behavior analysis  
* environmental/context intelligence  
* AI-assisted event analysis  
* cultural preservation systems  
* semantic event search  
* spatial intelligence systems  
* historical event simulation support

The architecture should support growth without repeated rebuilds.

---

# **FINAL PRINCIPLE**

Celebration Atlas is building a long-term intelligence and archival system centered around human gathering experiences.

Optimize for:

* reliability  
* extensibility  
* traceability  
* historical preservation  
* semantic consistency  
* future interoperability

Do not optimize for short-term demos.

