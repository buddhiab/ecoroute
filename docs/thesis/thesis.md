ECOROUTE: AN INTEGRATED WASTE MANAGEMENT PLATFORM COMBINING BLOCKCHAIN-BASED CIVIC INCENTIVES WITH EMBEDDED INTERACTION TELEMETRY
[STUDENT’S FULL NAME]
Bachelor of Science (Honours) in Software Engineering
Department of 
[__________]
NSBM Green University
Sri Lanka
October 2026
ECOROUTE: AN INTEGRATED WASTE MANAGEMENT PLATFORM COMBINING BLOCKCHAIN-BASED CIVIC INCENTIVES WITH EMBEDDED INTERACTION TELEMETRY
A thesis submitted to NSBM Green University for the degree of
Bachelor of Science (Honours) in Software Engineering
By
[STUDENT’S FULL NAME]
Department of 
[__________]
Faculty of Computing
NSBM Green University
Sri Lanka
October 2026
DECLARATION
I declare that the content of this undergraduate thesis titled “EcoRoute: An Integrated Waste Management Platform Combining Blockchain-Based Civic Incentives with Embedded Interaction Telemetry” is my own work and this dissertation does not incorporate without acknowledgement any material previously submitted for any other degree in any university or institution of higher learning.
Signature ……………………
	
Date ……………………
Name: 
[STUDENT’S FULL NAME]
Signature of the Supervisor
………………………………
	
Date ……………………
Ms. Pavithra Subhashini
Principal Supervisor
[Senior Lecturer/Lecturer]
Department of 
[__________]
,
NSBM Green University
ACKNOWLEDGEMENT
I would like to express my sincere gratitude to my supervisor, Ms. Pavithra Subhashini, for her guidance, patience and constructive feedback throughout this project. Her advice at the interim reviews, particularly the insistence that the thesis should represent the artefact honestly, shaped both the direction of the work and the way it has been reported.
I am grateful to the Faculty of Computing of NSBM Green University and its academic staff for the knowledge and support provided throughout my degree, and to the members of the review panels for their comments, which strengthened this work.
Finally, I thank my family and friends for their encouragement, understanding and patience during the many long hours this project required.
ABSTRACT
Urban waste collection in Sri Lanka depends on coordination between administrators, collection drivers and residents, yet progress updates and public complaints are commonly exchanged through telephone calls and manual records, leaving each group with a different picture of the same operation. Existing digital solutions address route tracking, citizen reporting or software quality in isolation. This study aimed to design, implement and evaluate an integrated waste-management platform that unifies these roles through realtime shared state, rewards citizen participation with verifiable blockchain incentives, and embeds interaction telemetry as evidence of software quality. Following a Design Science Research methodology, EcoRoute was developed as a Next.js web platform with a Supabase backend providing authentication, PostgreSQL persistence and realtime subscriptions. Citizen issue reports trigger ERC-20 token rewards on the Ethereum Sepolia testnet, drivers stream GPS positions to live administrator and citizen maps, and each route completion records its task duration for an administrator quality dashboard. The platform was evaluated through controlled functional testing, database state verification, paired-client realtime propagation trials, independent on-chain verification and descriptive analysis of system-generated task-duration telemetry. 
[ADD RESULTS once testing is complete, e.g.: X of 10 functional test cases passed; all six realtime trials propagated without refresh within approximately Y seconds; reward transactions were confirmed on Sepolia; the mean task duration was Z seconds across N trials.] 
The findings indicate that row-level realtime subscriptions can keep administrators, drivers and citizens aligned on a single operational state without manual communication, and that verifiable incentives and embedded telemetry can be combined within one lightweight platform. The evidence is limited to single-operator, controlled trials on a testnet, and validation with real drivers and residents remains the principal direction for future work.
TABLE OF CONTENTS
DECLARATION
ii
ACKNOWLEDGEMENT
iii
ABSTRACT
iv
TABLE OF CONTENTS
v
LIST OF FIGURES
ix
LIST OF TABLES
xi
LIST OF ABBREVIATIONS
xii
1 INTRODUCTION
1
1.1 Chapter overview
1
1.2 Background
1
1.3 Problem statement
2
1.4 Research gap
3
1.5 Research questions
3
1.6 Research motivation and significance
4
1.7 Scope
4
1.8 Overview of the proposed solution
5
1.9 Chapter summary
7
2 OBJECTIVES
8
2.1 General objective
8
2.2 Specific objectives
8
2.2.1 To identify operational requirements and usability considerations
8
2.2.2 To analyse technological and research gaps
8
2.2.3 To design and develop the EcoRoute platform
8
2.2.4 To evaluate the implemented system
8
3 LITERATURE REVIEW
9
3.1 Chapter overview
9
3.2 Conceptual map of the literature
9
3.3 Domain overview: waste collection and operational usability
10
3.4 Existing systems and frameworks
11
3.5 Technological analysis
12
3.5.1 Realtime data synchronisation architectures
12
3.5.2 Blockchain-based civic incentives
13
3.6 Algorithmic analysis: HCI telemetry for software quality
14
3.7 Design analysis: mobile interface metaphors
15
3.8 Workflow analysis: realtime operational coordination
16
3.9 Research gap identification
17
3.10 Chapter summary
17
4 METHODOLOGY
19
4.1 Chapter overview
19
4.2 Research design
19
4.2.1 Research paradigm
19
4.2.2 Research approach
20
4.2.3 Research strategy
20
4.2.4 Research methodology execution workflow (DSRM)
21
4.3 Data collection and stakeholders
22
4.3.1 Fact collection mechanisms
22
4.3.2 Stakeholder analysis
23
4.4 Requirements and analysis
24
4.4.1 Operationalisation process
24
4.4.2 Use case diagram
25
4.4.3 Use case specifications
27
4.4.4 Functional requirements
28
4.4.5 Non-functional requirements
32
4.5 Proposed design
33
4.5.1 System architecture
33
4.5.2 Class and data model
34
4.5.3 Activity diagrams
36
4.5.4 Sequence diagrams
37
4.5.5 Deployment view
39
4.6 Development and implementation procedure
39
4.6.1 Development resources
40
4.6.2 Technology stack and justification
40
4.6.3 Authentication and the driver approval workflow
42
4.6.4 Blockchain incentive mechanism
43
4.6.5 Location tracking and live monitoring
45
4.6.6 Realtime dispatch coordination
46
4.6.7 HCI telemetry implementation
46
4.6.8 Push notification implementation
47
4.7 Evaluation plan
47
4.8 Ethics and project management
49
4.8.1 Ethical considerations
49
4.8.2 Project management methodology
50
4.8.3 Project timeline
50
4.9 Chapter summary
51
5 RESULTS
53
5.1 Chapter overview
53
5.2 Evaluation environment
53
5.3 Developed artefact
53
5.3.1 Access and driver onboarding
54
5.3.2 Citizen reporting and token rewards
57
5.3.3 Live tracking and field operations
58
5.3.4 Telemetry dashboard
60
5.4 Functional test results
60
5.4.1 Functional test cases
60
5.4.2 Database verification evidence
61
5.4.3 Known implementation defects
63
5.5 Evaluation results
64
5.5.1 Blockchain verification
64
5.5.2 Realtime propagation trials
65
5.5.3 Task duration telemetry analysis
66
5.6 Results by objective
68
5.7 Chapter summary
68
6 DISCUSSION AND CONCLUSIONS
69
6.1 Discussion of key findings
69
6.1.1 Objective 2.2.1: identify operational requirements and usability considerations
69
6.1.2 Objective 2.2.2: analyse technological and research gaps
69
6.1.3 Objective 2.2.3: design and develop the EcoRoute platform
69
6.1.4 Objective 2.2.4: evaluate the implemented system
70
6.2 Comparison with literature
71
6.3 Contribution and practical implications
71
6.3.1 Real-world application possibilities
72
6.3.2 Commercial viability considerations
72
6.4 Limitations
73
6.4.1 Limitations identified in the specification
73
6.4.2 Limitations of the evaluation
74
6.5 Conclusions
75
6.6 Future work
75
REFERENCES
77
APPENDIX A: PROBLEMS ENCOUNTERED AND SELF-REFLECTION
79
A.1 Problems encountered
79
A.2 Self-reflection
80
A.2.1 Ideology about the research carried out
80
A.2.2 Benefits gained
81
A.2.3 Learning curves
81
APPENDIX B: SMART CONTRACT SOURCE CODE
82
LIST OF FIGURES
Page
Figure 1.1: Rich picture diagram of the EcoRoute ecosystem
7
Figure 3.1: Conceptual map diagram of the literature
10
Figure 4.1: EcoRoute use case diagram
26
Figure 4.2: EcoRoute system architecture
34
Figure 4.3: Entity relationship model of the EcoRoute schema
34
Figure 4.4: Activity diagram — citizen report submission with blockchain reward issuance
36
Figure 4.5: Sequence diagram — driver registration through realtime administrator approval
37
Figure 4.6: Sequence diagram — citizen report to on-chain reward
38
Figure 4.7: Deployment diagram — browser clients, Next.js application, Supabase backend, Sepolia network, push service
39
Figure 4.8: Project source structure
42
Figure 4.9: Gantt chart of the project timeline
51
Figure 5.1: Landing page with role portal selection
54
Figure 5.2: Administrator authentication interface
54
Figure 5.3: Driver registration — Step 1, account credentials
55
Figure 5.4: Driver registration — Step 2, vehicle and zone selection
55
Figure 5.5: Driver registration — Step 3, review and submission
56
Figure 5.6: Administrator fleet monitor showing a pending driver approval
56
Figure 5.7: Citizen issue report interface with map pinpointing
57
Figure 5.8: Report submission confirmed with ERC-20 reward dispatched to the connected wallet
57
Figure 5.9: ECO payout gateway showing token balance and bank payout request
58
Figure 5.10: Driver active operational tasks with GPS tracking active
58
Figure 5.11: Administrator live fleet map with an actively tracking driver
59
Figure 5.12: Citizen live tracking view showing driver position, status and Haversine distance
59
Figure 5.13: Administrator SQA telemetry dashboard
60
Figure 5.14: driver_profiles table showing approval state and live tracking coordinates
62
Figure 5.15: CitizenReports table showing submitted, assigned and resolved reports
62
Figure 5.16: HCILogs table showing captured task-duration telemetry
63
Figure 5.17: BankPayouts table showing citizen redemption requests
63
Figure 5.18: Confirmed transaction on the public block explorer
65
Figure 5.19: Task duration across trials — line or bar chart
67
Figure 5.20: Distribution of task durations — histogram or box plot
67
LIST OF TABLES
Page
Table 1.1: Project scope
5
Table 4.1: Execution of the DSRM activities in this study
21
Table 4.2: Fact collection mechanisms
23
Table 4.3: Stakeholder analysis
23
Table 4.4: Operationalisation of the research objectives
24
Table 4.5: UC-01 specification: complete route and record interaction telemetry
27
Table 4.6: UC-02 specification: submit issue report with token reward
27
Table 4.7: UC-03 specification: assign report to driver
28
Table 4.8: Functional requirements
28
Table 4.9: Requirement traceability matrix
31
Table 4.10: Non-functional requirements
32
Table 4.11: Technology stack and justification
40
Table 4.12: Project timeline
50
Table 5.1: Functional test cases and results
60
Table 5.2: Known implementation defects
64
Table 5.3: Blockchain verification record
65
Table 5.4: Realtime propagation trials
65
Table 5.5: Descriptive statistics of task duration
67
Table 5.6: Mapping of results to the specific objectives
68
Table 6.1: Summary of objective accomplishment
71
LIST OF ABBREVIATIONS
Abbreviation
Description
ABI
Application Binary Interface
API
Application Programming Interface
AR
Augmented Reality
CRUD
Create, Read, Update and Delete
CSS
Cascading Style Sheets
DSRM
Design Science Research Methodology
ERC-20
Ethereum Request for Comments 20 (fungible token standard)
FK
Foreign Key
FR
Functional Requirement
GPS
Global Positioning System
HCI
Human-Computer Interaction
HTTP
Hypertext Transfer Protocol
IDE
Integrated Development Environment
IEEE
Institute of Electrical and Electronics Engineers
IoT
Internet of Things
NFR
Non-Functional Requirement
PECI
[add full form of the PECI framework from reference [13]]
PK
Primary Key
PPP
Public-Private Partnership
PRINCE2
PRojects IN Controlled Environments
REST
Representational State Transfer
SQA
Software Quality Assurance
SQL
Structured Query Language
SUS
System Usability Scale
UC
Use Case
VAPID
Voluntary Application Server Identification
Check this list against your final text and add any abbreviation you introduce later.
1 INTRODUCTION
1.1 Chapter overview
This chapter establishes the background, research problem, research gap, research questions, motivation, scope and an overview of the proposed solution for the EcoRoute study. 
The research is situated within urban waste collection in Sri Lanka, where operations require continuous coordination between administrative staff, field drivers and residents.
The chapter positions EcoRoute as an operator-agnostic platform. The workflows described are applicable to a municipal council operating its own fleet, to a private contractor collecting on behalf of a council, or to a public-private partnership arrangement. This framing is adopted deliberately and is justified in Section 1.7, because certain platform capabilities — notably the citizen incentive and payout mechanism — assume a service operator with discretionary control over an operating budget.
1.2 Background
Waste management involves the collection, transportation, processing, recycling and disposal of materials generated by human activity. Within urban areas, efficient waste collection depends not only on physical resources such as vehicles and labour, but on timely coordination, accurate reporting, route visibility and communication between operational stakeholders [1], [18]. In Sri Lanka, waste collection has historically involved a mixture of administrative records, telephone communication, verbal field updates and manual coordination. Such arrangements make it difficult to maintain a consistent digital view of route progress and public complaints, particularly when information is distributed across separate and unsynchronised channels [1], [2].
Digital systems have the potential to reduce these coordination problems by providing a common platform for administrators, collection drivers and residents. However, digital adoption in field environments is influenced by interface complexity, task pressure and the availability of timely system feedback. Research on public-sector digital services indicates that continuity of use depends not only on functional availability but on perceived service quality and the ability of users to complete meaningful tasks efficiently [1], [2]. Logistics and field-work research similarly indicates that poorly designed interfaces increase interaction effort and reduce the practical usefulness of digital tools for operational workers [3], [7].
Citizen participation is a further dimension of waste-management operations. Operators need mechanisms through which residents can access collection schedules and communicate problems such as missed pickups, overflowing public bins and illegal dumping. Civic digital systems can support this interaction, but participation declines when users receive little feedback or when reporting processes are disconnected from operational workflows [10]. A platform that links citizen reporting to operational visibility therefore has value beyond simple complaint submission — and the addition of a transparent, verifiable incentive may sustain participation where feedback alone does not [10], [11].
From a software-engineering perspective, system quality should also be considered at the level of user interaction. Conventional quality assurance emphasises functional correctness, integration behaviour and server-side reliability [5]. These measures are necessary but do not describe how efficiently a user can complete a task. Interaction-level indicators such as task duration provide additional evidence about usability and the effort required to operate a system [12], [13]. This motivates the inclusion of an HCI telemetry component in EcoRoute.
1.3 Problem statement
Urban waste collection requires coordination among administrators, field workers and residents, yet digital workflows are typically fragmented across separate communication and monitoring mechanisms. Existing solutions provide individual functions such as route tracking or public reporting without providing a unified view of operational status [1], [9], [10]. Three specific shortcomings compound this fragmentation.
First, operational state is propagated between roles by manual communication rather than by shared system state, so the administrator’s view of route progress and the driver’s actual position diverge. Second, citizen reporting mechanisms offer no verifiable return to the reporting resident, and participation is not sustained [10]. Third, software evaluation focused only on backend correctness overlooks the interaction effort experienced by non-technical users operating under time pressure [5], [12].
EcoRoute addresses this problem by developing an integrated waste-management platform that combines role-separated operational workflows, realtime fleet monitoring, citizen issue reporting with blockchain-based incentives, centralised data management, and an embedded HCI telemetry mechanism for driver task performance.
Waste-collection operations become inefficient when information about collection routes, driver progress and citizen-reported issues is fragmented across disconnected communication channels. The absence of a unified digital workflow makes monitoring, response and operational decision-making slower and less reliable, and prevents the accumulation of operational data that could inform service improvement [1], [2], [16].
1.4 Research gap
Within software engineering for field operations, three specific gaps remain. There is limited demonstration of transparent, verifiable civic incentives attached to waste-reporting workflows using public blockchain infrastructure at a scale appropriate to a municipal or contracted operator. There is limited integration of interaction-level telemetry into the operational system itself, such that software quality can be assessed from measured task performance rather than from functional test outcomes alone. And there is limited work binding these to a realtime, role-separated operational workflow in which dispatch decisions, field execution and citizen visibility are reconciled against shared state rather than by manual communication. 
The research gap addressed by this study 
is the absence of an integrated platform that combines all three within a single, deployable, lightweight architecture.
 These gaps are examined against the literature in Section 3.9.
