'use client';

import React, { useRef, useState } from 'react';
import { InternshipPermission } from '@/types';
import { Printer, Download, Loader2 } from 'lucide-react';

interface PrintableFormProps {
  form: InternshipPermission;
}

export default function PrintableForm({ form }: PrintableFormProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

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
          margin: [8, 10, 8, 10],
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
    <span style={{ marginRight: 12, whiteSpace: 'nowrap' }}>
      <span>{checked ? '☑' : '☐'}</span>
      <span style={{ marginLeft: 3 }}>{label}</span>
    </span>
  );

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <tr>
      <td style={{ padding: '3px 6px', border: '1px solid #999', fontWeight: 600, width: '40%', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '3px 6px', border: '1px solid #999' }}>{value || ''}</td>
    </tr>
  );

  const docs = form.documentsChecklist || [];
  const docLabels = [
    'Internship Offer Letter / Internship Appointment Letter issued by the Company',
    'Internship Confirmation Email / Screenshot of confirmation',
    'Internship Job Description / Role Description, if available',
    'Company-issued joining instructions, if available',
    'NOC / Permission document, if applicable',
    'Any other supporting document from the Company',
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #printable-form, #printable-form * { visibility: visible; }
          #printable-form { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          @page { size: A4; margin: 12mm 14mm; }
        }
      `}} />

      {/* Action Bar */}
      <div className="no-print" style={{ padding: 16, background: '#f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>Print Preview</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleDownload} disabled={downloading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#059669', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, opacity: downloading ? 0.6 : 1 }}>
            {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
          <button onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            <Printer size={18} /> Print Form
          </button>
        </div>
      </div>

      {/* ═══════════ PRINTABLE DOCUMENT ═══════════ */}
      <div id="printable-form" ref={printRef} style={{ maxWidth: 800, margin: '0 auto', fontFamily: "'Times New Roman', Times, serif", color: '#000', background: '#fff', fontSize: 11, lineHeight: 1.45 }}>

        {/* ═══════ PAGE 1 — FRONT ═══════ */}
        <div style={{ padding: '20px 24px 10px' }}>

          {/* Print Instruction Banner */}
          <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: 4, padding: '6px 10px', marginBottom: 12, textAlign: 'center', fontSize: 10 }}>
            <strong style={{ color: '#dc2626' }}>⚠ PRINT INSTRUCTION:</strong>{' '}
            <span style={{ color: '#991b1b' }}>This form must be printed in <strong>COLOUR</strong> on a single sheet — <strong>FRONT and BACK</strong> (duplex printing). Page 1 = Front, Page 2 = Back.</span>
          </div>

          {/* College Header */}
          <div style={{ textAlign: 'center', marginBottom: 14, borderBottom: '2px solid #000', paddingBottom: 10 }}>
            <h1 style={{ fontSize: 17, fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: 1 }}>
              Maharaja Institute of Technology Mysore
            </h1>
            <p style={{ fontSize: 10, margin: '2px 0 0', color: '#333' }}>
              Belawadi, Srirangapatna Taluk, Mandya District, Karnataka – 571477
            </p>
            <p style={{ fontSize: 10, margin: '1px 0 0', color: '#555' }}>
              (Affiliated to VTU, Belagavi | Approved by AICTE, New Delhi)
            </p>
            <h2 style={{ fontSize: 13, fontWeight: 'bold', marginTop: 8, textTransform: 'uppercase' }}>
              External Internship Permission &amp; Registration Form
            </h2>
            <p style={{ fontSize: 9, fontStyle: 'italic', margin: '2px 0 0' }}>
              (To be submitted by Final Year Students BEFORE joining an external internship)
            </p>
          </div>

          {/* ── SECTION A ── */}
          <div style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 11, fontWeight: 'bold', background: '#e5e7eb', padding: '3px 6px', marginBottom: 4 }}>A. STUDENT BASIC DETAILS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <tbody>
                <Field label="Name" value={form.student?.fullName} />
                <Field label="USN" value={form.student?.usn} />
                <Field label="Branch" value={form.student?.department} />
                <Field label="Student Mobile Number" value={form.student?.phone} />
                <Field label="Personal Email ID" value={form.student?.email} />
                <Field label="Mentor Name" value={form.mentorName} />
              </tbody>
            </table>
          </div>

          {/* ── SECTION B ── */}
          <div style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 11, fontWeight: 'bold', background: '#e5e7eb', padding: '3px 6px', marginBottom: 4 }}>B. EXTERNAL INTERNSHIP DETAILS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <tbody>
                <Field label="Name of Company / Organization" value={form.companyName} />
                <Field label="Company Website" value={form.companyWebsite} />
                <Field label="Company Address" value={form.companyAddress} />
                <Field label="Internship Domain / Area" value={form.internshipDomain} />
                <Field label="Internship Role / Designation" value={form.internshipRole} />
                <Field label="Internship Project / Work Title" value={form.projectTitle} />
                <Field label="Internship Start Date" value={form.startDate} />
                <Field label="Internship End Date" value={form.endDate} />
                <Field label="Total Duration" value={form.totalDuration} />
                <tr>
                  <td style={{ padding: '3px 6px', border: '1px solid #999', fontWeight: 600, width: '40%' }}>Mode of Internship</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #999' }}>
                    <CB checked={form.mode === 'on-site'} label="On-site" />
                    <CB checked={form.mode === 'remote'} label="Remote / Online" />
                    <CB checked={form.mode === 'hybrid'} label="Hybrid" />
                  </td>
                </tr>
                <Field label="Place of Internship / Work Location" value={form.workLocation} />
                <Field label="Expected Working Hours / Schedule" value={form.workingHours} />
                <tr>
                  <td style={{ padding: '3px 6px', border: '1px solid #999', fontWeight: 600, width: '40%' }}>Is the internship related to your academic branch?</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #999' }}>
                    <CB checked={form.isRelatedToBranch === 'yes'} label="Yes" />
                    <CB checked={form.isRelatedToBranch === 'no'} label="No" />
                    <CB checked={form.isRelatedToBranch === 'partially'} label="Partially" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── SECTION C ── */}
          <div style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 11, fontWeight: 'bold', background: '#e5e7eb', padding: '3px 6px', marginBottom: 4 }}>C. INTERNSHIP OPPORTUNITY DETAILS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 6px', border: '1px solid #999', fontWeight: 600, width: '40%' }}>How was the internship opportunity obtained?</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #999' }}>
                    <CB checked={form.opportunitySource === 'on-campus'} label="On-Campus" />
                    <CB checked={form.opportunitySource === 'off-campus'} label="Off-Campus" />
                    <CB checked={form.opportunitySource === 'faculty'} label="Faculty" />
                    <CB checked={form.opportunitySource === 'alumni'} label="Alumni" />
                    <CB checked={form.opportunitySource === 'self'} label="Self" />
                    <CB checked={form.opportunitySource === 'portal'} label="Internship Portal" />
                    <CB checked={form.opportunitySource === 'other'} label="Other" />
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 6px', border: '1px solid #999', fontWeight: 600 }}>Was the opportunity facilitated by the College / Department?</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #999' }}>
                    <CB checked={form.facilitatedByCollege === true} label="Yes" />
                    <CB checked={form.facilitatedByCollege === false} label="No" />
                  </td>
                </tr>
                <Field label="Name of person / source through whom opportunity was obtained" value={form.sourcePerson} />
                <tr>
                  <td style={{ padding: '3px 6px', border: '1px solid #999', fontWeight: 600 }}>Is a stipend provided?</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #999' }}>
                    <CB checked={form.stipendProvided === true} label="Yes" />
                    <CB checked={form.stipendProvided === false} label="No" />
                  </td>
                </tr>
                <Field label="Stipend Amount per Month (if applicable)" value={form.stipendAmount} />
                <Field label="Other benefits provided by company, if any" value={form.otherBenefits} />
                <tr>
                  <td style={{ padding: '3px 6px', border: '1px solid #999', fontWeight: 600 }}>Is there a possibility of Full-Time Employment / PPO?</td>
                  <td style={{ padding: '3px 6px', border: '1px solid #999' }}>
                    <CB checked={form.ppoPossible === 'yes'} label="Yes" />
                    <CB checked={form.ppoPossible === 'no'} label="No" />
                    <CB checked={form.ppoPossible === 'not-confirmed'} label="Not Confirmed" />
                  </td>
                </tr>
                <Field label="If PPO is possible, mention details/conditions" value={form.ppoDetails} />
              </tbody>
            </table>
          </div>

          {/* ── SECTION D ── */}
          <div style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 11, fontWeight: 'bold', background: '#e5e7eb', padding: '3px 6px', marginBottom: 4 }}>D. COMPANY / HR / INTERNSHIP SUPERVISOR DETAILS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <tbody>
                <Field label="Company HR / Authorized Contact Name" value={form.hrName} />
                <Field label="HR / Authorized Contact Designation" value={form.hrDesignation} />
                <Field label="Official HR Email ID" value={form.hrEmail} />
                <Field label="HR / Company Contact Number" value={form.hrPhone} />
              </tbody>
            </table>
          </div>

          {/* ── SECTION E ── */}
          <div style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 11, fontWeight: 'bold', background: '#e5e7eb', padding: '3px 6px', marginBottom: 4 }}>E. DOCUMENTS TO BE SUBMITTED BEFORE JOINING</h3>
            <div style={{ paddingLeft: 6 }}>
              {docLabels.map((label, i) => (
                <div key={i} style={{ marginBottom: 2 }}>
                  <CB checked={!!docs[i]} label={label} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 9, fontStyle: 'italic', marginTop: 4, padding: '4px 6px', background: '#f9fafb', border: '1px solid #d1d5db' }}>
              <strong>Document submission note:</strong> The student shall submit/upload clear and authentic copies of the above documents along with this form. The offer letter and confirmation evidence should clearly establish the company, role, internship period and student identity wherever applicable.
            </p>
          </div>

          {/* ── SECTION F ── */}
          <div style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 11, fontWeight: 'bold', background: '#e5e7eb', padding: '3px 6px', marginBottom: 4 }}>F. STUDENT UNDERTAKING / DECLARATION</h3>
            <ol style={{ paddingLeft: 18, fontSize: 10, marginBottom: 6 }}>
              <li style={{ marginBottom: 2 }}>I hereby declare that the information furnished in this form and the documents submitted by me are true, complete and authentic to the best of my knowledge.</li>
              <li style={{ marginBottom: 2 }}>I understand that the external internship is subject to verification and approval by the College / Department and that submission of this form does not automatically constitute permission to join the internship.</li>
              <li style={{ marginBottom: 2 }}>I undertake to follow the rules, regulations, code of conduct and working requirements of both the College and the Company during the internship.</li>
              <li style={{ marginBottom: 2 }}>I undertake to maintain regular attendance and complete the internship for the approved duration. Any change in company, role, duration, location or other material internship details will be informed to the Department and approval will be obtained wherever required.</li>
              <li style={{ marginBottom: 2 }}>I understand that the College may contact the Company / HR / Internship Supervisor to verify the internship details, attendance, performance and completion.</li>
              <li style={{ marginBottom: 2 }}>I undertake that, after completion of the internship, I will submit the Internship Completion Certificate duly issued/authenticated by the Company HR or an authorized Company official, along with proof of attendance/completion.</li>
              <li style={{ marginBottom: 2 }}>I further undertake to submit the internship report, student feedback, company/HR evaluation and any other document prescribed by the Department within the stipulated time.</li>
              <li style={{ marginBottom: 2 }}>I understand that failure to submit the required completion documents or submission of false/incorrect information may result in action as per the rules of the Institution.</li>
            </ol>
            <div style={{ paddingLeft: 6 }}>
              <strong>Student Declaration:</strong> <CB checked={form.declarationAccepted} label="I have read, understood and agree to the above undertaking and declaration." />
            </div>
          </div>

          {/* ── SECTION G ── */}
          <div style={{ marginBottom: 6 }}>
            <h3 style={{ fontSize: 11, fontWeight: 'bold', background: '#e5e7eb', padding: '3px 6px', marginBottom: 4 }}>G. REQUEST FOR PERMISSION</h3>
            <p style={{ fontSize: 10, paddingLeft: 6 }}>
              I request the Department to grant me permission to undertake the above-mentioned external internship during the stated period. I confirm that I will comply with the academic, attendance and institutional requirements applicable to external internships.
            </p>
          </div>

          <div style={{ textAlign: 'center', fontSize: 8, color: '#666', borderTop: '1px solid #ccc', paddingTop: 4, marginTop: 6 }}>
            Page 1 of 2 — Front | For Departmental Record | External Internship – Initial Permission &amp; Registration
          </div>
        </div>

        {/* ═══════ PAGE 2 — BACK ═══════ */}
        <div className="page-break" style={{ padding: '20px 24px 10px' }}>

          {/* College Header (repeated for back page) */}
          <div style={{ textAlign: 'center', marginBottom: 12, borderBottom: '2px solid #000', paddingBottom: 8 }}>
            <h1 style={{ fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: 1 }}>
              Maharaja Institute of Technology Mysore
            </h1>
            <p style={{ fontSize: 9, margin: '2px 0', color: '#333' }}>
              External Internship Permission &amp; Registration Form — <em>Continued (Back)</em>
            </p>
          </div>

          {/* ── SECTION H ── */}
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 11, fontWeight: 'bold', background: '#e5e7eb', padding: '3px 6px', marginBottom: 4 }}>H. DEPARTMENT VERIFICATION &amp; APPROVAL – FOR OFFICE USE ONLY</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600, width: '40%' }}>Documents Verified</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999' }}>☐ Yes    ☐ No    ☐ Pending</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>Offer Letter Verified</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999' }}>☐ Yes    ☐ No    ☐ Pending</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>Confirmation Email / Screenshot Verified</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999' }}>☐ Yes    ☐ No    ☐ Pending</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>Company / HR Details Verified</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999' }}>☐ Yes    ☐ No    ☐ Pending</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>Internship Details Verified</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999' }}>☐ Yes    ☐ No    ☐ Pending</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>Faculty Mentor Recommendation</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999' }}>☐ Recommended    ☐ Not Recommended    ☐ Pending</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>HOD / Department Approval</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999' }}>☐ Approved    ☐ Not Approved    ☐ Pending</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>NOC / Permission Requested</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999' }}>☐ Yes    ☐ No</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>NOC / Permission Issued</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999' }}>☐ Yes    ☐ No    ☐ Pending    ☐ N/A</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>Attendance / Academic Permission Remarks</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', height: 36 }}></td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>Placement / Training Department Remarks</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', height: 36 }}></td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', border: '1px solid #999', fontWeight: 600 }}>Final Approval Status</td>
                  <td style={{ padding: '4px 6px', border: '1px solid #999' }}>☐ Approved    ☐ Not Approved    ☐ Pending</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── SECTION I ── */}
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 11, fontWeight: 'bold', background: '#e5e7eb', padding: '3px 6px', marginBottom: 6 }}>I. SIGNATURES &amp; AUTHORIZATION</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 6px' }}>
              {[
                'Student Name & Signature',
                'Faculty Coordinator',
                'Head of the Department (HOD)',
                'Placement / Training Officer',
              ].map((title) => (
                <div key={title} style={{ borderBottom: '1px solid #000', paddingBottom: 4 }}>
                  <div style={{ height: 50 }}></div>
                  <p style={{ fontSize: 10, fontWeight: 600, margin: 0 }}>{title}</p>
                  <p style={{ fontSize: 9, color: '#666', margin: 0 }}>Date: _______________</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECTION J ── */}
          <div style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 11, fontWeight: 'bold', background: '#e5e7eb', padding: '3px 6px', marginBottom: 4 }}>J. IMPORTANT POST-INTERNSHIP REQUIREMENT</h3>
            <p style={{ fontSize: 10, paddingLeft: 6, marginBottom: 4 }}>
              Before the internship is considered officially completed by the Department, the student must submit:
            </p>
            <div style={{ paddingLeft: 6, fontSize: 10 }}>
              {[
                'Company HR / Authorized Official-issued Internship Completion Certificate',
                'Proof of attendance / participation / completion',
                'Internship Report',
                'Company / HR Evaluation, if required',
                'Student Feedback Form',
                'Any other document prescribed by the College / Department',
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 2 }}>☐ {item}</div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 8, color: '#666', borderTop: '1px solid #ccc', paddingTop: 4, marginTop: 10 }}>
            Page 2 of 2 — Back | For Departmental Record | External Internship – Initial Permission &amp; Registration
          </div>
        </div>
      </div>
    </div>
  );
}
