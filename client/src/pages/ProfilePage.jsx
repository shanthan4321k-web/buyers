import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Save,
  Sprout,
  Edit3,
  X,
  Phone,
  Mail,
  FileCheck,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { Card } from '../components/common/Card.jsx';
import { Button } from '../components/common/Button.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { Badge } from '../components/common/Badge.jsx';

const buyerTypes = [
  'Retailer',
  'Wholesaler',
  'Local produce trader',
  'Distributor',
  'Food processor or mill',
  'Restaurant or catering business',
  'Other business buyer',
];

const indianStates = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const popularCropsSuggestions = [
  'Wheat', 'Rice (Paddy)', 'Basmati Rice', 'Cotton', 'Maize (Corn)',
  'Soybean', 'Mustard', 'Tomato', 'Onion', 'Potato', 'Chilli',
  'Turmeric', 'Sugarcane', 'Chickpea (Chana)', 'Pigeon Pea (Tur/Arhar)',
  'Banana', 'Mango', 'Apple', 'Garlic', 'Ginger',
];

const schema = z.object({
  business_name: z.string().trim().min(2, 'Business name must be at least 2 characters'),
  contact_person: z.string().trim().min(2, "Contact person's name is required"),
  mobile_number: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  buyer_type: z.enum([
    'Retailer', 'Wholesaler', 'Local produce trader', 'Distributor',
    'Food processor or mill', 'Restaurant or catering business', 'Other business buyer'
  ]),
  state: z.string().min(1, 'State is required'),
  district: z.string().trim().min(1, 'District is required'),
  city_town: z.string().trim().min(1, 'City/Town is required'),
  business_location: z.string().trim().min(2, 'Delivery or Business location is required'),
  business_address: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
  typical_quantity_range: z.string().trim().min(1, 'Typical quantity is required'),
  preferred_payment_terms: z.string().trim().optional(),
  preferred_procurement_radius_km: z.coerce.number().positive().default(100),
  quality_requirements: z.string().trim().optional(),
});

