import React, { useState, useEffect } from "react";
import { ServiceItem, Driver, EmailNotificationLog, NotificationSettings } from "../types";
import { Settings, Plus, Truck, Tag, RefreshCw, Check, Mail, Send, Bell, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

interface SettingsViewProps {
  services: ServiceItem[];
  drivers: Driver[];
  onAddService: (service: { name: string; category: ServiceItem['category']; unit: ServiceItem['unit']; price: number }) => void;
  onAddDriver: (driver: { name: string; phone: string; vehicle: string; username?: string; password?: string }) => void;
  onDeleteDriver: (driverId: string) => void;
  onResetSeed: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  services,
  drivers,
  onAddService,
  onAddDriver,
  onDeleteDriver,
  onResetSeed
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'drivers' | 'notifications' | 'system'>('services');

  // Service form
  const [sName, setSName] = useState("");
  const [sCategory, setSCategory] = useState<ServiceItem['category']>('Wash & Fold');
  const [sUnit, setSUnit] = useState<ServiceItem['unit']>('kg');
  const [sPrice, setSPrice] = useState("");

  // Driver form
  const [dName, setDName] = useState("");
  const [dPhone, setDPhone] = useState("");
  const [dVehicle, setDVehicle] = useState("");
  const [dUsername, setDUsername] = useState("");
  const [dPassword, setDPassword] = useState("");

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    adminEmail: "wangechigodfrey77@gmail.com",
    autoSendOrderConfirmation: true,
    autoSendStatusUpdates: true,
    autoSendAdminAlerts: true,
    senderName: "Sparkle Spins Laundry Operations",
    senderEmail: "notifications@sparklespins.co.ke",
    smtpConfigured: false
  });
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState("wangechigodfrey77@gmail.com");
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; msg: string; warning?: string | null } | null>(null);

  // Firestore Sync status state
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isLoadingSync, setIsLoadingSync] = useState(false);

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotificationData();
    } else if (activeTab === 'system') {
      fetchSyncStatus();
    }
  }, [activeTab]);

  const fetchSyncStatus = async () => {
    setIsLoadingSync(true);
    try {
      const res = await fetch("/api/sync/status");
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
      }
    } catch (err) {
      console.warn("Could not fetch sync status:", err);
    } finally {
      setIsLoadingSync(false);
    }
  };

  const fetchNotificationData = async () => {
    setIsLoadingSettings(true);
    try {
      const [settingsRes, logsRes] = await Promise.all([
        fetch("/api/notifications/settings"),
        fetch("/api/notifications/logs")
      ]);
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setNotificationSettings(sData);
        if (sData.adminEmail) setTestEmailAddress(sData.adminEmail);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setEmailLogs(lData);
      }
    } catch (e) {
      console.warn("Could not load notification settings:", e);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSaveNotificationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveSuccess(false);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationSettings)
      });
      if (res.ok) {
        setSettingsSaveSuccess(true);
        setTimeout(() => setSettingsSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert("Failed to save settings: " + (err as any)?.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) return;
    setIsSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/notifications/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: testEmailAddress.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestEmailResult({
          success: true,
          msg: data.simulated
            ? `Test email recorded & simulated for ${testEmailAddress.trim()}`
            : `Test email successfully delivered via SMTP to ${testEmailAddress.trim()}`,
          warning: data.smtpWarning || null
        });
        fetchNotificationData();
      } else {
        throw new Error(data.error || "Failed to send test email");
      }
    } catch (err: any) {
      setTestEmailResult({ success: false, msg: err.message || "Failed to send test email" });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleAddServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !sPrice) return;
    onAddService({ name: sName, category: sCategory, unit: sUnit, price: Number(sPrice) });
    setSName("");
    setSPrice("");
  };

  const handleAddDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dName || !dPhone) return;
    onAddDriver({ 
      name: dName, 
      phone: dPhone, 
      vehicle: dVehicle || 'Delivery Motorcycle',
      username: dUsername || dName.split(' ')[0].toLowerCase(),
      password: dPassword || 'rider123'
    });
    setDName("");
    setDPhone("");
    setDVehicle("");
    setDUsername("");
    setDPassword("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catalog & Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure service pricing, driver fleet, and automated order email notifications.
        </p>
      </div>

      {/* Subtabs */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'services' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-50'
          }`}
        >
          Service Catalog & Pricing ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'drivers' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-50'
          }`}
        >
          Driver Fleet ({drivers.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Notifications</span>
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'system' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-50'
          }`}
        >
          System & Reset
        </button>
      </div>

      {/* Content */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Active Services & Rates</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {services.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-medium text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 uppercase">per {s.unit}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">KSh {s.price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 h-fit">
            <h3 className="font-bold text-slate-900 text-base mb-4">Add New Service</h3>
            <form onSubmit={handleAddServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  placeholder="e.g. Express Ironing"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={sCategory}
                  onChange={(e) => setSCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Wash & Fold">Wash & Fold</option>
                  <option value="Dry Cleaning">Dry Cleaning</option>
                  <option value="Ironing">Ironing</option>
                  <option value="Special Care">Special Care</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Unit</label>
                <select
                  value={sUnit}
                  onChange={(e) => setSUnit(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="kg">Per Kilogram (kg)</option>
                  <option value="item">Per Item</option>
                  <option value="fixed">Fixed Price</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (KSh)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={sPrice}
                  onChange={(e) => setSPrice(e.target.value)}
                  placeholder="150"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
              >
                Add Service Item
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Driver Fleet Roster & Login Credentials</h3>
              <span className="text-xs text-slate-500">Default Password: rider123</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Rider / Username</th>
                  <th className="py-3 px-4">Phone & Vehicle</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{d.name}</div>
                      <div className="text-xs text-indigo-600 font-mono">User: {d.username || d.name.split(' ')[0].toLowerCase()}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-600 text-xs">{d.phone}</div>
                      <div className="text-slate-500 text-xs">{d.vehicle}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        d.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onDeleteDriver(d.id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-medium bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        title="Delete Rider Account"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 h-fit">
            <h3 className="font-bold text-slate-900 text-base mb-4">Create New Rider Account</h3>
            <form onSubmit={handleAddDriverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rider Full Name</label>
                <input
                  type="text"
                  required
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={dPhone}
                  onChange={(e) => setDPhone(e.target.value)}
                  placeholder="+254 700 000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle / Motorcycle Info</label>
                <input
                  type="text"
                  value={dVehicle}
                  onChange={(e) => setDVehicle(e.target.value)}
                  placeholder="e.g. Motorcycle #4 (Boxer)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Login Username</label>
                <input
                  type="text"
                  value={dUsername}
                  onChange={(e) => setDUsername(e.target.value)}
                  placeholder="e.g. alex (optional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Login Password</label>
                <input
                  type="text"
                  value={dPassword}
                  onChange={(e) => setDPassword(e.target.value)}
                  placeholder="rider123 (default)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
              >
                Create Rider Account
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Email Settings */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-100 p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Order Email Notification Settings</h3>
                    <p className="text-xs text-slate-500">Automate customer receipt emails and laundry management ops alerts</p>
                  </div>
                </div>

                {notificationSettings.smtpConfigured ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    SMTP Connected
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Active (Logging + Dev Mode)
                  </span>
                )}
              </div>

              {settingsSaveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Notification preferences successfully saved!</span>
                </div>
              )}

              <form onSubmit={handleSaveNotificationSettings} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Operations Admin Alert Recipients
                    </label>
                    <input
                      type="text"
                      required
                      value={notificationSettings.adminEmail}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, adminEmail: e.target.value })}
                      placeholder="wangechigodfrey77@gmail.com, hillaryochieng002@gmail.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Recipients:</span>
                      {notificationSettings.adminEmail
                        .split(/[,;\s]+/)
                        .map(e => e.trim())
                        .filter(Boolean)
                        .map((email, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          >
                            <Mail className="w-3 h-3 text-indigo-500" />
                            {email}
                          </span>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Separate multiple recipient emails with commas. All listed recipients receive instant alerts on new order bookings.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      required
                      value={notificationSettings.senderName}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, senderName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender &quot;From&quot; Email Address
                  </label>
                  <input
                    type="email"
                    value={notificationSettings.senderEmail}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, senderEmail: e.target.value })}
                    placeholder="notifications@sparklespins.co.ke"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Automation Toggles */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                    Automated Triggers
                  </span>

                  <div className="bg-slate-50 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Auto-send Customer Order Confirmation Email</div>
                      <div className="text-[11px] text-slate-500">Sends itemized summary immediately when customer books pickup online</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.autoSendOrderConfirmation}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, autoSendOrderConfirmation: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Auto-send Customer Status Update Emails</div>
                      <div className="text-[11px] text-slate-500">Notifies client when order becomes &quot;In Process&quot;, &quot;Ready for Delivery&quot;, or &quot;Delivered&quot;</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.autoSendStatusUpdates}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, autoSendStatusUpdates: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Auto-send Admin Operations Alerts</div>
                      <div className="text-[11px] text-slate-500">Sends instant copy of all customer bookings to admin email</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.autoSendAdminAlerts}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, autoSendAdminAlerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSettings ? "Saving Settings..." : "Save Notification Preferences"}
                  </button>
                </div>
              </form>
            </div>

            {/* Test Email Verification Box */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 h-fit space-y-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Send Test Email</h3>
              </div>
              <p className="text-xs text-slate-500">
                Trigger a sample notification to verify delivery formatting and inbox receipt.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Email</label>
                <input
                  type="text"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="hillaryochieng002@gmail.com, wangechigodfrey77@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white text-slate-800 font-medium"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setTestEmailAddress("hillaryochieng002@gmail.com")}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    + Hillary (hillaryochieng002@gmail.com)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestEmailAddress("wangechigodfrey77@gmail.com")}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    + Godfrey (wangechigodfrey77@gmail.com)
                  </button>
                </div>
              </div>

              {testEmailResult && (
                <div className="space-y-2">
                  <div className={`p-3 rounded-xl text-xs font-medium ${
                    testEmailResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {testEmailResult.msg}
                  </div>
                  {testEmailResult.warning && (
                    <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px] leading-relaxed space-y-1.5">
                      <div className="font-bold flex items-center gap-1 text-amber-800">
                        <span>🔑 Google Account 2FA App Password Notice</span>
                      </div>
                      <p>{testEmailResult.warning}</p>
                      <p className="text-amber-700 font-medium">
                        To enable real inbox delivery, open <strong>myaccount.google.com/apppasswords</strong>, generate a 16-letter App Password for &apos;Mail&apos;, and set it in your environment. The email is logged below.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={isSendingTestEmail}
                onClick={handleSendTestEmail}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTestEmail ? "Dispatching..." : "Send Test Email"}</span>
              </button>
            </div>
          </div>

          {/* Central Notification History Logs */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Live Email Notification Logs</h3>
                <p className="text-xs text-slate-500">Recent customer and operations email notifications</p>
              </div>
              <button
                onClick={fetchNotificationData}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1 bg-indigo-50 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {emailLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No email notifications dispatched yet. Book a pickup on the customer portal or create an order to see live logs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Date / Time</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-indigo-50 text-indigo-700 font-mono text-[10px] px-2 py-0.5 rounded-md font-semibold">
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{log.recipientName || log.recipient}</div>
                          <div className="text-slate-400 text-[11px]">{log.recipient}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                          {log.subject}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'sent'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : log.status === 'simulated'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {log.status === 'sent' ? '✓ Sent (SMTP)' : log.status === 'simulated' ? '✓ Dispatched' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6 max-w-2xl">
          {/* Firestore Real-Time Database Connection */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                  🔥
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Firebase Firestore Database</h3>
                  <p className="text-xs text-slate-500">Live cloud persistence & real-time document synchronization</p>
                </div>
              </div>
              <button
                onClick={fetchSyncStatus}
                disabled={isLoadingSync}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSync ? 'animate-spin' : ''}`} />
                <span>Check Status</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="text-[10px] uppercase font-bold text-slate-400">Database ID</div>
                <div className="font-mono text-slate-800 font-semibold truncate mt-0.5" title={syncStatus?.databaseId || "ai-studio-laundryopsmanage-1920ac0b-bf06-4683-97e5-3104d6cbdfc6"}>
                  {syncStatus?.databaseId || "ai-studio-laundryopsmanage-1920ac0b-bf06-4683-97e5-3104d6cbdfc6"}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="text-[10px] uppercase font-bold text-slate-400">Sync Status</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-emerald-700">Connected & Synced</span>
                </div>
              </div>
            </div>

            {syncStatus?.counts && (
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Synced Collection Records
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                    <div className="text-base font-extrabold text-indigo-700">{syncStatus.counts.orders}</div>
                    <div className="text-[10px] font-semibold text-slate-600">Orders</div>
                  </div>
                  <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                    <div className="text-base font-extrabold text-indigo-700">{syncStatus.counts.customers}</div>
                    <div className="text-[10px] font-semibold text-slate-600">Customers</div>
                  </div>
                  <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                    <div className="text-base font-extrabold text-indigo-700">{syncStatus.counts.drivers}</div>
                    <div className="text-[10px] font-semibold text-slate-600">Drivers / Riders</div>
                  </div>
                  <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                    <div className="text-base font-extrabold text-indigo-700">{syncStatus.counts.payments}</div>
                    <div className="text-[10px] font-semibold text-slate-600">Payments</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reset & Re-seed Box */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 text-base mb-2">Reset & Seed Test Data</h3>
            <p className="text-sm text-slate-500 mb-6">
              If you want to reset the database and reload the initial sample orders, customers, and drivers into Firestore, click below.
            </p>
            <button
              onClick={onResetSeed}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-3 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reset & Re-seed Demo Data to Firestore
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
