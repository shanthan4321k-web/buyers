import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Sparkles,
  Calendar,
  MapPin,
  PauseCircle,
  PlayCircle,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info,
  Building2,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api.js';
import { Card } from '../components/common/Card.jsx';
import { Button } from '../components/common/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';

export const BuyingRequirementsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldOpenNew = searchParams.get('action') === 'new';

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New / Edit Requirement Modal
  const [isModalOpen, setIsModalOpen] = useState(shouldOpenNew);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Requirement Form Data
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [requiredQty, setRequiredQty] = useState('');
  const [unit, setUnit] = useState('quintal');
  const [priceType, setPriceType] = useState('max_willing_to_pay');
  const [maxPrice, setMaxPrice] = useState('');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryState, setDeliveryState] = useState('Maharashtra');
  const [deliveryDistrict, setDeliveryDistrict] = useState('');
  const [transportPreference, setTransportPreference] = useState('buyer_arranged');
  const [qualityReqs, setQualityReqs] = useState('');
  const [packagingReqs, setPackagingReqs] = useState('');
  const [paymentPrefs, setPaymentPrefs] = useState('50% on loading, balance on weighbridge receipt');
  const [notes, setNotes] = useState('');

  // Compatible Matches Drawer / Modal
  const [selectedReqForMatches, setSelectedReqForMatches] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isMatchesModalOpen, setIsMatchesModalOpen] = useState(false);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/requirements');
      if (res.data?.success) {
        setRequirements(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch buying requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleCreateRequirement = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        crop_name: cropName.trim(),
        variety: variety.trim() || null,
        required_quantity: Number(requiredQty),
        unit,
        max_price_per_unit: maxPrice ? Number(maxPrice) : null,
        price_type: priceType,
        price_unit: `INR/${unit}`,
        required_by_date: requiredByDate,
        delivery_location: deliveryLocation.trim(),
        delivery_state: deliveryState,
        delivery_district: deliveryDistrict.trim(),
        quality_requirements: qualityReqs.trim() || null,
        packaging_requirements: packagingReqs.trim() || null,
        transport_preference: transportPreference,
        payment_preferences: paymentPrefs.trim() || null,
        notes: notes.trim() || null,
      };

      const res = await api.post('/requirements', payload);
      if (res.data?.success) {
        setIsModalOpen(false);
        resetForm();
        await fetchRequirements();
        // Immediately trigger deterministic matching for newly created requirement
        if (res.data.data?.id) {
          openMatchesModal(res.data.data);
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save requirement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.patch(`/requirements/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        setRequirements((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const openMatchesModal = async (req) => {
    setSelectedReqForMatches(req);
    setIsMatchesModalOpen(true);
    setLoadingMatches(true);
    try {
      const res = await api.get(`/requirements/${req.id}/matches`);
      if (res.data?.success) {
        setMatches(res.data.data);
      }
    } catch (err) {
      console.error('Matching error:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const resetForm = () => {
    setCropName('');
    setVariety('');
    setRequiredQty('');
    setMaxPrice('');
    setRequiredByDate('');
    setDeliveryLocation('');
    setDeliveryDistrict('');
    setQualityReqs('');
    setPackagingReqs('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Buying Requirements (Demand Postings)</h1>
          <p className="text-sm text-slate-500">
            Post your procurement requirements to discover and match with compatible regional farmers.
          </p>
        </div>

        <Button
          variant="primary"
          icon={PlusCircle}
          onClick={() => {
            resetForm();
            setFormError(null);
            setIsModalOpen(true);
          }}
        >
          Post New Requirement
        </Button>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner text="Fetching your buying requirements..." size="lg" />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : requirements.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Buying Requirements Posted"
          description="You haven't posted any crop requirements yet. When you post a requirement, AgriGuide automatically matches it against active farmer listings."
          actionLabel="Post Your First Requirement"
          actionIcon={PlusCircle}
          onAction={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {requirements.map((req) => {
            const isFulfilled = req.status === 'FULFILLED';
            const isPaused = req.status === 'PAUSED';
            const isCancelled = req.status === 'CANCELLED';

            return (
              <Card key={req.id} hover className="p-5 sm:p-6 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-bold text-slate-900">{req.crop_name}</h3>
                      {req.variety && <Badge variant="default">Variety: {req.variety}</Badge>}
                      <Badge
                        variant={
                          req.status === 'ACTIVE'
                            ? 'success'
                            : req.status === 'PAUSED'
                            ? 'warning'
                            : req.status === 'FULFILLED'
                            ? 'purple'
                            : 'danger'
                        }
                      >
                        {req.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1.5 gap-x-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-500 block">Required Quantity:</span>
                        <strong className="text-slate-900 text-sm">
                          {req.required_quantity} {req.unit}
                        </strong>
                        {Number(req.fulfilled_quantity) > 0 && (
                          <span className="text-emerald-700 ml-1">
                            ({req.fulfilled_quantity} fulfilled)
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-500 block">
                          {req.price_type === 'max_willing_to_pay' ? 'Max Budget:' : 'Target Price:'}
                        </span>
                        <strong className="text-slate-900 text-sm">
                          {req.max_price_per_unit ? `₹${req.max_price_per_unit}/${req.unit}` : 'Open to offers'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block">Required By Date:</span>
                        <strong className="text-slate-900">
                          {new Date(req.required_by_date).toLocaleDateString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Delivery: {req.delivery_location}, {req.delivery_district}, {req.delivery_state}
                      </span>
                      <span>Transport: {req.transport_preference.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Right: Matching & Status Controls */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Sparkles}
                      onClick={() => openMatchesModal(req)}
                    >
                      Find Matches
                    </Button>

                    {req.status === 'ACTIVE' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={PauseCircle}
                        onClick={() => handleStatusChange(req.id, 'PAUSED')}
                      >
                        Pause
                      </Button>
                    )}

                    {req.status === 'PAUSED' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={PlayCircle}
                        onClick={() => handleStatusChange(req.id, 'ACTIVE')}
                      >
                        Resume
                      </Button>
                    )}

                    {req.status !== 'CANCELLED' && req.status !== 'FULFILLED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        icon={XCircle}
                        onClick={() => handleStatusChange(req.id, 'CANCELLED')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Post Buying Requirement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post New Buying Requirement"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateRequirement} className="space-y-4">
          {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Marketplace Pricing Rule:</strong> Stating a maximum price sets your procurement budget limit and is not a guaranteed purchase offer. AgriGuide matches your requirement deterministically with compatible farmer listings.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Crop Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Wheat, Tomato, Soybean, Rice"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Preferred Variety (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sharbati, Hybrid 105, Sona Masoori"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Required Quantity *
              </label>
              <input
                type="number"
                step="any"
                required
                min="0.1"
                placeholder="e.g. 50"
                value={requiredQty}
                onChange={(e) => setRequiredQty(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantity Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              >
                <option value="quintal">Quintal (100 kg)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="ton">Metric Ton (1,000 kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Price Ceiling Type
              </label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              >
                <option value="max_willing_to_pay">Maximum price I am willing to pay</option>
                <option value="target_price">Target procurement price</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Price (₹ per {unit}) (Optional)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 2500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Required By Date *
              </label>
              <input
                type="date"
                required
                value={requiredByDate}
                onChange={(e) => setRequiredByDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Transport Preference *
              </label>
              <select
                value={transportPreference}
                onChange={(e) => setTransportPreference(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              >
                <option value="buyer_arranged">Buyer arranges pickup</option>
                <option value="seller_arranged">Seller delivers to buyer</option>
                <option value="negotiable">Open to negotiation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Delivery District *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pune"
                value={deliveryDistrict}
                onChange={(e) => setDeliveryDistrict(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Delivery / Warehouse Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. APMC Gultekdi Market Yard"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quality & Moisture Requirements
              </label>
              <input
                type="text"
                placeholder="e.g. Moisture < 12%, No foreign matter, Grade A produce only"
                value={qualityReqs}
                onChange={(e) => setQualityReqs(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Post Requirement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Compatible Farmer Matches Modal */}
      <Modal
        isOpen={isMatchesModalOpen}
        onClose={() => setIsMatchesModalOpen(false)}
        title={`Compatible Farmer Matches — ${selectedReqForMatches?.crop_name}`}
        maxWidth="max-w-3xl"
      >
        {selectedReqForMatches && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-900">Demand: {selectedReqForMatches.required_quantity} {selectedReqForMatches.unit}</span>
                {selectedReqForMatches.max_price_per_unit && (
                  <span className="ml-2">| Max: ₹{selectedReqForMatches.max_price_per_unit}/{selectedReqForMatches.unit}</span>
                )}
              </div>
              <div>
                <span>Delivery: {selectedReqForMatches.delivery_district}, {selectedReqForMatches.delivery_state}</span>
              </div>
            </div>

            {loadingMatches ? (
              <LoadingSpinner text="Running deterministic matching against active farmer lots..." />
            ) : matches.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No matching farmer listings yet"
                description="Your requirement is active. Farmers will be able to discover this requirement on the shared marketplace as supply becomes available."
              />
            ) : (
              <div className="space-y-3">
                {matches.map((m) => {
                  const lot = m.lot;
                  return (
                    <Card key={lot.id} className="p-4 border-slate-200 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900">{lot.crop_name}</h4>
                            {lot.variety && <Badge variant="default">{lot.variety}</Badge>}
                            <Badge variant={m.score >= 80 ? 'success' : m.score >= 50 ? 'warning' : 'default'}>
                              {m.score}% Match Score
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Farmer: {lot.farmers?.full_name || 'Verified Farmer'} ({lot.district}, {lot.state})
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-bold text-agri-700">
                            {lot.asking_price_per_unit ? `₹${lot.asking_price_per_unit}/${lot.unit}` : 'Open to offers'}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Available: {lot.available_quantity} {lot.unit}
                          </span>
                        </div>
                      </div>

                      {/* Match Explanation Tags */}
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {m.matchCriteria.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ✓ {c}
                          </span>
                        ))}
                        {m.warnings.map((w, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            ⚠ {w}
                          </span>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
