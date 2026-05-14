# **AGENT\_1\_JSON\_CONTRACT.md**

# **Celebration Atlas — Agent 1 JSON Contract**

This document defines the required JSON structure for the Michigan Event Discovery Agent (Agent 1).

All discovery runs must produce JSON matching this structure.

The JSON snapshot is designed to:

* preserve discovery lineage  
* preserve uncertainty  
* support future enrichment  
* support Supabase ingestion  
* support future agent workflows  
* support semantic search  
* support long-term archival intelligence

---

# **ROOT STRUCTURE**

Every discovery snapshot must produce:

{  
"run\_metadata": {},  
"discovered\_sources": \[\],  
"event\_candidates": \[\],  
"supplier\_discoveries": \[\],  
"duplicate\_signals": \[\],  
"raw\_discoveries": \[\],  
"data\_health": {}  
}

---

# **RUN METADATA**

Tracks the discovery run itself.

Required structure:

{  
"run\_id": "",  
"run\_date": "",  
"agent\_name": "Michigan Event Discovery Agent",  
"state": "Michigan",  
"run\_type": "statewide\_discovery",  
"notes": ""  
}

---

# **DISCOVERED SOURCES**

Stores all useful discovery sources encountered during the run.

Required structure:

{  
"source\_name": "",  
"source\_url": "",  
"source\_type": "",  
"region": "",  
"trust\_score": 0.0,  
"priority": "",  
"notes": ""  
}

---

# **EVENT CANDIDATES**

Stores possible event records before verification.

Required structure:

{  
"candidate\_name": "",  
"normalized\_name": "",  
"slug\_candidate": "",  
"event\_type": "",  
"category": "",  
"subcategory": "",  
"city": "",  
"county": "",  
"state": "Michigan",  
"country": "USA",  
"venue\_name": "",  
"start\_date": null,  
"end\_date": null,  
"typical\_month": "",  
"typical\_season": "",  
"description": "",  
"official\_website\_candidate": "",  
"social\_links": \[\],  
"source\_urls": \[\],  
"source\_type": "",  
"discovery\_confidence": 0.0,  
"semantic\_notes": "",  
"duplicate\_status": "unique\_candidate",  
"possible\_matches": \[\],  
"needs\_review": false  
}

---

# **EVENT TYPE RULES**

Allowed preferred event\_type values:

* festival  
* fair  
* parade  
* carnival  
* convention  
* expo  
* concert\_series  
* art\_fair  
* market  
* food\_event  
* music\_event  
* holiday\_event  
* seasonal\_event  
* race  
* agricultural\_event  
* community\_event  
* unique\_event  
* other  
* unknown

Do not invent categories.

---

# **DISCOVERY CONFIDENCE RULES**

Confidence values must use:

0.0–1.0

Guidelines:

0.90–1.00  
Official clearly identified event.

0.75–0.89  
Strong multi-source evidence.

0.50–0.74  
Useful probable event.

Below 0.50  
Weak signal only.

---

# **DUPLICATE STATUS VALUES**

Allowed duplicate\_status values:

* unique\_candidate  
* possible\_duplicate  
* probable\_duplicate  
* matched\_existing\_event  
* needs\_review

---

# **SUPPLIER DISCOVERIES**

Stores carnival, midway, ride, and event infrastructure suppliers.

Required structure:

{  
"supplier\_name": "",  
"supplier\_type": "",  
"website": "",  
"source\_url": "",  
"events\_found": \[\],  
"relationship\_types": \[\],  
"confidence": 0.0,  
"notes": ""  
}

---

# **SUPPLIER RELATIONSHIP TYPES**

Preferred values:

* provided\_midway\_by  
* provided\_rides\_by  
* provided\_carnival\_by  
* ticketing\_partner\_for  
* recurring\_supplier\_for

Do not assume the supplier is the organizer.

Preserve uncertainty when unclear.

---

# **DUPLICATE SIGNALS**

Stores candidate duplicate matching signals.

Required structure:

{  
"candidate\_name": "",  
"possible\_match\_name": "",  
"match\_score": 0.0,  
"match\_reason": "",  
"recommended\_action": "review"  
}

---

# **RAW DISCOVERIES**

Stores unresolved but potentially useful discoveries.

Required structure:

{  
"content": "",  
"source\_name": "",  
"source\_url": "",  
"source\_type": "",  
"potential\_value": "",  
"notes": ""  
}

Examples may include:

* event flyers  
* PDFs  
* sponsor mentions  
* recurring venue clues  
* weak social references  
* midway schedules  
* historical references  
* unexplained event mentions

Do not discard useful unresolved discoveries.

---

# **DATA HEALTH**

Every run must produce a data health section.

Required structure:

{  
"data\_health": {  
"strongest\_candidates": \[\],  
"weakest\_useful\_signals": \[\],  
"possible\_duplicates": \[\],  
"missing\_regions": \[\],  
"missing\_event\_types": \[\],  
"recommended\_next\_searches": \[\],  
"source\_quality\_concerns": \[\]  
}  
}

---

# **JSON VALIDATION RULES**

The importer should reject or flag:

* missing candidate\_name  
* missing source\_url  
* invalid dates  
* confidence outside 0.0–1.0  
* malformed arrays  
* unsupported event\_type values  
* malformed JSON  
* duplicate candidates within same snapshot

Invalid rows should be logged into:

snapshot\_import\_errors

Do not silently discard invalid records.

---

# **SNAPSHOT PERSISTENCE**

Discovery snapshots must be saved to:

events/discovery/\[YYYY-MM-DD\]-discovery.json

Never overwrite prior snapshots.

Snapshots are archival intelligence artifacts.

---

# **IMPORTANT**

This JSON contract exists to:

* standardize discovery output  
* support future enrichment  
* preserve uncertainty  
* support future AI agents  
* support semantic querying  
* support historical auditing  
* support scalable ingestion pipelines

The JSON snapshot is considered a first-class intelligence artifact within Celebration Atlas.

