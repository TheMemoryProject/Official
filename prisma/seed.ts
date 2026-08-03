import { PrismaClient, SystemRole, VerificationStatus, ProblemSeverity, KnowledgeVisibility, RelationshipType, GraphNodeType, TranslationCategory, EvidenceType, StandardStatus } from '@prisma/client';

const prisma = new PrismaClient();

const KNOWLEDGE_VERIFIED: VerificationStatus = 'VERIFIED';
const SOLUTION_VERIFIED: VerificationStatus = 'VERIFIED';

async function main() {
  console.log('Seeding Knowledge Translation Network (Innovation Engine) database...');

  // Clean existing data in dependency order
  await prisma.knowledgeTranslation.deleteMany();
  await prisma.graphEdge.deleteMany();
  await prisma.graphNode.deleteMany();
  await prisma.complianceMapping.deleteMany();
  await prisma.knowledgeVersion.deleteMany();
  await prisma.knowledgeComment.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.engineeringTask.deleteMany();
  await prisma.engineeringDecision.deleteMany();
  await prisma.standardRecord.deleteMany();
  await prisma.evidenceRecord.deleteMany();
  await prisma.failureRecord.deleteMany();
  await prisma.verifiedSolution.deleteMany();
  await prisma.engineeringProblem.deleteMany();
  await prisma.knowledgeEntry.deleteMany();
  await prisma.engineeringPrinciple.deleteMany();
  await prisma.analyticsMetric.deleteMany();
  await prisma.industry.deleteMany();
  await prisma.engineeringDomain.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // ------------------------------------------------------------
  // 1. ORGANIZATION & USERS
  // ------------------------------------------------------------
  const org = await prisma.organization.create({
    data: {
      name: 'KTN Enterprise Engineering Co.',
      slug: 'ktn-enterprise',
      description: 'Multi-industry engineering knowledge collective focused on cross-domain innovation discovery.',
      subscriptionTier: 'ENTERPRISE',
      region: 'EU-WEST',
    },
  });

  const users: Record<string, string> = {};
  const userDefs: Array<{ key: string; email: string; fullName: string; title: string; role: SystemRole }> = [
    { key: 'admin', email: 'elena.vasquez@ktn.io', fullName: 'Dr. Elena Vasquez', title: 'Chief Engineering Officer', role: 'ADMIN' },
    { key: 'verifier', email: 'james.okafor@ktn.io', fullName: 'James Okafor', title: 'Senior Verification Lead', role: 'VERIFIER' },
    { key: 'aero', email: 'priya.raman@ktn.io', fullName: 'Priya Raman', title: 'Propulsion Systems Engineer', role: 'CONTRIBUTOR' },
    { key: 'ev', email: 'marcus.chen@ktn.io', fullName: 'Marcus Chen', title: 'Battery Systems Architect', role: 'CONTRIBUTOR' },
    { key: 'wind', email: 'ingrid.berg@ktn.io', fullName: 'Ingrid Berg', title: 'Offshore Wind Structures Engineer', role: 'ENGINEER' },
    { key: 'semi', email: 'takeshi.mori@ktn.io', fullName: 'Takeshi Mori', title: 'Semiconductor Packaging Engineer', role: 'ENGINEER' },
    { key: 'med', email: 'aisha.khan@ktn.io', fullName: 'Aisha Khan', title: 'Medical Device Reliability Engineer', role: 'CONTRIBUTOR' },
    { key: 'guest', email: 'guest@ktn.io', fullName: 'KTN Guest Explorer', title: 'Anonymous Innovation Explorer', role: 'ADMIN' },
  ];

  for (const u of userDefs) {
    const created = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        fullName: u.fullName,
        title: u.title,
        role: u.role,
        organizationId: org.id,
      },
    });
    users[u.key] = created.id;
  }

  // ------------------------------------------------------------
  // 2. DOMAINS & INDUSTRIES
  // ------------------------------------------------------------
  const domainDefs: Array<{ code: string; name: string; description: string }> = [
    { code: 'AERO', name: 'Aerospace & Propulsion', description: 'Turbomachinery, structural dynamics, and orbital systems.' },
    { code: 'SEMI', name: 'Semiconductor Manufacturing', description: 'Wafer fabrication, packaging, and thermal management.' },
    { code: 'EV', name: 'Electric Vehicle Systems', description: 'Battery packs, power electronics, and thermal safety.' },
    { code: 'WIND', name: 'Offshore Wind Energy', description: 'Turbine structures, blade aerodynamics, and foundations.' },
    { code: 'ROBOT', name: 'Robotics & Automation', description: 'Kinematics, calibration, and precision control.' },
    { code: 'MED', name: 'Medical Devices', description: 'Implantable devices, sterilization, and biocompatibility.' },
    { code: 'MARINE', name: 'Marine & Subsea Engineering', description: 'Subsea connectors, corrosion protection, and deepwater systems.' },
    { code: 'SW', name: 'Software & Cloud Infrastructure', description: 'Distributed systems, consensus, and reliability.' },
  ];
  const domainId: Record<string, string> = {};
  for (const d of domainDefs) {
    const rec = await prisma.engineeringDomain.create({ data: d });
    domainId[d.code] = rec.id;
  }

  const industryDefs: Array<{ code: string; name: string; description: string }> = [
    { code: 'AER', name: 'Aerospace', description: 'Aircraft, spacecraft, and propulsion OEMs.' },
    { code: 'SEM', name: 'Semiconductors', description: 'Chipmakers, packaging, and tool vendors.' },
    { code: 'AUTO', name: 'Automotive & EV', description: 'OEMs, battery suppliers, and tier-1 suppliers.' },
    { code: 'REN', name: 'Renewable Energy', description: 'Wind, solar, and storage developers.' },
    { code: 'MNF', name: 'Advanced Manufacturing', description: 'Precision machining, assembly, and process control.' },
    { code: 'HLC', name: 'Healthcare & Medical', description: 'Medical device and life-sciences manufacturers.' },
    { code: 'MAR', name: 'Marine & Energy', description: 'Offshore, subsea, and maritime operators.' },
    { code: 'SW', name: 'Software & Cloud', description: 'Cloud providers and distributed-systems builders.' },
  ];
  const industryId: Record<string, string> = {};
  for (const ind of industryDefs) {
    const rec = await prisma.industry.create({ data: ind });
    industryId[ind.code] = rec.id;
  }

  // ------------------------------------------------------------
  // 3. ENGINEERING PRINCIPLES (shared physics across domains)
  // ------------------------------------------------------------
  const principleDefs = [
    { name: 'Compressive Residual Stress Surface Treatment', code: 'PRINCIPLE-PEEN', category: 'FATIGUE_ENGINEERING', description: 'Introducing compressive residual stress at critical surfaces arrests crack initiation and growth under cyclic loading.' },
    { name: 'Cyclic Fatigue & Stress Concentration', code: 'PRINCIPLE-FATIGUE', category: 'MECHANICAL', description: 'Cyclic loading near stress raisers drives crack initiation; life is governed by amplitude, mean stress, and stress concentration.' },
    { name: 'Heat Transfer & Thermal Dissipation', code: 'PRINCIPLE-THERMAL', category: 'THERMAL_MANAGEMENT', description: 'Moving heat from high-flux sources to sinks via conduction, convection, phase change, or radiation.' },
    { name: 'Thermal Interface & Phase Change', code: 'PRINCIPLE-PHASECHANGE', category: 'THERMAL_MANAGEMENT', description: 'Phase-change materials absorb large latent heat to suppress thermal excursions and runaway propagation.' },
    { name: 'Kinematic Calibration & Backlash Compensation', code: 'PRINCIPLE-CALIB', category: 'CONTROL_ENGINEERING', description: 'Periodic kinematic identification and error compensation restore precision in articulated mechanisms.' },
    { name: 'Coordinate Metrology Alignment', code: 'PRINCIPLE-METROLOGY', category: 'ALIGNMENT', description: 'Laser/vision-based coordinate alignment reduces assembly error propagation in precision integration.' },
    { name: 'Contamination & Particulate Control', code: 'PRINCIPLE-CONTAM', category: 'PROCESS_CONTROL', description: 'Closed-loop airborne particle control and sterile barriers prevent defect-causing contamination.' },
    { name: 'Galvanic & Cathodic Corrosion Protection', code: 'PRINCIPLE-CORROSION', category: 'MATERIALS', description: 'Galvanic isolation and impressed-current cathodic protection arrest corrosion in aggressive environments.' },
    { name: 'Consensus & Partition Recovery', code: 'PRINCIPLE-CONSENSUS', category: 'DISTRIBUTED_SYSTEMS', description: 'Leader-based consensus with quorum rules maintains consistency through network partitions.' },
    { name: 'Deterministic Scheduling', code: 'PRINCIPLE-SCHEDULING', category: 'OPERATIONS', description: 'Constraint-driven deterministic scheduling stabilizes throughput under variability.' },
  ];
  for (const p of principleDefs) {
    await prisma.engineeringPrinciple.create({ data: p });
  }

  // ------------------------------------------------------------
  // 4. ENGINEERING PROBLEMS (cross-domain analogues)
  // ------------------------------------------------------------
  const problemDefs = [
    { key: 'P-AERO-HCF', title: 'High-cycle fatigue cracking in gas turbine fan blade roots', description: 'Fan blades experience high-cycle vibration loading at blade roots, driving fretting fatigue crack initiation and propagation near the dovetail.', severity: 'HIGH' as ProblemSeverity, domain: 'AERO', industry: 'AER', creator: 'aero' },
    { key: 'P-WIND-BLADEROOT', title: 'High-cycle fatigue cracking in offshore wind turbine blade root joints', description: 'Blade root bolt joints in offshore turbines suffer high-cycle bending fatigue from wind load spectra, leading to crack initiation at bolt holes.', severity: 'HIGH' as ProblemSeverity, domain: 'WIND', industry: 'REN', creator: 'wind' },
    { key: 'P-SEMI-DIEATTACH', title: 'Die-attach delamination under thermal cycling', description: 'CTE mismatch between die and substrate drives delamination of die-attach layers during thermal cycling, degrading thermal performance.', severity: 'MEDIUM' as ProblemSeverity, domain: 'SEMI', industry: 'SEM', creator: 'semi' },
    { key: 'P-EV-THERMAL', title: 'Battery cell thermal runaway propagation in dense EV packs', description: 'A single cell thermal event can cascade to adjacent cells via heat transfer through module structure, risking full-pack fires.', severity: 'CRITICAL' as ProblemSeverity, domain: 'EV', industry: 'AUTO', creator: 'ev' },
    { key: 'P-ROBOT-DRIFT', title: 'End-effector positional drift in articulated robots', description: 'Gear backlash, thermal growth, and wear cause positional drift of the end-effector, degrading repeatability in precision assembly.', severity: 'MEDIUM' as ProblemSeverity, domain: 'ROBOT', industry: 'MNF', creator: 'admin' },
    { key: 'P-MED-CONTAM', title: 'Contamination-induced inflammation around surgical implants', description: 'Residual particulate or biofilm contamination on implant surfaces triggers inflammatory response and implant rejection.', severity: 'CRITICAL' as ProblemSeverity, domain: 'MED', industry: 'HLC', creator: 'med' },
    { key: 'P-MNF-PARTICULATE', title: 'Particulate contamination in precision machining lines', description: 'Airborne particles settling on machined surfaces cause defects in high-tolerance components, reducing yield.', severity: 'MEDIUM' as ProblemSeverity, domain: 'ROBOT', industry: 'MNF', creator: 'admin' },
    { key: 'P-MARINE-GALVANIC', title: 'Galvanic corrosion in subsea power connectors', description: 'Dissimilar-metal connectors in seawater establish galvanic cells, corroding critical sealing surfaces and causing insulation breakdown.', severity: 'HIGH' as ProblemSeverity, domain: 'MARINE', industry: 'MAR', creator: 'admin' },
    { key: 'P-WIND-MONOPILE', title: 'Cathodic protection failure on offshore wind monopiles', description: 'Coating holidays and anode exhaustion leave monopile surfaces unprotected, enabling localized corrosion in the splash zone.', severity: 'MEDIUM' as ProblemSeverity, domain: 'WIND', industry: 'REN', creator: 'wind' },
    { key: 'P-AERO-SATALIGN', title: 'Satellite payload misalignment during integration', description: 'Manual alignment of payload boresights to the spacecraft datum introduces cumulative error affecting mission pointing accuracy.', severity: 'HIGH' as ProblemSeverity, domain: 'AERO', industry: 'AER', creator: 'admin' },
    { key: 'P-SW-CONSENSUS', title: 'Consensus deadlock during datacenter partition recovery', description: 'Network partitions between replicas can stall leader election and consensus progress, delaying recovery and risking split-brain.', severity: 'HIGH' as ProblemSeverity, domain: 'SW', industry: 'SW', creator: 'admin' },
    { key: 'P-MNF-SCHED', title: 'Schedule instability in manufacturing execution systems', description: 'Unpredictable machine breakdowns and material delays destabilize MES schedules, causing WIP pileups and late deliveries.', severity: 'MEDIUM' as ProblemSeverity, domain: 'SW', industry: 'MNF', creator: 'admin' },
  ];

  const problemId: Record<string, string> = {};
  for (const p of problemDefs) {
    const rec = await prisma.engineeringProblem.create({
      data: {
        title: p.title,
        description: p.description,
        severity: p.severity,
        domainId: domainId[p.domain],
        industryId: industryId[p.industry],
        organizationId: org.id,
        creatorId: users[p.creator],
      },
    });
    problemId[p.key] = rec.id;
  }

  // ------------------------------------------------------------
  // 5. VERIFIED SOLUTIONS
  // ------------------------------------------------------------
  const solutionDefs = [
    { key: 'S-PEEN-AERO', problem: 'P-AERO-HCF', title: 'Shot peening with compressive residual stress layer for fan blade roots', summary: 'Controlled shot peening of the blade root dovetail introduces a deep compressive residual stress layer that arrests fretting fatigue crack initiation.', solutionDetails: 'AI-controlled shot peening at Almen intensity 12-16A with ceramic media, followed by thermal relaxation bake and residual stress verification via XRD.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: 'Validated across 42 test cycles at full flight load spectrum.', domain: 'AERO', industry: 'AER', creator: 'aero', verifier: 'verifier' },
    { key: 'S-PEEN-WIND', problem: 'P-WIND-BLADEROOT', title: 'Roller burnishing of blade root bolt holes for fatigue life extension', summary: 'Roller burnishing of the bolt-hole bore introduces compressive residual stress, extending fatigue life of blade root joints under wind load spectra.', solutionDetails: 'Hydraulic roller burnishing tooling applied to bolt hole bores; verified by residual stress measurement and 10^7 cycle coupon testing.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: 'Demonstrated 3.1x life improvement on scale-model blade root.', domain: 'WIND', industry: 'REN', creator: 'wind', verifier: 'verifier' },
    { key: 'S-SILICON-NITRIDE', problem: 'P-SEMI-DIEATTACH', title: 'Silver-sintered die attach with coefficient-matched interposer', summary: 'Replacing solder die attach with pressure-assisted silver sintering on a CTE-matched interposer suppresses delamination under thermal cycling.', solutionDetails: 'Pressure-assisted silver sinter (3 MPa, 250C) with SiC-reinforced interposer; thermal impedance reduced 38% vs solder.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: '1000 thermal shock cycles without delamination.', domain: 'SEMI', industry: 'SEM', creator: 'semi', verifier: 'verifier' },
    { key: 'S-PCM-BATTERY', problem: 'P-EV-THERMAL', title: 'Multi-layer phase-change thermal barrier for battery pack runaway suppression', summary: 'Layered architecture of intumescent mica sheet, phase-change material, and thermal break inserts contains single-cell thermal events.', solutionDetails: 'Module-level PCM cells (paraffin/expanded graphite composite) absorb latent heat; mica barriers block flame propagation between cells.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: 'Single-cell trigger test: no adjacent cell thermal runaway in 60 min.', domain: 'EV', industry: 'AUTO', creator: 'ev', verifier: 'verifier' },
    { key: 'S-CALIB-ROBOT', problem: 'P-ROBOT-DRIFT', title: 'Adaptive kinematic calibration loop with backlash compensation', summary: 'Periodic external-sensor kinematic identification with model-based backlash compensation restores end-effector repeatability.', solutionDetails: 'Laser tracker-based kinematic identification every 200h, feedforward backlash/thermal compensation in the controller.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: 'Repeatability improved from +/-0.4mm to +/-0.05mm.', domain: 'ROBOT', industry: 'MNF', creator: 'admin', verifier: 'verifier' },
    { key: 'S-STERILE-IMPLANT', problem: 'P-MED-CONTAM', title: 'Sterile barrier process chain for implantable devices', summary: 'Closed sterile barrier chain from final wash through barrier packaging eliminates residual particulate and biofilm contamination.', solutionDetails: 'Laminar-flow protected final wash, HEPA-classified transfer, VHP sterilization with rapid aerator, and particle-count release testing.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: 'Bacterial endotoxin and particulate release tests consistently pass.', domain: 'MED', industry: 'HLC', creator: 'med', verifier: 'verifier' },
    { key: 'S-CLEANROOM', problem: 'P-MNF-PARTICULATE', title: 'Closed-loop airborne particle control for precision machining cells', summary: 'Real-time particle monitoring with adaptive airflow and localized extraction holds airborne contamination below defect thresholds.', solutionDetails: 'Ionizing air knives at machining exits, continuous particle counters, closed-loop HVAC trim, and statistical process control.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: 'Yield improved 6.4% on high-tolerance components.', domain: 'ROBOT', industry: 'MNF', creator: 'admin', verifier: 'verifier' },
    { key: 'S-CORROSION', problem: 'P-MARINE-GALVANIC', title: 'Galvanic isolation coating and cathodic protection for subsea connectors', summary: 'Ceramic-polymer barrier coatings with galvanic isolation spacers eliminate dissimilar-metal galvanic cells in seawater.', solutionDetails: 'Alumina-reinforced polymer coating on both mating halves, PTFE isolation spacers, and sacrificial anode ring.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: '10-year accelerated seawater test: no crevice corrosion.', domain: 'MARINE', industry: 'MAR', creator: 'admin', verifier: 'verifier' },
    { key: 'S-ICCP', problem: 'P-WIND-MONOPILE', title: 'Impressed-current cathodic protection with distributed anodes for monopiles', summary: 'Distributed impressed-current anodes plus smart coating maintain polarization on monopile surfaces even in the splash zone.', solutionDetails: 'Hybrid ICCP with ribbon anodes along the pile, energized coating with self-healing pigments, and remote monitoring.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: 'Polarization maintained below -850mV vs Ag/AgCl for 24 months.', domain: 'WIND', industry: 'REN', creator: 'wind', verifier: 'verifier' },
    { key: 'S-METROLOGY', problem: 'P-AERO-SATALIGN', title: 'Laser tracker coordinate alignment for satellite payload integration', summary: 'Six-degree-of-freedom laser tracker alignment of payload boresights to spacecraft datum eliminates cumulative mechanical error.', solutionDetails: 'Multi-station laser tracker network, best-fit datum transformation, and photogrammetry checks on thermal distortion.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: 'Alignment error reduced from arcmin to arc-second class.', domain: 'AERO', industry: 'AER', creator: 'admin', verifier: 'verifier' },
    { key: 'S-RAFT', problem: 'P-SW-CONSENSUS', title: 'Raft consensus with lease-based partition recovery', summary: 'Leader lease expiration with weighted quorum pre-vote avoids stalled elections and split-brain during datacenter partitions.', solutionDetails: 'Bounded leader leases, pre-vote phase, and read-index optimization reduce unavailability windows during partitions.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: 'Recovery time under partition reduced from 42s to 3.1s.', domain: 'SW', industry: 'SW', creator: 'admin', verifier: 'verifier' },
    { key: 'S-REBALANCE', problem: 'P-MNF-SCHED', title: 'Constraint-based deterministic rescheduling for MES stability', summary: 'Constraint propagation with frozen-window hedging stabilizes MES schedules against machine breakdowns and material delays.', solutionDetails: 'Rule engine evaluating sequencing constraints, capacity buffers, and rolling frozen horizons with human-in-the-loop approval.', verificationStatus: SOLUTION_VERIFIED, verificationNotes: 'On-time delivery improved 18% with 40% fewer reschedules.', domain: 'SW', industry: 'MNF', creator: 'admin', verifier: 'verifier' },
  ];

  const solutionId: Record<string, string> = {};
  for (const s of solutionDefs) {
    const rec = await prisma.verifiedSolution.create({
      data: {
        problemId: problemId[s.problem],
        title: s.title,
        summary: s.summary,
        solutionDetails: s.solutionDetails,
        verificationStatus: s.verificationStatus,
        verificationNotes: s.verificationNotes,
        knownLimitations: 'Requires validated material characterization for the target environment before reuse.',
        domainId: domainId[s.domain],
        industryId: industryId[s.industry],
        creatorId: users[s.creator],
        verifierId: users[s.verifier],
        verifiedAt: new Date('2026-05-15T10:00:00Z'),
      },
    });
    solutionId[s.key] = rec.id;
  }

  // ------------------------------------------------------------
  // 6. KNOWLEDGE ENTRIES (rich, transferable engineering knowledge)
  // ------------------------------------------------------------
  const knowledgeDefs = [
    {
      key: 'K-PEEN-AERO',
      title: 'Fatigue Life Extension via Compressive Residual Stress Surface Treatment',
      problemSummary: 'High-cycle fatigue cracking at turbine blade roots reduces inspection intervals and fleet availability.',
      detailedProblem: 'Fretting fatigue at the blade root dovetail initiates under combined vibratory and centrifugal loading, with crack growth driven by high mean stress.',
      solutionSummary: 'Shot peening introduces a deep compressive residual stress layer that arrests crack initiation and dramatically extends fatigue life.',
      technicalExplanation: 'Compressive residual stress (600-900 MPa to a depth of 0.2-0.4mm) opposes tensile fatigue loads, shifting the mean stress into compression where fatigue cracks cannot propagate. Fatigue life extension follows the Goodman mean-stress correction. XRD-verified residual stress profiles and coupon S-N testing confirm 5-10x life improvement.',
      knownConstraints: 'Peening must not over-peen thin sections causing distortion; re-peening intervals required; shot media certification needed.',
      failureModes: 'Fretting fatigue; crack initiation at peening dimple defects if intensity uncontrolled.',
      lessonsLearned: 'Residual stress engineering is a transferable enabler for any high-cycle fatigue-critical metallic component.',
      domain: 'AERO', industry: 'AER', creator: 'aero',
    },
    {
      key: 'K-PEEN-WIND',
      title: 'Roller Burnishing for Blade Root Joint Fatigue in Offshore Wind Turbines',
      problemSummary: 'Blade root bolt holes in offshore turbines initiate fatigue cracks under multi-MN bending loads.',
      detailedProblem: 'Wind load spectra generate high-cycle bending fatigue at blade root bolt holes, with offshore turbulence amplifying damage accumulation rates.',
      solutionSummary: 'Hydraulic roller burnishing of bolt-hole bores introduces compressive residual stress, extending fatigue life under realistic load spectra.',
      technicalExplanation: 'Roller burnishing cold-works the bore surface creating a compressive residual stress layer (up to 800 MPa, 0.5mm deep) and improves surface finish (Ra 0.2um), removing machining notches that act as crack initiators. 10^7 cycle testing shows 3.1x life extension.',
      knownConstraints: 'Hole geometry limits tool access; burnishing force must be controlled to avoid bore ovality; verify on scale models first.',
      failureModes: 'High-cycle bending fatigue; fretting at bolt contact; corrosion-assisted fatigue in splash zone.',
      lessonsLearned: 'The compressive residual stress principle transfers directly from aerospace turbine blades to wind blade roots.',
      domain: 'WIND', industry: 'REN', creator: 'wind',
    },
    {
      key: 'K-THERMAL-SEMI',
      title: 'Layered Thermal Management Architecture for High-Density Chip Stacks',
      problemSummary: 'Heat flux in advanced chip stacks exceeds conventional TIM capacity, driving junction temperature and reliability risk.',
      detailedProblem: '3D-stacked dies concentrate heat fluxes above 300 W/cm2, while CTE mismatch between silicon, interposer, and substrate induces thermal-mechanical stress and delamination.',
      solutionSummary: 'A layered thermal architecture combining vapor chambers, phase-change TIMs, and CTE-matched interposers manages heat and stress simultaneously.',
      technicalExplanation: 'Vapor chambers spread heat laterally; phase-change TIMs absorb transient spikes; CTE-matched interposers decouple thermal-mechanical stress. The system is validated to 1000 thermal shock cycles with junction-to-case resistance reduced 38%.',
      knownConstraints: 'Height constraints in package; cost of vapor chamber; thermal interface materials degrade with thermal cycling.',
      failureModes: 'Die-attach delamination; TIM pump-out; solder fatigue under thermal cycling.',
      lessonsLearned: 'Heat flux management strategies are directly applicable to battery and power-electronics thermal design.',
      domain: 'SEMI', industry: 'SEM', creator: 'semi',
    },
    {
      key: 'K-THERMAL-EV',
      title: 'Multi-Level Thermal Barrier System for Battery Pack Thermal Runaway Suppression',
      problemSummary: 'Thermal runaway propagation in dense EV battery packs poses catastrophic fire risk.',
      detailedProblem: 'Single-cell thermal events (300-800C, gas venting) can cascade to adjacent cells through module structure within seconds, driven by conductive and radiative heat transfer.',
      solutionSummary: 'Layered thermal barriers (intumescent mica, phase-change material, thermal break inserts) contain events at the cell level and suppress propagation.',
      technicalExplanation: 'PCM cells (paraffin/expanded graphite) absorb latent heat (200+ J/g) during the runaway transient; intumescent mica expands to block flame and gas paths; thermal break inserts minimize conductive coupling. Full-module trigger testing demonstrates zero adjacent-cell propagation within 60 minutes.',
      knownConstraints: 'Mass and volume penalty of barrier layers; PCM cycling degradation; cost of intumescent materials.',
      failureModes: 'Thermal runaway propagation; vent gas deflagration; PCM leakage after repeated cycling.',
      lessonsLearned: 'Heat-flux management and phase-change principles from semiconductor packaging translate directly to battery thermal safety.',
      domain: 'EV', industry: 'AUTO', creator: 'ev',
    },
    {
      key: 'K-CALIB-ROBOT',
      title: 'Adaptive Kinematic Calibration and Backlash Compensation for Articulated Robots',
      problemSummary: 'End-effector positional drift degrades repeatability in high-precision robotic assembly.',
      detailedProblem: 'Gear backlash, thermal growth, joint compliance, and wear accumulate into positional error exceeding assembly tolerances in precision tasks.',
      solutionSummary: 'Periodic external-sensor kinematic identification with model-based backlash and thermal compensation restores precision.',
      technicalExplanation: 'A laser-tracker measures the end-effector across the workspace; least-squares identification updates Denavit-Hartenberg parameters; feedforward compensation predicts and cancels backlash and thermal drift in real time. Repeatability improved from +/-0.4mm to +/-0.05mm.',
      knownConstraints: 'Requires external metrology during calibration; model accuracy depends on sensor coverage; temperature transients still limit absolute accuracy.',
      failureModes: 'Kinematic drift; backlash-induced limit cycles; metrology sensor misalignment.',
      lessonsLearned: 'Metrology-guided calibration is a portable principle for any precision positioning system, including satellite assembly.',
      domain: 'ROBOT', industry: 'MNF', creator: 'admin',
    },
    {
      key: 'K-METROLOGY-SAT',
      title: 'Laser Tracker Coordinate Alignment for Satellite Payload Integration',
      problemSummary: 'Payload boresight misalignment during satellite integration degrades mission pointing performance.',
      detailedProblem: 'Cumulative mechanical tolerances and thermal distortion during integration shift payload boresights relative to the spacecraft datum, exceeding pointing budgets.',
      solutionSummary: 'Multi-station laser tracker network performs six-degree-of-freedom best-fit alignment of payloads to the spacecraft datum.',
      technicalExplanation: 'A network of laser trackers measures reference cube corner reflectors; best-fit datum transformation computes corrective shim thicknesses; photogrammetry validates thermal distortion. Alignment error reduced from arc-min to arc-second class.',
      knownConstraints: 'Cleanroom compatibility; tracker placement limited by spacecraft geometry; reflective surfaces complicate measurement.',
      failureModes: 'Boresight misalignment; thermal distortion during on-orbit transition; reference cube bonding failure.',
      lessonsLearned: 'Metrology-guided precision integration transfers from robotics to spacecraft and any high-value assembly.',
      domain: 'AERO', industry: 'AER', creator: 'admin',
    },
    {
      key: 'K-STERILE-MED',
      title: 'Sterile Barrier Process Chain for Implantable Medical Devices',
      problemSummary: 'Residual contamination on implant surfaces triggers inflammation and rejection.',
      detailedProblem: 'Particulate, endotoxin, and biofilm contamination on implant surfaces elicits inflammatory response, fibrous encapsulation, and device failure.',
      solutionSummary: 'A closed sterile barrier chain from final wash through barrier packaging eliminates contamination sources.',
      technicalExplanation: 'Laminar-flow protected final wash removes particles and bioburden; HEPA-classified transfer stages prevent recontamination; VHP sterilization with rapid aeration inactivates endotoxin; particle-count and endotoxin release testing verify conformance.',
      knownConstraints: 'Materials must withstand VHP cycles; process validation per ISO 11135/ISO 14644; cost of classified environments.',
      failureModes: 'Biofilm formation; endotoxin breakthrough; packaging integrity loss.',
      lessonsLearned: 'Contamination control methodology is directly transferable to precision manufacturing where particulate defects dominate yield loss.',
      domain: 'MED', industry: 'HLC', creator: 'med',
    },
    {
      key: 'K-PARTICLE-CLEANROOM',
      title: 'Closed-Loop Airborne Particle Control for Precision Manufacturing Cells',
      problemSummary: 'Airborne particulate contamination reduces yield of high-tolerance machined components.',
      detailedProblem: 'Particles settling on machined surfaces cause scratches, inclusions, and tolerance violations that drive rework and scrap.',
      solutionSummary: 'Real-time particle monitoring with adaptive airflow and localized extraction holds contamination below defect thresholds.',
      technicalExplanation: 'Continuous particle counters feed a closed-loop controller that trims HVAC airflow and activates ionizing air knives at machining exits; SPC alarms trigger intervention. Yield improved 6.4% on high-tolerance components.',
      knownConstraints: 'Sensor placement coverage; airflow changes affect thermal stability of machines; calibration of particle counters.',
      failureModes: 'Particle redeposition; sensor drift; airflow-induced machining thermal error.',
      lessonsLearned: 'The closed-loop contamination-control principle from medical devices maps to general precision manufacturing.',
      domain: 'ROBOT', industry: 'MNF', creator: 'admin',
    },
    {
      key: 'K-CORROSION-MARINE',
      title: 'Galvanic Isolation Coating and Cathodic Protection for Subsea Power Connectors',
      problemSummary: 'Galvanic corrosion in dissimilar-metal subsea connectors causes insulation breakdown.',
      detailedProblem: 'Seawater creates galvanic cells between aluminum housings, copper contacts, and steel fasteners, corroding critical sealing surfaces and degrading insulation resistance.',
      solutionSummary: 'Ceramic-polymer barrier coatings with galvanic isolation spacers and sacrificial anodes eliminate dissimilar-metal cells.',
      technicalExplanation: 'Alumina-reinforced polymer coatings raise contact resistance; PTFE isolation spacers break galvanic coupling; sacrificial anode rings protect exposed cathodes. Accelerated 10-year seawater testing shows no crevice corrosion.',
      knownConstraints: 'Coating wear during make/break cycling; anode service life; inspection access in deep water.',
      failureModes: 'Galvanic corrosion; crevice corrosion; hydrogen embrittlement of high-strength fasteners.',
      lessonsLearned: 'Galvanic corrosion protection principles transfer to offshore wind foundation systems and any seawater-exposed structure.',
      domain: 'MARINE', industry: 'MAR', creator: 'admin',
    },
    {
      key: 'K-ICCP-WIND',
      title: 'Impressed-Current Cathodic Protection with Distributed Anodes for Offshore Monopiles',
      problemSummary: 'Coating failures leave offshore wind monopiles unprotected against splash-zone corrosion.',
      detailedProblem: 'Coating holidays, anode exhaustion, and splash-zone wet/dry cycling create localized corrosion cells that threaten foundation integrity.',
      solutionSummary: 'Hybrid impressed-current cathodic protection with distributed ribbon anodes and smart self-healing coating maintains polarization.',
      technicalExplanation: 'Ribbon anodes along the pile distribute current uniformly; energized coating with self-healing pigments reseals holidays; remote monitoring sustains polarization below -850mV vs Ag/AgCl. Verified over 24 months in service.',
      knownConstraints: 'Power supply reliability; anode current leakage to adjacent structures; monitoring system maintenance.',
      failureModes: 'Localized pitting; coating blistering; anode consumption.',
      lessonsLearned: 'Cathodic protection design transfers from subsea connectors and pipelines to wind foundations.',
      domain: 'WIND', industry: 'REN', creator: 'wind',
    },
    {
      key: 'K-CONSENSUS-SW',
      title: 'Raft Consensus with Lease-Based Partition Recovery',
      problemSummary: 'Datacenter network partitions stall consensus progress and delay recovery.',
      detailedProblem: 'Leader election and log replication stall during partitions between replicas, and naive failover risks split-brain and data divergence.',
      solutionSummary: 'Bounded leader leases with weighted quorum pre-vote recover quickly and safely through partitions.',
      technicalExplanation: 'Leader leases expire deterministically, pre-vote phase prevents disrupted candidates from disrupting stable leaders, and read-index optimization serves consistent reads during recovery. Partition recovery reduced from 42s to 3.1s with no split-brain.',
      knownConstraints: 'Lease duration trades availability vs failover speed; requires stable clock skew bounds; weights need careful tuning.',
      failureModes: 'Split-brain; log divergence; leader election thrash.',
      lessonsLearned: 'Consensus and partition-recovery principles apply to any system requiring consistency under partial failure.',
      domain: 'SW', industry: 'SW', creator: 'admin',
    },
    {
      key: 'K-SCHED-MES',
      title: 'Constraint-Based Deterministic Rescheduling for Manufacturing Execution Systems',
      problemSummary: 'Machine breakdowns and material delays destabilize MES schedules.',
      detailedProblem: 'Unpredictable disruptions force frequent rescheduling, causing WIP pileups, idle machines, and missed delivery dates.',
      solutionSummary: 'Constraint propagation with frozen-window hedging stabilizes schedules against disruption.',
      technicalExplanation: 'A rule engine evaluates sequencing, capacity, and material constraints; capacity buffers and rolling frozen horizons limit disruption propagation; human-in-the-loop approval prevents thrash. On-time delivery improved 18% with 40% fewer reschedules.',
      knownConstraints: 'Rule completeness; frozen-window length trade-off; data latency from shop floor systems.',
      failureModes: 'Schedule instability; constraint violation; buffer starvation.',
      lessonsLearned: 'Deterministic scheduling under variability is a transferable operations principle for any production system.',
      domain: 'SW', industry: 'MNF', creator: 'admin',
    },
  ];

  const knowledgeId: Record<string, string> = {};
  for (const k of knowledgeDefs) {
    const rec = await prisma.knowledgeEntry.create({
      data: {
        title: k.title,
        problemSummary: k.problemSummary,
        detailedProblem: k.detailedProblem,
        solutionSummary: k.solutionSummary,
        technicalExplanation: k.technicalExplanation,
        knownConstraints: k.knownConstraints,
        failureModes: k.failureModes,
        lessonsLearned: k.lessonsLearned,
        benefits: 'Reusable across adjacent industries; evidence-backed; reduces rediscovery cost.',
        tradeoffs: 'Requires re-validation against target-environment constraints.',
        implementationSteps: '1) Characterize target environment 2) Re-validate material properties 3) Pilot on low-risk subsystem.',
        verificationStatus: KNOWLEDGE_VERIFIED,
        confidenceScore: 92,
        difficultyLevel: 3,
        viewCount: 140 + Math.floor(Math.random() * 300),
        readingTimeMinutes: 8,
        visibility: KnowledgeVisibility.PUBLIC,
        verificationNotes: 'Verified by domain verifier with empirical evidence linked.',
        domainId: domainId[k.domain],
        industryId: industryId[k.industry],
        organizationId: org.id,
        creatorId: users[k.creator],
        reviewerId: users['verifier'],
        verifiedAt: new Date('2026-06-01T09:00:00Z'),
      },
    });
    knowledgeId[k.key] = rec.id;
  }

  // ------------------------------------------------------------
  // 7. FAILURE RECORDS (recurring root mechanisms across domains)
  // ------------------------------------------------------------
  const failureDefs = [
    { key: 'F-AERO-HCF', title: 'Fan blade root fretting fatigue crack', summary: 'Fretting fatigue initiated at blade root dovetail under combined vibration and centrifugal loading.', description: 'High-cycle vibration at fan blade resonance drove fretting damage and crack initiation at the dovetail contact surface.', category: 'STRUCTURAL_FATIGUE', failureType: 'FATIGUE_CRACK', subsystem: 'Fan Module', component: 'Fan Blade Root', phenomenon: 'High-cycle fatigue', rootCause: 'Fretting fatigue with high mean stress', immediateCause: 'Resonance crossing at operational speed', contributingFactors: 'Surface roughness; assembly preload; stress concentration', severity: 9, occurrence: 7, detectability: 6, rpn: 378, correctiveActions: 'Shot peening + blade root redesign', preventiveActions: 'Residual stress treatment; mistuned blade design', lessonsLearned: 'Fretting fatigue must be mitigated with residual stress engineering at the design stage.', domain: 'AERO', industry: 'AER', contributor: 'aero' },
    { key: 'F-WIND-ROOT', title: 'Blade root bolt hole fatigue crack', summary: 'High-cycle bending fatigue crack initiated at blade root bolt holes.', description: 'Wind load spectra drove high-cycle bending fatigue at blade root bolt holes, initiating cracks at machining notches.', category: 'STRUCTURAL_FATIGUE', failureType: 'FATIGUE_CRACK', subsystem: 'Blade Root', component: 'Bolt Hole Bore', phenomenon: 'High-cycle fatigue', rootCause: 'Bending fatigue with tensile mean stress', immediateCause: 'Offshore turbulence overload cycles', contributingFactors: 'Machining notches; corrosion pitting; preload loss', severity: 8, occurrence: 8, detectability: 5, rpn: 320, correctiveActions: 'Roller burnishing + bolt preload optimization', preventiveActions: 'Burnish holes; corrosion protection; condition monitoring', lessonsLearned: 'The same high-cycle fatigue root mechanism appears in aerospace and wind structures.', domain: 'WIND', industry: 'REN', contributor: 'wind' },
    { key: 'F-SEMI-DELAM', title: 'Die-attach delamination after thermal cycling', summary: 'CTE-mismatch-driven delamination of die-attach layer degraded thermal path.', description: 'Thermal cycling caused CTE-mismatch stress between die and substrate, delaminating the die-attach layer and degrading thermal performance.', category: 'THERMAL_MECHANICAL', failureType: 'DELAMINATION', subsystem: 'Package', component: 'Die Attach', phenomenon: 'Thermal-mechanical stress', rootCause: 'CTE mismatch cyclic strain', immediateCause: 'Temperature cycling profile', contributingFactors: 'Void content; solder fatigue; intermetallic growth', severity: 7, occurrence: 6, detectability: 7, rpn: 294, correctiveActions: 'Silver-sintered attach + interposer', preventiveActions: 'CTE-matched materials; derating; thermal cycling qualification', lessonsLearned: 'Thermal cycling drives delamination across packaging and battery domains alike.', domain: 'SEMI', industry: 'SEM', contributor: 'semi' },
    { key: 'F-EV-RUNAWAY', title: 'Cell thermal runaway propagation event', summary: 'Single-cell thermal event cascaded to adjacent cells.', description: 'Internal short circuit triggered thermal runaway in one cell; heat transfer through the module ignited adjacent cells.', category: 'THERMAL_SAFETY', failureType: 'THERMAL_RUNAWAY', subsystem: 'Battery Module', component: 'Cell Stack', phenomenon: 'Thermal runaway propagation', rootCause: 'Cascading heat transfer between cells', immediateCause: 'Internal short circuit', contributingFactors: 'High energy density; inadequate barriers; cell venting', severity: 10, occurrence: 4, detectability: 5, rpn: 200, correctiveActions: 'Multi-layer thermal barriers installed', preventiveActions: 'PCM barriers; intumescent mica; venting channels', lessonsLearned: 'Phase-change thermal management learned in semiconductors applies to battery fire safety.', domain: 'EV', industry: 'AUTO', contributor: 'ev' },
    { key: 'F-ROBOT-DRIFT', title: 'End-effector positional drift', summary: 'Gear wear and thermal drift degraded robot repeatability.', description: 'Backlash growth, gear wear, and thermal expansion caused end-effector positional drift beyond assembly tolerances.', category: 'PRECISION_CONTROL', failureType: 'POSITIONAL_DRIFT', subsystem: 'Articulation', component: 'Joints', phenomenon: 'Kinematic drift', rootCause: 'Backlash + thermal growth', immediateCause: 'Accumulated wear over duty cycles', contributingFactors: 'Temperature transients; joint compliance; sensor drift', severity: 6, occurrence: 7, detectability: 4, rpn: 168, correctiveActions: 'Adaptive calibration loop installed', preventiveActions: 'Periodic kinematic identification; thermal compensation', lessonsLearned: 'Calibration drift recurs in robotics and spacecraft integration; metrology fixes both.', domain: 'ROBOT', industry: 'MNF', contributor: 'admin' },
    { key: 'F-MED-CONTAM', title: 'Implant contamination event', summary: 'Residual particulate contamination triggered inflammatory response.', description: 'Residual particles and biofilm on implant surface triggered inflammation and fibrous encapsulation leading to device explant.', category: 'CONTAMINATION', failureType: 'PARTICULATE', subsystem: 'Final Assembly', component: 'Implant Surface', phenomenon: 'Particulate contamination', rootCause: 'Inadequate barrier control', immediateCause: 'Recontamination during transfer', contributingFactors: 'Static charge; air turbulence; packaging breaches', severity: 9, occurrence: 5, detectability: 6, rpn: 270, correctiveActions: 'Sterile barrier chain implemented', preventiveActions: 'HEPA transfer; VHP sterilization; particle release testing', lessonsLearned: 'Contamination control is a shared failure mechanism between medical and precision manufacturing.', domain: 'MED', industry: 'HLC', contributor: 'med' },
    { key: 'F-MARINE-CORR', title: 'Subsea connector galvanic corrosion', summary: 'Galvanic corrosion damaged connector sealing surfaces.', description: 'Dissimilar metals in seawater formed galvanic cells, corroding sealing surfaces and degrading insulation resistance.', category: 'CORROSION', failureType: 'GALVANIC_CORROSION', subsystem: 'Connector', component: 'Sealing Surface', phenomenon: 'Galvanic corrosion', rootCause: 'Dissimilar metal galvanic coupling', immediateCause: 'Seawater electrolyte path', contributingFactors: 'Coating holidays; anode exhaustion; crevice geometry', severity: 8, occurrence: 6, detectability: 5, rpn: 240, correctiveActions: 'Galvanic isolation coating + cathodic protection', preventiveActions: 'Isolation spacers; barrier coatings; monitoring', lessonsLearned: 'Corrosion mechanisms recur across subsea and offshore-wind structures.', domain: 'MARINE', industry: 'MAR', contributor: 'admin' },
    { key: 'F-WIND-SPLASH', title: 'Monopile splash-zone corrosion', summary: 'Coating failure enabled localized pitting in splash zone.', description: 'Coating holidays and wet/dry cycling in the splash zone enabled localized corrosion cells on monopile surfaces.', category: 'CORROSION', failureType: 'LOCALIZED_PITTING', subsystem: 'Foundation', component: 'Monopile', phenomenon: 'Corrosion pitting', rootCause: 'Coating holiday + wet/dry cycling', immediateCause: 'Anode exhaustion', contributingFactors: 'Splash-zone exposure; chloride concentration; coating damage', severity: 7, occurrence: 6, detectability: 4, rpn: 168, correctiveActions: 'Hybrid ICCP + self-healing coating', preventiveActions: 'Distributed anodes; energized coating; remote monitoring', lessonsLearned: 'Cathodic protection learned in subsea engineering transfers to wind foundations.', domain: 'WIND', industry: 'REN', contributor: 'wind' },
  ];

  for (const f of failureDefs) {
    await prisma.failureRecord.create({
      data: {
        title: f.title,
        summary: f.summary,
        description: f.description,
        category: f.category,
        failureType: f.failureType,
        subsystem: f.subsystem,
        component: f.component,
        phenomenon: f.phenomenon,
        rootCause: f.rootCause,
        immediateCause: f.immediateCause,
        contributingFactors: f.contributingFactors,
        correctiveActions: f.correctiveActions,
        preventiveActions: f.preventiveActions,
        lessonsLearned: f.lessonsLearned,
        severity: f.severity,
        occurrence: f.occurrence,
        detectability: f.detectability,
        rpn: f.rpn,
        verificationStatus: KNOWLEDGE_VERIFIED,
        domainId: domainId[f.domain],
        industryId: industryId[f.industry],
        organizationId: org.id,
        contributorId: users[f.contributor],
        verifierId: users['verifier'],
        verifiedAt: new Date('2026-05-20T08:00:00Z'),
      },
    });
  }

  // ------------------------------------------------------------
  // 8. EVIDENCE RECORDS
  // ------------------------------------------------------------
  const evidenceDefs = [
    { key: 'E-PEEN', title: 'XRD residual stress + S-N coupon test report for shot peening', summary: 'Residual stress profiling and fatigue coupon data validating peening.', description: 'XRD residual stress profiles (600-900 MPa compressive to 0.4mm depth) and S-N coupon testing showing 5-10x fatigue life extension.', evidenceType: 'TEST_REPORT' as EvidenceType, source: 'KTN Materials Lab', confidence: 95, domain: 'AERO', industry: 'AER', contributor: 'aero' },
    { key: 'E-PCM', title: 'Module-level thermal runaway trigger test', summary: 'Single-cell trigger test showing zero adjacent-cell propagation.', description: 'Full module trigger test with PCM/intumescent barriers: no adjacent-cell thermal runaway within 60 minutes.', evidenceType: 'PROTOTYPE_RESULT' as EvidenceType, source: 'KTN Battery Test Lab', confidence: 93, domain: 'EV', industry: 'AUTO', contributor: 'ev' },
    { key: 'E-CALIB', title: 'Laser tracker repeatability benchmark for robot calibration', summary: 'Repeatability improved from +/-0.4mm to +/-0.05mm.', description: 'Workspace repeatability benchmark before and after adaptive calibration with laser tracker kinematic identification.', evidenceType: 'LAB_RESULT' as EvidenceType, source: 'KTN Robotics Lab', confidence: 91, domain: 'ROBOT', industry: 'MNF', contributor: 'admin' },
    { key: 'E-STERILE', title: 'Endotoxin and particulate release test results', summary: 'Release tests confirm contamination-free implant surfaces.', description: 'Bacterial endotoxin and particulate release testing across 200 implant units passing specification after sterile barrier chain.', evidenceType: 'QUALIFICATION_REPORT' as EvidenceType, source: 'KTN Medical QA', confidence: 97, domain: 'MED', industry: 'HLC', contributor: 'med' },
    { key: 'E-CORR', title: 'Accelerated seawater corrosion test (10-year equivalent)', summary: 'No crevice corrosion after accelerated seawater exposure.', description: 'Accelerated 10-year seawater testing of galvanic isolation coating system: no crevice corrosion, insulation resistance stable.', evidenceType: 'QUALIFICATION_REPORT' as EvidenceType, source: 'KTN Marine Lab', confidence: 94, domain: 'MARINE', industry: 'MAR', contributor: 'admin' },
    { key: 'E-ICCP', title: '24-month monopile polarization monitoring', summary: 'Polarization maintained below -850mV vs Ag/AgCl.', description: 'Two-year remote monitoring of hybrid ICCP on monopile foundation confirming sustained cathodic protection.', evidenceType: 'INSPECTION_REPORT' as EvidenceType, source: 'KTN Offshore Ops', confidence: 90, domain: 'WIND', industry: 'REN', contributor: 'wind' },
  ];

  for (const e of evidenceDefs) {
    await prisma.evidenceRecord.create({
      data: {
        title: e.title,
        summary: e.summary,
        description: e.description,
        evidenceType: e.evidenceType,
        source: e.source,
        confidenceLevel: 'HIGH',
        evidenceStrengthScore: e.confidence,
        verificationStatus: KNOWLEDGE_VERIFIED,
        domainId: domainId[e.domain],
        industryId: industryId[e.industry],
        organizationId: org.id,
        contributorId: users[e.contributor],
        verifierId: users['verifier'],
        verifiedAt: new Date('2026-05-25T11:00:00Z'),
      },
    });
  }

  // ------------------------------------------------------------
  // 9. STANDARDS
  // ------------------------------------------------------------
  const standardDefs = [
    { key: 'STD-ISO9001', title: 'Quality management systems', standardNumber: 'ISO 9001:2015', standardFamily: 'ISO', revision: '2015', officialPublisher: 'ISO', domain: 'AERO', industry: 'AER', contributor: 'verifier' },
    { key: 'STD-IEC61400', title: 'Wind energy generation systems - design requirements for offshore', standardNumber: 'IEC 61400-3', standardFamily: 'IEC', revision: '2019', officialPublisher: 'IEC', domain: 'WIND', industry: 'REN', contributor: 'wind' },
    { key: 'STD-ISO26262', title: 'Road vehicles - functional safety', standardNumber: 'ISO 26262', standardFamily: 'ISO', revision: '2018', officialPublisher: 'ISO', domain: 'EV', industry: 'AUTO', contributor: 'ev' },
    { key: 'STD-ISO13485', title: 'Medical devices - quality management systems', standardNumber: 'ISO 13485:2016', standardFamily: 'ISO', revision: '2016', officialPublisher: 'ISO', domain: 'MED', industry: 'HLC', contributor: 'med' },
    { key: 'STD-IPC', title: 'Acceptability of electronic assemblies', standardNumber: 'IPC-A-610', standardFamily: 'IPC', revision: 'Rev H', officialPublisher: 'IPC', domain: 'SEMI', industry: 'SEM', contributor: 'semi' },
  ];

  for (const s of standardDefs) {
    await prisma.standardRecord.create({
      data: {
        title: s.title,
        standardNumber: s.standardNumber,
        standardFamily: s.standardFamily,
        revision: s.revision,
        status: StandardStatus.ACTIVE,
        description: `${s.title} (${s.standardNumber}) applicable to ${s.standardFamily} engineering practice.`,
        scope: 'Applies to design, manufacturing, and verification of engineering systems.',
        officialPublisher: s.officialPublisher,
        verificationStatus: KNOWLEDGE_VERIFIED,
        domainId: domainId[s.domain],
        industryId: industryId[s.industry],
        organizationId: org.id,
        contributorId: users[s.contributor],
        reviewerId: users['verifier'],
      },
    });
  }

  // ------------------------------------------------------------
  // 10. GRAPH NODES & EDGES (incl. candidate/unverified relationships)
  // ------------------------------------------------------------
  const nodeDefs = [
    { name: 'Shot Peening', nodeType: 'MANUFACTURING_PROCESS' as GraphNodeType, domain: 'AERO' },
    { name: 'Roller Burnishing', nodeType: 'MANUFACTURING_PROCESS' as GraphNodeType, domain: 'WIND' },
    { name: 'Compressive Residual Stress', nodeType: 'PHYSICAL_PHENOMENON' as GraphNodeType, domain: 'AERO' },
    { name: 'High-Cycle Fatigue', nodeType: 'FAILURE_MODE' as GraphNodeType, domain: 'AERO' },
    { name: 'Vapor Chamber', nodeType: 'COMPONENT' as GraphNodeType, domain: 'SEMI' },
    { name: 'Phase-Change Material', nodeType: 'MATERIAL' as GraphNodeType, domain: 'EV' },
    { name: 'Intumescent Mica', nodeType: 'MATERIAL' as GraphNodeType, domain: 'EV' },
    { name: 'Thermal Runaway', nodeType: 'FAILURE_MODE' as GraphNodeType, domain: 'EV' },
    { name: 'Laser Tracker', nodeType: 'TECHNOLOGY' as GraphNodeType, domain: 'ROBOT' },
    { name: 'Kinematic Identification', nodeType: 'TECHNOLOGY' as GraphNodeType, domain: 'ROBOT' },
    { name: 'Galvanic Corrosion', nodeType: 'FAILURE_MODE' as GraphNodeType, domain: 'MARINE' },
    { name: 'Cathodic Protection', nodeType: 'TECHNOLOGY' as GraphNodeType, domain: 'MARINE' },
    { name: 'Sacrificial Anode', nodeType: 'COMPONENT' as GraphNodeType, domain: 'MARINE' },
    { name: 'Impressed-Current Cathodic Protection', nodeType: 'TECHNOLOGY' as GraphNodeType, domain: 'WIND' },
    { name: 'Vapor Sterilization (VHP)', nodeType: 'MANUFACTURING_PROCESS' as GraphNodeType, domain: 'MED' },
    { name: 'Airborne Particle Control', nodeType: 'TECHNOLOGY' as GraphNodeType, domain: 'MNF' },
    { name: 'Raft Consensus', nodeType: 'TECHNOLOGY' as GraphNodeType, domain: 'SW' },
    { name: 'Leader Lease', nodeType: 'CONSTRAINT' as GraphNodeType, domain: 'SW' },
    { name: 'Deterministic Scheduling', nodeType: 'TECHNOLOGY' as GraphNodeType, domain: 'SW' },
    { name: 'Constraint Propagation', nodeType: 'TECHNOLOGY' as GraphNodeType, domain: 'SW' },
  ];

  const nodeId: Record<string, string> = {};
  for (const n of nodeDefs) {
    const rec = await prisma.graphNode.create({
      data: {
        name: n.name,
        nodeType: n.nodeType,
        domainId: domainId[n.domain],
      },
    });
    nodeId[n.name] = rec.id;
  }

  // Knowledge nodes
  for (const k of Object.keys(knowledgeId)) {
    const rec = await prisma.graphNode.create({
      data: { name: k, nodeType: 'KNOWLEDGE_ENTRY' as GraphNodeType, entityId: knowledgeId[k] },
    });
    nodeId[k] = rec.id;
  }

  const edgeDefs: Array<{ from: string; to: string; rel: RelationshipType; weight: number; confidence: number; status: VerificationStatus }> = [
    { from: 'K-PEEN-AERO', to: 'Shot Peening', rel: 'USES', weight: 1, confidence: 95, status: KNOWLEDGE_VERIFIED },
    { from: 'K-PEEN-AERO', to: 'Compressive Residual Stress', rel: 'GENERATED_BY', weight: 1, confidence: 95, status: KNOWLEDGE_VERIFIED },
    { from: 'K-PEEN-WIND', to: 'Roller Burnishing', rel: 'USES', weight: 1, confidence: 95, status: KNOWLEDGE_VERIFIED },
    { from: 'K-PEEN-WIND', to: 'Compressive Residual Stress', rel: 'GENERATED_BY', weight: 1, confidence: 90, status: KNOWLEDGE_VERIFIED },
    { from: 'K-PEEN-AERO', to: 'High-Cycle Fatigue', rel: 'PREVENTS', weight: 1, confidence: 92, status: KNOWLEDGE_VERIFIED },
    { from: 'K-PEEN-WIND', to: 'High-Cycle Fatigue', rel: 'PREVENTS', weight: 1, confidence: 85, status: KNOWLEDGE_VERIFIED },
    { from: 'K-THERMAL-SEMI', to: 'Vapor Chamber', rel: 'USES', weight: 1, confidence: 93, status: KNOWLEDGE_VERIFIED },
    { from: 'K-THERMAL-EV', to: 'Phase-Change Material', rel: 'USES', weight: 1, confidence: 94, status: KNOWLEDGE_VERIFIED },
    { from: 'K-THERMAL-EV', to: 'Intumescent Mica', rel: 'USES', weight: 1, confidence: 94, status: KNOWLEDGE_VERIFIED },
    { from: 'K-THERMAL-EV', to: 'Thermal Runaway', rel: 'PREVENTS', weight: 1, confidence: 93, status: KNOWLEDGE_VERIFIED },
    { from: 'K-CALIB-ROBOT', to: 'Laser Tracker', rel: 'USES', weight: 1, confidence: 91, status: KNOWLEDGE_VERIFIED },
    { from: 'K-CALIB-ROBOT', to: 'Kinematic Identification', rel: 'USES', weight: 1, confidence: 91, status: KNOWLEDGE_VERIFIED },
    { from: 'K-METROLOGY-SAT', to: 'Laser Tracker', rel: 'USES', weight: 1, confidence: 90, status: KNOWLEDGE_VERIFIED },
    { from: 'K-CORROSION-MARINE', to: 'Galvanic Corrosion', rel: 'PREVENTS', weight: 1, confidence: 94, status: KNOWLEDGE_VERIFIED },
    { from: 'K-CORROSION-MARINE', to: 'Cathodic Protection', rel: 'USES', weight: 1, confidence: 94, status: KNOWLEDGE_VERIFIED },
    { from: 'K-CORROSION-MARINE', to: 'Sacrificial Anode', rel: 'USES', weight: 1, confidence: 90, status: KNOWLEDGE_VERIFIED },
    { from: 'K-ICCP-WIND', to: 'Impressed-Current Cathodic Protection', rel: 'USES', weight: 1, confidence: 93, status: KNOWLEDGE_VERIFIED },
    { from: 'K-ICCP-WIND', to: 'Galvanic Corrosion', rel: 'PREVENTS', weight: 1, confidence: 88, status: KNOWLEDGE_VERIFIED },
    { from: 'K-STERILE-MED', to: 'Vapor Sterilization (VHP)', rel: 'USES', weight: 1, confidence: 95, status: KNOWLEDGE_VERIFIED },
    { from: 'K-PARTICLE-CLEANROOM', to: 'Airborne Particle Control', rel: 'USES', weight: 1, confidence: 90, status: KNOWLEDGE_VERIFIED },
    { from: 'K-CONSENSUS-SW', to: 'Raft Consensus', rel: 'USES', weight: 1, confidence: 92, status: KNOWLEDGE_VERIFIED },
    { from: 'K-CONSENSUS-SW', to: 'Leader Lease', rel: 'USES', weight: 1, confidence: 90, status: KNOWLEDGE_VERIFIED },
    { from: 'K-SCHED-MES', to: 'Deterministic Scheduling', rel: 'USES', weight: 1, confidence: 90, status: KNOWLEDGE_VERIFIED },
    { from: 'K-SCHED-MES', to: 'Constraint Propagation', rel: 'USES', weight: 1, confidence: 90, status: KNOWLEDGE_VERIFIED },

    // Candidate (unverified) cross-domain relationships - to be surfaced as hidden discoveries
    { from: 'K-PEEN-AERO', to: 'K-PEEN-WIND', rel: 'SIMILAR_TO', weight: 0.9, confidence: 72, status: 'UNVERIFIED' },
    { from: 'K-THERMAL-SEMI', to: 'K-THERMAL-EV', rel: 'SIMILAR_TO', weight: 0.85, confidence: 68, status: 'UNVERIFIED' },
    { from: 'K-CALIB-ROBOT', to: 'K-METROLOGY-SAT', rel: 'SIMILAR_TO', weight: 0.85, confidence: 70, status: 'UNVERIFIED' },
    { from: 'K-STERILE-MED', to: 'K-PARTICLE-CLEANROOM', rel: 'SIMILAR_TO', weight: 0.8, confidence: 65, status: 'UNVERIFIED' },
    { from: 'K-CORROSION-MARINE', to: 'K-ICCP-WIND', rel: 'SIMILAR_TO', weight: 0.85, confidence: 71, status: 'UNVERIFIED' },
    { from: 'K-CONSENSUS-SW', to: 'K-SCHED-MES', rel: 'SIMILAR_TO', weight: 0.7, confidence: 58, status: 'UNVERIFIED' },
    { from: 'Vapor Chamber', to: 'Phase-Change Material', rel: 'RELATED_TO', weight: 0.7, confidence: 55, status: 'UNVERIFIED' },
    { from: 'Laser Tracker', to: 'Kinematic Identification', rel: 'RELATED_TO', weight: 0.75, confidence: 62, status: 'UNVERIFIED' },
    { from: 'Sacrificial Anode', to: 'Impressed-Current Cathodic Protection', rel: 'RELATED_TO', weight: 0.8, confidence: 66, status: 'UNVERIFIED' },
    { from: 'Airborne Particle Control', to: 'Vapor Sterilization (VHP)', rel: 'RELATED_TO', weight: 0.65, confidence: 52, status: 'UNVERIFIED' },
  ];

  const edgeSourceId: Record<string, string> = {};
  for (const k of Object.keys(knowledgeId)) {
    edgeSourceId[k] = nodeId[k] ?? '';
  }
  // Resolve from/to ids: if from is a knowledge key use its node, else its name node
  const resolveNode = (ref: string): string | null => {
    if (edgeSourceId[ref]) return edgeSourceId[ref];
    if (nodeId[ref]) return nodeId[ref];
    return null;
  };

  for (const e of edgeDefs) {
    const source = resolveNode(e.from);
    const target = resolveNode(e.to);
    if (!source || !target) {
      console.warn(`Edge skipped (missing node): ${e.from} -> ${e.to}`);
      continue;
    }
    await prisma.graphEdge.create({
      data: {
        sourceNodeId: source,
        targetNodeId: target,
        relationshipType: e.rel,
        weight: e.weight,
        confidence: e.confidence,
        verificationStatus: e.status,
      },
    });
  }

  // ------------------------------------------------------------
  // 11. KNOWLEDGE TRANSLATIONS (verified seed examples)
  // ------------------------------------------------------------
  const translationDefs = [
    { source: 'K-PEEN-AERO', target: 'K-PEEN-WIND', type: 'STRUCTURAL_TRANSFER' as TranslationCategory, confidence: 87, explanation: 'Compressive residual stress fatigue mitigation transfers from aerospace turbine blades to offshore wind blade roots via identical fatigue physics.' },
    { source: 'K-THERMAL-SEMI', target: 'K-THERMAL-EV', type: 'THERMAL_TRANSFER' as TranslationCategory, confidence: 84, explanation: 'Heat-flux management and phase-change principles from semiconductor packaging translate to battery thermal runaway suppression.' },
    { source: 'K-CALIB-ROBOT', target: 'K-METROLOGY-SAT', type: 'FUNCTION_TRANSFER' as TranslationCategory, confidence: 82, explanation: 'Metrology-guided kinematic calibration from robotics transfers to satellite payload precision integration.' },
    { source: 'K-STERILE-MED', target: 'K-PARTICLE-CLEANROOM', type: 'MANUFACTURING_TRANSFER' as TranslationCategory, confidence: 80, explanation: 'Contamination-control methodology from medical sterilization transfers to precision manufacturing particulate control.' },
    { source: 'K-CORROSION-MARINE', target: 'K-ICCP-WIND', type: 'MATERIAL_TRANSFER' as TranslationCategory, confidence: 83, explanation: 'Galvanic corrosion protection from subsea connectors transfers to offshore wind monopile corrosion control.' },
  ];

  for (const t of translationDefs) {
    await prisma.knowledgeTranslation.create({
      data: {
        sourceKnowledgeId: knowledgeId[t.source],
        targetKnowledgeId: knowledgeId[t.target],
        sourceIndustryId: industryId.AER,
        targetIndustryId: industryId.REN,
        translationType: t.type,
        translationConfidence: t.confidence,
        verificationStatus: KNOWLEDGE_VERIFIED,
        explanation: t.explanation,
        functionalSimilarities: 'Identical governing physical mechanism; equivalent stress/thermal/contamination boundary conditions.',
        constraintSimilarities: 'Comparable operational duty cycles and environmental severity.',
        differingConstraints: 'Regulatory safety factors and qualification standards differ by industry.',
        verifiedAt: new Date('2026-06-10T10:00:00Z'),
      },
    });
  }

  // ------------------------------------------------------------
  // 12. ANALYTICS METRICS (innovation scoreboard)
  // ------------------------------------------------------------
  const metricDefs = [
    { name: 'Engineering Solutions Reused', code: 'SOLUTIONS_REUSED', description: 'Count of verified solution transfers accepted across domains.', formula: 'COUNT(knowledge_translation WHERE status=VERIFIED AND transfer accepted)', dataSource: 'TRANSLATIONS', visualizationType: 'METRIC_CARD' },
    { name: 'Duplicated Work Prevented', code: 'DUPLICATION_PREVENTED', description: 'Similar-problem pairs surfaced before independent re-solving.', formula: 'COUNT(problem pairs with shared failure mechanism)', dataSource: 'KNOWLEDGE', visualizationType: 'METRIC_CARD' },
    { name: 'Cross-Domain Discoveries', code: 'CROSS_DOMAIN_DISCOVERIES', description: 'Candidate solution transfers between industries.', formula: 'COUNT(transfers where source.industry <> target.industry)', dataSource: 'TRANSLATIONS', visualizationType: 'METRIC_CARD' },
    { name: 'Hidden Relationships Discovered', code: 'HIDDEN_RELATIONSHIPS', description: 'Candidate graph relationships awaiting verification.', formula: 'COUNT(graph_edges WHERE status=UNVERIFIED)', dataSource: 'KNOWLEDGE', visualizationType: 'METRIC_CARD' },
    { name: 'Knowledge Gaps Identified', code: 'KNOWLEDGE_GAPS', description: 'Failures without verified solutions and problems without knowledge.', formula: 'COUNT(failures without solution + problems without knowledge)', dataSource: 'FAILURES', visualizationType: 'METRIC_CARD' },
    { name: 'Innovation Opportunities Surfaced', code: 'OPPORTUNITIES_SURFACED', description: 'Total actionable innovation recommendations generated.', formula: 'SUM(engine recommendations)', dataSource: 'KNOWLEDGE', visualizationType: 'METRIC_CARD' },
  ];

  for (const m of metricDefs) {
    await prisma.analyticsMetric.create({ data: m });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
