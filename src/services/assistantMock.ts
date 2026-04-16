import { mockSOPs } from '../data/mockSOPs';
import { Hospital, Incident, Operator } from '../types';

interface AssistantMockContext {
  hospitals: Hospital[];
  incidents: Incident[];
  operators: Operator[];
}

export async function generateAssistantFallback(
  text: string,
  { incidents, operators, hospitals }: AssistantMockContext,
): Promise<string> {
  let responseContent = "I'm sorry, I couldn't process that request.";
  const lowerText = text.toLowerCase();

  if (lowerText.includes('latest incident') && lowerText.includes('summarize')) {
    const latest = [...incidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    responseContent = `The latest incident is **${latest.incidentId}** (${latest.severity} severity), triggered by ${latest.triggerType} for vehicle ${latest.plateNumber}. It is currently marked as "${latest.status}".`;
  } else if (lowerText.includes('most critical') || lowerText.includes('high severity')) {
    const highSeverity = incidents.filter((i) => i.severity === 'high' && !['Resolved', 'Closed'].includes(i.status));
    if (highSeverity.length > 0) {
      responseContent = `There are ${highSeverity.length} critical active incidents. The most recent is **${highSeverity[0].incidentId}** (Vehicle: ${highSeverity[0].plateNumber}), currently ${highSeverity[0].status}.`;
    } else {
      responseContent = 'There are currently no active high-severity incidents.';
    }
  } else if (lowerText.includes('sop') || lowerText.includes('procedure')) {
    const activeIncidents = incidents.filter((i) => !['Resolved', 'Closed'].includes(i.status));
    if (activeIncidents.length > 0) {
      const inc = activeIncidents[0];
      let foundSOP = null;
      if (inc.triggerType === 'automatic' && inc.passengerCondition?.toLowerCase().includes('unconscious')) {
        foundSOP = mockSOPs.find((s) => s.id === 'SOP-001');
      } else if (inc.notes?.toLowerCase().includes('trapped')) {
        foundSOP = mockSOPs.find((s) => s.id === 'SOP-002');
      } else if (inc.notes?.toLowerCase().includes('fire') || inc.notes?.toLowerCase().includes('smoke')) {
        foundSOP = mockSOPs.find((s) => s.id === 'SOP-003');
      } else if (inc.triggerType === 'manual' && inc.notes?.toLowerCase().includes('medical')) {
        foundSOP = mockSOPs.find((s) => s.id === 'SOP-004');
      } else if (inc.passengerCondition?.toLowerCase().includes('child') || inc.passengerCondition?.toLowerCase().includes('elderly')) {
        foundSOP = mockSOPs.find((s) => s.id === 'SOP-006');
      } else if (inc.triggerType === 'automatic') {
        foundSOP = mockSOPs.find((s) => s.id === 'SOP-005');
      }

      if (foundSOP) {
        responseContent = `For the active incident **${inc.incidentId}**, I recommend following **${foundSOP.title}** (${foundSOP.id}). This is a ${foundSOP.priorityLevel} priority procedure. You can view the full checklist in the Emergency SOP Center.`;
      } else {
        responseContent = `I could not determine a specific SOP for incident **${inc.incidentId}**. Please review the incident details manually or consult the SOP Center.`;
      }
    } else {
      responseContent = 'There are no active incidents requiring SOP recommendations at the moment.';
    }
  } else if (lowerText.includes('nearest hospital')) {
    const activeIncidents = incidents.filter((i) => !['Resolved', 'Closed'].includes(i.status));
    if (activeIncidents.length > 0) {
      const inc = activeIncidents[0];
      const hosp = hospitals[0];
      responseContent = `For the active incident **${inc.incidentId}**, the nearest recommended hospital is **${hosp.name}** (approx. 3.2 km away).`;
    } else {
      responseContent = 'There are no active incidents requiring hospital routing at the moment.';
    }
  } else if (lowerText.includes('repeated incidents')) {
    responseContent = 'Vehicle **VAA 8899** has triggered 2 eCall alerts in the past 30 days. I recommend flagging this vehicle for maintenance review.';
  } else if (lowerText.includes('overloaded') || lowerText.includes('workload')) {
    const busyOperators = [...operators].sort((a, b) => b.activeIncidents - a.activeIncidents);
    if (busyOperators.length > 0 && busyOperators[0].activeIncidents > 2) {
      responseContent = `Operator **${busyOperators[0].name}** is currently handling ${busyOperators[0].activeIncidents} active incidents. Consider reassigning new cases to available dispatchers.`;
    } else {
      responseContent = 'Operator workload is currently balanced. No operators are critically overloaded.';
    }
  } else if (lowerText.includes('report') && lowerText.includes('resolved')) {
    const resolved = incidents.filter((i) => i.status === 'Resolved' || i.status === 'Closed');
    if (resolved.length > 0) {
      const res = resolved[0];
      responseContent = `**Incident Report: ${res.incidentId}**\n- **Vehicle:** ${res.plateNumber}\n- **Severity:** ${res.severity}\n- **Trigger:** ${res.triggerType}\n- **Status:** ${res.status}\n\n*Summary:* The incident was successfully handled and emergency services were dispatched. The case is now closed.`;
    } else {
      responseContent = 'No recently resolved incidents found to generate a report.';
    }
  } else {
    responseContent =
      'I can help you summarize incidents, check operator workload, recommend SOPs, and find nearest hospitals. Please ask a specific operations question.';
  }

  return responseContent;
}