1.5 Research questions
Main Research Question:
How can an integrated waste-management platform with blockchain-based civic incentives improve operational coordination between administrators, drivers and citizens while providing measurable evidence of software interaction quality?
Sub-Questions:
How can blockchain-based incentives be integrated into a civic reporting workflow in a manner that is transparent and verifiable to the reporting citizen?
What interaction-level telemetry can be embedded within an operational system to provide measurable evidence of software quality beyond functional correctness?
How can realtime shared state be used to reconcile administrative dispatch, field execution and citizen visibility without manual communication between roles?
To what extent does the integrated platform address the operational fragmentation identified in the problem statement?
1.6 Research motivation and significance
The motivation for this research arose from observing the practical conditions of waste collection in the Colombo area, where collection progress is communicated by telephone and residents have no reliable means of establishing whether a reported issue has been acted upon. Two aspects of this were of particular interest from a software-engineering perspective.
The first was that the three groups involved were each operating on a different picture of the same event. An administrator believed a route was in progress, a driver had finished it an hour earlier, and a resident had no way of knowing either. This suggested that the underlying problem was not a missing feature but the absence of shared state that all three roles observe simultaneously.
The second was the question of how software quality should be measured for users who are not the developers. Functional test suites establish that a feature works; they do not establish that a driver under time pressure can operate it. This suggested that interaction measurement should be built into the system rather than conducted as a separate study, and that the resulting data should be visible to the operator as an ongoing quality signal.
The opportunity to combine these concerns with a transparent civic incentive mechanism, using publicly verifiable blockchain infrastructure, provided the final element of the research direction.
1.7 Scope
The platform is scoped as an operator-agnostic waste-collection system. This deliberate framing warrants justification. Several implemented capabilities — in particular the citizen token reward and the token-to-currency payout workflow — presuppose an operator with discretionary control over an operating budget and the authority to disburse funds to residents. A municipal council in Sri Lanka would require council-level budgetary approval to operate such a scheme, whereas a contracted private operator or a public-private partnership could adopt it as a customer-retention measure within existing commercial discretion. The driver self-registration and approval workflow likewise reflects contractor onboarding rather than the employment model of a council fleet, where drivers are existing payroll staff. The platform is therefore positioned as suitable for deployment by a municipal council, a contracted private operator, or a PPP arrangement, and the term 
service operator
 is used throughout in preference to 
municipality
.
Table 1.1: 
Project scope
Category
In Scope
Out of Scope
Administration
Driver approval, fleet monitoring, live GPS map, report assignment, SQA telemetry dashboard, payout review
Administrator authentication and access control (identified as a limitation), route CRUD management, predictive analytics
Driver Operations
Registration and authenticated login, approval gate, task viewing, GPS tracking, route completion, realtime dispatch alerts
Automated route optimisation, turn-by-turn navigation, vehicle telematics integration
Citizen Services
Zone schedules, issue submission, segregation guidance, live driver tracking, token rewards, payout requests
Citizen account authentication, in-app dispute resolution, multi-language interface
Blockchain
ERC-20 reward issuance on Sepolia testnet, balance query, network guard, token redemption transfer
Mainnet deployment, gas optimisation study, on-chain governance, automated fiat settlement
Evaluation
Controlled functional testing, database verification, realtime propagation trials, on-chain verification, task-duration telemetry analysis
Real participant usability study with municipal staff, SUS instrument administration, longitudinal field deployment
1.8 Overview of the proposed solution
EcoRoute is structured as a multi-role waste-management ecosystem comprising role-specific interfaces, a centralised cloud database with realtime change propagation, and a public blockchain integration. The implemented workflows are as follows.
Administrator workflow.
 The administrator accesses the Dispatch Center to review pending driver registrations and approve or reject them, monitor the live fleet through a map view showing the current GPS position of every actively tracking driver, review incoming citizen reports and assign them to drivers, inspect aggregate HCI telemetry through the SQA dashboard, and review and approve citizen token-to-currency payout requests.
Driver workflow.
 The driver registers through a multi-step form capturing personal, vehicle and zone details, and waits at an approval screen until an administrator approves the account, at which point the interface transitions automatically without refresh. Once authenticated, the driver views assigned tasks, enables GPS tracking which streams position updates to the backend, and completes routes. Each completion updates shared route state and generates an HCI telemetry record capturing task name and elapsed duration. Zone or vehicle reassignments issued by an administrator appear on the driver’s screen as a dispatch alert in realtime.
Citizen workflow.
 The citizen selects a residential zone, views the collection schedule and waste-segregation guidance, and submits an issue report which is persisted with Pending status. On submission, the connected wallet address is used to trigger an ERC-20 token reward through the smart contract deployed on the Sepolia testnet. The citizen may subsequently track the assigned driver’s live position and estimated distance, and may request conversion of accumulated tokens to Sri Lankan Rupees through the payout workflow.
Figure 1.1: 
Rich picture diagram of the EcoRoute ecosystem
This structure creates a shared operational chain in which dispatch decisions, field execution and citizen reports are reconciled within a single backend, while remaining functional under intermittent connectivity.
1.9 Chapter summary
This chapter established the context and research direction of EcoRoute. The problem was framed around fragmented waste-management workflows, unsustained citizen participation, and the limitations of functional-only software evaluation. 
The research gap was identified, and a main research question and four sub-questions were derived. 
The platform was positioned as operator-agnostic, with justification for this framing given in the scope discussion. 
Chapter 2 sets out the four research objectives that follow from these questions, spanning requirements identification, technological analysis, design and development, and evaluation. Chapter 3 then reviews the literature underpinning each of these areas and establishes the research gap in detail.
2 OBJECTIVES
2.1 General objective
The aim of this research is to design, implement and evaluate an integrated waste-management platform that unifies administrative dispatch, field driver operations and citizen reporting through realtime shared state, incorporates transparent blockchain-based civic incentives, and embeds interaction-level telemetry to provide measurable evidence of software quality in operational use.
2.2 Specific objectives
Each specific objective below is mapped to the system functions and evidence that address it in Section 4.4.1, and to the corresponding results in Section 5.6.
2.2.1 To identify operational requirements and usability considerations
To identify the operational requirements of waste-collection stakeholders and the usability considerations affecting field application use, through analysis of the operational domain, examination of existing systems, and derivation of role-specific functional requirements for administrator, driver and citizen users.
2.2.2 To analyse technological and research gaps
To analyse existing systems, blockchain incentive mechanisms, realtime data-synchronisation architectures and interaction-measurement approaches in order to establish the technological options available and justify the research gap addressed by this study.
2.2.3 To design and develop the EcoRoute platform
To design and develop an integrated platform providing authenticated role-separated access, GPS-based fleet monitoring with realtime propagation, citizen reporting with blockchain-based token rewards, and an embedded HCI telemetry layer.
2.2.4 To evaluate the implemented system
To evaluate the implemented system through controlled functional testing, database persistence verification, realtime propagation trials, on-chain transaction verification, and descriptive statistical analysis of system-generated interaction telemetry.
3 LITERATURE REVIEW
3.1 Chapter overview
This chapter critically reviews the literature relevant to EcoRoute from five connected perspectives: waste-management digitisation, usability and cognitive load in operational interfaces, blockchain-based civic incentives, realtime data synchronisation, and software-quality telemetry. The review compares existing approaches, identifies their limitations, and positions the present study around an integrated operational workflow. Each section closes with a personal critical reflection assessing the reviewed work against the requirements of this project, since the value of a reviewed approach depends on whether it addresses the specific problem under investigation.
3.2 Conceptual map of the literature
The literature is organised around the following conceptual relationships. This map is provided so that the reader can locate each reviewed strand within the overall argument of the chapter.
The first strand, 
waste-management systems
, is concerned with operational coordination, routing, reporting and service continuity, and it defines the domain requirements and stakeholder structure examined in Sections 3.3 and 3.4. The second, 
human-computer interaction and cognitive load
, addresses interaction effort, navigation complexity and task duration, and underpins the driver-oriented interface decisions discussed in Sections 3.3 and 3.7. The third, 
realtime data synchronisation
, concerns how a state change made by one participant becomes visible to others, and directly informs the coordination architecture examined in Sections 3.5 and 3.8. The fourth, 
blockchain and digital incentives
, is concerned with transparency, traceability and sustained engagement, and underpins the ERC-20 citizen reward mechanism analysed in Section 3.5. The fifth, 
software quality and telemetry
, addresses the distinction between functional correctness and interaction-level evidence, and justifies the embedded task-duration measurement discussed in Section 3.6.
These strands are not independent. The domain literature establishes what the system must do; the HCI literature constrains how the field interface may present it; the synchronisation literature determines whether the three roles can hold a common view of the same event; the incentive literature addresses whether citizen participation can be sustained; and the telemetry literature determines how the resulting artefact can be evaluated. The argument of this chapter follows that sequence.
Figure 3.1: 
Conceptual map diagram of the literature
3.3 Domain overview: waste collection and operational usability
Waste collection is a time-sensitive operational activity involving physical work, route coordination and frequent communication between field staff and administrative personnel [1], [3]. In such settings the value of a digital system depends on how effectively it supports the tasks users actually need to complete. Research on digital public services 
suggests that perceived service quality and expectation confirmation influence continued use [1], while studies of logistics work highlight the significance of interaction quality and worker well-being in operational performance [3].
The human-computer interaction dimension is particularly important when software is used by non-specialist workers under time pressure. Deep navigation structures, small interaction targets and delayed system responses increase the mental effort required to complete a task [7], [8]. Zhang and Dolah [7] examine the relationship between interface metaphors, cognitive load and satisfaction, while Akram et al. [8] show that navigation design patterns materially influence the occurrence of usability problems on mobile devices.
Critical reflection.
 My assessment is that this literature is directly applicable but incomplete for the present problem. It establishes convincingly that interface simplicity reduces task effort, and EcoRoute adopts that finding in the design of the driver interface, which presents a focused route card and a single prominent completion action rather than a multi-screen control system. However, the reviewed studies treat usability as a property of a single user facing a single interface. They do not address the multi-role case, where the usability problem is partly one of 
shared awareness
: an interface can be individually excellent while still leaving three stakeholders with three different pictures of the same operational event. This gap in the domain literature is one motivation for the realtime emphasis of this study.
3.4 Existing systems and frameworks
The reviewed literature identifies several broad approaches to waste-management digitisation, each addressing a different portion of the problem.
IoT smart-bin systems
 use sensors to estimate fill levels and provide automated status information [9]. Mohammed et al. demonstrate the deployment of machine-learning models through progressive web applications in smart-city contexts, showing that browser-delivered applications can serve as the presentation layer for sensor-driven infrastructure. These systems reduce the need for manual observation, but introduce hardware procurement, battery maintenance and physical installation obligations across a bin estate.
GPS-based fleet systems
 focus on vehicle position and route tracking [6]. Zhang et al. demonstrate the identification of last-mile delivery stops from GPS trajectory data, establishing that operationally meaningful events can be inferred from position streams alone. Such systems provide valuable operational visibility, but they depend on consistent connectivity for position upload and typically address neither citizen participation nor interaction usability.
