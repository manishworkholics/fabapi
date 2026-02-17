-- CreateTable
CREATE TABLE "ems_manufacturers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "employees" TEXT,
    "certifications" TEXT,
    "industries" TEXT,
    "website" TEXT,
    "emsType" TEXT,
    "manufacturingSpecifications" TEXT,
    "assemblySpecifications" TEXT,
    "capabilities" TEXT,
    "equipment" TEXT,
    "constraints" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ems_manufacturers_pkey" PRIMARY KEY ("id")
);

-- Insert EMS manufacturer data
INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Protronics Inc.', 'operations@protronics-inc.com', NULL, NULL, NULL, NULL, NULL, 'www.protronics-inc.com', 'PCB manufacturer & contract assembly', 'PCB Fabrication:
Minimum trace width (mm): 0.12
Minimum clearance (mm): 0.15
Minimum annular ring (mm): 0.15
Maximum layer count: 12
Maximum board thickness (mm): 2.0
Maximum board size (mm): (width: 600, height: 600)

Vias
Supported types: through-hole, blind, buried, microvia
Minimum via drill size (mm):

Finishes (ENIG, HASL, OSP, etc.):

Materials (FR-4, Rogers, Polyimide, etc.)', 'SMT supported? Yes
THT supported? Yes
BGA minimum pitch (mm): 0.4
Fine pitch assembly supported? Yes
Max components per board: 5000', NULL, NULL, 'Controlled impedance support: Yes
Max copper weight (oz): 3
Any unique requirements or limitations: Yes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Summit Interconnect', 'info@summitinterconnect.com', '(714) 239-2433 / (877) 264-0343', 'Fullerton / multiple US facilities (CA + others)', '1,250+', 'RoHS, IPC-related, AS9100', 'Aerospace, RF/Microwave, Consumer, Industrial', 'summitinterconnect.com', 'PCB manufacturer & contract assembly: rigid, flex, rigid-flex, HDI, quick-turn & volume.', 'Board types: rigid, flex, rigid-flex, HDI, RF/microwave, high-reliability multilayer. 
Layers: 1–40+ 
Min trace/space: typically 3–4 mil / 3–4 mil for production; prototype lines may be 4/4. 
Min hole size (drilled): 0.15–0.20 mm (6–8 mil) (confirm microvia capability). 
Aspect ratio: typically 8:1 standard; 10:1 for special processes*. 
Thickness: 0.2–3.2 mm. 
Copper weights: 0.5 oz – 12 oz possible (inner & outer) — standard: 1/1, 2/2, 3/3 oz. 
Vias: thru-hole, blind & buried, microvias, stacked microvias (confirm stack depth, via-in-pad & filled via types: epoxy filled, copper-filled, via-in-pad filled & plated). 
Via fill: via fill options: non-filled, filled & plated, filled and capped. 
Finishes: ENIG, ENEPIG, HASL (lead-free), OSP (chemical), immersion Ag, immersion Sn. 
Soldermask: standard LPI, colors: green, black, white, blue, red; SMD defined/non-SMD defined. 
Silkscreen: epoxy ink or water-based; min stroke 0.3 mm. 
Dielectrics/materials: FR-4 (various Tg & Tg150/Tg170), high-TG, Rogers (RF), polyimide for flex. 
Impedance: controlled impedance capability ±10–15%
Surface finish planarity: for BGA and microBGA planarity requirements supported (via microvia & via-in-pad). 
Thermal vias: via arrays, capped/healed via for BGA. 
DFM limits: min annular ring 3–4 mil recommended; soldermask clearance min 5–6 mil*. 
Panelization: rack / step & repeat, tooling holes, V-scoring, tab routing. 
Environmental: RoHS, IPC process control; AS9100 for aerospace lines.', 'SMT: placement of 0402 and 0201, fine-pitch down to 0.3 mm pitch, BGAs down to 0.4 mm pitch (vendor dependent). 
THT: PTH insertion & wave/ selective soldering. 
Assembly tolerances: pick-and-place positional accuracy typically ±0.05–0.1 mm (50–100 µm). 
Stencil: laser-cut stainless steel, thickness 0.1–0.2 mm (100–200 µm) depending on paste volume. 
Reflow: lead-free RoHS reflow oven, multiple zones, nitrogen available for some high reliability builds. 
Paste inspection: SPI before reflow. 
Inspection: AOI, X-ray for BGA, ICT/functional test as required, Flying probe for low volumes. 
Conformal coating: acrylic, polyurethane, silicone (select). 
Cleaning: aqueous / no-clean flux options. 
Box-build: cable assembly, harnessing, mechanical integration, final test, burn-in.*
ESD & clean room: ESD-controlled environment.*', 'Full-service: PCB fabrication + assembly + box-build + high-reliability (aerospace/defense) programs. 
Strong in rigid-flex and RF.', 'PCB fab equipment: LDI image systems (Orbotech/KLA), automated inner layer inspection, lamination presses, CNC drilling (Schill, Schmoll, Hitachi), PTH plating lines, electroless copper plating, immersion gold/plating lines. 
Assembly equipment: DEK/ASM/Europlacer paste printers, Yamaha/JUKI/Fuji pick-and-place, Heller/BTU/Rehm reflow ovens, Koh Young/Omron AOI, Nordson Dage / Yxlon X-ray, ICT beds, flying probe testers.', 'Large North American footprint; strong for rigid-flex/high-reliability; see certs for aerospace/defense requirements.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('NCAB Group US Inc.', 'jill.rocha@ncabgroup.com', '603 329 4551', 'Hampstead, NH', '11-50', 'ISO / export controls / ITAR guidance', 'Broad: Industrial, automotive, telecom, electronics OEMs', 'ncabgroup.com', 'PCB Supplier/Procurement & Supply partner', 'Manufacturing specs: depends on selected factory. 
NCAB typically supports: 1–40+ layers, controlled impedance, ENIG/OSP/immersion metal finishes, blind/buried/microvia, FR-4, high-TG, Rogers options. 
Min trace/space: 3–4 mil typical from their network (some suppliers 2/2 possible). 
Plating & fills: ENIG, HASL lead-free, OSP, immersion Ag; via fill options available through some suppliers.', 'Assembly specs: NCAB coordinates EMS partners for assembly; assembly capabilities vary by partner (from proto quick-turn SMT to high-mix box build).', 'Capability: global procurement, vendor qualification, supply chain & QA oversight.', 'Equipment: varies by factory; NCAB does not operate its own fab lines. For each RFQ record the supplier facility and equipment list.', 'NCAB provides supply management rather than being a single EMS fab.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Premier Logitech (formerly VOTRONICS, Inc.)', 'sales@premierss.com', '(866) 591-7546', 'Plano / Coppell, TX', '10–50', 'ISO 9001:2015, ITAR registration', 'Electronics OEMs, telecom, industrial', 'votronicsinc.com / premierss.com', 'EMS / PCBA, electro-mechanical assembly, NPI support', 'Board types: rigid & some flexible/rigid-flex.*
Layers: typical 1–16 layer.* 
Min trace/space: 4–6 mil typical.* 
Min drill: 0.25 mm / 10 mil. Materials: FR-4 standard, high-TG possibly upon request. 
Finishes: ENIG, HASL lead-free, OSP likely. 
Vias: through-hole, some blind via capability with partner fabs.* 
Impedance control: available on request.', 'SMT: placement of 0402 common 
BGA: typical support to 0.5 mm pitch; X-ray for BGA inspection. Reflow: lead-free reflow. 
Inspection: AOI & manual optical; flying probe/ICT may be outsourced. 
Box build: basic box builds and cable harnesses offered.', 'Small–medium EMS with prototype-to-low-volume production services.', 'Typical equipment (to confirm): SMT pick-and-place (JUKI/Yamaha), reflow ovens, stencil printer, AOI (Omron/Koh Young), wave or selective soldering.', 'Some of the company directory entries are sparse', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Multilayer Technology (Multilayer Technology Group / JVB Electronics)', 'sales@multilayer.com', '972-790-0062', 'Irving, TX (US office)', 'Company history > decades; US staff smaller', 'AS9100, ISO 9001 family, ITAR & JCP, MIL-PR', 'Aerospace, military, high-reliability electronics', 'multilayer.com', 'High-reliability PCB manufacturer (focus on MIL/Aero & high-precision PCBs)', 'Board types: multi-layer rigid, high-density, high-reliability PCBs, Rogers/RF materials. 
Layers: up to high layer counts (20–40+). 
Min trace/space: 3/3 mil or better (high precision). 
Microvias & HDI: supported (stacked microvias & via-in-pad for high-reliability PCBs). 
Min drill: microvia diameters 0.10–0.18 mm . 
Copper weights: heavy copper options for power PCBs. 
Finishes: ENIG, ENEPIG, OSP, immersion silver, gold plating. 
Impedance control: tight ±5–10% typical for aerospace/military boards. 
Special processes: controlled dielectric thickness, low loss RF substrates, impedance test coupons.', 'Assembly specs: high-reliability assembly per AS9100: fine pitch BGAs, buried/blind via BGA escape routing, via-in-pad with filled & capped via for BGA. 
Test: ICT, functional, X-ray, conformal coat, potting, environmental stress screening (ESS)/thermal cycling for qualification. 
Solder: lead-free, selective wave for PTH.', 'Specialty: aerospace & military grade PCBs, high-reliability multilayer and RF. 

*Good candidate for DRC profiles requiring high reliability, controlled impedance and heavy copper.', 'Fab equipment typical of high-end fabs: LDI (KLA), controlled lamination presses, microvia laser drills/laser via formation, electroplating lines, precision imaging, AOI/AXI/X-ray test suites.', 'Focused on military/aerospace, likely higher lead times / qualification needs for new customers.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('National Circuit Assembly (NCA)', 'info@ncatx.com', '(972) 278-2009 / 888-278-8890', 'Garland, TX', 'Small/medium', 'ISO/industry quality processes', 'Aerospace, defense, industrial, commercial', 'ncatx.com', 'PCBA contract manufacturer: quick turn, prototype, small & production quantities.', 'Board types: rigid PCBs, prototypes to small/mid production multilayer. 
Layers: typical 1–12*. 
Min trace/space: 4–6 mil standard; HDI options may be limited/quoted. 
Min drill: 0.2–0.3 mm. 
Materials & finishes: FR-4 standard, ENIG, OSP, HASL; controlled impedance upon request. 
Vias: thru-hole & plated thru, limited blind via support*.', 'SMT: 0402 & 0201 on higher-end lines. 
Pick-and-place accuracy: typical ±0.05–0.1 mm. 
Inspection: AOI, manual inspection, ICT/flying probe for testing. 
Reflow: Pb-free; selective soldering for PTH. 
Conformal coat: available on demand. 
Box build: available.', 'Quick-turn PCBA and small volume production; good for prototypes and low-to-mid volumes.', 'Typical equipment: stencil printer (DEK/MPM), pick-and-place (Yamaha/JUKI), reflow ovens, AOI, flying probe or basic ICT.', 'Good for US quick-turn and low-to-mid volumes.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Niltronix Circuits', 'quote@niltronix.com', '713-465-4216 / 713-465-7246', 'Sugar Land / Houston, TX', 'Not stated on site (small-medium)', 'AS9100D, ISO 9001:2015', 'Aerospace, medical, oil & gas, industrial', 'niltronix.com', 'Turnkey PCB fabrication & assembly, box build, testing', 'Board types: rigid multilayer, high-reliability; may offer flex/rigid-flex*. 
Min trace/space: 4/4 mil typical. 
Min drill: 0.2 mm typical. 
Finishes: ENIG, HASL, OSP. 
Special: AS9100D certified — implies higher process control and testing. 
Vias & fill: likely plated thru; microvia on request.*', 'Assembly: SMT fine pitch down to 0.4–0.5 mm, BGA support and X-ray for inspection, conformal coating, ICT and functional testing capability, box build. 
Clean/ESD: standard processes for aerospace/medical.', 'Fabrication + assembly for aerospace / military / oil & gas', 'Equipment: AOI, reflow ovens, pick-and-place lines, X-ray', 'Focus on integrated fabrication + assembly, useful when both fab & assembly are needed.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Protoline, Inc.', 'sales@protoline.com', '281-561-0802', 'Houston, TX', '11–50', 'Not heavily published on site; general quality statements', 'Industrial & commercial electronics', 'protoline.com', 'PCB manufacturer / PCBA services', 'Board types: rigid FR-4, prototypes & small production. 
Layers: 1–8 typical for local shops.
Min trace/space: 5–6 mil typical in public specs. 
Finishes: ENIG, HASL, OSP; impedance control upon request. 
Vias: plated thru standard, blind/microvia via partners.', 'Assembly: typical SMT placement, 0402, 0201, reflow ovens (Pb-free), AOI, selective soldering, functional test.', 'Prototype and low-volume PCB fabrication & assembly.', 'Typical small/medium shop lines: JUKI/Yamaha pick-and-place, stencil printers, Heller or equivalent reflow ovens, AOI.', 'Smaller independent manufacturer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Q C Graphics, Inc. (QCG)', 'Info@QCG.com', '972-931-4100', 'Richardson / Plano area, TX (1501 N Plano Rd #300, Richardson TX)', 'small-medium', 'AS9100 Rev D, ISO 9001:2015, ITAR & NIST / DFARS compliance', 'Aerospace, defense, medical, industrial, commercial', 'qcg.com', 'Turnkey PCB design, fabrication and assembly; high-reliability focus', 'Board types: multilayer rigid, high-reliability; AS9100D & ISO 9001 implies: controlled impedance, blind/buried vias, microvia capability & controlled planarity. 
Min trace/space: 3–4 mil typical for aerospace class. 
Min drill: 0.10–0.20 mm possible on specialized lines. 
Finishes: ENIG, ENEPIG, OSP, immersion Ag, hard gold for edge connector plating. 
Materials: FR-4 high Tg, Rogers/RF.', 'Assembly: fine pitch down to 0.3–0.4 mm, BGA/X-ray, ICT, functional test and environmental screening (thermal shock, humidity) for aerospace/medical. 
Conformal coat & potting available.', 'High-reliability aerospace & defense focused fabrication & assembly; strong QA & test regimes. Use for DRC requiring tight impedance & microvia work.', 'Fab/assembly equipment: LDI, microvia tech, precision lamination, KLA/Orbotech inspection, Koh Young AOI, Yxlon / Nordson Dage X-ray, reflow ovens (nitrogen).', 'Strong aerospace/defense compliance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Rapid PCB, LLC (RapidPCB)', 'Support@RapidPCB.com', '877-887-5777', 'Austin / Dripping Springs, TX', 'Small to medium', 'Standard ISO / RoHS', 'Consumer, industrial, IoT prototypes', 'rapidpcb.com', 'Quick-turn PCB fabrication & prototype assembly', 'Board types: quick-turn prototype rigid & small multilayer. 
Min trace/space: 4–6 mil typical (4/4--standard option). 
Min drill: 0.2–0.25 mm. Layers: up to ~12 advertised. 
Finishes: ENIG, OSP, lead-free HASL. 
Vias: standard thru-hole plated; microvias & blind/buried likely via partner or special quote.', 'Assembly: quick-turn SMT for prototypes: 0402, some 0201 possible, pick-and-place, reflow, AOI for prototype runs, flying probe / functional test optional.', 'Fast prototypes, online ordering and quoting', 'Prototype-oriented equipment: stencil printers, small/med pick-and-place (MyData/Fuji/Yamaha), reflow ovens, SPI/AOI.', 'Good for prototyping/fast quotes; not a large high-reliability contract fab.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Super PCB', 'info@superpcb.com', '(214) 550-9837', 'Plano, TX', 'Small-medium', 'RoHS, ISO TS16949, ISO 9001, UL, IPC', 'Prototypes, consumer & industrial electronics', 'superpcb.com', 'PCB fabrication & prototype production (fast turn prototypes)', 'Board types: prototype rigid, small batches. 
Min trace/space: often 4–6 mil. 
Min drill: 0.2 mm typical. Layers: up to 8–12 typical. 
Finishes: ENIG / OSP / HASL. 
Vias: plated thru standard.', 'Assembly: prototype SMT lines: 0402 support, reflow, AOI basic, flying probe testing optional. Conformal coat: on request.', 'Prototype & low-volume production; price-sensitive.', 'Typical small fab equipment: stencil printer, pick-and-place, reflow ovens, AOI (basic).', 'Firm focuses on prototype speed and competitive pricing.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Trilogy Circuits, Inc. (acquired by Zentech in 2020)', 'info@trilogycircuits.com', '972-907-2727 / 877-837-2727', 'Richardson, TX', 'Small / medium', 'UL,RoHS, ISO 9001:2015, ITAR, AS9100D', 'Aerospace, defense, high-reliability electronics', 'trilogycircuits.com', 'EMS & PCBA services; design & assembly co-located; high-reliability work', 'Board types: formerly high-reliability (AS9100/ISO); capability includes rigid multilayer, HDI, controlled impedance and microvias. 
Min trace/space: 3–4 mil typical for high-reliability. 
Microvia/via-in-pad: supported where needed. 
Finishes: ENIG, ENEPIG, OSP, immersion Ag; heavy copper for power PCBs on request.', 'Assembly: high-reliability assembly: fine pitch BGA, X-ray, ICT, conformal coating, thermal screening; box build & harnessing. 
Test: functional test, environmental screening.', 'Aerospace/defense & industrial', 'Typical: KLA/Orbotech LDI, Koh Young AOI, Yxlon/ Nordson X-ray, high-end pick-and-place (Fuji/Flex/ASM).', 'Note: Trilogy acquired by Zentech', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('PCB International (PCBI)', 'support@pcbinternational.com', '206-310-3624', 'Seattle, WA', 'Small / medium', 'ISO, UL', 'Consumer, industrial, commercial', 'pcbinternational.com', 'PCB manufacturing & turnkey assembly; online quoting', 'Board types: prototyping to production, rigid multilayer. 
Min trace/space: often 4/4 mil or 3/3 on special quote. 
Finishes: ENIG, OSP, HASL. 
Vias: standard plated thru; blind/microvia on request. 
Impedance control: available through supplier network.', 'Assembly: proto SMT, 0402 placement, 0.5 mm BGA support, AOI and inspection, flying probe for small runs, ICT for production runs.', 'Online quoting + prototyping focus. Good for prototyping DRC but confirm advanced HDI needs.', 'Typical equipment for prototyping: desktop/bench scale pick-and-place, mid-range pick-and-place, reflow ovens, AOI.', 'Good for cost-sensitive projects; confirm lead time/volume specifics.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('PCB Universe (PCBU)', 'terryh@pcbuniverse.com', '360-256-7222', 'Vancouver, WA', 'Small / medium', 'RoHS, UL, ISO', 'Prototypes, hobbyist, commercial prototyping', 'pcbuniverse.com', 'Online PCB fab & assembly (prototype to production), turnkey options', 'Board types: quick-turn prototype rigid & small multilayer. 
Min trace/space: 4–5 mil standard; 3/3 sometimes available as premium option. 
Min drill: 0.2 mm. 
Finishes: ENIG, HASL lead-free, OSP. 
Vias: plating standard; microvia via quote.', 'Assembly: prototype pick-and-place, reflow, AOI; flying probe testing; support 0402 and 0201 for higher-end option.', 'Prototype & low-volume; online ordering infrastructure.', 'Typical: stencil printers, Mydata/Fuji small to mid pick-and-place, reflow ovens, AOI.', 'Good for fast prototyping and smaller runs; larger production needs should be confirmed.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('UMC GLOBAL (UMC Global Inc.)', 'sales@umcglobal.com', '(425) 483-0277 / (800) 886-4789', 'Woodinville, WA', 'Small / medium', 'RoHS, ISO/TS, UL, IPC', 'OEM electronics procurement / manufacturing', 'umcglobal.com', 'PCB sourcing & manufacturing partner', 'Manufacturing specs depend on assigned factory. 
Typical capability across network: 1–40+ layers, controlled impedance, ENIG/OSP/ImmAg/ENEPIG, blind/buried microvia options.', 'Assembly: depends on the EMS partner assigned by UMC — could be anything from prototyping SMT to high-mix box build.', 'Supply chain & contract manufacturing coordination. Do not use as single DRC profile.', 'Equipment varies by partner — fetch per supplier.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('TouchPad Electronics LLC', 'sales@touchpadelectronics.com', '262-378-3000', 'Mukwonago, WI', 'Small / medium', 'UL, RoHS, ISO 9001:2015, SMTA, ITAR', 'Commercial, industrial, OEM, prototypes', 'touchpadelectronics.com', 'PCB design, bare board and assembly services; quick turn & production', 'Board types: rigid PCBs, some rigid-flex on request. Min trace/space: 4–6 mil typical. Min drill: 0.20–0.25 mm typical. Finishes: ENIG, HASL, OSP. Vias: plated thru, special processes via quote.', 'Assembly: SMT & THT; supports 0402, 0201 on request, BGA support with X-ray inspections, SPI/AOI, ICT/flying probe testing. Box build: cable assembly, harnesses, enclosures.', 'Design + assembly focus for prototypes and production; DFM support available.', 'Typical equipment: stencil printers, mid-range pick-and-place (Yamaha/JUKI), reflow ovens, AOI, X-ray (if necessary).', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Alltek Circuits (Alltek Circuit / Alltek Circuit, Inc.)', 'info@alltekcircuit.com', '(972) 485-0800', 'Garland, TX', 'Small / medium', 'ISO / quick-turn', 'Commercial, industrial, OEM, prototypes', 'alltekcircuit.com', 'PCB fabrication & assembly: quick-turn, low-volume, high-tech boards', 'Board types: PCB fabrication for low-to-mid volumes, prototypes. Min trace/space: 4–6 mil typical. Finishes: ENIG, HASL, OSP. Vias: plated thru; blind/microvia by quote.', 'Assembly: SMT support, 0402 placement, reflow ovens, AOI; selective soldering for PTH.', 'Quick-turn prototype and small production. Confirm microvia and HDI levels.', 'Typical equipment: DEK/MPM printer, JUKI/Yamaha pick-and-place, reflow oven, AOI.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('AirBorn, Inc.', 'corporate inquiries via site', '(512) 863-5585', 'Georgetown, TX', '~large', 'RoHS', 'Rugged connectors, aerospace, defense, industrial', 'airborn.com', 'Manufacturer of connectors, cable assemblies, flexible circuits & has PCB/assembly services', 'Board types & products: flexible circuits, cable assemblies, ruggedized interconnects, flexible PCBs (polyimide, adhesive or adhesiveless flex), and box build. Flex specs: polyimide base, flex thickness 25–125 µm, adhesiveless flex available, coverlay and stiffeners, controlled bend radii, dynamic and static flex design rules. Layers: single to multi-flex stacks, rigid-flex assemblies. Min trace/space for flex: 4/4 mil common; advanced lines down to 3/3 mil. Via in flex: laser vias & small mechanical vias available, via fill & plating per spec. Finishes: ENIG, immersion silver, OSP for flex.', 'Assembly: specialized for flex-to-board assembly, cable termination, overmolding, soldering for flex, FFC/connector assemblies, test & inspection for high-reliability interconnects. Conformal coating & potting for ruggedized products.', 'Specialist: flexible circuits, cable & interconnect assemblies, ruggedized connectors and box builds for aerospace/defense/industrial. Excellent DRC profile for flex/rigid-flex design rules and constraints.', 'Flex processing equipment (flex lamination presses, laser drills, flex routing, coverlay application); cable assembly machines, crimp presses, automated soldering & reflow adapted for flex, AOI, X-ray for terminations.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('BENCOR, LLC', 'sales@BENCOR-LLC.com', '979-830-5252', 'Brenham, TX', '~11–50', 'Standard quality assertions on site', 'OEM electronics, contract manufacturing', 'bencor-llc.com', 'Contract manufacturer — PCB assembly, cable assembly, box build, kitting', 'Board types: rigid multilayer, standard FR-4. Min trace/space: 4–6 mil typical. Finishes: ENIG, HASL, OSP. Vias: standard plated thru; advanced via processes by quote.', 'Assembly: SMT & THT, pick-and-place, reflow, selective soldering, AOI, flying probe/ICT testing available; box build & kitting.', 'Contract manufacturer focusing on full box builds, cable and harness assembly with PCB assembly services.', 'Equipment: pick-and-place (Yamaha/Juki/Fuji), reflow ovens, AOI, selective soldering, cable assembly machines.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('Circuit Design Specialties, Inc. (CDS)', 'pcbinfo@circuitdesign.com', '972-424-1007', 'Plano, TX', '~10–50', 'Standard quality processes', 'PCB design, prototype & production electronics', 'circuitdesign.com', 'PCB design + manufacturing services (design house with assembly services)', 'Board types: prototyping + small production rigid multilayer. Min trace/space: 4–6 mil typical. Finishes: ENIG, HASL, OSP. Vias: plated thru; microvia upon request/quote.', 'Assembly: design + layout + prototype assembly; support for 0402, typical fine pitch; reflow, AOI, functional testing; design for manufacturability (DFM) services included.', 'Design house with in-house prototyping & assembly capability — good for DFM driven projects.', 'Equipment: CAD/CAM, small pick-and-place, reflow ovens, AOI for prototype verification.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ems_manufacturers" ("name", "email", "phone", "location", "employees", "certifications", "industries", "website", "emsType", "manufacturingSpecifications", "assemblySpecifications", "capabilities", "equipment", "constraints", "createdAt", "updatedAt")
VALUES ('International Concept Services', 'randy.manning@neosongu.com', '972-939-6543', 'Carrollton, TX', 'Small / unknown', 'UL, RoHS, ISO, CSA', 'Flexible PCB / contract manufacturing', 'http://www.neosongu.com/quality.html', 'Flexible & rigid PCB services listed on directory entries', 'Board types: listed in directory as flexible & rigid PCB provider — limited public info. Typical defaults: 4–6 mil trace/space, plated thru vias, ENIG/OSP. (confirm)', 'Assembly: small/medium volume SMT & cable assembly possible via partner network.', 'Directory-listed PCB service; limited public detail.', 'Unknown publicly — request equipment list in RFQ.', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);