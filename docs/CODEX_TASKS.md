# **CODEX TASK — Build Agent 1: Michigan Event Discovery Foundation**

You are building the foundational discovery system for Celebration Atlas.

This is NOT a demo project.

This is the beginning of a long-term statewide event intelligence platform.

Your goal is to create the foundation that future agents will build upon.

The system must support:

* discovery  
* normalization  
* candidate review  
* verification  
* source traceability  
* future enrichment agents  
* future intelligence layers

Do NOT over-engineer.  
Do NOT build autonomous crawling yet.  
Do NOT build speculative features.

Build a stable foundation.

---

# **PROJECT OVERVIEW**

Celebration Atlas is building a master inventory of public gathering events in Michigan including:

* festivals  
* fairs  
* parades  
* carnivals  
* conventions  
* expos  
* seasonal events  
* music events  
* cultural gatherings  
* community celebrations  
* unique Michigan events

Agent 1 is responsible for:

1. discovering event candidates  
2. preserving source evidence  
3. normalizing identity  
4. reducing duplicate fragmentation  
5. promoting verified events into the canonical database

The architecture must support future agents without rebuilding the database.

---

# **REQUIRED REPOSITORY STRUCTURE**

Create this structure:

/docs  
/supabase  
/supabase/migrations  
/supabase/functions  
/src  
/src/app  
/src/components  
/src/lib  
/src/pages/admin  
/data/discovery/snapshots

---

# **REQUIRED DOCUMENT FILES**

Create placeholder docs if missing:

docs/MASTER\_SPEC.md  
docs/AGENT\_1\_EVENT\_DISCOVERY.md  
docs/AGENT\_1\_JSON\_CONTRACT.md  
docs/DATABASE\_SCHEMA\_AGENT\_1.md  
docs/CODEX\_TASKS.md

---

# **REQUIRED SUPABASE TABLES**

Create migrations for:

* discovery\_sources  
* discovery\_runs  
* event\_candidates  
* event\_candidate\_sources  
* event\_candidate\_matches  
* supplier\_discoveries  
* events  
* event\_sources  
* snapshot\_import\_errors

Use UUID primary keys.

Use timestamptz created\_at fields.

Use proper foreign key relationships.

Preserve JSONB support where useful.

Do NOT create speculative tables yet.

---

# **REQUIRED ADMIN UI**

Create admin pages for:

1. Discovery Sources  
2. Discovery Runs  
3. Snapshot Imports  
4. Event Candidates  
5. Verified Events

The UI should prioritize:

* readability  
* review workflow  
* source traceability  
* operational simplicity

This is an internal intelligence system, not a public consumer UI.

---

# **DISCOVERY SOURCE REQUIREMENTS**

Users must be able to:

* create discovery sources  
* edit discovery sources  
* activate/deactivate sources  
* assign trust score  
* assign priority  
* track last checked time

---

# **SNAPSHOT IMPORT REQUIREMENTS**

The system must support manual upload/import of JSON discovery snapshots.

Workflow:

1. Upload JSON file  
2. Validate schema  
3. Create discovery\_run  
4. Import discovered\_sources  
5. Import event\_candidates  
6. Import candidate sources  
7. Import supplier discoveries  
8. Flag duplicates  
9. Preserve import errors

Do NOT silently discard invalid records.

Create import error logs.

---

# **EVENT CANDIDATE REQUIREMENTS**

Candidates must support:

* candidate\_name  
* normalized\_name  
* slug\_candidate  
* event\_type  
* category  
* city  
* county  
* venue\_name  
* start\_date  
* end\_date  
* confidence  
* source lineage  
* duplicate status  
* semantic notes

Preserve uncertainty.

Do NOT force normalization when unclear.

---

# **DUPLICATE MATCHING REQUIREMENTS**

Support:

* possible duplicate flagging  
* match scores  
* match reasoning  
* manual review workflow

Do NOT automatically merge candidates.

---

# **VERIFIED EVENT PROMOTION REQUIREMENTS**

Users must be able to:

* approve candidate  
* reject candidate  
* mark for review  
* promote candidate into canonical events table

When promoting:

* preserve source lineage  
* preserve confidence  
* preserve discovery history

---

# **COST GOVERNANCE REQUIREMENTS**

Discovery runs must support:

* estimated\_cost  
* actual\_cost  
* approval\_required  
* approval\_status

Do NOT implement advanced billing logic yet.

Only create fields and workflow hooks.

---

# **IMPORTANT ARCHITECTURE RULES**

1. Candidate data must remain separate from verified events.  
2. Preserve source lineage everywhere possible.  
3. Do not overwrite historical discovery records.  
4. Build for future agent expansion.  
5. Keep discovery modular.  
6. Preserve uncertainty.  
7. Prefer review workflows over automation.  
8. Keep schema extensible.  
9. Avoid speculative complexity.  
10. Build clean migrations.

---

# **DO NOT BUILD YET**

Do NOT build:

* autonomous scraping  
* uncontrolled crawling  
* social media API ingestion  
* real-time monitoring  
* heatmaps  
* BLE/sensor systems  
* enrichment agents  
* AI summarization pipelines  
* public frontend experience

Those come later.

---

# **SUCCESS CRITERIA**

The system succeeds if a user can:

1. Add a discovery source.  
2. Upload a JSON discovery snapshot.  
3. Import event candidates.  
4. Review candidates.  
5. Flag duplicates.  
6. Promote candidates into verified events.  
7. Preserve source evidence throughout the process.

---

# **FINAL REQUIREMENT**

This is the foundation layer for a future statewide event intelligence system.

Optimize for:

* clarity  
* traceability  
* schema integrity  
* future extensibility  
* operational reliability

Do not optimize for flashy demos.

Build the foundation correctly.