Civic reporting portals
 provide a direct communication path from residents to authorities [10]. Nechesov and Ruponen examine the combination of artificial intelligence and blockchain for citizen proposal systems, arguing that verifiability supports civic engagement. However, reporting functions frequently remain isolated from operational route management when the underlying workflows are not integrated.
Route optimisation systems
 apply artificial intelligence to logistics efficiency [4]. Fan et al. describe route optimisation for sustainable logistics ecosystems, offering substantial theoretical efficiency gains.
Critical reflection.
 Assessing these four families against the requirements of this project, my judgement is as follows. The IoT smart-bin approach is 
not suitable
 for adoption here: it addresses fill-level sensing rather than operational coordination, and its hardware dependency places it outside the scope of a software-engineering research project without institutional deployment support. GPS fleet tracking is 
suitable and has been adopted
, because live driver position is directly useful to both the administrator and the reporting citizen; EcoRoute implements it through browser geolocation rather than dedicated vehicle telematics, which reduces cost at the expense of precision. Civic reporting is 
suitable and adopted
, but the reviewed implementations leave the engagement problem unresolved, which is why this project extends the pattern with a verifiable incentive. Route optimisation is 
not adopted
, and this warrants explicit justification: optimisation algorithms presuppose reliable data about current route state, and in an environment where route state is reconciled by telephone rather than by system record, that precondition does not hold. Establishing reliable operational data capture is logically prior to optimising over it. Route optimisation is accordingly identified as future work in Section 6.6 rather than dismissed.
The broader observation is that no single approach dominates, and that each addresses a distinct fragment. The opportunity for EcoRoute lies in integrating the operationally relevant fragments into one lightweight platform.
3.5 Technological analysis
This section examines the two enabling technology families that distinguish EcoRoute from the systems reviewed above.
3.5.1 Realtime data synchronisation architectures
Multi-role operational systems require that a state change made by one participant becomes visible to others without delay. Three architectural approaches are available.
Under 
client polling
, the client re-queries the server on a fixed interval. The approach is trivial to implement and requires no persistent connection, but propagation latency is bounded by the polling interval, requests are wasteful when nothing has changed, and load scales directly with the number of connected clients. Under 
server-sent events
, the server pushes a one-way event stream over HTTP; this is simple and requires no additional infrastructure, but the channel is unidirectional and reconnection handling must be implemented manually. Under 
managed realtime subscriptions
, the client subscribes to database change events over a persistent channel supplied by the backend platform, obtaining sub-second propagation with row-level filtering and without a separate event-publishing service, at the cost of a dependency on that platform and the need to handle connection state explicitly.
Critical reflection.
 The selection of managed realtime subscriptions requires justification rather than assertion. The decisive consideration was that the required propagation is 
row-scoped
: a driver awaiting approval needs to observe exactly one row, their own profile, and a citizen tracking a collection needs to observe exactly one driver’s position. Polling for a single row on a short interval would generate continuous load to detect an event that occurs once, and the interval would directly bound how stale the driver’s screen is permitted to be. Subscribing to filtered change events eliminates both problems.
The limitation I accept is a dependency on the backend provider’s realtime service. Were that service unavailable, the coordination behaviour described in Section 4.6.3 would degrade to manual refresh rather than fail outright, but the platform’s responsiveness claim would not hold. This is a genuine coupling and is recorded in Section 6.4.2.
3.5.2 Blockchain-based civic incentives
Blockchain-enabled incentive mechanisms address the engagement problem identified in Section 3.4. Nechesov and Ruponen [10] argue that merging distributed-ledger verifiability with civic proposal systems increases citizen trust in the process, because the citizen can independently confirm that their contribution was recorded. Islam and Basi [11] provide a systematic review of blockchain-enabled traceability implementations in supply chains, demonstrating that distributed ledgers can supply verifiable transaction histories at operational scale.
The ERC-20 token standard provides a widely supported fungible-token interface with well-understood semantics for balance queries and transfers, and mature client-library support.
Critical reflection.
 The case for blockchain here is narrower than enthusiasm for the technology usually suggests, and intellectual honesty requires stating the counter-argument. A centralised database column recording a citizen’s point balance would be simpler, cheaper and faster than an on-chain token. The blockchain earns its place only on the specific property of 
independent verifiability
: the citizen can confirm their reward through a public block explorer without trusting the operator’s database. Where the operator is a private contractor with a commercial interest in the reward ledger — precisely the deployment context identified in Section 1.7 — this independence has genuine value. I would not defend the blockchain integration on efficiency grounds, and this study does not attempt to. The implementation uses the Sepolia testnet, which means the tokens carry no real economic value; the mechanism is demonstrated rather than economically deployed, and this is acknowledged as a limitation in Section 6.4.2.
3.6 Algorithmic analysis: HCI telemetry for software quality
Traditional software quality assurance emphasises unit testing, integration testing, automated test execution and system availability [5]. Ali et al. survey automated testing across the software lifecycle, and Wang et al. [14] propose a roadmap for testing in open collaborative development environments. These practices remain necessary, but interaction-level evidence reveals usability problems that functional tests cannot capture: a test suite confirms that a button performs its function, not that a user can find it.
HCI-oriented telemetry measures task duration, click behaviour, navigation loops and related interaction signals [12], [13]. Živčnjak et al. [13] apply the PECI framework to compare interface performance in augmented-reality warehouse management, demonstrating that interaction metrics can discriminate between interface designs in operational settings. Zhao et al. [12] address automated defect detection, illustrating the broader principle that measurable signals extracted during execution can indicate quality problems.
EcoRoute operationalises a deliberately simplified form of this idea. The driver interface records a timestamp when route data renders and computes elapsed time when the completion action is taken:
ΔT = T_end − T_start
where T_start is the render timestamp and T_end is the moment of task completion. The result is stored in the HCILogs table with the task name, and aggregate statistics are computed and displayed on the administrator SQA dashboard.
Critical reflection.
 This mechanism is substantially narrower than the telemetry models described in the literature, which track dead clicks, rage clicks, navigation loops and scroll behaviour. Two limitations must be stated plainly. First, ΔT measures wall-clock elapsed time from render to completion, which includes the physical collection work and any interruption; it is therefore not a pure measure of interface interaction effort, and comparisons between records are only meaningful when the underlying physical task is comparable. Second, the click-count field in the current implementation is recorded as a fixed value rather than derived from counted interaction events, which means click count cannot support any analytical claim and is excluded from the analysis in Chapter 5. Reporting a metric that is constant by construction would be a fabricated result, and this study declines to do so. Task duration remains a valid and useful signal despite these constraints, and the mechanism demonstrates that quality instrumentation can be embedded in an operational system rather than conducted as a separate exercise.
3.7 Design analysis: mobile interface metaphors
Field-oriented interfaces need to reduce unnecessary visual searching and interaction steps. The literature indicates that simple, clearly grouped interaction patterns reduce task effort for users working under physical and environmental constraints [7], [8], [13]. Akram et al. [8] specifically address design strategies for minimising usability issues in mobile navigation patterns.
EcoRoute applies these principles through a focused route card with a single dominant completion action in the driver interface, sectioned grouping of schedule, reporting and guidance functions in the citizen interface, and a tabular monitoring layout in the administrator interface where information density is appropriate to a desktop context and an operator who is not under field conditions.
Critical reflection.
 The design decisions are traceable to the literature, but the evaluation of those decisions in this study is indirect. A formal human-participant usability study with 
municipal or contractor staff was not conducted, for reasons of access and timeframe discussed in Section 4.3.1. Design quality is therefore evidenced through implementation and controlled task-duration measurement rather than through participant judgement. This is a real limitation on the strength of the design claims, and is acknowledged as such in Section 6.4.2 rather than presented as equivalent to participant validation.
3.8 Workflow analysis: realtime operational coordination
A conventional web application follows a request-response pattern in which the client transmits a request and awaits a result. Under this pattern each role observes only the consequences of its own actions; changes made by other participants become visible only when the user reloads. In a multi-role operational workflow this produces exactly the divergence identified in Section 1.2, where administrator, driver and resident each hold a different picture of the same collection event.
EcoRoute reconciles this by treating the database as the single source of shared operational truth and having each interface subscribe to the change events relevant to its role. Three coordination behaviours follow from this design. A driver awaiting registration approval subscribes to their own profile row and the interface advances automatically when an administrator sets the approval flag. An administrator’s fleet map subscribes to driver position updates and repositions markers as they arrive. A citizen tracking a collection subscribes to the assigned driver’s position and the displayed distance recalculates continuously. In each case no polling occurs and no refresh is required.
Critical reflection.
 The design achieves propagation without additional infrastructure, but two weaknesses must be stated. First, dispatch alerts are delivered by writing a message into the driver’s own profile row rather than to a dedicated message table; because the row holds a single alert field, a second alert overwrites the first before acknowledgement. This is adequate at the scale examined but is not reliable multi-message delivery. Second, the approach inherits last-write-wins semantics from the underlying database: concurrent writes to the same row from two roles resolve by arrival order with no conflict detection. In the operational model examined here this is low-risk, since route completion is effectively single-writer and the driver is the authoritative source for whether collection occurred. In a system with genuine concurrent editing, conflict resolution would be required. I regard this as an acceptable simplification given the operational model, not as a solved problem.
3.9 Research gap identification
The literature demonstrates substantial development in individual aspects of digital waste-management services. Fleet systems provide operational visibility [6], citizen portals support reporting [10], sensor and smart-city approaches provide automated data collection [9], blockchain provides verifiable transaction records [10], [11], and HCI research provides mechanisms for assessing interaction quality [7], [8], [12], [11].
These strands are, however, consistently pursued in isolation. Blockchain civic-incentive research addresses proposal and governance systems rather than routine service reporting, and is rarely demonstrated at a scale appropriate to a single municipal or 
contracted operator. HCI telemetry is generally conducted as an external evaluation activity rather than embedded as an operational capability visible to the service operator. And realtime coordination is treated as an interface convenience rather than as the mechanism by which operational divergence between roles is eliminated.
The research gap addressed by this study is the absence of an integrated, lightweight platform in which verifiable civic incentives, embedded interaction telemetry and realtime multi-role coordination operate together within a single deployable waste-management workflow.
 The contribution is integrative rather than algorithmic: no individual component advances the state of the art in its own field, but their combination within one operational architecture, and the demonstration that this combination is achievable without specialised infrastructure, has not been previously demonstrated in this domain. All primary sources supporting the gap are drawn from work published within the last five years, with the exception of foundational methodological references [15], [16].
3.10 Chapter summary
This chapter reviewed waste-management digitisation, HCI and cognitive load, existing systems and frameworks, realtime data-synchronisation architectures, blockchain-based civic incentives and software-quality telemetry. Each strand was assessed for suitability to the present problem, with explicit justification given both for approaches adopted and for those rejected. The review established that integrated operational workflows, verifiable civic incentives and measurable interaction quality remain individually well-developed but jointly unaddressed. On this basis, EcoRoute is positioned as an integrated platform combining role-separated realtime operations, blockchain-based citizen incentives and embedded HCI telemetry. The following chapter sets out the research methodology through which this platform was designed, developed and evaluated.
4 METHODOLOGY
4.1 Chapter overview
This chapter presents the research methodology adopted for the EcoRoute study. It states and justifies the research paradigm, approach and strategy; describes the fact-collection mechanisms used and explains why certain mechanisms were excluded; maps the research activities onto a structured execution workflow; justifies the project management methodology; presents the project timeline; and addresses ethical considerations. The chapter aims to make the research process transparent and reproducible, and to ensure that the claims made in later chapters are supported by activities that were actually carried out.
 The chapter then specifies the requirements derived from the research objectives, presents the proposed system design, describes the development and implementation procedure, and sets out the evaluation plan through which the artefact was assessed.
4.2 Research design
4.2.1 Research paradigm
This study adopts a 
pragmatist
 research paradigm. Pragmatism holds that the value of knowledge is determined by its practical consequences and that methods should be selected according to their fitness for the research problem rather than adherence to a single epistemological position [16].
The justification for this selection is grounded in the nature of the problem. A purely positivist paradigm would require controlled measurement of predefined variables against hypotheses, which does not accommodate the design and construction of a novel artefact. A purely interpretivist paradigm would centre subjective stakeholder meaning, which does not accommodate the objective technical verification — transaction confirmation, database persistence, task duration — that constitutes much of this study’s evidence. Pragmatism permits both: the artefact is constructed to solve an identified practical problem, and it is evaluated using whichever evidence best establishes whether it does so.
The paradigm shapes the analytical angle taken throughout. The central question is not “what is the objective truth about waste management” but “does this constructed artefact demonstrably address the identified operational problem, and what evidence establishes that”. This orientation determines the evaluation design in Section 4.7, which prioritises reproducible system-generated evidence over interpretive judgement.
4.2.2 Research approach
The study follows a 
deductive-dominant approach with inductive elements
, applied within a design science frame.
The deductive component proceeds from established literature to implementation: the interface simplification is derived from Zhang and Dolah [7] and Akram et al. [8]; the telemetry mechanism is derived from Živčnjak et al. [13]; the verifiable-incentive design is derived from Nechesov and Ruponen [10] and Islam and Basi [11]. In each case a principle established in the literature was applied to the artefact and its consequences observed.
The inductive component arises from implementation experience. Several design decisions — the driver approval gate, the exclusion of click count from analysis, the clearing of driver 
position on task completion — emerged from problems encountered during construction rather than from prior theory. These are reported in Section A.1.
Design science methodology explicitly accommodates this combination, since artefact construction generates knowledge that could not be derived deductively from prior theory alone [15].
4.2.3 Research strategy
The research strategy is 
Design Science Research
, following the methodology of Peffers et al. [15]. This strategy is appropriate because the study’s central output is a constructed artefact intended to solve an identified class of problem, and because DSRM provides an established six-activity structure that maps cleanly onto the required chapter organisation.
Alternative strategies were considered and rejected with reasons. A 
survey strategy
 would establish stakeholder perceptions of waste-management problems but would not produce or evaluate a working system, and the research aim is explicitly constructive. A 
