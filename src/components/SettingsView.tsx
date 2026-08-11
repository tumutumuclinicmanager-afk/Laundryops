import React, { useState } from "react";
import { ServiceItem, Driver } from "../types";
import { Settings, Plus, Truck, Tag, RefreshCw, Check } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<'services' | 'drivers' | 'system'>('services');

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
          Configure service pricing, manage driver fleet, and test data settings.
        </p>
      </div>

      {/* Subtabs */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex items-center gap-2">
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

      {activeTab === 'system' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 max-w-xl">
          <h3 className="font-bold text-slate-900 text-base mb-2">Reset & Seed Test Data</h3>
          <p className="text-sm text-slate-500 mb-6">
            If you want to reset the database back to initial sample orders, customers, and drivers, click below.
          </p>
          <button
            onClick={onResetSeed}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-3 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reset & Re-seed Demo Data
          </button>
        </div>
      )}
    </div>
  );
};
