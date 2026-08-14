'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { InternshipPermission } from '@/types';
import PrintableForm from '@/components/internship/PrintableForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminPrintableFormPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [form, setForm] = useState<InternshipPermission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchForm = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getInternshipPermission(id);
        setForm((res?.data ?? null) as InternshipPermission | null);
      } catch {
        setError('Failed to load the form data.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <p className="text-red-600 mb-4">{error || 'Form not found.'}</p>
        <button onClick={() => router.push('/admin/internship-permissions')} className="i-btn-dark">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print p-4">
        <Link href="/admin/internship-permissions" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Internship Permissions
        </Link>
      </div>
      <PrintableForm form={form} />
    </div>
  );
}