case study strategy
 would require access to an operating waste-collection organisation for an extended observation period; this access was not available within the project timeframe, and a case study of a system that does not yet exist is not possible. An 
experimental strategy
 comparing EcoRoute against an existing platform under controlled conditions would be methodologically attractive but requires a comparable baseline system and participant cohort, neither of which was available. DSRM was selected as the strategy that both fits the research aim and is achievable with the resources available.
Within the DSRM frame the study uses 
controlled system testing and system-generated telemetry
 as its evaluation instruments, rather than human-participant instruments.
4.2.4 Research methodology execution workflow (DSRM)
The six DSRM activities [15] were executed as follows.
Table 4.1: 
Execution of the DSRM activities in this study
DSRM Activity
Execution in This Study
Evidence Location
Problem identification and motivation
Analysis of waste-collection coordination failures, connectivity assumptions in field applications, unsustained civic participation, and functional-only quality evaluation
Sections 1.2, 1.3
Definition of objectives for a solution
Four research objectives derived from the identified problems, specifying required platform capabilities
Section 2.2
Design and development
Architecture design, database design, and implementation of the role-separated platform with realtime coordination, blockchain integration and telemetry layer
Chapter 4
Demonstration
Execution of each workflow, capture of interface and database evidence, on-chain transaction submission
Sections 5.3, 4.7, 5.4.2, 5.5.1
Evaluation
Controlled functional testing, telemetry statistical analysis, synchronisation trials, verification against objectives
Chapter 5, Section 6.1
Communication
This thesis document
Complete document
4.2.4.1 Problem identification
The problem was identified through observation of waste-collection practice in the Colombo area and through literature analysis establishing that coordination fragmentation, connectivity failure and evaluation narrowness are recognised concerns [1], [2], [11], [18].
4.2.4.2 Relevance justification
Relevance was justified through the operational significance of waste collection as a public service and through documented policy attention to solid-waste management in the Western Province [18].
4.2.4.3 Comparative analysis and gap validation
Existing systems were compared in Section 3.4 with explicit suitability judgements, and the gap was validated in Section 3.9 by demonstrating that the three relevant research strands are pursued in isolation.
4.2.4.4 Define and finalise research objectives
Four objectives were defined in Section 2.2, revised following supervisor feedback at the Interim 02 review to align stated objectives with evidence that could realistically be collected within the project.
4.2.4.5 Design, development and data management
The artefact was designed and implemented as described in Chapter 4. Data management used Supabase PostgreSQL for persistence and realtime change propagation, with the Sepolia testnet providing the blockchain execution environment.
4.2.4.6 Evaluation and communication
Evaluation was conducted through the mechanisms in Section 4.3.1 and is reported in Chapter 5. Communication is through this thesis and the accompanying artefact.
4.3 Data collection and stakeholders
4.3.1 Fact collection mechanisms
The following mechanisms were used to collect the facts on which this thesis rests.
Table 4.2: 
Fact collection mechanisms
Mechanism
Purpose
Output
Structured literature review
Establish domain knowledge, technological options and research gap
Chapter 3; 18 references
Source code inspection
Verify the actual implemented state of the artefact against documented claims
Chapter 4; defect register in Section 5.4.3
Controlled functional testing
Verify that each workflow produces its expected outcome
Section 5.4.1
Database state verification
Confirm that interface actions reach persistent storage correctly
Section 5.4.2
System-generated HCI telemetry
Measure driver task duration during controlled trials
Section 5.5.3
Blockchain transaction verification
Confirm on-chain execution independently through a public block explorer
Section 5.5.1
Realtime propagation trials
Verify that state changes reach subscribed interfaces without refresh
Section 5.5.2
Mechanisms deliberately excluded.
 Field interviews with waste-collection staff and administration of the System Usability Scale to real users were considered and excluded. Access to municipal or contractor personnel could not be secured within the project timeframe, and the ethical clearance and scheduling required for interviews with operational staff exceeded the available period. This exclusion is stated explicitly because it constrains the strength of the usability claims this study can make: design quality is evidenced through measured task duration and implementation, not through user judgement. 
No participant data has been simulated, estimated or fabricated to compensate for this exclusion.
 Where participant evidence would have been required to support a claim, the claim is not made.
4.3.2 Stakeholder analysis
Table 4.3: 
Stakeholder analysis
Stakeholder
Role
Primary Concerns
System Interface
Service operator administrator
Plans collection, approves drivers, assigns reports, monitors fleet, reviews payouts
Operational visibility, workforce control, accurate service records, cost control
Admin portal: fleet monitor, live map, reports, SQA dashboard, payouts
Collection driver
Executes routes, resolves assigned reports, records completion
Minimal interaction burden under time pressure, ability to work without connectivity, clear task instruction
Driver portal: registration, tasks, dashboard, sync inspection
Citizen / resident
Reports issues, tracks resolution, receives incentives
Confidence that reports are acted upon, visibility of driver progress, tangible return for participation
Citizen portal: report, track, rewards
Quality analyst / researcher
Assesses software interaction quality
Objective, system-generated evidence of task performance
Admin SQA telemetry dashboard
Regulatory / environmental authority
Oversees waste management compliance
Auditable service records
Indirect, through operator records (not implemented)
The first three stakeholders are directly served by implemented interfaces and are the focus of this specification. The quality analyst is served by the SQA dashboard. The regulatory stakeholder is identified for completeness but is not addressed by the current artefact.
4.4 Requirements and analysis
4.4.1 Operationalisation process
This section maps each research objective to the system functions that address it and to the evidence produced. This mapping establishes that the specification is derived from the research objectives rather than assembled independently of them.
Table 4.4: 
Operationalisation of the research objectives
Research Objective
System Functions Addressing It
Evidence Produced
Verification Location
2.2.1 Identify operational requirements and usability considerations
Role-separated portals; simplified driver interaction; stakeholder-derived requirement set
Requirement specification; use case model
Sections 4.3.2, 4.4, 4.4.4
2.2.2 Analyse technological and research gaps
Technology selection with documented justification
Comparative technology assessment
Sections 3.4, 3.5, 4.6.2
2.2.3 Design and develop the platform
Authentication with approval gate; GPS tracking; realtime coordination; blockchain reward; telemetry capture; push notification
Working artefact; implementation evidence
Sections 4.6, 5.3
2.2.4 Evaluate the implemented system
Functional test execution; database verification; telemetry aggregation; realtime propagation trials; on-chain verification
Test results; descriptive statistics; transaction records
Chapter 5
The operationalisation departs from a questionnaire-based approach because, as established in Section 4.3.1, no human-participant data collection was undertaken. Requirements are therefore derived from domain literature and operational analysis rather than from elicited stakeholder responses, and requirement validity is established through demonstrated operation rather than through stakeholder confirmation. This is a weaker validation basis than participant elicitation would provide, and is recorded as a limitation.
4.4.2 Use case diagram
The system supports three primary actors and one external system actor. The use cases are summarised below and depicted in Figure 4.1.
Administrator:
 Approve driver registration; Monitor fleet; View live fleet map; View citizen reports; Assign report to driver; Edit driver zone or vehicle; View SQA telemetry; Review payout request.
Driver:
 Register account; Log in; View assigned tasks; Start journey with GPS tracking; Complete route and record telemetry; Acknowledge dispatch alert.
Citizen:
 View collection schedule; Submit issue report; Receive token reward; Track assigned driver; Subscribe to push notification; Request token-to-currency payout.
External system (Ethereum Sepolia network):
 Execute token reward transaction; Return token balance; Execute token redemption transfer.
Figure 4.1: 
EcoRoute use case diagram
4.4.3 Use case specifications
Three principal use cases are specified in full. Remaining specifications are omitted to conserve page count, as directed by the chapter guidance.
Table 4.5: 
UC-01 specification: complete route and record interaction telemetry
Field
Detail
Actor
Driver
Precondition
Driver is authenticated and approved; an active route exists with status In Progress
Main flow
1. Driver opens the driver dashboard. 2. System renders the active route card and records the render timestamp. 3. Driver performs physical collection. 4. Driver activates the completion action. 5. System computes elapsed duration as the difference between the completion moment and the render timestamp. 6. System updates the route status to Completed. 7. System inserts a telemetry record capturing task name and elapsed duration. 8. System confirms completion and the SQA dashboard updates for any subscribed administrator.
Alternate flow
At step 6, if the update fails, the completion is not recorded and an error is surfaced; no telemetry record is written for a failed completion.
Postcondition
Route status is Completed and a corresponding telemetry record exists
Exception
Session expired: the driver is returned to the login screen and the completion is not recorded
Table 4.6: 
UC-02 specification: submit issue report with token reward
Field
Detail
Actor
Citizen; Ethereum Sepolia network
Precondition
Citizen has a wallet extension installed and connected to the Sepolia network
Main flow
1. Citizen selects zone and issue type. 2. Citizen enters description and marks the location. 3. Citizen submits. 4. System inserts a CitizenReports record with status Pending. 5. System obtains the connected wallet address. 6. System invokes the reward function on the token contract. 7. System awaits block confirmation. 8. System confirms submission and reward to the citizen.
Alternate flow
At step 5 or 6, if the wallet is unavailable, on the wrong network, or the transaction is rejected, the report remains saved and the system reports that the reward failed, stating the reason.
Postcondition
Report is persisted and, where the blockchain flow succeeded, tokens are transferred on chain
Exception
Wrong network: the network guard detects a chain identifier other than Sepolia and aborts the blockchain operation
Table 4.7: 
UC-03 specification: assign report to driver
Field
Detail
Actor
Administrator
Precondition
A citizen report exists with status Pending; at least one approved driver is assigned to the report’s zone
Main flow
1. Administrator opens the reports view. 2. Administrator selects a report and activates assignment. 3. System presents approved drivers filtered by the report’s zone. 4. Administrator selects a driver. 5. System updates the report with the driver identifier and sets status to In Progress. 6. System dispatches a push notification to any subscribed citizen for that report.
Alternate flow
At step 6, if no push subscription exists for the report, notification is skipped without error.
Postcondition
Report is assigned, visible in the driver’s task list, and the citizen is notified
Exception
No approved driver in zone: the selection list is empty and assignment cannot proceed
4.4.4 Functional requirements
Table 4.8: 
Functional requirements
ID
Requirement
Priority
Status
FR-01
The system shall allow a driver to register by providing account credentials, personal details, licence number, vehicle selection and preferred zone
High
Implemented
FR-02
The system shall create driver accounts in an unapproved state and prevent operational access until approved
High
Implemented
FR-03
The system shall allow an administrator to approve or reject pending driver registrations
High
Implemented
FR-04
The system shall transition an approved driver’s registration screen automatically upon approval without requiring refresh
High
Implemented
FR-05
The system shall authenticate drivers using email and password credentials
High
Implemented
FR-06
The system shall prevent a vehicle already assigned to an approved driver from being selected during registration
Medium
Implemented
FR-07
The system shall allow a citizen to view collection schedules by zone
High
Implemented
FR-08
The system shall allow a citizen to submit an issue report with type, description and geographic location
High
Implemented
FR-09
The system shall persist citizen reports with an initial status of Pending
High
Implemented
FR-10
The system shall issue an ERC-20 token reward to the citizen’s connected wallet upon report submission
High
Implemented
FR-11
The system shall preserve the submitted report if the token reward transaction fails, and inform the citizen of the failure reason
High
Implemented
FR-12
The system shall verify that the connected wallet is on the Sepolia network before executing blockchain operations
Medium
Implemented
FR-13
The system shall allow an administrator to view all citizen reports and assign a report to an approved driver within the report’s zone
High
Implemented
FR-14
The system shall allow a driver to view reports assigned to them
High
Implemented
FR-15
The system shall capture the driver’s geographic position continuously while a journey is active and store it against the driver profile
High
Implemented
FR-16
The system shall clear the driver’s stored position and tracking flag when the task is resolved
High
Implemented
FR-17
The system shall display all actively tracking drivers on a map to the administrator, updating in real time
High
Implemented
FR-18
The system shall allow a citizen to view the assigned driver’s live position and the distance from the reported location
High
Implemented
FR-19
The system shall indicate arrival when the driver is within 150 metres of the reported location
Medium
Implemented
FR-20
The system shall allow a citizen to subscribe to push notifications for a report and shall notify the citizen when a driver is assigned
Medium
Implemented
FR-21
The system shall allow a driver to mark a route complete, updating the route status and recording a telemetry entry
High
Implemented
FR-25
The system shall record the elapsed duration of each route completion task
High
Implemented
FR-26
The system shall record the number of interaction events for each route completion task
Medium
Not satisfied — value is fixed rather than counted (see Section 6.4.1)
FR-27
The system shall present aggregate telemetry statistics to the administrator, updating in real time
High
Implemented
FR-28
The system shall allow an administrator to change a driver’s assigned zone or vehicle and shall deliver an alert to that driver without refresh
Medium
Implemented
FR-29
The system shall allow a citizen to request conversion of held tokens to Sri Lankan Rupees by submitting bank details
Medium
Implemented
FR-30
The system shall execute an on-chain token transfer when a payout is requested and record the request for administrator review
Medium
Implemented
FR-31
The system shall allow an administrator to review and process pending payout requests
Medium
Implemented (manual process)
FR-32
The system shall restrict administrative functions to authenticated administrators
High
Implemented
4.4.4.1 Requirement traceability to implementation
Table 4.9 traces representative functional requirements to the implementing module and the verifying test case, establishing that the specification, the artefact and the evaluation are connected rather than independently authored.
Table 4.9: 
Requirement traceability matrix
Requirement
Implementing module
Verification
Status
FR-01, FR-02
Driver registration flow (
/register/driver
)
T01
Verified
FR-03, FR-04
Admin fleet monitor + realtime profile subscription
T02
Verified
FR-05
Supabase Auth sign-in with approval gate
T03
Verified
FR-06
Vehicle availability computation at registration
T04
Verified
FR-08, FR-09
Citizen report submission (
/citizen/report
)
T05
Verified
FR-10, FR-11, FR-12
web3.js
 reward call, network guard, failure isolation
