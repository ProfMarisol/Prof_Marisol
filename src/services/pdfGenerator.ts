import { jsPDF } from 'jspdf';
import { ModulePage, StudentSubmission, User } from '../types';

export function generateSubmissionPDF(
  module: ModulePage,
  submission: StudentSubmission,
  student: User
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Theme Colors
  const primaryColor = [79, 70, 229]; // Indigo #4f46e5
  const secondaryColor = [30, 41, 59]; // Slate 800
  const lightBg = [248, 250, 252]; // Slate 50
  const successColor = [16, 185, 129]; // Emerald #10b981
  const dangerColor = [239, 68, 68]; // Rose #ef4444

  // Top header banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AULAVIRTUAL · CENTRO EDUCATIVO', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Certificado Oficial de Entrega y Evaluación', margin, 19);

  const formattedDate = new Date(submission.submittedAt).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.text(`Fecha: ${formattedDate}`, pageWidth - margin, 19, { align: 'right' });

  // Student & Module Card Box
  let currentY = 34;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 38, 3, 3, 'FD');

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DATOS DEL ALUMNO/A', margin + 5, currentY + 7);
  doc.text('ACTIVIDAD ACADÉMICA', margin + (contentWidth / 2) + 5, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nombre: ${student.name}`, margin + 5, currentY + 14);
  doc.text(`Usuario: ${student.username}`, margin + 5, currentY + 20);
  doc.text(`Grupo/Curso: ${student.gradeGroup || 'General'}`, margin + 5, currentY + 26);

  doc.text(`Título: ${module.title.substring(0, 36)}${module.title.length > 36 ? '...' : ''}`, margin + (contentWidth / 2) + 5, currentY + 14);
  doc.text(`Asignatura: ${module.subject}`, margin + (contentWidth / 2) + 5, currentY + 20);
  doc.text(`Docente: ${module.author}`, margin + (contentWidth / 2) + 5, currentY + 26);
  doc.text(`ID Entrega: ${submission.id}`, margin + (contentWidth / 2) + 5, currentY + 32);

  // Score Badge Banner
  currentY += 44;
  const isPassed = submission.percentage >= 50;
  const scoreBadgeBg = isPassed ? [236, 253, 245] : [254, 242, 242];
  const scoreBadgeBorder = isPassed ? [167, 243, 208] : [254, 202, 202];
  const scoreTextColor = isPassed ? [6, 95, 70] : [153, 27, 27];

  doc.setFillColor(scoreBadgeBg[0], scoreBadgeBg[1], scoreBadgeBg[2]);
  doc.setDrawColor(scoreBadgeBorder[0], scoreBadgeBorder[1], scoreBadgeBorder[2]);
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

  doc.setTextColor(scoreTextColor[0], scoreTextColor[1], scoreTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const statusLabel = isPassed ? 'ACTIVIDAD SUPERADA' : 'NO SUPERADA';
  doc.text(`PUNTUACIÓN: ${submission.score} / ${submission.maxScore} pts  (${submission.percentage}%)`, margin + 8, currentY + 13);
  doc.setFontSize(11);
  doc.text(statusLabel, pageWidth - margin - 8, currentY + 13, { align: 'right' });

  // Breakdown of Exercises
  currentY += 28;
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DESGLOSE DE EJERCICIOS Y RESPUESTAS', margin, currentY);

  currentY += 6;
  const exercises = module.exercises || [];

  if (exercises.length === 0) {
    // If it was an interactive HTML practice without separate questions
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 24, 1.5, 1.5, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Práctica Interactiva Completada', margin + 8, currentY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('El alumno ha completado la simulación/laboratorio web de este módulo.', margin + 8, currentY + 17);
    currentY += 30;
  } else {
    exercises.forEach((ex, idx) => {
      // Check if we need a new page
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = 20;
      }

      const studentAnswer = submission.answers[ex.id];
      let isCorrect = false;
      let studentAnsText = 'Sin responder';

      if (ex.type === 'multiple-choice') {
        const selectedIdx = Number(studentAnswer);
        const opt = ex.options?.[selectedIdx];
        studentAnsText = opt || (studentAnswer !== undefined ? `Opción #${selectedIdx + 1}` : 'Sin responder');
        isCorrect = String(studentAnswer) === String(ex.correctAnswer);
      } else if (ex.type === 'true-false') {
        const isTrue = String(studentAnswer) === 'true';
        studentAnsText = studentAnswer !== undefined ? (isTrue ? 'Verdadero' : 'Falso') : 'Sin responder';
        isCorrect = String(studentAnswer) === String(ex.correctAnswer);
      } else if (ex.type === 'fill-blank' || ex.type === 'short-answer') {
        studentAnsText = String(studentAnswer || '—');
        const cleanExpected = String(ex.correctAnswer || '').trim().toLowerCase();
        const cleanStudent = studentAnsText.trim().toLowerCase();
        isCorrect = cleanExpected.length > 0 && cleanStudent === cleanExpected;
      } else if (ex.type === 'open-question') {
        studentAnsText = String(studentAnswer || '—');
        isCorrect = studentAnsText.trim().length > 10;
      }

      // Exercise box
      const boxHeight = 22;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

      // Status indicator bullet
      doc.setFillColor(isCorrect ? successColor[0] : dangerColor[0], isCorrect ? successColor[1] : dangerColor[1], isCorrect ? successColor[2] : dangerColor[2]);
      doc.circle(margin + 5, currentY + 7, 2.5, 'F');

      // Prompt
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const qTitle = `${idx + 1}. ${ex.prompt.substring(0, 75)}${ex.prompt.length > 75 ? '...' : ''}`;
      doc.text(qTitle, margin + 11, currentY + 8);

      // Student answer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tu respuesta: `, margin + 11, currentY + 16);

      doc.setTextColor(isCorrect ? 16 : 220, isCorrect ? 149 : 38, isCorrect ? 106 : 38);
      doc.setFont('helvetica', 'bold');
      doc.text(`${studentAnsText.substring(0, 48)} (${isCorrect ? 'Correcta' : 'Incorrecta'})`, margin + 30, currentY + 16);

      // Points earned
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`${isCorrect ? ex.points : 0} / ${ex.points} pts`, pageWidth - margin - 5, currentY + 16, { align: 'right' });

      currentY += boxHeight + 4;
    });
  }

  // Footer Seal / Stamp
  if (currentY > pageHeight - 30) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY = Math.max(currentY + 6, pageHeight - 26);
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento oficial generado por AulaVirtual · Registrado en GitHub y Almacenamiento Local', margin, currentY + 5);
  doc.text(`Alumno: ${student.username} (${student.name})`, pageWidth - margin, currentY + 5, { align: 'right' });

  // Sanitize filename
  const cleanSlug = (module.slug || module.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanStudentName = student.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Entrega_${cleanStudentName}_${cleanSlug}.pdf`;

  doc.save(fileName);
}
