import { jsPDF } from 'jspdf'

type PrescriptionData = {
  prescription_id: string
  patient: {
    first_name: string
    last_name: string
    date_of_birth: string
    phone: string
  }
  doctor: {
    full_name: string
  }
  clinic: {
    name: string
    address?: string
    phone?: string
  }
  medications: Array<{
    name: string
    dosage: string
    frequency: string
    duration?: string
    instructions?: string
  }>
  instructions?: string
  valid_until?: string
  created_at: string
}

export function generatePrescriptionPDF(data: PrescriptionData): ArrayBuffer {
  const doc = new jsPDF()
  let yPosition = 20

  // Helper function to add text with automatic line breaks
  const addText = (text: string, x: number, y: number, maxWidth?: number) => {
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth)
      doc.text(lines, x, y)
      return y + (lines.length * 7) // Return new Y position
    }
    doc.text(text, x, y)
    return y + 7
  }

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  yPosition = addText('PRESCRIPTION', 105, yPosition)
  yPosition += 5

  // Clinic Information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  yPosition = addText(data.clinic.name, 105, yPosition)
  if (data.clinic.address) {
    doc.setFontSize(10)
    yPosition = addText(data.clinic.address, 105, yPosition)
  }
  if (data.clinic.phone) {
    yPosition = addText(`Tel: ${data.clinic.phone}`, 105, yPosition)
  }
  yPosition += 10

  // Draw line separator
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 10

  // Patient Information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  yPosition = addText('Patient Information', 20, yPosition)
  yPosition += 2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  yPosition = addText(`Name: ${data.patient.first_name} ${data.patient.last_name}`, 20, yPosition)
  yPosition = addText(`Date of Birth: ${new Date(data.patient.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, yPosition)
  yPosition = addText(`Phone: ${data.patient.phone}`, 20, yPosition)
  yPosition += 5

  // Doctor Information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  yPosition = addText('Prescribed By', 20, yPosition)
  yPosition += 2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  yPosition = addText(`Dr. ${data.doctor.full_name}`, 20, yPosition)
  yPosition = addText(`Date: ${new Date(data.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, yPosition)
  yPosition += 10

  // Draw line separator
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 10

  // Medications Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  yPosition = addText('Rx - Medications', 20, yPosition)
  yPosition += 5

  // Medications List
  doc.setFontSize(10)
  data.medications.forEach((med, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFont('helvetica', 'bold')
    yPosition = addText(`${index + 1}. ${med.name}`, 20, yPosition)

    doc.setFont('helvetica', 'normal')
    yPosition = addText(`   Dosage: ${med.dosage}`, 20, yPosition)
    yPosition = addText(`   Frequency: ${med.frequency}`, 20, yPosition)

    if (med.duration) {
      yPosition = addText(`   Duration: ${med.duration}`, 20, yPosition)
    }

    if (med.instructions) {
      yPosition = addText(`   Instructions: ${med.instructions}`, 20, yPosition, 170)
    }

    yPosition += 3
  })

  yPosition += 5

  // General Instructions
  if (data.instructions) {
    // Check if we need a new page
    if (yPosition > 230) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFont('helvetica', 'bold')
    yPosition = addText('General Instructions:', 20, yPosition)
    yPosition += 2

    doc.setFont('helvetica', 'normal')
    yPosition = addText(data.instructions, 20, yPosition, 170)
    yPosition += 5
  }

  // Valid Until
  if (data.valid_until) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    yPosition = addText(
      `This prescription is valid until: ${new Date(data.valid_until).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      20,
      yPosition
    )
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Prescription ID: ${data.prescription_id}`, 20, 285)
    doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' })
    doc.text('This is a computer-generated prescription', 105, 290, { align: 'center' })
  }

  // Return PDF as ArrayBuffer
  return doc.output('arraybuffer') as ArrayBuffer
}