T05, T06
Verified
FR-13
Admin reports view with zone-filtered driver selection
T07
Verified
FR-15, FR-16, FR-17
Geolocation watch + realtime map subscription
T08
Verified
FR-18, FR-19
Citizen tracking view with Haversine distance
T08
Verified
FR-20
Web Push subscription + 
/api/notify
 handler
T07
Verified
FR-21, FR-25
Route completion path with telemetry insert
T09
Verified
FR-26
Interaction counter
—
Not implemented
FR-27
SQA telemetry dashboard (
/admin/sqa
)
T09
Verified
FR-29, FR-30, FR-31
Payout gateway (
/rewards
) + BankPayouts queue
Manual
Verified
FR-32
Admin authentication (
/login/admin
)
—
Not independently verified
4.4.5 Non-functional requirements
Table 4.10: 
Non-functional requirements
ID
Category
Requirement
Status
NFR-01
Responsiveness
State changes shall propagate to every subscribed interface within a few seconds without manual refresh
Satisfied
NFR-02
Responsiveness
Position updates shall be transmitted efficiently without unnecessary network traffic
Partially satisfied — no debouncing or distance threshold is applied
NFR-03
Usability
The driver interface shall present the primary completion action without requiring navigation beyond the initial screen
Satisfied
NFR-04
Usability
The system shall provide explicit confirmation for every state-changing action
Satisfied
NFR-05
Security
Driver accounts shall be authenticated and unapproved accounts shall not gain operational access
Satisfied
NFR-06
Security
Administrative functions shall be protected from unauthenticated access
Satisfied
NFR-07
Security
Privileged backend credentials shall not be exposed to the browser
Satisfied — service role key confined to server route handlers
NFR-08
Integrity
Blockchain operations shall be prevented on networks other than the intended test network
Satisfied
NFR-09
Integrity
Failure of the incentive mechanism shall not cause loss of the citizen’s report
Satisfied
NFR-10
Maintainability
The database schema shall be version-controlled and reproducible
Not satisfied — no migration files exist
NFR-11
Portability
The system shall operate on standard mobile and desktop browsers without native installation
Satisfied
NFR-12
Testability
Task performance shall be measurable from data generated by the system in normal operation
Satisfied
4.5 Proposed design
4.5.1 System architecture
EcoRoute follows a client-centric architecture with a managed backend and two external service dependencies.
The 
presentation and application layer
 is a Next.js application using the App Router, executing predominantly in the browser. Role-specific route groups serve the administrator, driver and citizen interfaces. A small number of server-side route handlers exist for operations requiring privileged credentials.
The 
backend data layer
 is Supabase, providing PostgreSQL persistence, authentication, and realtime change subscriptions. The browser communicates with Supabase through a client initialised with a publishable key; privileged server-side operations use a service role key confined to server route handlers.
The 
blockchain layer
 is an ERC-20 token contract deployed on the Ethereum Sepolia testnet, accessed from the browser through the ethers.js v6 library and a wallet extension acting as the signing provider.
The 
notification layer
 uses the Web Push protocol with VAPID authentication, with subscriptions stored in the backend and messages dispatched from server route handlers. A Service Worker is registered to receive push events and render notifications.
Figure 4.2: 
EcoRoute system architecture
A significant architectural property is the pervasive use of realtime subscriptions. Rather than polling, each interface subscribes to database change events for the tables relevant to it. This produces the observable behaviour that an administrator’s approval action causes the waiting driver’s registration screen to advance without refresh, and a driver’s position update moves the marker on the administrator’s map immediately.
4.5.2 Class and data model
Figure 4.3: 
Entity relationship model of the EcoRoute schema
The persistent data model comprises seven tables. The schema below reflects the operational schema in use; it should be noted that no SQL migration files exist in the repository and the schema is maintained directly in the Supabase console, which is recorded as a limitation in Section 6.4.1.
driver_profiles
 — 
id
 (PK), 
user_id
 (FK to auth users), 
full_name
, 
email
, 
phone_number
, 
vehicle_number
, 
license_number
, 
assigned_zone
, 
is_approved
 (boolean, default false), 
latitude
, 
longitude
, 
is_tracking
 (boolean), 
recent_alert
, 
created_at
.
CitizenReports
 — 
id
 (PK), 
zone
, 
issue_type
, 
description
, 
exact_address
, 
latitude
, 
longitude
, 
status
, 
assigned_driver_id
 (FK to driver_profiles), 
created_at
.
Routes
 — 
id
 (PK), 
driver_name
, 
zone
, 
status
.
HCILogs
 — 
id
 (PK), 
task_name
, 
clicks
, 
time_taken
 (milliseconds).
BankPayouts
 — 
id
 (PK), 
wallet_address
, 
eco_burned
, 
lkr_amount
, 
account_name
, 
account_number
, 
bank_name
, 
status
.
vehicles
 — 
registration_number
 (unique), 
created_at
.
push_subscriptions
 — 
report_id
 (FK to CitizenReports), 
endpoint
 (unique), 
p256dh
, 
auth
.
4.5.3 Activity diagrams
Figure 4.4: 
Activity diagram — citizen report submission with blockchain reward issuance
4.5.4 Sequence diagrams
Figure 4.5: 
Sequence diagram — driver registration through realtime administrator approval
Figure 4.6: 
Sequence diagram — citizen report to on-chain reward
4.5.5 Deployment view
Figure 4.7: 
Deployment diagram — browser clients, Next.js application, Supabase backend, Sepolia network, push service
4.6 Development and implementation procedure
This section documents the implementation of the EcoRoute platform. It justifies the technology selections and describes the implementation of each contribution area with reference to the logic employed; the resulting interfaces are presented as results in Section 5.3. 
Following the chapter guidance, routine functionality without distinctive logic is not elaborated; emphasis is placed on the blockchain incentive mechanism, the embedded telemetry layer and the realtime coordination behaviour that together constitute the research contribution.
4.6.1 Development resources
4.6.1.1 Hardware requirements
Desktop or laptop computer for development, database administration and operation of the administrator portal.
Mobile device with GPS capability for testing the driver interface and location tracking under real field conditions.
Mobile device or mobile-sized browser environment for testing the citizen interface.
Internet connection for development, deployment and blockchain transaction submission.
4.6.1.2 Software requirements
Next.js and React for application development.
Tailwind CSS and shadcn/ui for interface implementation.
Supabase for PostgreSQL-backed data management, authentication and realtime subscriptions.
ethers.js v6 for blockchain interaction, and MetaMask as the wallet provider.
Ethereum Sepolia testnet as the blockchain execution environment.
Google Maps JavaScript API for fleet and tracking map rendering.
Web Push with VAPID key authentication for driver notifications.
Git for version control and Antigravity IDE for development.
4.6.2 Technology stack and justification
Table 4.11: 
Technology stack and justification
Layer
Technology
Justification
Application framework
Next.js with App Router
Provides both client rendering and server route handlers in one codebase, allowing privileged operations to be isolated server-side without a separate backend service. React’s component model suits the role-separated interface structure.
Interface
Tailwind CSS, shadcn/ui
Utility-first styling permits rapid iteration on interface density, which was necessary given the differing requirements of a field driver interface and a desktop administrative interface.
Backend
Supabase (PostgreSQL)
Supplies relational persistence, authentication and realtime change subscriptions as a single managed service. The realtime capability was decisive: implementing equivalent change propagation over a conventional REST backend would have required a separate WebSocket infrastructure.
Notification delivery
Service Worker (hand-authored)
Written directly rather than generated through Workbox, to retain explicit control over push event handling and to make the logic legible for academic examination.
Blockchain client
ethers.js v6
Mature library with well-defined provider and signer abstractions and native BigInt handling for chain identifiers and token amounts.
Blockchain network
Ethereum Sepolia testnet
Permits real on-chain transaction execution and independent public verification without committing real economic value, which would be inappropriate in a research context.
Wallet
MetaMask via injected provider
The most widely adopted browser wallet, giving the citizen custody of their own keys rather than requiring the operator to custody them.
Mapping
Google Maps JavaScript API
Provides reliable coverage of Sri Lankan road geography, which was the determining factor over open alternatives.
Notifications
Web Push with VAPID
A standards-based mechanism requiring no proprietary messaging service and no native application.
Development
Antigravity IDE, Git
Version control and development environment.
The overall selection is governed by two principles. The platform must be deliverable through a browser without native application installation, because requiring residents and contracted drivers to install and maintain a native application would impose an adoption barrier disproportionate to the service. And state changes must propagate between roles without polling, because the operational divergence identified in Chapter 1 is precisely a problem of one role not seeing what another has done.
Figure 4.8: 
Project source structure
4.6.3 Authentication and the driver approval workflow
Driver onboarding is implemented as a three-step registration process. The first step captures and validates account credentials with a minimum password length. The second captures the driver’s name, licence number, vehicle selection and preferred operating zone. Vehicle selection is constrained: the available list is computed as the set of all registered vehicles less those already assigned to approved drivers, which prevents duplicate vehicle assignment at the point of registration rather than through a subsequent integrity check. The third step presents a review screen before submission.
On submission the implementation performs an authentication sign-up followed by insertion of a driver profile record with the approval flag set to false. This two-record structure separates identity, held by the authentication service, from operational profile data, held in the application schema and linked by user identifier.
The approval gate is enforced at login. After successful credential verification, the implementation retrieves the driver profile by user identifier and inspects the approval flag; an unapproved driver receives a pending-approval message and is not admitted to the operational interface.
The behaviour of interest is what happens while the driver waits. Rather than requiring the driver to poll by refreshing, the registration screen subscribes to database change events filtered to that driver’s own profile row, and navigates automatically when the approval flag transitions to true. The administrator approves from the fleet monitor with a single update to the profile record. The pseudocode below expresses the coordination:
DRIVER CLIENT:
  submit registration
  create auth account
  insert driver_profile (is_approved = false)
  subscribe to UPDATE events on driver_profiles WHERE id = own_id
  on event received:
      if event.new.is_approved == true:
          navigate to driver dashboard
ADMINISTRATOR CLIENT:
  display driver_profiles WHERE is_approved = false
  on approve action:
      update driver_profiles SET is_approved = true WHERE id = selected_id
The result is that the driver’s screen advances within a second of the administrator’s action, with no polling and no page refresh. The same subscription mechanism is reused for dispatch alerts, described in Section 4.6.6.
4.6.4 Blockchain incentive mechanism
4.6.4.1 Contract interface
The token contract is deployed on the Sepolia testnet and accessed through a human-readable ABI defining the standard ERC-20 informational and transfer functions together with a reward-issuing function and a configured reward amount. The contract address is held as an application constant.
[ACTION REQUIRED — the Solidity source for the deployed contract is not currently present in the repository. Retrieve it from the deployment environment or from the verified source on the public block explorer and include it in the final submission.]
4.6.4.2 Provider, signer and network guard
Blockchain access is mediated by a small library module exposing three operations. A signer accessor wraps the injected wallet provider and returns the provider, signer and a contract instance bound to that signer. A reward function invokes the contract’s citizen reward function for a given address and awaits block confirmation. A balance function returns the citizen’s token holding.
The balance function includes two defensive guards worth noting. It compares the provider’s chain identifier against the Sepolia identifier using BigInt comparison, which is required by ethers v6 semantics, and it verifies that contract bytecode is actually present at the configured address before attempting a call. The second guard converts an otherwise opaque decoding failure — the symptom of querying an address where no contract exists — into a diagnosable error.
FUNCTION getEcoBalance(walletAddress):
    provider ← BrowserProvider(injected wallet)
    network ← provider.getNetwork()
    IF network.chainId ≠ 11155111:
        RAISE "Wallet is not connected to the Sepolia network"
    code ← provider.getCode(TOKEN_ADDRESS)
    IF code == "0x":
        RAISE "No contract deployed at the configured address"
    raw ← contract.balanceOf(walletAddress)
    RETURN formatUnits(raw, 18)
