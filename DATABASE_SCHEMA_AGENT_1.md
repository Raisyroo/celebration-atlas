# **DATABASE\_SCHEMA\_AGENT\_1.md**

# **Celebration Atlas — Agent 1 Database Schema**

This document defines the foundational Supabase schema for the Celebration Atlas Michigan Event Discovery system.

Agent 1 is responsible for:

* source discovery  
* event candidate discovery  
* source preservation  
* duplicate detection  
* verification workflow  
* canonical event promotion

This schema is intentionally designed to support future enrichment agents without rebuilding the core architecture.

---

# **ARCHITECTURE PRINCIPLE**

Candidate discovery data must remain separate from verified canonical events.

Core pipeline:

discovery\_sources  
→ discovery\_runs  
→ event\_candidates  
→ event\_candidate\_sources  
→ event\_candidate\_matches  
→ verified events  
→ future intelligence layers

---

# **TABLE — discovery\_sources**

Stores approved discovery infrastructure sources.

Examples:

* Michigan.org  
* chamber calendars  
* county calendars  
* carnival route pages  
* convention center calendars

Required fields:

* id  
* name  
* source\_url  
* source\_type  
* region  
* city  
* county  
* state  
* priority  
* trust\_score  
* is\_active  
* notes  
* last\_checked\_at  
* created\_at  
* updated\_at

---

# **TABLE — discovery\_runs**

Tracks each discovery operation.

Required fields:

* id  
* run\_type  
* source\_id  
* status  
* started\_at  
* completed\_at  
* items\_found  
* candidates\_created  
* duplicates\_flagged  
* estimated\_cost  
* actual\_cost  
* error\_message  
* notes  
* created\_at

---

# **TABLE — event\_candidates**

Stores possible events before verification.

Required fields:

* id  
* discovery\_run\_id  
* candidate\_name  
* normalized\_name  
* slug\_candidate  
* event\_type  
* category  
* subcategory  
* city  
* county  
* state  
* country  
* venue\_name  
* start\_date  
* end\_date  
* typical\_month  
* typical\_season  
* probable\_recurrence  
* description  
* official\_website\_candidate  
* social\_links  
* source\_urls  
* discovery\_confidence  
* verification\_status  
* duplicate\_status  
* matched\_event\_id  
* needs\_review  
* semantic\_notes  
* raw\_payload  
* created\_at  
* updated\_at

---

# **TABLE — event\_candidate\_sources**

Stores source evidence for event candidates.

Required fields:

* id  
* candidate\_id  
* source\_name  
* source\_url  
* source\_type  
* source\_excerpt  
* trust\_score  
* last\_accessed  
* created\_at

Every candidate should preserve source lineage whenever possible.

---

# **TABLE — event\_candidate\_matches**

Stores duplicate and match signals.

Required fields:

* id  
* candidate\_id  
* possible\_event\_id  
* possible\_candidate\_id  
* match\_score  
* match\_reason  
* recommended\_action  
* status  
* reviewed\_by  
* created\_at

The system must never silently merge candidates.

---

# **TABLE — supplier\_discoveries**

Stores carnival, midway, ride, and event infrastructure suppliers.

Required fields:

* id  
* discovery\_run\_id  
* supplier\_name  
* supplier\_type  
* website  
* source\_url  
* events\_found  
* relationship\_types  
* confidence  
* notes  
* created\_at  
* updated\_at

These discoveries are considered strategic event infrastructure intelligence.

---

# **TABLE — events**

Canonical verified events.

This becomes the master event inventory.

Required fields:

* id  
* name  
* slug  
* event\_type  
* category  
* subcategory  
* city  
* county  
* state  
* country  
* venue\_name  
* official\_website  
* facebook\_url  
* instagram\_url  
* typical\_month  
* typical\_season  
* recurrence\_pattern  
* short\_description  
* long\_description  
* status  
* verification\_status  
* confidence\_score  
* first\_discovered\_at  
* last\_verified\_at  
* created\_at  
* updated\_at

Only verified/promoted events belong here.

---

# **TABLE — event\_sources**

Stores source lineage attached to verified events.

Required fields:

* id  
* event\_id  
* source\_name  
* source\_url  
* source\_type  
* trust\_score  
* source\_notes  
* last\_accessed  
* created\_at

Preserve lineage after promotion.

---

# **TABLE — snapshot\_import\_errors**

Stores invalid import rows and validation failures.

Required fields:

* id  
* import\_id  
* record\_type  
* record\_payload  
* error\_message  
* severity  
* created\_at

No discovery data should disappear silently.

---

# **UUID REQUIREMENT**

All primary keys must use UUIDs.

---

# **TIMESTAMP REQUIREMENT**

All tables must use timestamptz fields.

Minimum:

* created\_at

Recommended:

* updated\_at

---

# **JSONB REQUIREMENT**

Use JSONB where appropriate for:

* social\_links  
* source\_urls  
* raw\_payload  
* events\_found  
* relationship\_types

---

# **IMPORTANT DESIGN RULES**

1. Preserve uncertainty.  
2. Preserve source lineage.  
3. Do not silently merge duplicates.  
4. Candidate data is not canonical truth.  
5. Verified events must remain clean.  
6. Preserve historical discovery records.  
7. Keep schema extensible.  
8. Build for future agent expansion.  
9. Preserve weak but useful signals.  
10. Avoid speculative over-engineering.

---

# **FUTURE AGENT SUPPORT**

This schema must support future agents including:

* Event Verification Agent  
* Event Enrichment Agent  
* Field Intelligence Agent  
* Spatial/Hotspot Agent  
* Social Intelligence Agent  
* Vendor Intelligence Agent  
* Economic Intelligence Agent  
* Reporting & Export Agent

Future agents should extend the architecture rather than replace it.

---

# **COST GOVERNANCE SUPPORT**

Discovery runs must support:

* estimated\_cost  
* actual\_cost  
* approval\_required  
* approval\_status

Advanced billing systems are not required yet.

---

# **CURRENT MVP BOUNDARY**

Version one should support:

* discovery source management  
* JSON snapshot import  
* event candidate review  
* duplicate review  
* verified event promotion  
* source lineage preservation

Version one should NOT include:

* autonomous crawling  
* uncontrolled scraping  
* real-time monitoring  
* social media ingestion  
* heatmaps  
* BLE/sensor systems  
* advanced enrichment agents

Those systems come later.

---

# **FINAL PRINCIPLE**

This schema is the foundation layer for a long-term event intelligence platform.

Optimize for:

* reliability  
* traceability  
* extensibility  
* operational clarity  
* future agent interoperability

Do not optimize for short-term demos.

