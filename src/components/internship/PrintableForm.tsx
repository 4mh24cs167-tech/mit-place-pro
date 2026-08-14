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
      // Load html2canvas + jsPDF from CDN directly (more reliable than html2pdf.js)
      const loadScript = (url: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
          const s = document.createElement('script');
          s.src = url;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error(`Failed to load: ${url}`));
          document.head.appendChild(s);
        });
      };

      await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');

      const html2canvas = (window as any).html2canvas;
      const jsPDF = (window as any).jspdf.jsPDF;

      if (!html2canvas || !jsPDF) throw new Error('Libraries not loaded');

      const element = printRef.current;
      const pages = element.querySelectorAll(':scope > div') as NodeListOf<HTMLElement>;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      const pdfWidth = 210; // A4 mm
      const pdfHeight = 297;

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 794,
          windowWidth: 794,
          scrollY: 0,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc: Document) => {
            // Fix: html2canvas can't parse oklch/lab CSS colors from globals.css
            // Override all oklch CSS variables with hex equivalents
            const style = clonedDoc.createElement('style');
            style.textContent = `
              :root, *, *::before, *::after {
                --color-background: #eeedf5 !important;
                --color-foreground: #1a1730 !important;
                --color-card: #f8f7fc !important;
                --color-card-foreground: #1a1730 !important;
                --color-primary: #3b2299 !important;
                --color-primary-foreground: #fafafa !important;
                --color-secondary: #e8e5f0 !important;
                --color-secondary-foreground: #2d2950 !important;
                --color-muted: #e8e6f0 !important;
                --color-muted-foreground: #6b6680 !important;
                --color-accent-green: #80d990 !important;
                --color-accent-purple: #c4b0e8 !important;
                --color-accent-yellow: #e8d080 !important;
                --color-border: #ddd9e8 !important;
                --color-input: #e8e6f0 !important;
                --color-ring: #3b2299 !important;
                --color-sidebar-bg: #f0eef5 !important;
                --color-dark: #1e1a33 !important;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
              }
              #printable-form {
                margin: 0 !important;
                max-width: none !important;
                width: 794px !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));
      }

      const name = (form.student?.fullName || 'Student').replace(/\s+/g, '_');
      const company = form.companyName.replace(/\s+/g, '_');
      pdf.save(`Internship_Permission_${name}_${company}.pdf`);

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      alert(`PDF generation failed: ${msg}. Please try again.`);
    } finally {
      setDownloading(false);
      // Cleanup any leftover elements
      document.querySelectorAll('.html2pdf__overlay, .html2canvas-container').forEach(el => el.remove());
      document.body.style.overflow = '';
    }
  }, [downloading, form]);

  // Colors
  const C = {
    navy: '#1e1b4b',
    purple: '#6d28d9',
    purpleLight: '#ede9fe',
    purpleMid: '#8b5cf6',
    bg: '#f8f7ff',
    card: '#ffffff',
    text: '#1e1b4b',
    muted: '#6b7280',
    border: '#e5e7eb',
  };

  const s = form.student;
  const duration = form.totalDuration || '–';

  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0; padding: 0; }
          body * { visibility: hidden; }
          #printable-form, #printable-form * { visibility: visible; }
          #printable-form { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        @media screen and (max-width: 640px) {
          .action-bar { flex-direction: column !important; gap: 8px !important; }
          .action-buttons { display: flex !important; width: 100% !important; }
          .action-buttons button { flex: 1 !important; justify-content: center !important; }
        }
      `}} />

      {/* POPUP */}
      {showInstruction && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setShowInstruction(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#fef3c7', borderRadius: 10, padding: 8, flexShrink: 0 }}><AlertTriangle size={20} style={{ color: '#d97706' }} /></div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Print Instructions</h3>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.9, color: '#92400e' }}>
                <li>Print in <strong>COLOUR</strong></li>
                <li>Single sheet — <strong>front & back</strong></li>
                <li>Use <strong>duplex printing</strong></li>
                <li>Check <strong>&quot;Background graphics&quot;</strong></li>
              </ul>
            </div>
            <button onClick={() => setShowInstruction(false)} style={{ width: '100%', padding: 10, background: C.purple, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Got it</button>
          </div>
        </div>
      )}

      {/* ACTION BAR */}
      <div className="no-print action-bar" style={{ padding: '10px 16px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Print Preview</h2>
        <div className="action-buttons" style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowInstruction(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f59e0b', color: '#fff', padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><AlertTriangle size={14} /> Info</button>
          <button onClick={handleDownload} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.purple, color: '#fff', padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: downloading ? 0.6 : 1 }}>
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* ═══════ PRINTABLE DOCUMENT ═══════ */}
      <div id="printable-form" ref={printRef} style={{ maxWidth: 794, margin: '0 auto', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: C.text, background: '#fff' }}>

        {/* ═══ PAGE 1 ═══ */}
        <div style={{ minHeight: 1122, position: 'relative', overflow: 'hidden' }}>

          {/* HEADER — Dark navy */}
          <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #312e81 50%, ${C.purple} 100%)`, color: '#fff', padding: '20px 28px 18px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'rgba(255,255,255,0.03)', borderRadius: '0 0 0 200px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/mitm-logo.png" alt="MIT" style={{ width: 42, height: 42, borderRadius: 99, border: '2px solid rgba(255,255,255,0.3)', objectFit: 'contain', background: '#fff' }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>Maharaja Institute of Technology</div>
                  <div style={{ fontSize: 8, opacity: 0.7, marginTop: 1 }}>Mysore | Belawadi, Srirangapatna Taluk, Mandya – 571477</div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: 8, opacity: 0.8 }}>Internship Duration</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 1 }}>{duration}</div>
              </div>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '14px 0 2px', lineHeight: 1.1 }}>Internship <span style={{ color: '#c4b5fd' }}>Registration</span></h1>
            <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>Industry Experience Opportunity</p>
            <p style={{ fontSize: 9.5, marginTop: 6, opacity: 0.6 }}>Student Internship Approval & Registration Details</p>
          </div>

          {/* BODY */}
          <div style={{ padding: '12px 22px 10px', background: C.bg }}>

            {/* Journey Banner */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>🎓</span>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: 1 }}>Internship Journey</div>
                <div style={{ fontSize: 8.5, color: C.muted, marginTop: 1 }}>Empowering students with real-world industry exposure through structured internship opportunities.</div>
              </div>
            </div>

            {/* TWO COLUMNS — Student + Internship */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

              {/* Student Profile */}
              <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 14 }}>👤</span></div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>Student Profile</div>
                </div>
                {[
                  ['👤', 'Name', s?.fullName || '–'],
                  ['🆔', 'USN', s?.usn || '–'],
                  ['🏛️', 'Department', s?.department || '–'],
                  ['📱', 'Phone', s?.phone || '–'],
                  ['📧', 'Email', s?.user?.email || s?.email || '–'],
                  ['👨‍🏫', 'Faculty Mentor', form.mentorName || '–'],
                ].map(([icon, label, val], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: i < 5 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: 10, width: 16, textAlign: 'center' }}>{icon}</span>
                    <span style={{ fontSize: 8.5, color: C.muted, width: 70, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, flex: 1 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Internship Info */}
              <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: C.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 14 }}>💼</span></div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>Internship Information</div>
                </div>
                {[
                  ['🏢', 'Organization', form.companyName],
                  ['💻', 'Domain', form.internshipDomain],
                  ['🎯', 'Role', form.internshipRole],
                  ['📝', 'Project Title', form.projectTitle || '–'],
                  ['📍', 'Mode', form.mode || '–'],
                  ['📌', 'Location', form.workLocation || '–'],
                  ['📅', 'Start Date', form.startDate],
                  ['📅', 'End Date', form.endDate],
                  ['⏳', 'Duration', form.totalDuration || '–'],
                  ['⏰', 'Working Hours', form.workingHours || '–'],
                ].map(([icon, label, val], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: i < 9 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: 10, width: 16, textAlign: 'center' }}>{icon}</span>
                    <span style={{ fontSize: 8.5, color: C.muted, width: 76, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 8.5, fontWeight: 600, flex: 1 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* HIGHLIGHT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[
                ['S', 'Opportunity Source', form.opportunitySource || '–', C.purpleLight, C.purple],
                ['₹', 'Stipend', form.stipendAmount ? String(form.stipendAmount) : (form.stipendProvided ? 'Yes' : 'No'), '#fef3c7', '#b45309'],
                ['L', 'Work Location', form.workLocation || '–', '#dbeafe', '#1d4ed8'],
                ['P', 'PPO Possible', form.ppoPossible || '–', '#dcfce7', '#15803d'],
              ].map(([icon, label, val, bg, clr], i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 99, background: bg as string, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: clr as string, fontFamily: 'Arial, sans-serif' }}>{icon}</span>
                  </div>
                  <div style={{ fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 1, textTransform: 'capitalize' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* TWO CARDS — HR + Company */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* HR Details */}
              <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 12 }}>🏢</span></div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>HR / Supervisor Details</div>
                </div>
                {[
                  ['👤', 'Contact', form.hrName || '–'],
                  ['📧', 'Email', form.hrEmail || '–'],
                  ['📱', 'Phone', form.hrPhone || '–'],
                  ['💼', 'Designation', form.hrDesignation || '–'],
                ].map(([icon, label, val], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: 9, width: 14 }}>{icon}</span>
                    <span style={{ fontSize: 8, color: C.muted, width: 55 }}>{label}</span>
                    <span style={{ fontSize: 8.5, fontWeight: 600, flex: 1, wordBreak: 'break-all' }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Opportunity + Additional */}
              <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: C.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 12 }}>📋</span></div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>Opportunity & Company</div>
                </div>
                {[
                  ['🌐', 'Website', form.companyWebsite || '–'],
                  ['📍', 'Address', form.companyAddress || '–'],
                  ['🏫', 'College facilitated', form.facilitatedByCollege ? 'Yes' : 'No'],
                  ['👤', 'Source / Ref', form.sourcePerson || '–'],
                  ['🎓', 'Related to branch', form.isRelatedToBranch || '–'],
                  ['🎁', 'Other benefits', form.otherBenefits || '–'],
                  ['📄', 'PPO details', form.ppoDetails || '–'],
                ].map(([icon, label, val], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2.5px 0', borderBottom: i < 6 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: 9, width: 14 }}>{icon}</span>
                    <span style={{ fontSize: 7.5, color: C.muted, width: 72 }}>{label}</span>
                    <span style={{ fontSize: 8, fontWeight: 600, flex: 1, wordBreak: 'break-all' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DECLARATION */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', border: `1px solid ${C.border}`, marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 12 }}>✅</span></div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#166534' }}>Student Declaration {form.declarationAccepted ? '(Accepted)' : ''}</div>
              </div>
              <ol style={{ fontSize: 7, color: C.muted, margin: 0, paddingLeft: 14, lineHeight: 1.35 }}>
                <li>I declare all information furnished and documents submitted are true, complete and authentic.</li>
                <li>Internship is subject to verification; submission does not constitute automatic permission.</li>
                <li>I will follow rules and code of conduct of both College and Company.</li>
                <li>I will maintain regular attendance. Any changes will be informed to the Department.</li>
                <li>College may contact Company to verify details and performance.</li>
                <li>After completion, I will submit the Internship Completion Certificate.</li>
                <li>I will submit internship report, feedback, evaluation within stipulated time.</li>
                <li>Failure to submit documents or false information may result in action per institutional rules.</li>
              </ol>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
                <div style={{ fontSize: 7.5, color: C.text }}>{form.declarationAccepted ? '☑' : '☐'} I have read, understood and agree to the above.</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-block', borderBottom: '1px solid #000', width: 110, height: 18 }} />
                  <div style={{ fontSize: 6.5, color: C.muted, marginTop: 1 }}>Student Signature</div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ background: C.navy, color: '#fff', padding: '8px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/mitm-logo.png" alt="MIT" style={{ width: 22, height: 22, borderRadius: 99, objectFit: 'contain', background: '#fff' }} />
              <div>
                <div style={{ fontSize: 9, fontWeight: 700 }}>Maharaja Institute of Technology Mysore</div>
                <div style={{ fontSize: 7, opacity: 0.6 }}>Belawadi, Srirangapatna Taluk, Mandya – 571477</div>
              </div>
            </div>
            <div style={{ fontSize: 7, opacity: 0.6, textAlign: 'right' }}>
              <div style={{ fontWeight: 600, opacity: 0.8 }}>An Autonomous Institution</div>
              <div>Affiliated to VTU, Belagavi | Approved by AICTE, New Delhi</div>
            </div>
          </div>
        </div>

        {/* ═══ PAGE 2 — BACK ═══ */}
        <div className="page-break" style={{ minHeight: 1122, position: 'relative', background: C.bg }}>

          {/* Mini Header */}
          <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.purple})`, color: '#fff', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/mitm-logo.png" alt="MIT" style={{ width: 30, height: 30, borderRadius: 99, objectFit: 'contain', background: '#fff' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Department Verification</div>
                <div style={{ fontSize: 8, opacity: 0.7 }}>Office Use Only — Page 2</div>
              </div>
            </div>
            <div style={{ fontSize: 8, opacity: 0.6 }}>{s?.fullName} | {s?.usn}</div>
          </div>

          <div style={{ padding: '14px 22px' }}>

            {/* H — Verification */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>📋</span> Department Verification & Approval
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
                <tbody>
                  {[
                    ['Documents Verified', '☐ Yes  ☐ No  ☐ Pending'],
                    ['Offer Letter Verified', '☐ Yes  ☐ No  ☐ Pending'],
                    ['Confirmation Verified', '☐ Yes  ☐ No  ☐ Pending'],
                    ['Company / HR Verified', '☐ Yes  ☐ No  ☐ Pending'],
                    ['Internship Details Verified', '☐ Yes  ☐ No  ☐ Pending'],
                    ['Faculty Recommendation', '☐ Recommended  ☐ Not Recommended  ☐ Pending'],
                    ['HOD Approval', '☐ Approved  ☐ Not Approved  ☐ Pending'],
                    ['NOC Requested / Issued', '☐ Yes  ☐ No  ☐ Pending  ☐ N/A'],
                    ['Final Approval', '☐ Approved  ☐ Not Approved  ☐ Pending'],
                  ].map(([label, val], i) => (
                    <tr key={i}>
                      <td style={{ padding: '5px 8px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, width: '35%', color: C.navy }}>{label}</td>
                      <td style={{ padding: '5px 8px', borderBottom: `1px solid ${C.border}`, color: C.muted }}>{val}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: 600, color: C.navy }}>Remarks</td>
                    <td style={{ padding: '5px 8px', height: 40 }} />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* I — Signatures */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>✍️</span> Signatures & Authorization
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {['Student Name & Signature', 'Faculty Coordinator', 'Head of Department (HOD)', 'Placement / Training Officer'].map((title) => (
                  <div key={title} style={{ textAlign: 'center' }}>
                    <div style={{ height: 50, border: `1px dashed ${C.border}`, borderRadius: 8, marginBottom: 4, background: '#fafafa' }} />
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: C.navy }}>{title}</div>
                    <div style={{ fontSize: 7.5, color: C.muted }}>Date: _______________</div>
                  </div>
                ))}
              </div>
            </div>

            {/* J — Post Internship */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>📝</span> Post-Internship Requirements
              </div>
              <div style={{ fontSize: 9 }}>
                {['Internship Completion Certificate', 'Proof of attendance / completion', 'Internship Report', 'Company Evaluation (if required)', 'Student Feedback Form', 'Any other prescribed document'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: i < 5 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${C.border}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents submitted */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>📎</span> Documents Submitted by Student
              </div>
              <div style={{ fontSize: 8.5 }}>
                {['Offer Letter / Appointment Letter', 'Confirmation Email / Screenshot', 'Job Description / Role Description', 'Joining Instructions', 'NOC / Permission document', 'Other supporting document'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2.5px 0' }}>
                    <span style={{ fontSize: 10, color: (form.documentsChecklist || [])[i] ? '#22c55e' : C.muted }}>{(form.documentsChecklist || [])[i] ? '☑' : '☐'}</span>
                    <span style={{ color: (form.documentsChecklist || [])[i] ? C.text : C.muted }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: C.navy, color: '#fff', padding: '8px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/mitm-logo.png" alt="MIT" style={{ width: 22, height: 22, borderRadius: 99, objectFit: 'contain', background: '#fff' }} />
              <div><div style={{ fontSize: 9, fontWeight: 700 }}>Maharaja Institute of Technology Mysore</div><div style={{ fontSize: 7, opacity: 0.6 }}>Belawadi, Srirangapatna Taluk, Mandya – 571477</div></div>
            </div>
            <div style={{ fontSize: 7, opacity: 0.6, textAlign: 'right' }}>
              <div style={{ fontWeight: 600, opacity: 0.8 }}>An Autonomous Institution</div>
              <div>Affiliated to VTU, Belagavi | Approved by AICTE, New Delhi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