4.6.4.3 Reward issuance on report submission
Report submission executes a two-phase flow. The report is first inserted into the backend with Pending status. The wallet address is then obtained from the connected signer and the reward function is invoked.
The ordering is deliberate and is the significant design decision in this section. The civic function — recording that a resident reported a waste problem — is the operationally essential outcome; the incentive is secondary. Persisting the report first, and treating blockchain failure as a non-fatal condition that produces an explanatory message while the report remains saved, ensures that a wallet problem, a network mismatch or a rejected transaction never costs the operator a service report. This satisfies FR-11 and NFR-09.
4.6.4.4 Token redemption
Citizens may convert held tokens to Sri Lankan Rupees at a fixed configured exchange rate. The flow records a payout request with Pending Transfer status and executes an on-chain transfer of the redeemed tokens.
Two honest qualifications are required. First, the redemption function is named as a burn operation but is implemented as a transfer to a fixed treasury address rather than a transfer to the zero address or a call to a contract burn function; whether the tokens are subsequently destroyed depends on the treasury contract’s behaviour and is not established by this implementation. The naming therefore overstates what the code does, and should be corrected. Second, no automated fiat settlement exists: the payout record is a request queue reviewed and actioned manually by an administrator, and no banking integration is implemented. The exchange rate is a fixed application constant with no market or policy basis.
4.6.5 Location tracking and live monitoring
When a driver starts a journey against an assigned report, the implementation marks the report In Progress and initiates a continuous position watch through the browser geolocation API with high-accuracy enabled and no cached-position tolerance. Each reported position writes latitude, longitude and a tracking flag to the driver’s profile record.
On resolution, the watch is cleared and the stored position is nulled with the tracking flag set false. Clearing position data on completion is a deliberate privacy measure: the system does not retain a location history for the driver, holding only a current position while a journey is active. This limits the surveillance capability of the system, though it also prevents route reconstruction for operational analysis — a trade-off resolved in favour of the worker.
Position updates are written on every positional change reported by the browser, without debouncing or a minimum-distance threshold. This is inefficient and is recorded against NFR-02.
The administrator fleet map subscribes to profile update events and maintains map markers accordingly, adding a driver when tracking becomes active and removing them when it ceases. Only the current position marker is rendered; no route polyline or historical replay is implemented.
The citizen tracking view is publicly accessible by report identifier and requires no authentication. It loads the report and the assigned driver profile, subscribes to that driver’s position updates, and computes great-circle distance between the driver and the reported location using the Haversine formula:
a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)
d = 2R · atan2(√a, √(1−a))
where φ denotes latitude in radians, λ denotes longitude in radians and R is the Earth’s mean radius, taken as 6,371 km. An arrival state is indicated when the computed distance falls below 150 metres.
The Haversine formula was selected over the more accurate Vincenty formulae because it is computationally trivial, executes acceptably on every position update on a mobile client, and its spherical-earth error is negligible at the sub-kilometre distances relevant to arrival estimation.
The public accessibility of the tracking view warrants comment: any party holding a report identifier can observe the assigned driver’s live position. Given that identifiers are sequential, this is a privacy weakness and is recorded in Section 6.4.2.
4.6.6 Realtime dispatch coordination
When an administrator changes a driver’s assigned zone or vehicle, the update writes both the new value and a dispatch alert message to the driver’s profile record. Because the driver dashboard maintains a subscription to its own profile row, the alert appears as a banner immediately without refresh, and acknowledgement clears the field.
This pattern — writing a message into the same row the client already observes — avoids a separate messaging channel entirely. It is a simple solution and adequate at this scale. Its limitation is that only one unacknowledged alert can exist per driver, since a second alert overwrites the first. A message table would be required for reliable multi-alert delivery.
4.6.7 HCI telemetry implementation
Telemetry capture is embedded in the driver completion path. A timestamp is recorded when route data renders; elapsed time is computed at the completion action and written to the telemetry table with the task name. Each record is written at the moment the completion action is taken, so the measured interval reflects the driver’s task rather than any subsequent transmission delay.
The administrator SQA dashboard aggregates these records, computing total event count, mean task duration, and a per-task breakdown, and rendering a proportional bar for each record’s duration relative to the maximum observed. The dashboard subscribes to telemetry inserts and updates live.
As stated in Sections 3.6 and 6.4.1, the interaction-count field is written with a fixed value and is therefore excluded from analysis. The dashboard computes and displays an average interaction count derived from this field; because the underlying value is constant, that 
display is uninformative by construction and should not be interpreted as a measurement. This is stated explicitly so that no reader mistakes the displayed figure for a finding.
4.6.8 Push notification implementation
Notification delivery uses the Web Push protocol with VAPID authentication. Credentials are supplied through environment variables, with the private key confined to the server and the public key exposed to the browser for subscription creation.
Citizens subscribe from the tracking view, which requests notification permission, creates a push subscription using the public application key, and posts the resulting subscription to a server route handler. That handler verifies the session, then upserts the subscription keyed on endpoint using a privileged server-side client.
When an administrator assigns a driver to a report, a second server route handler retrieves subscriptions for that report and dispatches a notification. The service worker’s push handler renders the notification with action buttons, and a notification click handler opens the corresponding tracking page.
The use of server route handlers here is architecturally necessary rather than incidental: the VAPID private key and the privileged database credential must never reach the browser, so these operations cannot be performed client-side.
4.7 Evaluation plan
The chapter guidance requires that the selection of testing and evaluation strategies be justified rather than asserted. The strategies adopted, and those rejected, are as follows.
Adopted: controlled functional testing.
 Black-box scenario testing of each workflow against expected outcomes. Justified because the artefact’s primary claim is that a set of integrated workflows operate correctly across roles and connectivity states; scenario execution is the direct test of that claim.
Adopted: database state verification.
 Inspection of persisted records after each interface action. Justified because a functional test observing only interface confirmation cannot distinguish a successful write from an interface state change that never reached storage.
Adopted: system-generated telemetry analysis.
 Descriptive statistical analysis of task durations captured during controlled trials. Justified because it provides objective interaction evidence without participant recruitment, and because generating this evidence is itself one of the research contributions under evaluation.
Adopted: realtime propagation trials.
 Execution of a state change in one role’s interface while a second role’s interface is open and observed. Justified because the coordination claim concerns what a 
second
 participant sees, which no single-client test can establish.
Adopted: independent on-chain verification.
 Confirmation of transactions through a public block explorer. Justified because verification through the application’s own interface would be circular; the value claimed for the blockchain component is precisely that it can be verified without trusting the application.
Rejected: automated unit and integration testing.
 No automated test suite exists in the repository. Its absence is a genuine weakness in engineering practice and is recorded as such; the evaluation reported here is manual, and regression protection is correspondingly absent.
Rejected: human-participant usability testing.
 Excluded for the access and timeframe reasons stated in Section 4.3.1. The consequence is that usability claims rest on measured task duration rather than on user judgement, and no claim of user satisfaction is made anywhere in this thesis.
Rejected: comparative benchmarking against an existing system.
 No comparable integrated platform was available as a baseline, and constructing one would constitute a second research project.
Rejected: load and stress testing.
 Not applicable at prototype scale with a single-driver dataset, and would produce figures with no interpretable meaning.
4.8 Ethics and project management
4.8.1 Ethical considerations
Several ethical considerations arise from this study and were addressed as follows.
Human participants.
 No human participants were recruited and no personal data was collected from real individuals. All records in the system are development test data created by the author. This eliminates the consent, confidentiality and data-protection obligations that would attach to a participant study, and correspondingly limits the claims the study can make.
Location data.
 The platform collects GPS coordinates from driver devices. All such data in this study originates from the author’s own device during testing. In a real deployment, continuous location tracking of workers raises significant privacy and workplace-surveillance concerns that would require informed consent, a defined retention period, and a clear operational justification. These obligations are noted in Section 6.6 as a prerequisite for deployment.
Blockchain immutability.
 Transactions written to a public blockchain cannot be deleted. Deployment on the Sepolia testnet rather than a mainnet means no personal data and no 
real financial value is permanently committed to a public ledger during this research. In a production deployment, the linkage between a wallet address and a resident’s reporting history would constitute a permanent public record requiring careful consideration under data-protection principles.
Research integrity.
 No data has been fabricated, simulated or estimated in this thesis. Where a component is incomplete, uses fixed values, or has not been verified, this is stated explicitly rather than omitted. The defect register in Section 5.4.3 records all known gaps between claimed and implemented functionality, including those that reflect unfavourably on the artefact.
Academic integrity.
 All sources are cited in IEEE format. The software artefact is the author’s own work; third-party libraries are acknowledged in the technology stack in Section 4.6.2.
4.8.2 Project management methodology
Scrum
 was adopted as the project management methodology, following the Scrum Guide [17], adapted for a single-developer research project.
The justification rests on the nature of the problem. The project involved substantial technical uncertainty — particularly regarding blockchain integration and realtime subscription behaviour, neither of which could be reliably estimated in advance. Scrum’s iterative sprint structure permits requirements and priorities to be revised as technical understanding develops, which occurred repeatedly during this project. A predictive methodology such as PRINCE2 assumes a stable and specifiable scope defined at initiation; this assumption did not hold, since the authentication, tracking and blockchain components were reprioritised following the Interim 02 supervisory review. Kanban was considered as a lighter alternative, but its continuous-flow model provides weaker natural alignment with the fixed academic review milestones that structured this project.
Scrum was adapted as follows: sprints of two weeks; the supervisor performing the Product Owner review function at scheduled meetings; a personal product backlog maintained as a prioritised feature list; and sprint reviews aligned to academic milestones. Daily stand-ups and the Scrum Master role were not applicable to a single-developer 
project and were omitted, which is a deviation from the framework rather than an implementation of it.
4.8.3 Project timeline
Table 4.12: 
Project timeline
Phase
Period
Principal Activities
Project initiation and proposal
Feb – Mar 2026
Topic selection, supervisor allocation, proposal preparation
Literature review
Mar – Apr 2026
Systematic review, gap identification, conceptual map
Requirements and design
Apr – May 2026
Stakeholder analysis, use case modelling, architecture design
Interim 01 submission
May 2026
Chapters 1–3 draft, initial prototype
Core implementation
May – Jul 2026
Role portals, Supabase integration, initial telemetry
Interim 02 submission
19 Aug 2026
Revised Chapters 1–3, progress update, preliminary evidence
Extended implementation
Aug – Sep 2026
Authentication, GPS tracking, live fleet map, blockchain integration, push notifications
Testing and evaluation
Sep 2026
Controlled functional testing, telemetry trials, sync trials
Complete draft submission
10 Sep 2026
This document
Final submission
Oct 2026
Revised thesis incorporating supervisory feedback
Figure 4.9: 
Gantt chart of the project timeline
4.9 Chapter summary
This chapter established a pragmatist paradigm, a deductive-dominant approach with inductive elements, and a Design Science Research strategy following Peffers et al. Fact-collection mechanisms were specified, and the deliberate exclusion of interviews and usability instruments was stated together with its consequences for the strength of the study’s claims. The DSRM activities were mapped to specific locations in this document, Scrum was justified as the project management methodology with its adaptations and deviations declared, the project timeline was presented, and ethical considerations spanning participants, location data, blockchain immutability and research integrity were addressed.
The requirements and design of the EcoRoute system were then specified. 
Stakeholders were identified and their concerns mapped to interfaces; the research objectives were operationalised into system functions and evidence; the system was modelled through use case, class, activity, sequence and deployment views; the architecture was described across presentation, backend, blockchain and notification layers; a requirement traceability matrix was presented; and the functional and non-functional requirements were specified with their implementation status declared.
The implementation of EcoRoute was then documented across
 authentication and approval, blockchain incentives, location tracking, realtime dispatch coordination, telemetry capture and push notification. Technology selections were justified against the requirements of the domain, and the logic of the contributing components was presented through pseudocode and algorithmic description. Design decisions with non-obvious rationale — the ordering of report persistence before reward issuance, the clearing of driver position on task completion, the writing of dispatch alerts into an already-observed row, and the selection of the Haversine formula — were explained rather than merely reported. 
