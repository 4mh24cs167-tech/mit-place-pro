'use client';

import React, { useRef, useState, useEffect } from 'react';
import { InternshipPermission } from '@/types';
import { Printer, Download, Loader2, X, AlertTriangle } from 'lucide-react';

interface PrintableFormProps {
  form: InternshipPermission;
}

export default function PrintableForm({ form }: PrintableFormProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);

  useEffect(() => {
    setShowInstruction(true);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const studentName = form.student?.fullName || 'Student';
      const filename = `Internship_Permission_${studentName.replace(/\s+/g, '_')}_${form.companyName.replace(/\s+/g, '_')}.pdf`;
      await html2pdf()
        .set({
          margin: [6, 8, 6, 8],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css'] },
        })
        .from(printRef.current)
        .save();
    } catch {
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const CB = ({ checked, label }: { checked: boolean; label: string }) => (
    <span style={{ marginRight: 10, whiteSpace: 'nowrap', fontSize: 10 }}>
      <span>{checked ? '☑' : '☐'}</span>
      <span style={{ marginLeft: 2 }}>{label}</span>
    </span>
  );

  const docs = form.documentsChecklist || [];
  const docLabels = [
    'Internship Offer Letter / Appointment Letter issued by the Company',
    'Internship Confirmation Email / Screenshot of confirmation',
    'Internship Job Description / Role Description, if available',
    'Company-issued joining instructions, if available',
    'NOC / Permission document, if applicable',
    'Any other supporting document from the Company',
  ];

  // Shared table cell styles — compact
  const th: React.CSSProperties = { padding: '2px 5px', border: '1px solid #888', fontWeight: 600, width: '38%', verticalAlign: 'top', fontSize: 10 };
  const td: React.CSSProperties = { padding: '2px 5px', border: '1px solid #888', fontSize: 10 };
  const secHead: React.CSSProperties = { fontSize: 10, fontWeight: 'bold', background: '#d1d5db', padding: '2px 5px', marginBottom: 2, textTransform: 'uppercase' as const };

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #printable-form, #printable-form * { visibility: visible; }
          #printable-form { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          @page { size: A4; margin: 10mm 12mm; }
        }
      `}} />

      {/* ═══ PRINT INSTRUCTION POPUP ═══ */}
      {showInstruction && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 440, width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setShowInstruction(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#fef3c7', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} style={{ color: '#d97706' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Print Instructions</h3>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: '#92400e' }}>
                <li>Print this form in <strong style={{ color: '#b45309' }}>COLOUR</strong> (not black & white)</li>
                <li>Print on a <strong style={{ color: '#b45309' }}>single sheet</strong> — front and back</li>
                <li>Use <strong style={{ color: '#b45309' }}>duplex printing</strong> (flip on long edge)</li>
                <li><strong>Page 1</strong> = Front &nbsp;|&nbsp; <strong>Page 2</strong> = Back</li>
              </ul>
            </div>
            <button onClick={() => setShowInstruction(false)} style={{ width: '100%', padding: '10px 0', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Got it, continue
            </button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="no-print" style={{ padding: '12px 16px', background: '#f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1f2937', margin: 0 }}>Print Preview</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowInstruction(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f59e0b', color: '#fff', padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            <AlertTriangle size={16} /> Instructions
          </button>
          <button onClick={handleDownload} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, opacity: downloading ? 0.6 : 1 }}>
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563eb', color: '#fff', padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* ═══════════ PRINTABLE DOCUMENT ═══════════ */}
      <div id="printable-form" ref={printRef} style={{ maxWidth: 780, margin: '0 auto', fontFamily: "'Times New Roman', Times, serif", color: '#000', background: '#fff', fontSize: 10, lineHeight: 1.35 }}>

        {/* ═══════ PAGE 1 — FRONT ═══════ */}
        <div style={{ padding: '14px 20px 8px' }}>

          {/* College Header */}
          <div style={{ textAlign: 'center', marginBottom: 8, borderBottom: '2px solid #000', paddingBottom: 6 }}>
            <h1 style={{ fontSize: 15, fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: 0.8 }}>
              Maharaja Institute of Technology Mysore
            </h1>
            <p style={{ fontSize: 9, margin: '1px 0 0', color: '#333' }}>
              Belawadi, Srirangapatna Taluk, Mandya District, Karnataka – 571477
            </p>
            <p style={{ fontSize: 8.5, margin: '0', color: '#555' }}>
              (An Autonomous Institution | Affiliated to VTU, Belagavi | Approved by AICTE, New Delhi)
            </p>
            <h2 style={{ fontSize: 11.5, fontWeight: 'bold', marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              External Internship Permission &amp; Registration Form
            </h2>
            <p style={{ fontSize: 8, fontStyle: 'italic', margin: '1px 0 0' }}>
              (To be submitted by Final Year Students BEFORE joining an external internship)
            </p>
          </div>

          {/* SECTION A */}
          <div style={{ marginBottom: 6 }}>
            <h3 style={secHead}>A. Student Basic Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={th}>Name</td><td style={td}>{form.student?.fullName || ''}</td></tr>
                <tr><td style={th}>USN</td><td style={td}>{form.student?.usn || ''}</td></tr>
                <tr><td style={th}>Branch</td><td style={td}>{form.student?.department || ''}</td></tr>
                <tr><td style={th}>Student Mobile Number</td><td style={td}>{form.student?.phone || ''}</td></tr>
                <tr><td style={th}>Personal Email ID</td><td style={td}>{form.student?.email || ''}</td></tr>
                <tr><td style={th}>Mentor Name</td><td style={td}>{form.mentorName || ''}</td></tr>
              </tbody>
            </table>
          </div>

          {/* SECTION B */}
          <div style={{ marginBottom: 6 }}>
            <h3 style={secHead}>B. External Internship Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={th}>Name of Company / Organization</td><td style={td}>{form.companyName}</td></tr>
                <tr><td style={th}>Company Website</td><td style={td}>{form.companyWebsite || ''}</td></tr>
                <tr><td style={th}>Company Address</td><td style={td}>{form.companyAddress || ''}</td></tr>
                <tr><td style={th}>Internship Domain / Area</td><td style={td}>{form.internshipDomain}</td></tr>
                <tr><td style={th}>Internship Role / Designation</td><td style={td}>{form.internshipRole}</td></tr>
                <tr><td style={th}>Internship Project / Work Title</td><td style={td}>{form.projectTitle || ''}</td></tr>
                <tr><td style={th}>Internship Start Date</td><td style={td}>{form.startDate}</td></tr>
                <tr><td style={th}>Internship End Date</td><td style={td}>{form.endDate}</td></tr>
                <tr><td style={th}>Total Duration</td><td style={td}>{form.totalDuration}</td></tr>
                <tr><td style={th}>Mode of Internship</td><td style={td}>
                  <CB checked={form.mode === 'on-site'} label="On-site" />
                  <CB checked={form.mode === 'remote'} label="Remote / Online" />
                  <CB checked={form.mode === 'hybrid'} label="Hybrid" />
                </td></tr>
                <tr><td style={th}>Place of Internship / Work Location</td><td style={td}>{form.workLocation || ''}</td></tr>
                <tr><td style={th}>Expected Working Hours / Schedule</td><td style={td}>{form.workingHours || ''}</td></tr>
                <tr><td style={th}>Is the internship related to your academic branch?</td><td style={td}>
                  <CB checked={form.isRelatedToBranch === 'yes'} label="Yes" />
                  <CB checked={form.isRelatedToBranch === 'no'} label="No" />
                  <CB checked={form.isRelatedToBranch === 'partially'} label="Partially" />
                </td></tr>
              </tbody>
            </table>
          </div>

          {/* SECTION C */}
          <div style={{ marginBottom: 6 }}>
            <h3 style={secHead}>C. Internship Opportunity Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={th}>How was the internship opportunity obtained?</td><td style={td}>
                  <CB checked={form.opportunitySource === 'on-campus'} label="On-Campus" />
                  <CB checked={form.opportunitySource === 'off-campus'} label="Off-Campus" />
                  <CB checked={form.opportunitySource === 'faculty'} label="Faculty" />
                  <CB checked={form.opportunitySource === 'alumni'} label="Alumni" />
                  <CB checked={form.opportunitySource === 'self'} label="Self" />
                  <CB checked={form.opportunitySource === 'portal'} label="Portal" />
                  <CB checked={form.opportunitySource === 'other'} label="Other" />
                </td></tr>
                <tr><td style={th}>Facilitated by the College?</td><td style={td}>
                  <CB checked={form.facilitatedByCollege === true} label="Yes" />
                  <CB checked={form.facilitatedByCollege === false} label="No" />
                </td></tr>
                <tr><td style={th}>Source person / reference</td><td style={td}>{form.sourcePerson || ''}</td></tr>
                <tr><td style={th}>Is a stipend provided?</td><td style={td}>
                  <CB checked={form.stipendProvided === true} label="Yes" />
                  <CB checked={form.stipendProvided === false} label="No" />
                </td></tr>
                <tr><td style={th}>Stipend Amount per Month</td><td style={td}>{form.stipendAmount || ''}</td></tr>
                <tr><td style={th}>Other benefits, if any</td><td style={td}>{form.otherBenefits || ''}</td></tr>
                <tr><td style={th}>Possibility of PPO?</td><td style={td}>
                  <CB checked={form.ppoPossible === 'yes'} label="Yes" />
                  <CB checked={form.ppoPossible === 'no'} label="No" />
                  <CB checked={form.ppoPossible === 'not-confirmed'} label="Not Confirmed" />
                </td></tr>
                <tr><td style={th}>PPO details / conditions</td><td style={td}>{form.ppoDetails || ''}</td></tr>
              </tbody>
            </table>
          </div>

          {/* SECTION D */}
          <div style={{ marginBottom: 6 }}>
            <h3 style={secHead}>D. Company / HR / Supervisor Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={th}>HR / Authorized Contact Name</td><td style={td}>{form.hrName || ''}</td></tr>
                <tr><td style={th}>HR Designation</td><td style={td}>{form.hrDesignation || ''}</td></tr>
                <tr><td style={th}>Official HR Email ID</td><td style={td}>{form.hrEmail || ''}</td></tr>
                <tr><td style={th}>HR / Company Contact Number</td><td style={td}>{form.hrPhone || ''}</td></tr>
              </tbody>
            </table>
          </div>

          {/* SECTION E */}
          <div style={{ marginBottom: 4 }}>
            <h3 style={secHead}>E. Documents to be Submitted Before Joining</h3>
            <div style={{ paddingLeft: 4, fontSize: 9.5 }}>
              {docLabels.map((label, i) => (
                <div key={i} style={{ marginBottom: 1 }}>{docs[i] ? '☑' : '☐'} {label}</div>
              ))}
            </div>
            <p style={{ fontSize: 8, fontStyle: 'italic', marginTop: 2, padding: '2px 4px', background: '#f3f4f6', border: '1px solid #d1d5db' }}>
              <strong>Note:</strong> Submit clear, authentic copies of all documents. Offer letter and confirmation should clearly establish the company, role, period and student identity.
            </p>
          </div>

          {/* SECTION F — compact */}
          <div style={{ marginBottom: 4 }}>
            <h3 style={secHead}>F. Student Undertaking / Declaration</h3>
            <ol style={{ paddingLeft: 16, fontSize: 8.5, margin: '0 0 3px', lineHeight: 1.3 }}>
              <li>I declare the information furnished and documents submitted are true, complete and authentic.</li>
              <li>I understand the internship is subject to verification and approval; submission does not constitute automatic permission.</li>
              <li>I will follow the rules and code of conduct of both the College and the Company.</li>
              <li>I will maintain regular attendance and complete the approved duration. Any changes will be informed to the Department.</li>
              <li>I understand the College may contact the Company to verify internship details and performance.</li>
              <li>After completion, I will submit the Internship Completion Certificate duly issued by the Company.</li>
              <li>I will submit the internship report, feedback, evaluation and other prescribed documents within the stipulated time.</li>
              <li>Failure to submit required documents or submission of false information may result in action as per institutional rules.</li>
            </ol>
            <div style={{ paddingLeft: 4, fontSize: 9.5 }}>
              <strong>Declaration:</strong> {form.declarationAccepted ? '☑' : '☐'} I have read, understood and agree to the above undertaking.
            </div>
          </div>

          {/* SECTION G */}
          <div style={{ marginBottom: 4 }}>
            <h3 style={secHead}>G. Request for Permission</h3>
            <p style={{ fontSize: 9, paddingLeft: 4, margin: 0 }}>
              I request the Department to grant me permission to undertake the above-mentioned external internship. I confirm that I will comply with all academic, attendance and institutional requirements.
            </p>
          </div>

          <div style={{ textAlign: 'center', fontSize: 7.5, color: '#888', borderTop: '1px solid #ccc', paddingTop: 3, marginTop: 4 }}>
            Page 1 of 2 — Front | Maharaja Institute of Technology Mysore | External Internship Permission
          </div>
        </div>

        {/* ═══════ PAGE 2 — BACK ═══════ */}
        <div className="page-break" style={{ padding: '14px 20px 8px' }}>

          {/* Mini header for back page */}
          <div style={{ textAlign: 'center', marginBottom: 8, borderBottom: '1.5px solid #000', paddingBottom: 5 }}>
            <h1 style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
              Maharaja Institute of Technology Mysore
            </h1>
            <p style={{ fontSize: 8.5, margin: '1px 0', color: '#333' }}>
              External Internship Permission &amp; Registration Form — <em>Page 2 (Back)</em>
            </p>
          </div>

          {/* SECTION H */}
          <div style={{ marginBottom: 8 }}>
            <h3 style={secHead}>H. Department Verification &amp; Approval – For Office Use Only</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={th}>Documents Verified</td><td style={td}>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Pending</td></tr>
                <tr><td style={th}>Offer Letter Verified</td><td style={td}>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Pending</td></tr>
                <tr><td style={th}>Confirmation Verified</td><td style={td}>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Pending</td></tr>
                <tr><td style={th}>Company / HR Details Verified</td><td style={td}>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Pending</td></tr>
                <tr><td style={th}>Internship Details Verified</td><td style={td}>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Pending</td></tr>
                <tr><td style={th}>Faculty Mentor Recommendation</td><td style={td}>☐ Recommended &nbsp;&nbsp; ☐ Not Recommended &nbsp;&nbsp; ☐ Pending</td></tr>
                <tr><td style={th}>HOD / Department Approval</td><td style={td}>☐ Approved &nbsp;&nbsp; ☐ Not Approved &nbsp;&nbsp; ☐ Pending</td></tr>
                <tr><td style={th}>NOC / Permission Requested</td><td style={td}>☐ Yes &nbsp;&nbsp; ☐ No</td></tr>
                <tr><td style={th}>NOC / Permission Issued</td><td style={td}>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Pending &nbsp;&nbsp; ☐ N/A</td></tr>
                <tr><td style={th}>Attendance / Academic Remarks</td><td style={{...td, height: 28}}></td></tr>
                <tr><td style={th}>Placement / Training Remarks</td><td style={{...td, height: 28}}></td></tr>
                <tr><td style={th}>Final Approval Status</td><td style={td}>☐ Approved &nbsp;&nbsp; ☐ Not Approved &nbsp;&nbsp; ☐ Pending</td></tr>
              </tbody>
            </table>
          </div>

          {/* SECTION I */}
          <div style={{ marginBottom: 10 }}>
            <h3 style={secHead}>I. Signatures &amp; Authorization</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '4px 4px 0' }}>
              {[
                'Student Name & Signature',
                'Faculty Coordinator',
                'Head of the Department (HOD)',
                'Placement / Training Officer',
              ].map((title) => (
                <div key={title} style={{ borderBottom: '1px solid #000', paddingBottom: 3 }}>
                  <div style={{ height: 40 }}></div>
                  <p style={{ fontSize: 9, fontWeight: 600, margin: 0 }}>{title}</p>
                  <p style={{ fontSize: 8, color: '#666', margin: 0 }}>Date: _______________</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION J */}
          <div style={{ marginBottom: 6 }}>
            <h3 style={secHead}>J. Important Post-Internship Requirement</h3>
            <p style={{ fontSize: 9, paddingLeft: 4, marginBottom: 3, marginTop: 2 }}>
              Before the internship is officially completed, the student must submit:
            </p>
            <div style={{ paddingLeft: 4, fontSize: 9.5 }}>
              {[
                'Company HR / Official-issued Internship Completion Certificate',
                'Proof of attendance / participation / completion',
                'Internship Report',
                'Company / HR Evaluation, if required',
                'Student Feedback Form',
                'Any other document prescribed by the College / Department',
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 1 }}>☐ {item}</div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 7.5, color: '#888', borderTop: '1px solid #ccc', paddingTop: 3, marginTop: 6 }}>
            Page 2 of 2 — Back | Maharaja Institute of Technology Mysore | External Internship Permission
          </div>
        </div>
      </div>
    </div>
  );
}
