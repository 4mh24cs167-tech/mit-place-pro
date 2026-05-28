"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/lib/auth-context";
import { adminApi } from "@/lib/api";
import {
  Server,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
  Terminal,
} from "lucide-react";

interface PortTestResult {
  port: number;
  secure: boolean;
  success: boolean;
  error: string | null;
}

interface SmtpStatus {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  hasSmtpPass: boolean;
  isTransporterInitialized: boolean;
  testResults: PortTestResult[];
}

export default function DiagnosticsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SmtpStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; error?: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setIsLoading(true);
    setTestResult(null);
    try {
      const res = await adminApi.getSmtpStatus();
      if (res.success && res.data) {
        setStatus(res.data as SmtpStatus);
      }
    } catch (err) {
      console.error("Failed to load SMTP status:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setIsSending(true);
    setTestResult(null);

    try {
      const res = await adminApi.sendSmtpTest(testEmail.trim());
      setTestResult({
        success: res.success,
        message: res.message || (res.success ? "Test email sent successfully!" : "Failed to send email"),
        error: (res as any).error,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Network or Server error when sending test email",
        error: err.message || String(err),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page-enter">
      <Header
        userName={user?.email || "Admin"}
        userRole="Admin"
        greeting="System Diagnostics"
        subtitle="Verify SMTP email configuration and outbound connectivity."
      />

      <div className="px-4 sm:px-6 md:px-8 pb-10 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-foreground">SMTP Relay Verification</h2>
          <button
            onClick={() => fetchStatus(true)}
            disabled={isLoading || refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted/50 transition-all font-medium text-sm text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Re-Test Connection
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-sm font-medium text-foreground">Running active connection verification on server...</p>
            <p className="text-xs text-muted-foreground mt-1">This tests standard SMTP ports live from Render.</p>
          </div>
        ) : !status ? (
          <div className="i-card p-8 text-center bg-red-50/50 border-red-100">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="font-semibold text-red-800">Connection status unavailable</p>
            <p className="text-sm text-red-600 mt-1">
              Could not communicate with the SMTP diagnostic services. Please ensure your backend server is running.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Transporter Health Card */}
              <div className="i-card p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transporter Health</p>
                    <p className="text-2xl font-black mt-2 text-foreground">
                      {status.isTransporterInitialized ? "ACTIVE" : "INACTIVE"}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.isTransporterInitialized ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    <Server className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  {status.isTransporterInitialized
                    ? "✅ NodeMailer is verified and connected to SMTP relay."
                    : "⚠️ SMTP is not connected. Mail sending falls back to local logging."}
                </p>
              </div>

              {/* Host & Port Card */}
              <div className="i-card p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relay Server</p>
                    <p className="text-lg font-bold mt-2 text-foreground truncate max-w-[200px]">
                      {status.smtpHost}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Configured Port: <strong>{status.smtpPort}</strong> · TLS Upgrade: <strong>Enabled</strong>
                </p>
              </div>

              {/* Authenticated User */}
              <div className="i-card p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auth Username</p>
                    <p className="text-sm font-semibold mt-2 text-foreground truncate max-w-[220px]">
                      {status.smtpUser}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.hasSmtpPass ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Password: <strong>{status.hasSmtpPass ? "Configured (Hidden)" : "Missing"}</strong> · From: <strong>{status.smtpFrom || "Default"}</strong>
                </p>
              </div>
            </div>

            {/* Port scan results */}
            <div className="i-card p-6">
              <h3 className="text-base font-bold text-foreground mb-1">Active Outbound Port Diagnostics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                These tests check outbound network connectivity from the hosted Render environment directly to Brevo SMTP servers.
              </p>

              {status.testResults.length === 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">No SMTP credentials available to test</p>
                    <p className="text-xs mt-0.5">Please add SMTP_USER and SMTP_PASS to Render Environment Variables first.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {status.testResults.map((t) => (
                    <div
                      key={t.port}
                      className={`p-4 rounded-2xl border transition-all ${
                        t.success
                          ? "bg-emerald-50/50 border-emerald-100 text-emerald-900"
                          : "bg-rose-50/50 border-rose-100 text-rose-900"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-2">
                        <span className="text-sm">Port {t.port} ({t.secure ? "SSL" : "TLS/STARTTLS"})</span>
                        {t.success ? (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Success
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            Blocked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground mt-2">
                        {t.success
                          ? "✅ Server successfully handshaked with Brevo SMTP relay."
                          : `❌ Error: ${t.error || "Connection timed out"}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Email Form & Render Tips */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Send Test Form */}
              <div className="md:col-span-2 i-card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">Send SMTP Test Email</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Send a direct connection validation email to any inbox to confirm inbox delivery.
                  </p>

                  <form onSubmit={handleSendTest} className="space-y-4">
                    <div>
                      <label htmlFor="test-email-input" className="block text-xs font-medium text-muted-foreground mb-1">
                        Recipient Email Address
                      </label>
                      <input
                        id="test-email-input"
                        type="email"
                        required
                        placeholder="e.g. your-email@gmail.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border focus:border-foreground/30 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 transition-all outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSending || !testEmail.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground hover:bg-foreground/90 text-white font-medium text-sm disabled:opacity-50 transition-all shadow-md"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Diagnostic Email
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {testResult && (
                  <div
                    className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed ${
                      testResult.success
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : "bg-rose-50 border-rose-100 text-rose-800"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{testResult.success ? "Delivery Succeeded" : "Delivery Failed"}</span>
                    </div>
                    <p>{testResult.message}</p>
                    {testResult.error && (
                      <p className="mt-1.5 pt-1.5 border-t border-rose-100 font-mono text-[10px] break-all opacity-80">
                        Error Details: {testResult.error}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Render deployment configuration advice */}
              <div className="md:col-span-3 i-card p-6 bg-slate-900 border-slate-800 text-slate-100">
                <div className="flex items-start gap-2.5 mb-4">
                  <Terminal className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Render Environment Setup</h3>
                    <p className="text-xs text-slate-400">
                      How to add these SMTP credentials to your hosted API environment on Render.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs leading-relaxed">
                  <p className="text-slate-300">
                    Outbound emails are active locally but require exact environment keys on the Render dashboard to enable them on the live platform:
                  </p>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800">
                      <span className="text-indigo-400">SMTP_HOST</span>=smtp-relay.brevo.com<br />
                      <span className="text-indigo-400">SMTP_PORT</span>=587<br />
                      <span className="text-indigo-400">SMTP_USER</span>=a5fcda001@smtp-brevo.com<br />
                      <span className="text-indigo-400">SMTP_PASS</span>=xsmtpsib-fda5ca0233b802e19fac1fe4808f3259c159306aea190a481770b37a493007f7-LlT6AyXKdFhiZHUw<br />
                      <span className="text-indigo-400">SMTP_FROM</span>=4mh23cs185@gmail.com
                    </div>
                  </div>

                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                    <li>Log into your <strong>Render Dashboard</strong>.</li>
                    <li>Select your Web Service: <strong>mitm-placepro-api</strong>.</li>
                    <li>Navigate to the <strong>Environment</strong> tab on the left.</li>
                    <li>Add the 5 environment keys shown above exactly.</li>
                    <li>Click <strong>Save Changes</strong>. Render will automatically redeploy with emails active!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