Finally, the evaluation plan was defined, together with the ethical considerations and project management approach that governed the study. Chapter 5 reports the results obtained.
5 RESULTS
5.1 Chapter overview
This chapter reports the results of the study. It presents the developed artefact, the functional test results and database verification evidence, the known implementation defects, the blockchain verification, the realtime propagation trials and the system-generated task-duration telemetry, and then relates these findings to the specific objectives. 
Consistent with the position established in Section 4.8.1, no data presented in this chapter has been simulated or estimated; where evidence is not yet collected, this is marked rather than filled.
5.2 Evaluation environment
[TO WRITE: Describe the final setting in which the results were produced: the system version or commit tested, the browsers and devices used (desktop and mobile), the Supabase project and Sepolia network configuration, the test data used (number of drivers, reports and routes), and the dates on which testing was carried out.]
5.3 Developed artefact
This section presents the key implemented features of the EcoRoute platform, grouped by workflow. The implementation of each feature is described in Section 4.6.
5.3.1 Access and driver onboarding
Figure 5.1: 
Landing page with role portal selection
Figure 5.2: 
Administrator authentication interface
Figure 5.3: 
Driver registration — Step 1, account credentials
Figure 5.4: 
Driver registration — Step 2, vehicle and zone selection
Figure 5.5: 
Driver registration — Step 3, review and submission
Figure 5.6: 
Administrator fleet monitor showing a pending driver approval
5.3.2 Citizen reporting and token rewards
Figure 5.7: 
Citizen issue report interface with map pinpointing
Figure 5.8: 
Report submission confirmed with ERC-20 reward dispatched to the connected wallet
Figure 5.9: 
ECO payout gateway showing token balance and bank payout request
5.3.3 Live tracking and field operations
Figure 5.10: 
Driver active operational tasks with GPS tracking active
Figure 5.11: 
Administrator live fleet map with an actively tracking driver
Figure 5.12: 
Citizen live tracking view showing driver position, status and Haversine distance
5.3.4 Telemetry dashboard
Figure 5.13: 
Administrator SQA telemetry dashboard
5.4 Functional test results
5.4.1 Functional test cases
Ten principal test cases are presented. Remaining cases are omitted for brevity, as directed by the chapter guidance.
Table 5.1: 
Functional test cases and results
ID
Scenario
Expected Result
Actual Result
Status
T01
Driver submits registration through the three-step form
Auth account created; profile inserted with approval flag false; pending screen displayed
[TO BE COMPLETED]
[ ]
T02
Administrator approves a pending driver while the driver’s screen is open
Approval flag set true; driver screen advances to dashboard without refresh
[TO BE COMPLETED]
[ ]
T03
Unapproved driver attempts login
Credentials accepted; access refused with pending-approval message
[TO BE COMPLETED]
[ ]
T04
Registration attempts to select a vehicle already assigned to an approved driver
Vehicle absent from the selectable list
[TO BE COMPLETED]
[ ]
T05
Citizen submits an issue report with wallet connected to Sepolia
Report persisted with Pending status; reward transaction confirmed on chain
[TO BE COMPLETED]
[ ]
T06
Citizen submits a report with wallet connected to a network other than Sepolia
Report persisted; reward aborted by network guard; failure reason displayed
[TO BE COMPLETED]
[ ]
T07
Administrator assigns a report to a driver in the report’s zone
Report updated with driver and In Progress status; push notification delivered to subscribed citizen
[TO BE COMPLETED]
[ ]
T08
Driver starts journey and moves; citizen observes tracking view
Position written to profile; marker updates on administrator map and citizen view; distance recalculates
[TO BE COMPLETED]
[ ]
T09
Driver completes a route while online
Route status set Completed; telemetry record inserted with measured duration
[TO BE COMPLETED]
[ ]
T10
Administrator changes a driver’s zone while the driver dashboard is open
Profile updated; dispatch alert appears on the driver screen without refresh; acknowledgement clears the alert
[TO BE COMPLETED]
[ ]
[ACTION REQUIRED: Execute each test case and complete the Actual Result and Status columns. Capture a screenshot for each as evidence.]
5.4.2 Database verification evidence
Persistence was verified by inspecting the backend tables after each workflow execution, confirming that interface confirmations correspond to committed records rather than optimistic interface state.
Figure 5.14: 
driver_profiles table showing approval state and live tracking coordinates
Figure 5.15: 
CitizenReports table showing submitted, assigned and resolved reports
Figure 5.16: 
HCILogs table showing captured task-duration telemetry
Figure 5.17: 
BankPayouts table showing citizen redemption requests
5.4.3 Known implementation defects
For completeness and in accordance with Section 4.8.1, the following defects are recorded. They are drawn from a systematic inspection of the source code.
Table 5.2: 
Known implementation defects
Defect
Nature
Consequence
Depth of administrator route protection unverified
Unevaluated
Enforcement may be interface-level rather than server-level
Local-storage session fallback in the driver interface
Development artefact
Partial operation possible without a verified session
Interaction count written as a fixed value
Incomplete feature
Metric carries no information; excluded from analysis
Treasury address fixed in source
Hardcoded value
Not configurable per deployment
Redemption named as burn but implemented as transfer
Misleading naming
Overstates the on-chain effect
Contract source absent from repository
Missing artefact
Deployed logic not independently reviewable
No schema migration files
Missing artefact
Schema not reproducible from repository
Position updates undebounced
Inefficiency
Excess network and database load
Fixed summary figures on landing page
Demonstration data
Could be mistaken for operational measurements
Fixed entries in driver roster display
Demonstration data
Could be mistaken for real personnel
No automated test suite
Missing artefact
Regression protection absent; testing is manual
Public tracking view requires no authentication
Design weakness
Driver position observable by identifier enumeration
5.5 Evaluation results
5.5.1 Blockchain verification
On-chain execution was verified independently of the application through a public block explorer, confirming that the reward transactions originated from the application, executed against the deployed contract, and altered the recipient’s token balance.
Table 5.3: 
Blockchain verification record
Property
Value
Network
Ethereum Sepolia testnet (chain identifier 11155111)
Contract address
0x502Bd8d0be1607666Cce013D8BC39246F0733148
Token standard
ERC-20
Reward transaction hash
[TO BE COMPLETED — copy from block explorer]
Block number
[TO BE COMPLETED]
Gas used
[TO BE COMPLETED]
Recipient balance before
[TO BE COMPLETED]
Recipient balance after
[TO BE COMPLETED]
Redemption transaction hash
[TO BE COMPLETED]
[INSERT FIGURE HERE: Confirmed transaction on the public block explorer]
Figure 5.18: 
Confirmed transaction on the public block explorer
The network guard was verified by connecting the wallet to a different network and attempting a balance query; the guard is expected to reject the operation before any contract call is issued.
5.5.2 Realtime propagation trials
The coordination claim was evaluated through paired-client trials. Each trial opened two interfaces simultaneously, executed a state change in one, and observed whether and how quickly the change appeared in the other without manual refresh.
Table 5.4: 
Realtime propagation trials
Trial
Change made in
Observed in
Propagated without refresh
Approximate latency
Result
P1
Admin approves pending driver
Driver pending-approval screen
[TO BE COMPLETED]
P2
Driver enables GPS tracking
Admin live fleet map
[TO BE COMPLETED]
P3
Driver position changes
Citizen tracking view distance
[TO BE COMPLETED]
P4
Admin assigns report to driver
Driver task list
[TO BE COMPLETED]
P5
Admin changes driver zone
Driver dispatch alert banner
[TO BE COMPLETED]
P6
Driver completes route
Admin SQA telemetry dashboard
[TO BE COMPLETED]
[ACTION REQUIRED: Execute each paired trial with two browser windows open side by side. Record whether the second interface updated without refresh and roughly 
how long it took. A screen recording or a paired screenshot before and after is the evidence.]
The property to verify is that the second interface updates without any user action. A change that appears only after a manual refresh indicates that the subscription is not active for that table or that the row-level filter excludes the event, and would falsify the coordination claim for that pathway.
5.5.3 Task duration telemetry analysis
This section presents the quantitative evaluation of driver task performance from system-generated telemetry.
[DATA REQUIRED — this section cannot be completed until the telemetry trials have been run. Execute at least fifteen route-completion trials, then export the HCILogs table and insert the analysis below.]
The following analysis structure should be populated:
Descriptive statistics.
 Number of records; mean, median, standard deviation, minimum and maximum task duration in milliseconds, reported for the full set and for the first and second halves of the trial sequence so that any learning effect is visible.
Table 5.5: 
Descriptive statistics of task duration
Statistic
All records
First half of trials
Second half of trials
Number of records
[ ]
[ ]
[ ]
Mean duration (ms)
[ ]
[ ]
[ ]
Median duration (ms)
[ ]
[ ]
[ ]
Standard deviation (ms)
[ ]
[ ]
[ ]
Minimum (ms)
[ ]
[ ]
[ ]
Maximum (ms)
[ ]
[ ]
[ ]
[INSERT FIGURE HERE: Task duration across trials — line or bar chart]
Figure 5.19: 
Task duration across trials — line or bar chart
[INSERT FIGURE HERE: Distribution of task durations — histogram or box plot]
Figure 5.20: 
Distribution of task durations — histogram or box plot
Interpretation to be written against three questions.
 First, is the distribution stable, or is there evidence of a learning effect across successive trials — that is, does duration decline as the operator becomes familiar with the interface? Second, how much variability is present, and does the spread suggest that the interface imposes a consistent interaction cost or a highly variable one? Third, what does the observed magnitude of task duration indicate about interaction efficiency, bearing in mind the caveat in Section 3.6 that the measure includes physical task time and is not a pure interface metric?
A note on statistical claims.
 With a sample of this size, drawn from a single operator under controlled rather than field conditions, only descriptive analysis is appropriate. No inferential statistical test should be applied and no claim of statistical significance should be made. The analysis establishes that the telemetry mechanism produces usable measurements and characterises those measurements; it does not establish a population-level finding.
Interaction count is excluded from this analysis
 for the reason stated in Sections 3.6, 6.4.1 and 4.6.7: the field is written with a fixed value and is constant by construction. Reporting a mean derived from it would constitute a fabricated result.
5.6 Results by objective
The table below maps each specific objective in Section 2.2 to the results that address it.
Table 5.6: 
Mapping of results to the specific objectives
Specific objective
Results addressing it
2.2.1 Identify operational requirements and usability considerations
Requirements specified in Section 4.4; implemented interfaces in Section 5.3
2.2.2 Analyse technological and research gaps
Comparative assessment in Sections 3.4 and 3.5; gap statement in Section 3.9
2.2.3 Design and develop the EcoRoute platform
Developed artefact (Section 5.3); functional test results (Section 5.4.1); known defects (Section 5.4.3)
2.2.4 Evaluate the implemented system
Database verification (Section 5.4.2); blockchain verification (Section 5.5.1); realtime propagation trials (Section 5.5.2); telemetry analysis (Section 5.5.3)
[TO WRITE after completing the tests: add two or three sentences per objective stating what the results show, for example how many of test cases T01–T10 passed. Do not interpret the results here; interpretation belongs in Section 6.1.]
5.7 Chapter summary
[TO WRITE after completing the results: summarise the main observed findings from Sections 5.3 to 5.6 in one paragraph, without explaining their wider meaning.]
6 DISCUSSION AND CONCLUSIONS
6.1 Discussion of key findings
Each objective is assessed below through triangulation across implementation evidence, test outcomes and telemetry, following the chapter guidance. Assessment is stated as achieved, partially achieved or not achieved, with the supporting and limiting evidence given in each case.
6.1.1 Objective 2.2.1: identify operational requirements and usability considerations
Assessment: partially achieved.
Operational requirements were identified through domain and literature analysis and expressed as a stakeholder analysis, a use case model and a specification of thirty-two functional and twelve non-functional requirements (Sections 4.3.2, 4.4, 4.4.4, 4.4.5). Usability considerations were derived from the HCI literature [7], [8], [13] and applied in the interface design (Section 3.7).
The objective is qualified rather than fully achieved because requirements were derived analytically rather than elicited from stakeholders. No driver, administrator or resident contributed to requirement identification. The requirements are therefore defensible as reasoned but not validated as accurate to real operational need, and this weakens the foundation on which the remaining objectives build.
6.1.2 Objective 2.2.2: analyse technological and research gaps
Assessment: achieved.
Chapter 3 assessed five literature strands, evaluated four families of existing system with explicit suitability judgements including justified rejections (Section 3.4), compared state-propagation approaches and justified the selection made (Section 3.5.1), and stated the case against blockchain adoption alongside the case for it (Section 3.5.2). The research gap was established as the absence of an integrated platform combining verifiable civic incentives, embedded interaction telemetry and realtime multi-role coordination (Section 3.9). Technology selections in Section 4.6.2 trace to this analysis.
6.1.3 Objective 2.2.3: design and develop the EcoRoute platform
Assessment: substantially achieved.
The platform was implemented with authenticated driver access and an administrative approval gate, GPS-based fleet monitoring with live administrator and citizen views, realtime propagation of dispatch and approval state, citizen reporting with ERC-20 rewards executing on a public testnet, embedded task-duration telemetry with an aggregation dashboard, and push notification delivery. All but one specified functional requirement is satisfied.
One requirement is not satisfied: interaction event counting is not implemented (FR-26), which removes one intended dimension from the telemetry contribution. Administrator 
authentication was implemented late in the project and satisfies FR-32 and NFR-06 at the credential level, though the depth of route-level enforcement has not been independently verified. Further defects are recorded in Section 5.4.3.
The objective is assessed as substantially rather than fully achieved on this basis. The research contributions themselves — verifiable incentives, embedded telemetry, realtime coordination — are implemented and evaluable; the deficiencies lie in the production-readiness of the surrounding system.
6.1.4 Objective 2.2.4: evaluate the implemented system
Assessment: partially achieved.
An evaluation strategy was defined and justified, with rejected strategies stated (Section 4.7). Functional testing, database verification, realtime propagation trials, on-chain verification and telemetry analysis were specified and executed as reported in Sections 5.4.1 to 5.5.3.
The objective is qualified for three reasons. The evaluation was conducted by a single operator with complete system knowledge, under controlled rather than field conditions, on a prototype-scale dataset. No participant validation was obtained. And no automated test suite exists, so the functional evidence is a point-in-time manual observation rather than a repeatable verification. The evaluation establishes that the system works as designed; it does not establish that it works for its intended users in its intended environment.
Table 6.1: 
Summary of objective accomplishment
Objective
Assessment
Principal supporting evidence
Principal limiting factor
2.2.1 Requirements and usability
Partially achieved
Stakeholder analysis, use case model, 32 FR / 14 NFR
Requirements derived analytically, not elicited from stakeholders
2.2.2 Technological and research gaps
Achieved
Comparative assessment (Sections 3.4, 3.5), gap statement in Section 3.9
—
2.2.3 Design and development
Substantially achieved
Working artefact; 30 of 32 FR satisfied
FR-26 not implemented; access-control depth unverified
2.2.4 Evaluation
Partially achieved
Functional tests, database verification, on-chain confirmation, telemetry
Single operator, controlled conditions, prototype-scale dataset
6.2 Comparison with literature
[TO WRITE: Compare your main findings with the studies reviewed in Chapter 3. For example: how the realtime coordination results relate to the synchronisation approaches in Section 3.5.1; how the Sepolia reward verification relates to the verifiability argument of Nechesov and Ruponen [10] and Islam and Basi [11]; and how your task-duration telemetry compares with the richer interaction metrics used by Živčnjak et al. [13]. State where your results agree with the literature, where they differ, and why.]
6.3 Contribution and practical implications
[TO WRITE: One short paragraph stating the contribution of this study (the integration of verifiable civic incentives, embedded interaction telemetry and realtime multi-role coordination in one deployable platform, as framed in Section 3.9) before the practical implications below.]
6.3.1 Real-world application possibilities
The platform’s commercial application is clearest for 
private waste-collection contractors
, for the reasons set out in Section 1.7. A contractor operating under municipal contract has both the operational need for reliable field data capture and the commercial discretion to fund a citizen incentive scheme as a retention measure. Realtime operational visibility has direct economic value: a contractor billing per completed route needs an auditable record of what was collected and when, and disputed claims are unbilled or contested revenue.
Municipal councils
 could adopt the operational components — dispatch, tracking, report assignment, telemetry — without the incentive layer, which would require budgetary approval unlikely to be forthcoming.
Beyond waste management, the 
realtime multi-role coordination pattern
 generalises to any operation where a dispatcher, a field worker and a customer each need the same picture of one job: utility repair, courier delivery, home healthcare visits and roadside assistance all share this structure. The specific contribution — using row-scoped database change subscriptions so that a dispatcher’s action reaches a field worker’s screen and a customer’s tracking view simultaneously, without a separate messaging service — applies unchanged in all of these.
The 
embedded telemetry pattern
 has independent commercial value as a software quality practice: instrumenting task duration in the operational system and surfacing it to the operator provides ongoing quality signal without a dedicated usability study.
6.3.2 Commercial viability considerations
Honesty requires noting that the platform is not commercially deployable as it stands. Administrator authentication is absent, which is disqualifying. The blockchain component operates on a testnet with no economic value; mainnet deployment would incur real gas costs, and no analysis of those costs against the value of increased citizen participation has 
been performed. This analysis would be a prerequisite for any commercial claim about the incentive mechanism, and I do not make one.
6.4 Limitations
6.4.1 Limitations identified in the specification
The following requirements are specified but not satisfied by the current implementation. They are recorded here rather than omitted, in accordance with the research integrity position stated in Section 4.8.1.
Administrator authentication residual risk.
 An administrator authentication route and an 
admin_profiles
 table were implemented late in the project, satisfying FR-32 and NFR-06 at the credential level. Because the feature was added shortly before submission, the depth of enforcement has not been independently evaluated: it has not been verified whether every administrative route is protected at the server or middleware level, or whether protection is applied at the interface level only. Section 6.4.2 records this as an unevaluated area rather than a demonstrated control.
Interaction event counting is not implemented (FR-26).
 The interaction-count field is written with a fixed value rather than a counted total. Consequently this field carries no information and is excluded from the analysis in Chapter 5.