export const ProfilePage = () => {
  const { profile, refreshProfile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState(profile?.preferred_crops || []);
  const [cropInput, setCropInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      business_name: profile?.business_name || '',
      contact_person: profile?.contact_person || '',
      mobile_number: profile?.mobile_number || '',
      buyer_type: profile?.buyer_type || 'Wholesaler',
      state: profile?.state || 'Maharashtra',
      district: profile?.district || '',
      city_town: profile?.city_town || '',
      business_location: profile?.business_location || '',
      business_address: profile?.business_address || '',
      gstin: profile?.gstin || '',
      typical_quantity_range: profile?.typical_quantity_range || '',
      preferred_payment_terms: profile?.preferred_payment_terms || '',
      preferred_procurement_radius_km: profile?.preferred_procurement_radius_km || 100,
      quality_requirements: profile?.quality_requirements || '',
    },
  });

  // Sync form defaults whenever profile is refreshed or edit mode is toggled
  useEffect(() => {
    if (profile) {
      setSelectedCrops(profile.preferred_crops || []);
      reset({
        business_name: profile.business_name || '',
        contact_person: profile.contact_person || '',
        mobile_number: profile.mobile_number || '',
        buyer_type: profile.buyer_type || 'Wholesaler',
        state: profile.state || 'Maharashtra',
        district: profile.district || '',
        city_town: profile.city_town || '',
        business_location: profile.business_location || '',
        business_address: profile.business_address || '',
        gstin: profile.gstin || '',
        typical_quantity_range: profile.typical_quantity_range || '',
        preferred_payment_terms: profile.preferred_payment_terms || '',
        preferred_procurement_radius_km: profile.preferred_procurement_radius_km || 100,
        quality_requirements: profile.quality_requirements || '',
      });
    }
  }, [profile, reset, isEditing]);

  const handleStartEdit = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMsg(null);
    if (profile) {
      setSelectedCrops(profile.preferred_crops || []);
      reset({
        business_name: profile.business_name || '',
        contact_person: profile.contact_person || '',
        mobile_number: profile.mobile_number || '',
        buyer_type: profile.buyer_type || 'Wholesaler',
        state: profile.state || 'Maharashtra',
        district: profile.district || '',
        city_town: profile.city_town || '',
        business_location: profile.business_location || '',
        business_address: profile.business_address || '',
        gstin: profile.gstin || '',
        typical_quantity_range: profile.typical_quantity_range || '',
        preferred_payment_terms: profile.preferred_payment_terms || '',
        preferred_procurement_radius_km: profile.preferred_procurement_radius_km || 100,
        quality_requirements: profile.quality_requirements || '',
      });
    }
  };

  const toggleCrop = (crop) => {
    if (selectedCrops.includes(crop)) {
      setSelectedCrops(selectedCrops.filter((c) => c !== crop));
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  const handleAddCrop = (e) => {
    e.preventDefault();
    if (cropInput.trim() && !selectedCrops.includes(cropInput.trim())) {
      setSelectedCrops([...selectedCrops, cropInput.trim()]);
      setCropInput('');
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        ...data,
        preferred_crops: selectedCrops,
      };

      const res = await api.put('/buyer-profile', payload);
      if (res.data?.success) {
        await refreshProfile();
        setSuccessMsg('Buyer profile updated successfully.');
        setIsEditing(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-agri-50 to-emerald-50 rounded-full blur-3xl -z-0 opacity-70 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-agri-600 to-agri-800 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-agri-600/20 shrink-0">
              {profile?.business_name ? profile.business_name.charAt(0).toUpperCase() : 'B'}
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {profile?.business_name || 'Commercial Buyer Profile'}
                </h1>
                <Badge variant="agri" className="gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-agri-700" /> Verified Commercial Buyer
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                <span>{profile?.buyer_type || 'Wholesaler'}</span>
                {profile?.district && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {profile.district}, {profile.state}
                    </span>
                  </>
                )}
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200">
                  30-Day Active Session
                </span>
              </p>
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                icon={Edit3}
                onClick={handleStartEdit}
                className="shadow-sm"
              >
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </div>

      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}
      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}

      {/* VIEW MODE */}
      {!isEditing && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Business & Contact Card */}
            <Card className="p-6 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-agri-600" />
                  <h2 className="text-base font-semibold text-slate-900">Business Identity & Contact</h2>
                </div>
                <Button size="sm" variant="ghost" icon={Edit3} onClick={handleStartEdit}>
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Business / Firm Name</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{profile?.business_name || '—'}</p>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Buyer Category</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{profile?.buyer_type || '—'}</p>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contact Person</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{profile?.contact_person || '—'}</p>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registered Phone</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-agri-600" />
                    +91 {profile?.mobile_number || '—'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">GSTIN Registration</p>
                  <p className="text-sm font-mono font-medium text-slate-900 mt-1">
                    {profile?.gstin ? (
                      <span className="text-slate-900 font-semibold">{profile.gstin}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not registered / Optional</span>
                    )}
                  </p>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Auth Account Email</p>
                  <p className="text-sm font-medium text-slate-900 mt-1 flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-agri-600 shrink-0" />
                    <span className="truncate">{user?.email || '—'}</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Status / Session Summary */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileCheck className="w-5 h-5 text-agri-600" />
                <h2 className="text-base font-semibold text-slate-900">Session & Verification</h2>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <span className="font-medium text-emerald-900">Profile Status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Complete
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Session Persistence</span>
                  <span className="font-semibold text-slate-800">30 Days (Active)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Auth ID</span>
                  <span className="font-mono text-slate-700">{user?.id ? `${user.id.slice(0, 10)}...` : '—'}</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                  Your buyer credentials and procurement terms are saved for seamless order matching and direct farmer trade negotiations.
                </p>
              </div>
            </Card>
          </div>

          {/* 2. Procurement Logistics & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-agri-600" />
                  <h2 className="text-base font-semibold text-slate-900">Delivery & Operating Hub</h2>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Primary Delivery Warehouse Hub</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{profile?.business_location || '—'}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">City / Town</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">{profile?.city_town || '—'}</p>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">District</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">{profile?.district || '—'}</p>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">State</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">{profile?.state || '—'}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Preferred Procurement Radius</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      Within {profile?.preferred_procurement_radius_km || 100} km of hub
                    </p>
                  </div>
                  <Badge variant="neutral">{profile?.preferred_procurement_radius_km || 100} km</Badge>
                </div>
              </div>
            </Card>

            {/* 3. Purchasing Preferences & Portfolio */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-agri-600" />
                  <h2 className="text-base font-semibold text-slate-900">Procurement Preferences</h2>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Preferred Crops Portfolio</p>
                  {profile?.preferred_crops && profile.preferred_crops.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.preferred_crops.map((crop) => (
                        <span
                          key={crop}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-agri-50 text-agri-800 border border-agri-200/80"
                        >
                          {crop}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No crops selected yet.</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Typical Order Quantity</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{profile?.typical_quantity_range || '—'}</p>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Preferred Payment Terms</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{profile?.preferred_payment_terms || '—'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center justify-between bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-600 font-medium">
              Want to source produce directly based on your preferences?
            </p>
            <div className="flex gap-2">
              <Link to="/crops">
                <Button size="sm" variant="outline" icon={Sprout}>
                  Browse Lots
                </Button>
              </Link>
              <Link to="/requirements?action=new">
                <Button size="sm" variant="primary" icon={ArrowRight}>
                  Post Requirement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODE */}
      {isEditing && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl text-amber-800 text-xs">
            <span className="font-semibold">Editing Mode: Update your business details, operating hub, and preferred commodities.</span>
            <Button size="sm" variant="secondary" icon={X} onClick={handleCancelEdit}>
              Cancel Editing
            </Button>
          </div>

          {/* Section 1: Business Identity & Contact */}
          <Card className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-agri-600" />
                <h2 className="text-base font-semibold text-slate-900">1. Business Identity & Contact Details</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Business / Trading Name *
                </label>
                <input
                  type="text"
                  {...register('business_name')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.business_name && <p className="text-xs text-red-600 mt-1">{errors.business_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Buyer Category *
                </label>
                <select
                  {...register('buyer_type')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                >
                  {buyerTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.buyer_type && <p className="text-xs text-red-600 mt-1">{errors.buyer_type.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  {...register('contact_person')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.contact_person && <p className="text-xs text-red-600 mt-1">{errors.contact_person.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  {...register('mobile_number')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.mobile_number && <p className="text-xs text-red-600 mt-1">{errors.mobile_number.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  GSTIN Registration (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  {...register('gstin')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Operating Location & Hub */}
          <Card className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-agri-600" />
              <h2 className="text-base font-semibold text-slate-900">2. Procurement & Warehouse Hub Location</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">State *</label>
                <select
                  {...register('state')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                >
                  {indianStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">District *</label>
                <input
                  type="text"
                  placeholder="e.g. Nashik"
                  {...register('district')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.district && <p className="text-xs text-red-600 mt-1">{errors.district.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">City / Town / Mandi *</label>
                <input
                  type="text"
                  placeholder="e.g. Pimpalgaon"
                  {...register('city_town')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.city_town && <p className="text-xs text-red-600 mt-1">{errors.city_town.message}</p>}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Delivery Warehouse Hub Location *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot No 12, APMC Market Yard, Warehouse 4"
                  {...register('business_location')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.business_location && <p className="text-xs text-red-600 mt-1">{errors.business_location.message}</p>}
              </div>
            </div>
          </Card>

          {/* Section 3: Crops & Commercial Terms */}
          <Card className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sprout className="w-5 h-5 text-agri-600" />
              <h2 className="text-base font-semibold text-slate-900">3. Preferred Commodities & Purchasing Terms</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Preferred Crops Portfolio
              </label>

              {/* Selected crops chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedCrops.map((crop) => (
                  <span
                    key={crop}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-agri-600 text-white shadow-xs"
                  >
                    {crop}
                    <button
                      type="button"
                      onClick={() => toggleCrop(crop)}
                      className="hover:text-red-200 transition-colors ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Popular crop suggestions */}
              <div className="mb-3">
                <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Quick Add Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {popularCropsSuggestions
                    .filter((c) => !selectedCrops.includes(c))
                    .slice(0, 12)
                    .map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCrop(c)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                      >
                        + {c}
                      </button>
                    ))}
                </div>
              </div>

              {/* Add custom crop input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cropInput}
                  onChange={(e) => setCropInput(e.target.value)}
                  placeholder="Add custom crop (e.g. Cardamom, Sunflower)..."
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                <Button size="sm" variant="secondary" onClick={handleAddCrop}>
                  Add Crop
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Typical Purchasing Quantity *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50 - 200 Quintals"
                  {...register('typical_quantity_range')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.typical_quantity_range && (
                  <p className="text-xs text-red-600 mt-1">{errors.typical_quantity_range.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Procurement Radius (km)
                </label>
                <input
                  type="number"
                  placeholder="100"
                  {...register('preferred_procurement_radius_km')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Payment Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50% on weighing, balance upon warehouse delivery"
                  {...register('preferred_payment_terms')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              icon={Save}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
