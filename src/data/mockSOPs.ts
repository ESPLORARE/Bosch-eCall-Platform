import { SOP } from '../types';

export const mockSOPs: SOP[] = [
  {
    id: 'SOP-001',
    title: 'Automatic eCall – Unconscious Passenger Response',
    scenarioType: 'Unconscious passenger',
    triggerType: 'Automatic',
    priorityLevel: 'Critical',
    description: 'Procedure for handling automatic eCalls where the passenger is unresponsive.',
    lastUpdated: '2026-03-15',
    status: 'Active',
    version: 'v2.1',
    updatedBy: 'System Admin',
    applicableConditions: [
      'Automatic SOS received',
      'No verbal response from vehicle occupants',
      'High collision severity detected'
    ],
    triggerConditions: [
      'Automatic eCall triggered by vehicle sensors',
      'Operator attempts callback but receives no response',
      'Vehicle telemetry indicates severe impact'
    ],
    procedureSteps: [
      'Confirm vehicle location from map and incident data.',
      'Attempt callback to the vehicle immediately.',
      'Check for passenger response (listen for breathing, groans, or background noise).',
      'If no response within 30 seconds, classify as Critical priority.',
      'Dispatch ambulance immediately to the exact GPS coordinates.',
      'Notify the nearest hospital of incoming trauma case.',
      'Escalate to police or fire rescue if telemetry suggests severe damage or fire.',
      'Log all actions and timestamps in the incident record.'
    ],
    keyQuestions: [
      'Is the vehicle still moving?',
      'How many occupants may be involved (check seatbelt sensors)?',
      'Is there any passenger response or background noise?',
      'Is smoke or fire visible (if camera feed available)?'
    ],
    dispatchRecommendations: [
      'Ambulance: Required (Immediate)',
      'Police: Conditional (If traffic hazard or crime suspected)',
      'Fire Rescue: If trapped / smoke / rollover indicated by telemetry',
      'Hospital Notification: Required (Trauma Center)'
    ],
    escalationRules: [
      'No response after 2 callback attempts',
      'Severe collision indicators (high G-force, multiple airbag deployments)',
      'Fire or smoke detected'
    ],
    notesWarnings: [
      'Treat unconscious passenger cases as highly time-sensitive.',
      'Prioritize simultaneous callback and dispatch for critical incidents.',
      'Do not delay dispatch while waiting for police confirmation.'
    ],
    checklist: [
      'Confirm incident location',
      'Attempt callback',
      'Listen for background noise',
      'Dispatch ambulance',
      'Notify hospital',
      'Escalate to fire rescue (if needed)',
      'Record operator notes'
    ]
  },
  {
    id: 'SOP-002',
    title: 'Passenger Trapped in Vehicle SOP',
    scenarioType: 'Passenger trapped in vehicle',
    triggerType: 'Any',
    priorityLevel: 'Critical',
    description: 'Standard procedure for incidents where occupants are unable to exit the vehicle.',
    lastUpdated: '2026-02-28',
    status: 'Active',
    version: 'v1.5',
    updatedBy: 'Safety Officer',
    applicableConditions: [
      'Occupant reports being trapped',
      'Telemetry indicates doors cannot be opened after severe crash',
      'Rollover detected'
    ],
    triggerConditions: [
      'Manual SOS with verbal confirmation of trapped status',
      'Automatic SOS with rollover or severe side-impact telemetry'
    ],
    procedureSteps: [
      'Confirm vehicle location and orientation (e.g., rollover).',
      'Establish and maintain communication with the trapped occupant(s).',
      'Assess the medical condition of the occupant(s).',
      'Dispatch Fire Rescue equipped with extrication tools immediately.',
      'Dispatch ambulance to standby for medical assistance.',
      'Advise occupants to remain calm and avoid unnecessary movement.',
      'Instruct occupants NOT to attempt to force doors if it causes further injury.',
      'Provide continuous updates to responding units regarding occupant status.'
    ],
    keyQuestions: [
      'Are you injured? Where is the pain?',
      'Can you smell fuel or see smoke?',
      'Are any doors or windows operable?',
      'How many people are trapped?'
    ],
    dispatchRecommendations: [
      'Fire Rescue: Required (Extrication tools needed)',
      'Ambulance: Required',
      'Police: Recommended (Traffic control)'
    ],
    escalationRules: [
      'Occupant reports smelling fuel or seeing smoke',
      'Occupant condition deteriorates',
      'Vehicle is in a hazardous location (e.g., water, cliff edge)'
    ],
    notesWarnings: [
      'Escalate early if a trapped passenger is suspected.',
      'Keep the caller on the line until rescue arrives if possible.',
      'Prioritize fire rescue dispatch over other services.'
    ],
    checklist: [
      'Confirm location and vehicle orientation',
      'Dispatch Fire Rescue (extrication)',
      'Dispatch ambulance',
      'Assess medical condition',
      'Check for fire/fuel hazards',
      'Maintain communication with caller'
    ]
  },
  {
    id: 'SOP-003',
    title: 'Vehicle Fire / Smoke Emergency SOP',
    scenarioType: 'Vehicle fire / smoke',
    triggerType: 'Any',
    priorityLevel: 'Critical',
    description: 'Immediate response protocol for reported or detected vehicle fires.',
    lastUpdated: '2026-01-10',
    status: 'Active',
    version: 'v3.0',
    updatedBy: 'System Admin',
    applicableConditions: [
      'Occupant reports smoke or fire',
      'Vehicle thermal sensors detect abnormal heat',
      'Third-party report of vehicle fire'
    ],
    triggerConditions: [
      'Manual SOS reporting fire',
      'Automatic trigger with thermal sensor alert'
    ],
    procedureSteps: [
      'Confirm exact location and vehicle details.',
      'Instruct all occupants to evacuate the vehicle immediately if safe to do so.',
      'Advise occupants to move to a safe distance (at least 100 feet) and stay away from traffic.',
      'Dispatch Fire Rescue immediately.',
      'Dispatch Police for traffic control and safety perimeter.',
      'Dispatch Ambulance if injuries or smoke inhalation are reported.',
      'Maintain communication to monitor the situation until responders arrive.'
    ],
    keyQuestions: [
      'Is everyone out of the vehicle?',
      'Are there any injuries or smoke inhalation?',
      'Is the vehicle in a tunnel, parking garage, or near structures?',
      'What type of vehicle is it (EV, ICE, Hybrid)?'
    ],
    dispatchRecommendations: [
      'Fire Rescue: Required (Immediate)',
      'Police: Required (Traffic/Perimeter)',
      'Ambulance: Conditional (If injuries reported)'
    ],
    escalationRules: [
      'Vehicle is an EV (requires specialized firefighting protocol)',
      'Fire is spreading to structures or vegetation',
      'Occupants are unable to evacuate'
    ],
    notesWarnings: [
      'EV fires require significantly more water and specialized handling. Always ask vehicle type.',
      'Evacuation is the absolute highest priority.',
      'Do not advise occupants to attempt to extinguish the fire themselves.'
    ],
    checklist: [
      'Instruct evacuation',
      'Confirm all occupants are clear',
      'Dispatch Fire Rescue',
      'Dispatch Police',
      'Identify vehicle type (EV/ICE)',
      'Check for injuries'
    ]
  },
  {
    id: 'SOP-004',
    title: 'Manual SOS – Medical Emergency Procedure',
    scenarioType: 'Medical emergency',
    triggerType: 'Manual',
    priorityLevel: 'High',
    description: 'Handling manual SOS calls for medical issues not caused by a collision.',
    lastUpdated: '2025-11-20',
    status: 'Active',
    version: 'v1.2',
    updatedBy: 'Medical Advisor',
    applicableConditions: [
      'Manual SOS button pressed',
      'Caller reports a medical emergency (e.g., heart attack, stroke, severe allergic reaction)'
    ],
    triggerConditions: [
      'Manual SOS activation'
    ],
    procedureSteps: [
      'Confirm vehicle location and ensure the vehicle is safely pulled over.',
      'Identify the nature of the medical emergency and the patient\'s condition.',
      'Dispatch ambulance to the location.',
      'If the driver is the patient, instruct them to turn on hazard lights and unlock doors.',
      'Provide pre-arrival medical instructions if trained and authorized.',
      'Stay on the line to monitor the patient\'s condition until EMS arrives.'
    ],
    keyQuestions: [
      'Is the vehicle safely parked?',
      'Who is experiencing the medical emergency?',
      'Is the patient conscious and breathing normally?',
      'Are there any known medical conditions or medications?'
    ],
    dispatchRecommendations: [
      'Ambulance: Required',
      'Police: Conditional (If vehicle is in a hazardous location)'
    ],
    escalationRules: [
      'Patient becomes unconscious or stops breathing',
      'Vehicle is stopped in a dangerous location (e.g., active highway lane)'
    ],
    notesWarnings: [
      'Ensure the vehicle is not a traffic hazard before focusing solely on the medical issue.',
      'Do not provide medical advice beyond authorized pre-arrival instructions.'
    ],
    checklist: [
      'Confirm vehicle is safely parked',
      'Identify medical issue',
      'Dispatch ambulance',
      'Instruct to unlock doors/turn on hazards',
      'Provide pre-arrival instructions',
      'Monitor condition'
    ]
  },
  {
    id: 'SOP-005',
    title: 'No Occupant Response Escalation SOP',
    scenarioType: 'No occupant response',
    triggerType: 'Automatic',
    priorityLevel: 'High',
    description: 'Protocol for when an automatic eCall is received but no communication can be established.',
    lastUpdated: '2026-03-01',
    status: 'Active',
    version: 'v2.0',
    updatedBy: 'Operations Manager',
    applicableConditions: [
      'Automatic SOS received',
      'Callback attempts fail or connect to silence'
    ],
    triggerConditions: [
      'Automatic eCall triggered',
      'No verbal response after 2 attempts'
    ],
    procedureSteps: [
      'Review vehicle telemetry (speed before impact, airbag deployment, G-force).',
      'If telemetry indicates a severe crash, escalate to Critical and follow SOP-001.',
      'If telemetry indicates a minor event, attempt to contact the registered emergency contact.',
      'If emergency contact is unreachable or confirms potential danger, dispatch Police for a welfare check.',
      'Log all contact attempts and telemetry data.'
    ],
    keyQuestions: [
      'Does telemetry indicate a severe collision?',
      'Is there any background noise indicating distress?',
      'Is the vehicle location in a remote or hazardous area?'
    ],
    dispatchRecommendations: [
      'Police: Required (Welfare check)',
      'Ambulance: Conditional (If telemetry suggests severe impact)'
    ],
    escalationRules: [
      'Telemetry data indicates high severity',
      'Background noise suggests an ongoing emergency or crime'
    ],
    notesWarnings: [
      'Silence does not mean the occupants are safe; they may be unconscious or unable to speak.',
      'Always err on the side of caution and dispatch a welfare check if unsure.'
    ],
    checklist: [
      'Review telemetry data',
      'Attempt callback (x2)',
      'Listen for background noise',
      'Contact emergency contact (if applicable)',
      'Dispatch Police (welfare check)'
    ]
  },
  {
    id: 'SOP-006',
    title: 'Child / Elderly Passenger Priority Handling SOP',
    scenarioType: 'Child / elderly passenger priority',
    triggerType: 'Any',
    priorityLevel: 'High',
    description: 'Special handling procedures when vulnerable passengers (children, elderly) are involved.',
    lastUpdated: '2025-12-05',
    status: 'Draft',
    version: 'v1.0',
    updatedBy: 'Safety Officer',
    applicableConditions: [
      'Caller reports children or elderly passengers are present',
      'Vehicle profile indicates frequent transport of vulnerable individuals'
    ],
    triggerConditions: [
      'Any SOS trigger where vulnerable passengers are confirmed or highly suspected'
    ],
    procedureSteps: [
      'Confirm the presence, number, and ages of vulnerable passengers.',
      'Assess their specific medical conditions or injuries.',
      'Prioritize ambulance dispatch and notify them of pediatric or geriatric patients.',
      'Provide age-appropriate calming instructions to the caller.',
      'If the driver is incapacitated, attempt to communicate simply and calmly with any conscious children or elderly passengers.'
    ],
    keyQuestions: [
      'How many children/elderly are in the vehicle?',
      'What are their ages?',
      'Are they secured in car seats (for children)?',
      'Do they have any specific medical needs?'
    ],
    dispatchRecommendations: [
      'Ambulance: Required (Notify of vulnerable patients)',
      'Police: Recommended (Assistance with vulnerable individuals)'
    ],
    escalationRules: [
      'Vulnerable passenger is injured or unresponsive',
      'Extreme weather conditions (heat/cold) pose a risk to vulnerable passengers'
    ],
    notesWarnings: [
      'Children and elderly are more susceptible to shock and temperature extremes.',
      'Ensure responding units are aware of the patient demographics.'
    ],
    checklist: [
      'Confirm presence of vulnerable passengers',
      'Assess specific injuries/needs',
      'Dispatch ambulance (notify demographics)',
      'Provide calming instructions',
      'Monitor for environmental risks (heat/cold)'
    ]
  }
];