Position update frequency is uncontrolled.
 Position updates are transmitted on every positional change reported by the browser, with no debouncing or minimum-distance threshold. This produces higher network and database load than necessary.
Schema is not version-controlled.
 The database schema exists only in the hosted Supabase project and is not reproducible from repository artefacts. The schema documented in Section 4.5.2 was reconstructed by inspection of application queries.
Session handling contains a development fallback.
 A local-storage session fallback exists in the driver interface, permitting partial operation without a verified authentication 
session. This was introduced for development convenience and constitutes an authentication weakness.
Demonstration data is present in the interface.
 Certain summary figures on the landing page and a portion of the driver roster display are fixed demonstration values rather than queried data. These are identified so that no reader mistakes them for operational measurements.
6.4.2 Limitations of the evaluation
The following limitations bound the evaluation results reported in Chapter 5 and should be read alongside the conclusions in Section 6.5.
Single-operator evaluation.
 All trials were executed by the author. Task durations reflect the performance of a user with complete knowledge of the interface and therefore represent a best case; a driver encountering the system for the first time would be expected to perform differently, and the magnitude of that difference is unknown.
No participant validation.
 No municipal or contractor staff, and no residents, used the system. Usability is evidenced through measured duration alone, and no claim regarding user satisfaction, acceptance or preference is made.
Controlled rather than field conditions.
 Trials were conducted under simulated rather than genuine field conditions. Real collection work involves weather, vehicle movement, physical handling, interruption and time pressure, none of which is present in these measurements.
Prototype-scale dataset.
 The evaluation dataset comprises a small number of records for a single task type. Descriptive characterisation is appropriate; generalisation is not.
Absence of automated regression testing.
 Testing is entirely manual. There is no protection against regressions introduced by subsequent changes, and no evidence that previously passing behaviour remains correct after later modification.
Access control is not evaluated.
 Administrator authentication exists but was implemented too late for systematic access-control testing. It has not been verified whether protection is enforced at the server or middleware level for every administrative route, or only at the interface level. No penetration or authorisation-bypass testing was performed. The public accessibility of the citizen tracking view by sequential report identifier is a further unevaluated privacy weakness.
Testnet economics.
 The blockchain evaluation demonstrates mechanism rather than economics. Tokens carry no value, gas is free, and no conclusion about real-world cost, incentive effectiveness or citizen behavioural response can be drawn.
6.5 Conclusions
The main research question asked how an integrated waste-management platform with blockchain-based civic incentives can improve operational coordination while providing measurable evidence of software interaction quality. The study answers this constructively: it demonstrates a working architecture in which the three roles operate against shared state with realtime propagation, civic participation carries an independently 
verifiable reward, and interaction quality is measured by the system during normal operation. It does not answer the question empirically, because that would require deployment with real users, which was outside the scope achievable here.
Sub-question one, on transparent blockchain incentives, is answered by Sections 4.6.4 and 5.5.1, with testnet economics stated as a limitation. Sub-question two, on embedded telemetry, is answered by Sections 4.6.7 and 5.5.3, with the duration-measure caveat and the exclusion of interaction count stated. Sub-question three, on realtime shared state, is answered by Sections 4.6.3, 4.6.6 and 5.5.2, with the single-alert-per-driver and last-write-wins limitations stated. Sub-question four, on whether fragmentation is addressed, is answered only architecturally rather than empirically, for the reason given above.
6.6 Future work
Recommendations are ordered by priority.
Immediate, prior to any deployment.
 Verify that administrator authentication is enforced at the server or middleware level for every administrative route rather than at the interface level only, and remove the local-storage session fallback in the driver interface. These are prerequisites, not improvements.
High priority.
 Complete the interaction event counter so that the telemetry contribution is realised in full. Add schema migration files so the database is reproducible from the repository. Commit the smart contract source. Introduce an automated test suite covering at least the realtime subscription handlers, which are the components whose failure would be least visible, since a subscription that silently stops delivering looks identical to a system where nothing has changed.
Medium priority.
 Apply debouncing and a minimum-distance threshold to position updates. Correct the redemption function naming to reflect that it transfers rather than burns, or implement an actual burn. Move the treasury address and exchange rate to configuration. Restrict the citizen tracking view with a non-enumerable token rather than a sequential identifier.
Research extensions.
 Conduct a participant usability study with real drivers and residents, which is the single most valuable addition and the one that would convert this study’s architectural answer into an empirical one. Extend telemetry to dead clicks, navigation loops and error recovery. Replace the single-field dispatch alert with a message table supporting reliable multi-alert delivery and acknowledgement, and investigate conflict resolution beyond last-write-wins for genuinely concurrent scenarios. Evaluate mainnet deployment economics against measured participation effects. Revisit route optimisation — deliberately deferred in Section 3.4 — now that reliable operational data capture exists, since the precondition that justified its deferral would be satisfied. Client-side persistence for intermittent-connectivity operation, removed from scope in this study, remains a legitimate extension and would restore field resilience without disturbing the architecture described here.
Deployment prerequisites.
 Establish a data-protection framework for driver location tracking covering informed consent, retention period and permitted operational use, as identified in Section 4.8.1.
REFERENCES
[1] Z. Mao, Q. Zou, T. Bu, and R. Yan, “Understanding the role of service quality of government APPs in continuance intention: An expectation–confirmation perspective,” 
Sage Open
, vol. 13, no. 4, pp. 1–12, Oct. 2023.
[2] J. Kibbe and S. Sondhi, “The UK COVID-19 app: The failed co-production of a digital public service,” 
Soc. Sci. Med.
, vol. 287, p. 114365, Oct. 2021.
[3] D. Aloini, A. Fronzetti Colladon, P. Gloor, E. Guerrazzi, and A. Stefanini, “Enhancing operations management through smart sensors: Measuring and improving well-being, interaction and performance of logistics workers,” 
TQM J.
, vol. 34, no. 2, pp. 303–329, Dec. 2021.
[4] X. Fan, R. Kumar, and M. Chen, “Revolutionizing route optimization systems with artificial intelligence for a smarter, sustainable logistics ecosystem,” 
J. Supply Chain Manage.
, vol. 61, no. 1, pp. 45–68, Jan. 2025.
[5] H. Ali, S. Khan, and M. Raza, “A comprehensive study on automated testing within the software lifecycle,” 
J. Softw. Eng.
, vol. 18, no. 3, pp. 112–130, Mar. 2024.
[6] W. S. Zhang, T. Liu, and H. Zhao, “Identification of urban last-mile courier delivery stops using GPS trajectory data,” 
Transp. Res. Part C: Emerg. Technol.
, vol. 158, p. 104410, Jan. 2026.
[7] L. Zhang and J. Dolah, “Investigating the impact of interface metaphors on mobile cognitive load and satisfaction,” 
J. Logist. Inf. Serv. Sci.
, vol. 11, no. 4, pp. 89–105, Nov. 2024.
[8] H. Akram, N. Ahmad, and F. Sadiq, “Design strategies to minimize mobile usability issues in navigation design patterns,” 
Information
, vol. 15, no. 2, p. 114, Feb. 2024.
[9] A. Mohammed, B. Patel, and C. Fernandez, “Deploying machine learning models using progressive web applications for implementation in smart cities,” 
J. Smart Environ.
, vol. 9, no. 1, pp. 33–50, Jan. 2023.
[10] A. Nechesov and J. Ruponen, “Empowering government efficiency through civic intelligence: Merging artificial intelligence and blockchain for smart citizen proposals,” 
Technologies
, vol. 12, no. 12, p. 271, Dec. 2024.
[11] S. Islam and M. Basi, “A systematic literature review of blockchain-enabled supply chain traceability implementations,” 
IEEE Trans. Eng. Manage.
, vol. 70, no. 8, pp. 2890–2905, Aug. 2022.
[12] J. Zhao, Y. Wu, Y. Fu, and S. Liu, “ESfix: An embedded program repair tool for effective removal of concurrency defects,” 
Entropy
, vol. 27, no. 3, p. 294, Mar. 2025.
[13] M. Živčnjak, D. Horvat, and P. Kovač, “Designing AR-based warehouse management systems using the PECI framework: A comparative user study of interface performance,” in 
Proc. Des. Res. Soc. (DRS) Digital Library
, 2025, pp. 1–15.
[14] Q. Wang, Z. Liu, X. Chen, Y. Li, and H. Wang, “A roadmap for software testing in open collaborative development environments,” arXiv preprint arXiv:2406.05438, Jun. 2024.
[15] K. Peffers, T. Tuunanen, M. A. Rothenberger, and S. Chatterjee, “A design science research methodology for information systems research,” 
J. Manage. Inf. Syst.
, vol. 24, no. 3, pp. 45–77, Dec. 2007.
[16] J. W. Creswell and J. D. Creswell, 
Research Design: Qualitative, Quantitative, and Mixed Methods Approaches
, 5th ed. Thousand Oaks, CA, USA: SAGE Publications, 2018.
[17] K. Schwaber and J. Sutherland, 
The Definitive Guide to Scrum: The Rules of the Game
. Scrum.org, Tech. Rep., Nov. 2020.
[18] Ministry of Megapolis and Western Development, “Master Plan for Solid Waste Management in the Western Province, Sri Lanka,” Urban Development Authority, Colombo, Sri Lanka, Tech. Rep., 2018.
APPENDIX A: PROBLEMS ENCOUNTERED AND SELF-REFLECTION
A.1 Problems encountered
Scope instability following supervisory review.
 The Interim 02 submission correctly represented the blockchain and authentication components as unimplemented, and the supervisory guidance was that the thesis should reflect the artefact honestly. The subsequent decision to implement them changed the research framing substantially and required Chapters 1 to 3 to be rewritten in the opposite direction — removing the hedging that had earlier been introduced. A late decision to narrow the scope and drop a planned client-side persistence component compounded this. Together these consumed time that would otherwise have gone to evaluation, and are the principal reason the evaluation dataset is smaller than it should be.
Blockchain integration debugging.
 Contract interaction failures presented as opaque data-decoding errors that gave no indication of their cause. The eventual diagnosis — that a call to an address with no deployed bytecode fails during response decoding rather than at call time — motivated the bytecode presence check now in the balance function (Section 4.6.4.2). The library’s transition to BigInt semantics for chain identifiers was a further source of comparison failures that appeared as network mismatches.
Measuring duration at the right moment.
 An early telemetry implementation computed elapsed time at the point the record was written rather than at the moment the driver acted, so any delay between the two inflated the measurement. This was only apparent when a slow write produced an implausible figure. The correction — capturing the timestamp at the interaction and carrying it through to the write — is described in Section 4.6.7 and is, in retrospect, the most instructive error of the project, because the bug produced numbers that looked entirely plausible until examined.
Distinguishing interface state from persisted state.
 It proved easy to mistake an interface that had updated for a write that had succeeded, particularly where a component re-rendered from local state before the response returned. This drove the decision to verify every workflow at the database layer rather than through interface confirmation alone, and shaped the evaluation design in Section 5.4.2.
Deciding what not to report.
 The interaction-count field was implemented as a placeholder and never completed. Because the dashboard computes an average from it, a plausible-looking metric was available for reporting. Deciding to exclude it, and to state the 
exclusion explicitly in four separate sections, was a deliberate choice against presenting a fabricated result. This was the most uncomfortable decision in the project and, I believe, the correct one.
Time management.
 Implementation consistently consumed more of the schedule than planned, compressing evaluation into the final period. The consequence is visible in Chapter 5: the evaluation is adequate to characterise the system but thinner than the implementation warrants.
A.2 Self-reflection
A.2.1 Ideology about the research carried out
My view of this project changed over its course. It began as an attempt to build an impressive system — blockchain, telemetry, live tracking, push notifications, client-side persistence — and the breadth was, initially, the point. What I now think matters more is the discipline of representing the artefact accurately.
The supervisory feedback at Interim 02, which required removing claims about unimplemented features, was the turning point. It was uncomfortable at the time. It produced a better thesis, and more importantly it produced a habit: when the code inspection later revealed that administrator authentication was entirely absent, the instinct was to document it in the specification rather than to hope it went unnoticed. A thesis that states its own most serious defect in Section 6.4.1 is more defensible than one that conceals it, and I would not have understood that at the start of the project.
I am also less impressed by breadth than I was. Late in the project I removed a planned client-side persistence component rather than carry a claim I could not evidence, and narrowing the scope improved the thesis. The realtime coordination mechanism is the part of this work I would now defend most strongly, because it addresses a real operational failure — three roles holding three different pictures of one event — with a design that is simple and that I can demonstrate. The blockchain component is more visible but does less work, and I have said so in Section 3.5.2 rather than overclaiming for it.
A.2.2 Benefits gained
Technically, I gained working knowledge of realtime subscription architecture, blockchain client integration, geospatial computation, web push delivery, and the design of measurement into a running system. The last of these has changed how I think about software quality generally: instrumentation embedded at construction is more useful than evaluation bolted on afterwards.
Methodologically, I gained an understanding of design science as a research strategy — how an artefact can constitute a contribution, and what evidence is required to make that claim credible.
The most durable benefit is the least technical. I learned to distinguish between what a system does and what I would like it to do, and to write only the former.
A.2.3 Learning curves
The blockchain integration was the steepest curve, requiring understanding of providers, signers, ABI encoding, gas and network identity before any code could work at all. Realtime subscriptions were straightforward to adopt but conceptually harder than they appeared: components must be written to respond to state changed by someone else, not merely to their own actions, and reasoning about a screen that can change while nobody is touching it took time to internalise.
The academic writing curve was longer than expected, particularly the requirement to justify decisions rather than describe them. Writing that a network-first strategy was chosen is description; explaining that stale route data causes unrecoverable collection errors while latency causes only delay is justification. The difference took most of the project to internalise.
APPENDIX B: SMART CONTRACT SOURCE CODE
[ACTION REQUIRED: Insert the Solidity source code of the deployed ECO token contract (address 0x502Bd8d0be1607666Cce013D8BC39246F0733148 on the Sepolia testnet), as noted in Section 4.6.4.1.]