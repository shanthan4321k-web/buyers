import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CheckCircle2, ShieldAlert, ArrowRight, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { Button } from '../components/common/Button.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';

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

const commonCropsList = [
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
  ], { required_error: 'Please select your buyer category' }),
  state: z.string().min(1, 'State is required'),
  district: z.string().trim().min(1, 'District is required'),
  city_town: z.string().trim().min(1, 'City/Town is required'),
  business_location: z.string().trim().min(2, 'Delivery or Business location is required'),
  business_address: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
  typical_quantity_range: z.string().trim().min(1, 'Typical procurement quantity is required'),
  preferred_payment_terms: z.string().trim().optional(),
  preferred_procurement_radius_km: z.coerce.number().positive().default(100),
  quality_requirements: z.string().trim().optional(),
});

export const CompleteProfilePage = () => {
  const { user, profile, isProfileComplete, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedCrops, setSelectedCrops] = useState(profile?.preferred_crops || []);
  const [cropInput, setCropInput] = useState('');
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <LoadingSpinner text="Loading profile setup..." size="lg" />
      </div>
    );
  }

  // If not logged in, ask for login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If profile is already filled once, redirect straight to dashboard
  if (isProfileComplete || profile?.business_name) {
    return <Navigate to="/dashboard" replace />;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      business_name: profile?.business_name || user?.user_metadata?.business_name || '',
      contact_person: profile?.contact_person || user?.user_metadata?.full_name || user?.user_metadata?.name || '',
      mobile_number: profile?.mobile_number || user?.phone || user?.user_metadata?.phone || '',
      buyer_type: profile?.buyer_type || 'Wholesaler',
      state: profile?.state || 'Maharashtra',
      district: profile?.district || '',
      city_town: profile?.city_town || '',
      business_location: profile?.business_location || '',
      business_address: profile?.business_address || '',
      gstin: profile?.gstin || '',
      typical_quantity_range: profile?.typical_quantity_range || '10 - 100 quintals per order',
      preferred_payment_terms: profile?.preferred_payment_terms || '50% advance on weighing, balance upon delivery',
      preferred_procurement_radius_km: profile?.preferred_procurement_radius_km || 150,
      quality_requirements: profile?.quality_requirements || '',
    },
  });

  const toggleCrop = (crop) => {
    if (selectedCrops.includes(crop)) {
      setSelectedCrops(selectedCrops.filter((c) => c !== crop));
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  const handleAddCustomCrop = (e) => {
    e.preventDefault();
    if (cropInput.trim() && !selectedCrops.includes(cropInput.trim())) {
      setSelectedCrops([...selectedCrops, cropInput.trim()]);
      setCropInput('');
    }
  };

  const onSubmit = async (data) => {
    if (selectedCrops.length === 0) {
      setServerError('Please select at least one preferred crop category');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        ...data,
        preferred_crops: selectedCrops,
      };

      const res = await api.post('/buyer-profile', payload);
      if (res.data?.success) {
        await refreshProfile();
        navigate('/dashboard');
      }
    } catch (err) {
      setServerError(err.message || 'Failed to save buyer profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header & Step progress */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-agri-600 text-white flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Complete Buyer Profile</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Provide your commercial business details to unlock direct farmer listings and procurement.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-agri-700">Step 1 of 1: Commercial Registration</span>
            <span className="flex items-center gap-1 text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-agri-600" /> Real database verified
            </span>
          </div>
        </div>

        {serverError && <Alert type="error" message={serverError} className="mb-6" onClose={() => setServerError(null)} />}

        {/* Profile Completion Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Business Details */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
              1. Business & Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Business / Trading Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kisan Agro Traders"
                  {...register('business_name')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.business_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.business_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Buyer Category *
                </label>
                <select
                  {...register('buyer_type')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500 bg-white"
                >
                  {buyerTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.buyer_type && (
                  <p className="mt-1 text-xs text-red-600">{errors.buyer_type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  {...register('contact_person')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.contact_person && (
                  <p className="mt-1 text-xs text-red-600">{errors.contact_person.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  {...register('mobile_number')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.mobile_number && (
                  <p className="mt-1 text-xs text-red-600">{errors.mobile_number.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  {...register('gstin')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Operating Location */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
              2. Procurement & Delivery Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Operating State *
                </label>
                <select
                  {...register('state')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500 bg-white"
                >
                  {indianStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  District *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nashik"
                  {...register('district')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.district && (
                  <p className="mt-1 text-xs text-red-600">{errors.district.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City / Town / Mandi *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pimpalgaon"
                  {...register('city_town')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.city_town && (
                  <p className="mt-1 text-xs text-red-600">{errors.city_town.message}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Delivery / Warehouse Hub Location *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot No 12, APMC Market Yard, Warehouse 4"
                  {...register('business_location')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                {errors.business_location && (
                  <p className="mt-1 text-xs text-red-600">{errors.business_location.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Crops & Purchasing Preferences */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
              3. Procurement Preferences
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Preferred Crops to Procure *
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {commonCropsList.map((crop) => {
                  const isSelected = selectedCrops.includes(crop);
                  return (
                    <button
                      type="button"
                      key={crop}
                      onClick={() => toggleCrop(crop)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        isSelected
                          ? 'bg-agri-600 text-white border-agri-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {crop} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={cropInput}
                  onChange={(e) => setCropInput(e.target.value)}
                  placeholder="Add other crop (e.g. Cardamom, Sunflower)..."
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
                <Button size="sm" variant="secondary" onClick={handleAddCustomCrop}>
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
                  <p className="mt-1 text-xs text-red-600">{errors.typical_quantity_range.message}</p>
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
                  placeholder="e.g. Direct bank transfer on delivery inspection"
                  {...register('preferred_payment_terms')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full"
              icon={ArrowRight}
            >
              Complete Profile & Enter Dashboard
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
