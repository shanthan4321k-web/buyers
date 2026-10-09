import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sprout,
  Search,
  Filter,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  Info,
  Tag,
  Truck,
} from 'lucide-react';
import api from '../services/api.js';
import { Card } from '../components/common/Card.jsx';
import { Button } from '../components/common/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { Pagination } from '../components/common/Pagination.jsx';

export const AvailableCropsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [lots, setLots] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState(initialSearch);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minQty, setMinQty] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [distinctCrops, setDistinctCrops] = useState([]);

  // Selected lot for detail & offer submission
  const [selectedLot, setSelectedLot] = useState(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(null);
  const [offerError, setOfferError] = useState(null);

  // Offer Form State
  const [proposedQty, setProposedQty] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [pickupPreference, setPickupPreference] = useState('pickup_at_farm');
  const [expectedDate, setExpectedDate] = useState('');
  const [transportResponsibility, setTransportResponsibility] = useState('buyer');
  const [paymentTerms, setPaymentTerms] = useState('50% advance on weighing, 50% upon delivery/loading');
  const [offerMessage, setOfferMessage] = useState('');

  const fetchLots = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 9,
        search: search || undefined,
        crop: selectedCrop || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minQty: minQty || undefined,
        state: stateFilter || undefined,
        sortBy,
        sortOrder,
      };

      const res = await api.get('/selling-lots', { params });
      if (res.data?.success) {
        setLots(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch available crops');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistinctCrops = async () => {
    try {
      const res = await api.get('/selling-lots/crops/distinct');
      if (res.data?.success) {
        setDistinctCrops(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch distinct crops', err);
    }
  };

  useEffect(() => {
    fetchDistinctCrops();
  }, []);

  useEffect(() => {
    fetchLots(1);
  }, [selectedCrop, stateFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLots(1);
  };

  const openOfferModal = (lot) => {
    setSelectedLot(lot);
    setProposedQty(lot.available_quantity);
    setProposedPrice(lot.asking_price_per_unit || '');
    setOfferSuccess(null);
    setOfferError(null);
    setIsOfferModalOpen(true);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!selectedLot) return;

    const qty = Number(proposedQty);
    const price = Number(proposedPrice);

    if (qty <= 0 || isNaN(qty)) {
      setOfferError('Proposed quantity must be greater than zero');
      return;
    }

    if (qty > Number(selectedLot.available_quantity)) {
      setOfferError(`Proposed quantity cannot exceed available quantity (${selectedLot.available_quantity} ${selectedLot.unit})`);
      return;
    }

    if (price <= 0 || isNaN(price)) {
      setOfferError('Proposed price must be greater than zero');
      return;
    }

    setIsSubmittingOffer(true);
    setOfferError(null);

    try {
      const payload = {
        selling_lot_id: selectedLot.id,
        proposed_quantity: qty,
        proposed_price_per_unit: price,
        price_unit: selectedLot.price_unit || 'INR/quintal',
        pickup_delivery_preference: pickupPreference,
        expected_date: expectedDate || null,
        transport_responsibility: transportResponsibility,
        payment_terms: paymentTerms,
        message: offerMessage || null,
      };

      const res = await api.post('/offers', payload);
      if (res.data?.success) {
        setOfferSuccess('Your purchase offer has been submitted directly to the farmer!');
        setTimeout(() => {
          setIsOfferModalOpen(false);
          setOfferSuccess(null);
        }, 2000);
      }
    } catch (err) {
      setOfferError(err.message || 'Failed to submit offer. Please check details.');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Available Farmer Crop Listings</h1>
          <p className="text-sm text-slate-500">
            Real active harvest supply posted by farmers from the shared database.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search crop, variety, or city..."
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              />
            </div>

            {/* Crop Selector */}
            <div>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              >
                <option value="">All Crop Types</option>
                {distinctCrops.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
              >
                <option value="created_at-desc">Newest Listings</option>
                <option value="asking_price_per_unit-asc">Price: Low to High</option>
                <option value="asking_price_per_unit-desc">Price: High to Low</option>
                <option value="available_quantity-desc">Quantity: High to Low</option>
                <option value="expected_availability_date-asc">Earliest Availability</option>
              </select>
            </div>

            {/* Search Submit Button */}
            <div className="flex gap-2">
              <Button variant="primary" type="submit" className="w-full">
                Apply Filters
              </Button>
              {(search || selectedCrop || minPrice || maxPrice || minQty) && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedCrop('');
                    setMinPrice('');
                    setMaxPrice('');
                    setMinQty('');
                    setStateFilter('');
                    fetchLots(1);
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Main Listings Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching active farmer listings..." size="lg" />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : lots.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No farmer crop listings match your criteria"
          description="Try broadening your search filters or post a buying requirement so farmers can discover your demand."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedCrop('');
            setMinPrice('');
            setMaxPrice('');
            fetchLots(1);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lots.map((lot) => {
              const hasPrice = lot.asking_price_per_unit !== null && lot.asking_price_per_unit !== undefined;
              return (
                <Card key={lot.id} hover className="flex flex-col overflow-hidden">
                  {/* Card Header & Crop Banner */}
                  <div className="p-5 pb-3 border-b border-slate-100 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{lot.crop_name}</h3>
                        {lot.quality_grade && (
                          <Badge variant="agri">{lot.quality_grade}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {lot.variety ? `Variety: ${lot.variety}` : 'Variety: Standard / Unspecified'}
                      </p>
                    </div>

                    <div className="text-right">
                      {hasPrice ? (
                        <div>
                          <span className="text-base font-bold text-agri-700">
                            ₹{Number(lot.asking_price_per_unit).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-slate-500 block">per {lot.unit}</span>
                        </div>
                      ) : (
                        <Badge variant="warning">Price not specified</Badge>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 space-y-3.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500">Available Stock:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {Number(lot.available_quantity).toLocaleString('en-IN')} {lot.unit}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Approx. Location: <strong className="text-slate-800">{lot.district}, {lot.state}</strong></span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Available From: <strong className="text-slate-800">{new Date(lot.expected_availability_date).toLocaleDateString('en-IN')}</strong></span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <ShieldCheck className="w-4 h-4 text-agri-600 shrink-0" />
                        <span>Farmer: <strong className="text-slate-800">{lot.profiles?.full_name || lot.farmers?.full_name || 'Verified Farmer'}</strong></span>
                      </div>
                    </div>

                    {lot.quality_details && (
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[11px] text-slate-500 italic line-clamp-2">
                          "{lot.quality_details}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => openOfferModal(lot)}
                    >
                      Make Purchase Offer
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => fetchLots(p)}
          />
        </>
      )}

      {/* Offer Submission Modal */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title={`Submit Purchase Offer — ${selectedLot?.crop_name}`}
        maxWidth="max-w-xl"
      >
        {selectedLot && (
          <form onSubmit={handleSubmitOffer} className="space-y-4">
            {offerError && <Alert type="error" message={offerError} onClose={() => setOfferError(null)} />}
            {offerSuccess && <Alert type="success" message={offerSuccess} />}

            {/* Listing Reference Header */}
            <div className="p-3.5 rounded-xl bg-agri-50/70 border border-agri-100 text-xs text-slate-700 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">{selectedLot.crop_name}</span>
                {selectedLot.variety && <span> ({selectedLot.variety})</span>}
                <p className="text-slate-500">{selectedLot.district}, {selectedLot.state}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Max Available:</span>
                <p className="font-bold text-agri-800">{selectedLot.available_quantity} {selectedLot.unit}</p>
                {selectedLot.asking_price_per_unit && (
                  <p className="text-[11px] text-slate-500">Farmer Asking: ₹{selectedLot.asking_price_per_unit}/{selectedLot.unit}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Proposed Quantity ({selectedLot.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  max={selectedLot.available_quantity}
                  value={proposedQty}
                  onChange={(e) => setProposedQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Proposed Price (₹ per {selectedLot.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pickup / Delivery *
                </label>
                <select
                  value={pickupPreference}
                  onChange={(e) => setPickupPreference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                >
                  <option value="pickup_at_farm">Buyer Pickup at Farm</option>
                  <option value="delivery_to_buyer">Farmer Delivers to Buyer</option>
                  <option value="flexible">Flexible / Open to negotiate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Transport Responsibility *
                </label>
                <select
                  value={transportResponsibility}
                  onChange={(e) => setTransportResponsibility(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                >
                  <option value="buyer">Buyer Arranges & Pays Transport</option>
                  <option value="farmer">Farmer Arranges Transport</option>
                  <option value="shared">Shared Transport Costs</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Expected Pickup / Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Terms *
                </label>
                <input
                  type="text"
                  required
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. 50% advance on weighing at farm, 50% on receipt"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Optional Note / Message to Farmer
                </label>
                <textarea
                  rows={2}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Mention any specific quality requirements, packaging or questions..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>
            </div>

            {/* Estimated Total Calculation */}
            {proposedQty && proposedPrice && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600">Calculated Offer Value:</span>
                <span className="font-bold text-slate-900 text-sm">
                  ₹{(Number(proposedQty) * Number(proposedPrice)).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOfferModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmittingOffer}
              >
                Send Offer to Farmer
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
