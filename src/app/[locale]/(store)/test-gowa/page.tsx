'use client';

import React, { useState } from 'react';
import { main_color } from '@/app/lib/constants';
import { toast } from 'sonner';

export default function TestGowaPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('Hello from GOWA Test Page!');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      });

      const data = await res.json();
      setResponse(data);

      if (res.ok && data.success) {
        toast.success(`Message sent successfully via ${data.provider}!`);
      } else {
        toast.error(`Failed to send message: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Test send failed:', err);
      toast.error('Network error or API is down');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">GOWA WhatsApp Tester</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Use this page to verify your GOWA connection and test sending WhatsApp messages.
      </p>

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Phone Number (+E.164)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+972591234567"
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 outline-none transition-all"
            style={{ borderColor: '#e5e7eb' }}
            onFocus={(e) => (e.target.style.borderColor = main_color)}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Include country code (e.g., +972 or +970)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message Content
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 outline-none transition-all resize-none"
            style={{ borderColor: '#e5e7eb' }}
            onFocus={(e) => (e.target.style.borderColor = main_color)}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-white font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          style={{ backgroundColor: main_color }}
        >
          {loading ? 'Sending...' : 'Send Test Message'}
        </button>
      </form>

      {response && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">API Response:</h2>
          <pre className="bg-gray-50 p-4 rounded-xl text-xs overflow-x-auto border border-gray-200">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 flex gap-4 text-[11px] text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: response?.success ? '#10b981' : '#d1d5db' }}></div>
          Status: {response?.success ? 'Success' : 'Idle'}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: response?.provider === 'gowa' ? '#3b82f6' : (response?.provider === 'twilio' ? '#ef4444' : '#d1d5db') }}></div>
          Provider: {response?.provider || 'None'}
        </div>
      </div>
    </div>
  );
}
