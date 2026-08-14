'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { InternshipPermission } from '@/types';
import { Download, Loader2, X, AlertTriangle } from 'lucide-react';

interface PrintableFormProps {
  form: InternshipPermission;
}

export default function PrintableForm({ form }: PrintableFormProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);

  useEffect(() => { setShowInstruction(true); }, []);



  const handleDownload = useCallback(async () => {
    if (!printRef.current || downloading) return;
    setDownloading(true);
    try {
      const module = await import('html2pdf.js');
      const html2pdf = module.default || module;
      const name = (form.student?.fullName || 'Student').replace(/\s+/g, '_');
      const company = form.companyName.replace(/\s+/g, '_');
      await html2pdf().set({
        margin: [4, 6, 4, 6],
        filename: `Internship_Permission_${name}_${company}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css'] },
      }).from(printRef.current).save();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown';
      alert(`PDF generation failed: ${msg}. Please try again.`);
    } finally {
      setDownloading(false);
      document.querySelectorAll('.html2pdf__overlay').forEach(el => el.remove());
      document.body.style.overflow = '';
    }
  }, [downloading, form]);

  const CB = ({ checked, label }: { checked: boolean; label: string }) => (
    <span style={{ marginRight: 6, whiteSpace: 'nowrap' }}>
      {checked ? '☑' : '☐'} {label}
    </span>
  );

  const docs = form.documentsChecklist || [];
  const docLabels = [
    'Offer Letter / Appointment Letter',
    'Confirmation Email / Screenshot',
    'Job Description / Role Description',
    'Joining Instructions',
    'NOC / Permission document',
    'Other supporting document',
  ];

  // Ultra-compact styles
  const S = {
    th: { padding: '1.5px 4px', border: '1px solid #999', fontWeight: 700, width: '36%', verticalAlign: 'top' } as React.CSSProperties,
    td: { padding: '1.5px 4px', border: '1px solid #999', wordBreak: 'break-word' as const } as React.CSSProperties,
    sec: { fontSize: 9, fontWeight: 'bold' as const, background: '#ccc', padding: '1.5px 4px', margin: '0 0 1px', textTransform: 'uppercase' as const, borderBottom: '1px solid #999' } as React.CSSProperties,
    tbl: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 9 } as React.CSSProperties,
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Print styles — margin 0 removes browser headers/footers (date, URL, title) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0; padding: 0; }
          body * { visibility: hidden; }
          #printable-form, #printable-form * { visibility: visible; }
          #printable-form { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .print-page { padding: 10mm 12mm 8mm !important; }
        }
        @media screen and (max-width: 640px) {
          .action-bar { flex-direction: column !important; gap: 8px !important; }
          .action-buttons { display: flex !important; width: 100% !important; }
          .action-buttons button { flex: 1 !important; justify-content: center !important; }
        }
      `}} />

      {/* POPUP INSTRUCTIONS */}
      {showInstruction && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', maxWidth: 400, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setShowInstruction(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#fef3c7', borderRadius: 10, padding: 8, flexShrink: 0 }}>
                <AlertTriangle size={20} style={{ color: '#d97706' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Print Instructions</h3>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.9, color: '#92400e' }}>
                <li>Print in <strong>COLOUR</strong></li>
                <li>Single sheet — <strong>front & back</strong></li>
                <li>Use <strong>duplex printing</strong></li>
                <li>Uncheck <strong>&quot;Headers and footers&quot;</strong></li>
                <li>Check <strong>&quot;Background graphics&quot;</strong></li>
              </ul>
            </div>
            <button onClick={() => setShowInstruction(false)} style={{ width: '100%', padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ACTION BAR */}
      <div className="no-print action-bar" style={{ padding: '10px 16px', background: '#f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Print Preview</h2>
        <div className="action-buttons" style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowInstruction(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f59e0b', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <AlertTriangle size={14} /> Info
          </button>
          <button onClick={handleDownload} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#059669', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: downloading ? 0.6 : 1 }}>
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloading ? 'Wait...' : 'PDF'}
          </button>

        </div>
      </div>

      {/* ═══════════ PRINTABLE DOCUMENT ═══════════ */}
      <div id="printable-form" ref={printRef} style={{ maxWidth: 794, margin: '0 auto', fontFamily: "'Times New Roman', Times, serif", color: '#000', background: '#fff', lineHeight: 1.25 }}>

        {/* ═══ PAGE 1 — FRONT ═══ */}
        <div className="print-page" style={{ padding: '10px 18px 6px', fontSize: 9 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 5, borderBottom: '2px solid #000', paddingBottom: 4 }}>
            <h1 style={{ fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: 1 }}>Maharaja Institute of Technology Mysore</h1>
            <p style={{ fontSize: 8, margin: 0, color: '#333' }}>Belawadi, Srirangapatna Taluk, Mandya District, Karnataka – 571477</p>
            <p style={{ fontSize: 7.5, margin: 0, color: '#555' }}>(An Autonomous Institution | Affiliated to VTU, Belagavi | Approved by AICTE, New Delhi)</p>
            <h2 style={{ fontSize: 10, fontWeight: 'bold', margin: '3px 0 0', textTransform: 'uppercase' }}>External Internship Permission & Registration Form</h2>
            <p style={{ fontSize: 7, fontStyle: 'italic', margin: 0 }}>(To be submitted by Final Year Students BEFORE joining an external internship)</p>
          </div>

          {/* A */}
          <h3 style={S.sec}>A. Student Basic Details</h3>
          <table style={S.tbl}><tbody>
            <tr><td style={S.th}>Name</td><td style={S.td}>{form.student?.fullName || ''}</td></tr>
            <tr><td style={S.th}>USN</td><td style={S.td}>{form.student?.usn || ''}</td></tr>
            <tr><td style={S.th}>Branch</td><td style={S.td}>{form.student?.department || ''}</td></tr>
            <tr><td style={S.th}>Student Mobile Number</td><td style={S.td}>{form.student?.phone || ''}</td></tr>
            <tr><td style={S.th}>Personal Email ID</td><td style={S.td}>{form.student?.email || ''}</td></tr>
            <tr><td style={S.th}>Mentor Name</td><td style={S.td}>{form.mentorName || ''}</td></tr>
          </tbody></table>

          {/* B */}
          <h3 style={{...S.sec, marginTop: 4}}>B. External Internship Details</h3>
          <table style={S.tbl}><tbody>
            <tr><td style={S.th}>Company / Organization</td><td style={S.td}>{form.companyName}</td></tr>
            <tr><td style={S.th}>Company Website</td><td style={S.td}>{form.companyWebsite || ''}</td></tr>
            <tr><td style={S.th}>Company Address</td><td style={S.td}>{form.companyAddress || ''}</td></tr>
            <tr><td style={S.th}>Internship Domain / Area</td><td style={S.td}>{form.internshipDomain}</td></tr>
            <tr><td style={S.th}>Internship Role / Designation</td><td style={S.td}>{form.internshipRole}</td></tr>
            <tr><td style={S.th}>Project / Work Title</td><td style={S.td}>{form.projectTitle || ''}</td></tr>
            <tr><td style={S.th}>Start Date</td><td style={S.td}>{form.startDate}</td></tr>
            <tr><td style={S.th}>End Date</td><td style={S.td}>{form.endDate}</td></tr>
            <tr><td style={S.th}>Total Duration</td><td style={S.td}>{form.totalDuration}</td></tr>
            <tr><td style={S.th}>Mode of Internship</td><td style={S.td}><CB checked={form.mode==='on-site'} label="On-site" /><CB checked={form.mode==='remote'} label="Remote" /><CB checked={form.mode==='hybrid'} label="Hybrid" /></td></tr>
            <tr><td style={S.th}>Work Location</td><td style={S.td}>{form.workLocation || ''}</td></tr>
            <tr><td style={S.th}>Working Hours</td><td style={S.td}>{form.workingHours || ''}</td></tr>
            <tr><td style={S.th}>Related to branch?</td><td style={S.td}><CB checked={form.isRelatedToBranch==='yes'} label="Yes" /><CB checked={form.isRelatedToBranch==='no'} label="No" /><CB checked={form.isRelatedToBranch==='partially'} label="Partially" /></td></tr>
          </tbody></table>

          {/* C */}
          <h3 style={{...S.sec, marginTop: 4}}>C. Internship Opportunity Details</h3>
          <table style={S.tbl}><tbody>
            <tr><td style={S.th}>Opportunity obtained via?</td><td style={S.td}><CB checked={form.opportunitySource==='on-campus'} label="On-Campus" /><CB checked={form.opportunitySource==='off-campus'} label="Off-Campus" /><CB checked={form.opportunitySource==='faculty'} label="Faculty" /><CB checked={form.opportunitySource==='alumni'} label="Alumni" /><CB checked={form.opportunitySource==='self'} label="Self" /><CB checked={form.opportunitySource==='portal'} label="Portal" /><CB checked={form.opportunitySource==='other'} label="Other" /></td></tr>
            <tr><td style={S.th}>College facilitated?</td><td style={S.td}><CB checked={form.facilitatedByCollege===true} label="Yes" /><CB checked={form.facilitatedByCollege===false} label="No" /></td></tr>
            <tr><td style={S.th}>Source / reference</td><td style={S.td}>{form.sourcePerson || ''}</td></tr>
            <tr><td style={S.th}>Stipend provided?</td><td style={S.td}><CB checked={form.stipendProvided===true} label="Yes" /><CB checked={form.stipendProvided===false} label="No" /></td></tr>
            <tr><td style={S.th}>Stipend Amount / Month</td><td style={S.td}>{form.stipendAmount || ''}</td></tr>
            <tr><td style={S.th}>Other benefits</td><td style={S.td}>{form.otherBenefits || ''}</td></tr>
            <tr><td style={S.th}>PPO possible?</td><td style={S.td}><CB checked={form.ppoPossible==='yes'} label="Yes" /><CB checked={form.ppoPossible==='no'} label="No" /><CB checked={form.ppoPossible==='not-confirmed'} label="Not Confirmed" /></td></tr>
            <tr><td style={S.th}>PPO details</td><td style={S.td}>{form.ppoDetails || ''}</td></tr>
          </tbody></table>

          {/* D */}
          <h3 style={{...S.sec, marginTop: 4}}>D. Company / HR / Supervisor Details</h3>
          <table style={S.tbl}><tbody>
            <tr><td style={S.th}>HR / Contact Name</td><td style={S.td}>{form.hrName || ''}</td></tr>
            <tr><td style={S.th}>HR Designation</td><td style={S.td}>{form.hrDesignation || ''}</td></tr>
            <tr><td style={S.th}>HR Email</td><td style={S.td}>{form.hrEmail || ''}</td></tr>
            <tr><td style={S.th}>HR Phone</td><td style={S.td}>{form.hrPhone || ''}</td></tr>
          </tbody></table>

          {/* E */}
          <h3 style={{...S.sec, marginTop: 4}}>E. Documents to Submit</h3>
          <div style={{ fontSize: 8.5, paddingLeft: 3 }}>
            {docLabels.map((l, i) => <span key={i} style={{ display: 'inline-block', marginRight: 4 }}>{docs[i] ? '☑' : '☐'} {l}{i < 5 ? ' |' : ''}</span>)}
          </div>
          <p style={{ fontSize: 7, fontStyle: 'italic', margin: '1px 0 0', padding: '1px 3px', background: '#eee', border: '1px solid #ccc' }}><strong>Note:</strong> Submit clear, authentic copies. Offer letter should establish company, role, period & student identity.</p>

          {/* F */}
          <h3 style={{...S.sec, marginTop: 3}}>F. Student Undertaking / Declaration</h3>
          <ol style={{ paddingLeft: 14, fontSize: 7.5, margin: '0 0 1px', lineHeight: 1.2 }}>
            <li>I declare information furnished and documents submitted are true, complete and authentic.</li>
            <li>Internship is subject to verification; submission does not constitute automatic permission.</li>
            <li>I will follow rules and code of conduct of both College and Company.</li>
            <li>I will maintain regular attendance. Any changes will be informed to the Department.</li>
            <li>College may contact Company to verify details and performance.</li>
            <li>After completion, I will submit the Internship Completion Certificate.</li>
            <li>I will submit internship report, feedback, evaluation within stipulated time.</li>
            <li>Failure to submit documents or false information may result in action per institutional rules.</li>
          </ol>
          <p style={{ fontSize: 8.5, paddingLeft: 3, margin: '1px 0' }}><strong>Declaration:</strong> {form.declarationAccepted ? '☑' : '☐'} I have read, understood and agree to the above.</p>

          {/* G */}
          <h3 style={{...S.sec, marginTop: 3}}>G. Request for Permission</h3>
          <p style={{ fontSize: 8, paddingLeft: 3, margin: '1px 0' }}>I request the Department to grant permission for the above external internship. I will comply with all academic, attendance and institutional requirements.</p>

          <div style={{ textAlign: 'center', fontSize: 7, color: '#999', borderTop: '1px solid #ddd', paddingTop: 2, marginTop: 3 }}>Page 1 of 2 — Front</div>
        </div>

        {/* ═══ PAGE 2 — BACK ═══ */}
        <div className="page-break print-page" style={{ padding: '10px 18px 6px', fontSize: 9 }}>

          <div style={{ textAlign: 'center', marginBottom: 5, borderBottom: '1.5px solid #000', paddingBottom: 3 }}>
            <h1 style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>Maharaja Institute of Technology Mysore</h1>
            <p style={{ fontSize: 8, margin: 0, color: '#333' }}>External Internship Permission & Registration Form — <em>Page 2 (Back)</em></p>
          </div>

          {/* H */}
          <h3 style={S.sec}>H. Department Verification & Approval – Office Use Only</h3>
          <table style={S.tbl}><tbody>
            <tr><td style={S.th}>Documents Verified</td><td style={S.td}>☐ Yes  ☐ No  ☐ Pending</td></tr>
            <tr><td style={S.th}>Offer Letter Verified</td><td style={S.td}>☐ Yes  ☐ No  ☐ Pending</td></tr>
            <tr><td style={S.th}>Confirmation Verified</td><td style={S.td}>☐ Yes  ☐ No  ☐ Pending</td></tr>
            <tr><td style={S.th}>Company / HR Verified</td><td style={S.td}>☐ Yes  ☐ No  ☐ Pending</td></tr>
            <tr><td style={S.th}>Internship Details Verified</td><td style={S.td}>☐ Yes  ☐ No  ☐ Pending</td></tr>
            <tr><td style={S.th}>Faculty Mentor Recommendation</td><td style={S.td}>☐ Recommended  ☐ Not Recommended  ☐ Pending</td></tr>
            <tr><td style={S.th}>HOD Approval</td><td style={S.td}>☐ Approved  ☐ Not Approved  ☐ Pending</td></tr>
            <tr><td style={S.th}>NOC Requested</td><td style={S.td}>☐ Yes  ☐ No</td></tr>
            <tr><td style={S.th}>NOC Issued</td><td style={S.td}>☐ Yes  ☐ No  ☐ Pending  ☐ N/A</td></tr>
            <tr><td style={S.th}>Attendance / Academic Remarks</td><td style={{...S.td, height: 22}}></td></tr>
            <tr><td style={S.th}>Placement / Training Remarks</td><td style={{...S.td, height: 22}}></td></tr>
            <tr><td style={S.th}>Final Approval Status</td><td style={S.td}>☐ Approved  ☐ Not Approved  ☐ Pending</td></tr>
          </tbody></table>

          {/* I */}
          <h3 style={{...S.sec, marginTop: 6}}>I. Signatures & Authorization</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
            <tr>
              <td style={{ border: '1px solid #999', padding: 3, width: '50%', height: 50, verticalAlign: 'bottom' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: 1, fontSize: 8 }}><strong>Student Name & Signature</strong><br/>Date: ___________</div>
              </td>
              <td style={{ border: '1px solid #999', padding: 3, width: '50%', height: 50, verticalAlign: 'bottom' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: 1, fontSize: 8 }}><strong>Faculty Coordinator</strong><br/>Date: ___________</div>
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #999', padding: 3, width: '50%', height: 50, verticalAlign: 'bottom' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: 1, fontSize: 8 }}><strong>HOD</strong><br/>Date: ___________</div>
              </td>
              <td style={{ border: '1px solid #999', padding: 3, width: '50%', height: 50, verticalAlign: 'bottom' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: 1, fontSize: 8 }}><strong>Placement / Training Officer</strong><br/>Date: ___________</div>
              </td>
            </tr>
          </tbody></table>

          {/* J */}
          <h3 style={{...S.sec, marginTop: 6}}>J. Post-Internship Requirement</h3>
          <p style={{ fontSize: 8, paddingLeft: 3, margin: '1px 0 2px' }}>Before official completion, the student must submit:</p>
          <div style={{ fontSize: 8.5, paddingLeft: 3 }}>
            {['Internship Completion Certificate', 'Proof of attendance / completion', 'Internship Report', 'Company Evaluation (if required)', 'Student Feedback Form', 'Any other prescribed document'].map((item, i) => (
              <div key={i}>☐ {item}</div>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: 7, color: '#999', borderTop: '1px solid #ddd', paddingTop: 2, marginTop: 6 }}>Page 2 of 2 — Back</div>
        </div>
      </div>
    </div>
  );
}
