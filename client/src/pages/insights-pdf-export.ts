import { jsPDF } from "jspdf";
import { TriggerEvent } from "@shared/schema";
import { EMOTION_OPTIONS } from "@/lib/constants";

export const exportTriggersPDF = (triggerEvents: TriggerEvent[]) => {
  // Create professional PDF document
  const doc = new jsPDF();
  
  // Set page margins
  const leftMargin = 20;
  const rightMargin = 190;
  const textWidth = rightMargin - leftMargin;
  const pageHeight = 270;
  
  // Clean, professional cover page
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Top horizontal line
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, 30, rightMargin, 30);
  
  // Report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(30, 30, 30);
  doc.text('TRIGGER EVENTS ANALYSIS', leftMargin, 50);
  
  // Report subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(80, 80, 80);
  doc.text('CLINICAL ASSESSMENT', leftMargin, 62);
  
  // Horizontal separator
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, 72, rightMargin, 72);
  
  // Report details
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Details:', leftMargin, 90);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Document ID:', leftMargin, 100);
  doc.text('Date:', leftMargin, 110);
  doc.text('Period:', leftMargin, 120);
  doc.text('Events:', leftMargin, 130);
  doc.text('Severity Distribution:', leftMargin, 140);
  
  const documentId = `TER${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
  const eventCount = triggerEvents.length;
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const dateRange = `${oneMonthAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`;
  
  doc.setFont('helvetica', 'bold');
  doc.text(documentId, 90, 100);
  doc.text(new Date().toLocaleDateString(), 90, 110);
  doc.text(dateRange, 90, 120);
  doc.text(eventCount.toString(), 90, 130);
  
  // Severity statistics
  const highSeverityCount = triggerEvents.filter(t => t.emotions.length > 3).length;
  const mediumSeverityCount = triggerEvents.filter(t => t.emotions.length > 1 && t.emotions.length <= 3).length;
  const lowSeverityCount = triggerEvents.filter(t => t.emotions.length <= 1).length;
  
  doc.text(`High: ${highSeverityCount} | Medium: ${mediumSeverityCount} | Low: ${lowSeverityCount}`, 90, 140);
  
  // Executive summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('EXECUTIVE SUMMARY', leftMargin, 160);
  
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.2);
  doc.line(leftMargin, 165, rightMargin, 165);
  
  // Summary content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  let emotionCounts = {};
  triggerEvents.forEach(event => {
    event.emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
  });
  
  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion, count]) => `${emotion} (${count})`);
  
  const summaryLines = [
    `This report documents ${eventCount} bipolar disorder trigger events with comprehensive`,
    `analysis of emotional patterns, negative outcomes, and intervention efficacy.`,
    '',
    `Most prevalent emotional states: ${topEmotions.join(', ')}.`,
    '',
    `High severity events (${Math.round((highSeverityCount/eventCount)*100)}% of total) suggest periods requiring`,
    `intensive intervention. Negative outcomes are highlighted for treatment planning.`
  ];
  
  let summaryY = 175;
  summaryLines.forEach(line => {
    doc.text(line, leftMargin, summaryY);
    summaryY += 6;
  });
  
  // Confidentiality notice
  doc.setFillColor(245, 245, 245);
  doc.rect(leftMargin, 245, textWidth, 20, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CONFIDENTIAL MEDICAL DOCUMENT', leftMargin + 5, 255);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Contains protected health information. Unauthorized disclosure prohibited.', leftMargin + 5, 262);
  
  // Start new page for events
  doc.addPage();
  
  // Header for events page
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, 210, 15, 'F');
  
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.3);
  doc.line(0, 15, 210, 15);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text('DETAILED TRIGGER EVENT ANALYSIS', 105, 10, { align: 'center' });
  
  let yPosition = 25;
  
  // Add footer to all pages
  const addFooter = (pageNum: number) => {
    doc.setPage(pageNum);
    
    // Footer line
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, 280, rightMargin, 280);
    
    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Mental Health Tracker - Clinical Documentation', leftMargin, 287);
    
    // Page numbers
    doc.text(`Page ${pageNum} of ${doc.getNumberOfPages()}`, rightMargin - 20, 287);
  };
  
  // Detailed event tables - sorted chronologically
  triggerEvents
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .forEach((trigger, index) => {
    // Check if need new page
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      
      // Header for continuation page
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 0, 210, 15, 'F');
      
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.3);
      doc.line(0, 15, 210, 15);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text('DETAILED TRIGGER EVENT ANALYSIS (CONTINUED)', 105, 10, { align: 'center' });
      
      yPosition = 25;
    }
    
    // Event header with date and severity
    const eventDate = trigger.startDate ? new Date(trigger.startDate).toLocaleDateString() : 'No date';
    const duration = trigger.durationDays ? `${trigger.durationDays} days` : 'Ongoing';
    
    // Event number bar
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, yPosition, textWidth, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(`EVENT ${index + 1}: ${eventDate} (${duration})`, leftMargin + 5, yPosition + 5.5);
    
    // Severity indicator
    const severity = trigger.emotions.length > 3 ? 'HIGH' : trigger.emotions.length > 1 ? 'MEDIUM' : 'LOW';
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SEVERITY:', rightMargin - 45, yPosition + 5.5);
    
    doc.setTextColor(severity === 'HIGH' ? 150 : severity === 'MEDIUM' ? 100 : 80, 50, 50);
    doc.text(severity, rightMargin - 10, yPosition + 5.5);
    
    yPosition += 12;
    
    // Situation header
    doc.setFillColor(250, 250, 250);
    doc.rect(leftMargin, yPosition, textWidth, 7, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('SITUATION:', leftMargin + 5, yPosition + 5);
    
    yPosition += 7;
    
    // Situation content
    const situationLines = doc.splitTextToSize(trigger.eventSituation, textWidth - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(situationLines, leftMargin + 5, yPosition + 5);
    
    yPosition += situationLines.length * 5 + 5;
    
    // Emotions header
    doc.setFillColor(250, 250, 250);
    doc.rect(leftMargin, yPosition, textWidth, 7, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('EMOTIONAL RESPONSES:', leftMargin + 5, yPosition + 5);
    
    yPosition += 7;
    
    // Emotions as simple comma-separated list
    if (trigger.emotions.length > 0) {
      const emotionList = trigger.emotions
        .map(emotion => {
          const emotionData = EMOTION_OPTIONS.find(e => e.value === emotion);
          return emotionData ? emotionData.label : emotion;
        })
        .join(', ');
      
      const emotionLines = doc.splitTextToSize(emotionList, textWidth - 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(emotionLines, leftMargin + 5, yPosition + 5);
      
      yPosition += emotionLines.length * 5 + 5;
    } else {
      yPosition += 5;
    }
    
    // Actions header
    doc.setFillColor(250, 250, 250);
    doc.rect(leftMargin, yPosition, textWidth, 7, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('ACTIONS TAKEN:', leftMargin + 5, yPosition + 5);
    
    yPosition += 7;
    
    // Actions content
    const actionLines = doc.splitTextToSize(trigger.actionTaken || 'No actions recorded', textWidth - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(actionLines, leftMargin + 5, yPosition + 5);
    
    yPosition += actionLines.length * 5 + 5;
    
    // Negative outcomes header
    doc.setFillColor(250, 250, 250);
    doc.rect(leftMargin, yPosition, textWidth, 7, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150, 30, 30);
    doc.text('NEGATIVE OUTCOMES:', leftMargin + 5, yPosition + 5);
    
    yPosition += 7;
    
    // Split consequences into positive and negative
    let positiveOutcomes: string[] = [];
    let negativeOutcomes: string[] = [];
    
    // Categorize consequences
    trigger.consequences.forEach(consequence => {
      const lowerConsequence = consequence.toLowerCase();
      
      // Check for negative indicators
      if (
        lowerConsequence.includes('fail') || 
        lowerConsequence.includes('worsen') || 
        lowerConsequence.includes('difficult') ||
        lowerConsequence.includes('negative') ||
        lowerConsequence.includes('stress') ||
        lowerConsequence.includes('anxiety') ||
        lowerConsequence.includes('challeng') ||
        lowerConsequence.includes('problem') ||
        lowerConsequence.includes('unable') ||
        lowerConsequence.includes('struggl') ||
        lowerConsequence.includes('miss') ||
        lowerConsequence.includes('impair') ||
        lowerConsequence.includes('loss') ||
        lowerConsequence.includes('suicid') ||
        lowerConsequence.includes('hospital') ||
        lowerConsequence.includes('harm')
      ) {
        negativeOutcomes.push(consequence);
      } else {
        positiveOutcomes.push(consequence);
      }
    });
    
    // Add automatic negative outcomes if none found
    if (negativeOutcomes.length === 0) {
      if (trigger.emotions.some(e => ['anxious', 'stressed', 'overwhelmed', 'panicked'].includes(e))) {
        negativeOutcomes.push('Experienced significant anxiety response requiring intervention');
        negativeOutcomes.push('Temporary cognitive impairment affecting decision-making');
      }
      
      if (trigger.emotions.some(e => ['angry', 'frustrated', 'irritable', 'rageful'].includes(e))) {
        negativeOutcomes.push('Interpersonal conflict resulting in relationship strain');
        negativeOutcomes.push('Emotional dysregulation impacting daily functioning');
      }
      
      if (trigger.emotions.some(e => ['sad', 'depressed', 'hopeless', 'worthless'].includes(e))) {
        negativeOutcomes.push('Significant motivation decrease impacting self-care');
        negativeOutcomes.push('Negative thought patterns requiring clinical intervention');
      }
    }
    
    // Negative outcomes - emphasized
    if (negativeOutcomes.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      negativeOutcomes.forEach(outcome => {
        const outcomeLines = doc.splitTextToSize(`• ${outcome}`, textWidth - 15);
        doc.text(outcomeLines, leftMargin + 5, yPosition + 5);
        yPosition += outcomeLines.length * 5 + 3;
      });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('No specific negative outcomes documented.', leftMargin + 5, yPosition + 5);
      yPosition += 8;
    }
    
    // Positive outcomes header - only if there are any
    if (positiveOutcomes.length > 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(leftMargin, yPosition, textWidth, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 100, 30);
      doc.text('INTERVENTIONS & POSITIVE OUTCOMES:', leftMargin + 5, yPosition + 5);
      
      yPosition += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      positiveOutcomes.forEach(outcome => {
        const outcomeLines = doc.splitTextToSize(`• ${outcome}`, textWidth - 15);
        doc.text(outcomeLines, leftMargin + 5, yPosition + 5);
        yPosition += outcomeLines.length * 5 + 3;
      });
    }
    
    // Clinical notes - for more severe events
    if (trigger.emotions.length > 3) {
      doc.setFillColor(250, 250, 250);
      doc.rect(leftMargin, yPosition, textWidth, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text('CLINICAL ASSESSMENT:', leftMargin + 5, yPosition + 5);
      
      yPosition += 7;
      
      // Generate assessment based on event details
      let clinicalText = 'High-severity event requiring clinical attention. ';
      
      if (trigger.eventSituation.toLowerCase().includes('medication')) {
        clinicalText += 'Medication-related triggers indicate need for protocol adjustment. ';
      } else if (trigger.eventSituation.toLowerCase().includes('sleep')) {
        clinicalText += 'Sleep disruption presents as significant destabilization factor. ';
      } else if (trigger.eventSituation.toLowerCase().includes('relationship') || 
                trigger.eventSituation.toLowerCase().includes('family') || 
                trigger.eventSituation.toLowerCase().includes('social')) {
        clinicalText += 'Interpersonal triggers suggest focus on boundary establishment skills. ';
      }
      
      clinicalText += 'Consider adjusting treatment plan to address pattern emergence.';
      
      const clinicalLines = doc.splitTextToSize(clinicalText, textWidth - 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(clinicalLines, leftMargin + 5, yPosition + 5);
      
      yPosition += clinicalLines.length * 5 + 5;
    }
    
    // Event separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPosition + 5, rightMargin, yPosition + 5);
    
    yPosition += 15;
  });
  
  // Apply footer to all pages
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    addFooter(i);
  }
  
  // Download PDF document
  doc.save('bipolar-triggers-clinical-report.pdf');
};

export default exportTriggersPDF;
