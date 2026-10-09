import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Scale,
  CreditCard,
  Building2,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Send,
  Calendar,
} from 'lucide-react';
import api from '../services/api.js';
import { Card } from '../components/common/Card.jsx';
import { Button } from '../components/common/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Alert } from '../components/common/Alert.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';

export const OffersAndOrdersPage = () => {
  const [activeTab, setActiveTab] = useState('offers'); // 'offers' | 'orders'
  const [offersFilter, setOffersFilter] = useState('ALL'); // 'ALL', 'PENDING', 'COUNTERED', 'ACCEPTED', 'WITHDRAWN', 'REJECTED'
  const [ordersFilter, setOrdersFilter] = useState('ALL'); // 'ALL', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'

  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Counteroffer Modal
  const [selectedOfferForCounter, setSelectedOfferForCounter] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [isCounterSubmitting, setIsCounterSubmitting] = useState(false);
  const [counterError, setCounterError] = useState(null);

  // Order Tracking Modal
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [orderStatus, setOrderStatus] = useState('CONFIRMED');
  const [weighingStatus, setWeighingStatus] = useState('PENDING');
  const [actualWeighedQty, setActualWeighedQty] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');
  const [paymentReference, setPaymentReference] = useState('');
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [offersRes, ordersRes] = await Promise.all([
        api.get('/offers'),
        api.get('/orders'),
      ]);

      if (offersRes.data?.success) setOffers(offersRes.data.data);
      if (ordersRes.data?.success) setOrders(ordersRes.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load offers and orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdrawOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to withdraw this offer?')) return;
    try {
      const res = await api.post(`/offers/${offerId}/withdraw`);
      if (res.data?.success) {
        await fetchData();
      }
    } catch (err) {
      alert(`Withdrawal failed: ${err.message}`);
    }
  };

  const handleAcceptCounterOffer = async (offerId) => {
    if (!window.confirm('Accept this agreed counteroffer and generate formal purchase contract?')) return;
    try {
      const res = await api.post(`/offers/${offerId}/accept`);
      if (res.data?.success) {
        await fetchData();
        setActiveTab('orders');
      }
    } catch (err) {
      alert(`Acceptance failed: ${err.message}`);
    }
  };

  const handleRejectOffer = async (offerId) => {
    if (!window.confirm('Reject this offer?')) return;
    try {
      const res = await api.post(`/offers/${offerId}/reject`);
      if (res.data?.success) {
        await fetchData();
      }
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const openCounterModal = (offer) => {
    setSelectedOfferForCounter(offer);
    setCounterPrice(offer.counter_price_per_unit || offer.proposed_price_per_unit);
    setCounterQty(offer.counter_quantity || offer.proposed_quantity);
    setCounterNotes('');
    setCounterError(null);
  };

  const handleSubmitCounter = async (e) => {
    e.preventDefault();
    if (!selectedOfferForCounter) return;
    setIsCounterSubmitting(true);
    setCounterError(null);

    try {
      const payload = {
        counter_price_per_unit: Number(counterPrice),
        counter_quantity: Number(counterQty),
        counter_notes: counterNotes.trim(),
      };

      const res = await api.post(`/offers/${selectedOfferForCounter.id}/counter`, payload);
      if (res.data?.success) {
        setSelectedOfferForCounter(null);
        await fetchData();
      }
    } catch (err) {
      setCounterError(err.message || 'Failed to send counteroffer');
    } finally {
      setIsCounterSubmitting(false);
    }
  };

  const openTrackingModal = (order) => {
    setSelectedOrderForTracking(order);
    setOrderStatus(order.order_status);
    setWeighingStatus(order.weighing_status);
    setActualWeighedQty(order.actual_weighed_quantity || '');
    setPaymentStatus(order.payment_status);
    setPaymentReference(order.payment_reference || '');
    setTrackingError(null);
  };

  const handleUpdateTracking = async (e) => {
    e.preventDefault();
    if (!selectedOrderForTracking) return;
    setIsUpdatingTracking(true);
    setTrackingError(null);

    try {
      const payload = {
        order_status: orderStatus,
        weighing_status: weighingStatus,
        actual_weighed_quantity: actualWeighedQty ? Number(actualWeighedQty) : null,
        payment_status: paymentStatus,
        payment_reference: paymentReference.trim() || null,
      };

      const res = await api.patch(`/orders/${selectedOrderForTracking.id}/tracking`, payload);
      if (res.data?.success) {
        setSelectedOrderForTracking(null);
        await fetchData();
      }
    } catch (err) {
      setTrackingError(err.message || 'Failed to update order tracking');
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  const filteredOffers = offersFilter === 'ALL'
    ? offers
    : offers.filter((o) => o.status === offersFilter);

  const filteredOrders = ordersFilter === 'ALL'
    ? orders
    : orders.filter((o) => o.order_status === ordersFilter);

  return (
    <div className="space-y-6">
      {/* Header & Primary Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Procurement Offers & Orders</h1>
          <p className="text-sm text-slate-500">
            Track price negotiations, formal purchase contracts, weighing slips, and payment statuses.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 border border-slate-200">
          <button
            onClick={() => setActiveTab('offers')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'offers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Offers & Negotiations ({offers.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Agreed Orders ({orders.length})
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching negotiations and orders from database..." size="lg" />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : activeTab === 'offers' ? (
        /* OFFERS TAB */
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'COUNTERED', 'ACCEPTED', 'WITHDRAWN', 'REJECTED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setOffersFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  offersFilter === filter
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredOffers.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No offers found"
              description="You currently have no crop purchase offers in this category."
            />
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => {
                const isPending = offer.status === 'PENDING';
                const isCountered = offer.status === 'COUNTERED';
                const isAccepted = offer.status === 'ACCEPTED';
                const isWithdrawn = offer.status === 'WITHDRAWN';
                const isRejected = offer.status === 'REJECTED';

                return (
                  <Card key={offer.id} className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-lg font-bold text-slate-900">
                            {offer.selling_lots?.crop_name || 'Crop Listing'}
                          </h3>
                          {offer.selling_lots?.variety && (
                            <Badge variant="default">{offer.selling_lots.variety}</Badge>
                          )}
                          <Badge
                            variant={
                              isAccepted
                                ? 'success'
                                : isCountered
                                ? 'warning'
                                : isPending
                                ? 'info'
                                : 'default'
                            }
                          >
                            {offer.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Farmer: <strong>{offer.profiles?.full_name || offer.farmers?.full_name || 'Farmer Partner'}</strong> ({offer.profiles?.district || offer.farmers?.district || offer.selling_lots?.district}, {offer.profiles?.state || offer.farmers?.state || offer.selling_lots?.state})
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-500 block">Proposed Total Value:</span>
                        <span className="text-lg font-bold text-agri-800">
                          ₹{(Number(offer.proposed_quantity) * Number(offer.proposed_price_per_unit)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Offer Terms Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 text-xs border border-slate-100">
                      <div>
                        <span className="text-slate-500 block">Quantity:</span>
                        <strong className="text-slate-900">{offer.proposed_quantity} {offer.selling_lots?.unit || 'quintal'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Proposed Rate:</span>
                        <strong className="text-slate-900">₹{offer.proposed_price_per_unit}/{offer.price_unit}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Transport:</span>
                        <strong className="text-slate-900 capitalize">{offer.transport_responsibility}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Delivery Mode:</span>
                        <strong className="text-slate-900">{offer.pickup_delivery_preference.replace(/_/g, ' ')}</strong>
                      </div>
                    </div>

                    {/* Counteroffer details if available */}
                    {isCountered && (
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <RotateCcw className="w-4 h-4 text-amber-700" />
                          Counteroffer Proposed:
                        </div>
                        <p>
                          Price: <strong>₹{offer.counter_price_per_unit}/{offer.price_unit}</strong> | Quantity: <strong>{offer.counter_quantity} {offer.selling_lots?.unit}</strong>
                        </p>
                        {offer.counter_notes && <p className="italic">Note: "{offer.counter_notes}"</p>}
                      </div>
                    )}

                    {/* Actions Toolbar */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 justify-end border-t border-slate-100">
                      {isCountered && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={CheckCircle2}
                            onClick={() => handleAcceptCounterOffer(offer.id)}
                          >
                            Accept Counteroffer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={RotateCcw}
                            onClick={() => openCounterModal(offer)}
                          >
                            Send Revised Counter
                          </Button>
                        </>
                      )}

                      {(isPending || isCountered) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                          icon={XCircle}
                          onClick={() => handleWithdrawOffer(offer.id)}
                        >
                          Withdraw Offer
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ORDERS TAB */
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setOrdersFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  ordersFilter === filter
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="No formal orders yet"
              description="Orders are created when both parties agree on price, quantity, and payment terms."
            />
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-slate-900">
                          {order.selling_lots?.crop_name} ({order.agreed_quantity} {order.unit})
                        </h3>
                        <Badge variant="success">{order.order_status}</Badge>
                        <Badge variant={order.payment_status === 'PAID' ? 'success' : 'warning'}>
                          Payment: {order.payment_status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Contract with: <strong>{order.profiles?.full_name || order.farmers?.full_name || 'Farmer Partner'}</strong> | Created: {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-500 block">Agreed Contract Value:</span>
                      <span className="text-xl font-bold text-agri-700">
                        ₹{Number(order.total_amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        (₹{order.agreed_price_per_unit}/{order.unit})
                      </span>
                    </div>
                  </div>

                  {/* Operational Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-500 block">Delivery Status:</span>
                        <strong className="text-slate-900">{order.order_status}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-500 block">Weighing Status:</span>
                        <strong className="text-slate-900">{order.weighing_status}</strong>
                        {order.actual_weighed_quantity && (
                          <span className="text-slate-500 block">({order.actual_weighed_quantity} {order.unit} verified)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-500 block">Payment Tracking:</span>
                        <strong className="text-slate-900">{order.payment_status}</strong>
                        {order.payment_reference && (
                          <span className="text-slate-500 block truncate">Ref: {order.payment_reference}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openTrackingModal(order)}
                    >
                      Update Fulfillment & Tracking
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Counteroffer Modal */}
      <Modal
        isOpen={Boolean(selectedOfferForCounter)}
        onClose={() => setSelectedOfferForCounter(null)}
        title="Send Counteroffer"
        maxWidth="max-w-lg"
      >
        {selectedOfferForCounter && (
          <form onSubmit={handleSubmitCounter} className="space-y-4">
            {counterError && <Alert type="error" message={counterError} onClose={() => setCounterError(null)} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Counter Price (₹ per {selectedOfferForCounter.price_unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Counter Quantity ({selectedOfferForCounter.selling_lots?.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={counterQty}
                  onChange={(e) => setCounterQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Explanation / Counter Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="Reason for revised price or terms..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedOfferForCounter(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isCounterSubmitting}
              >
                Submit Counteroffer
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Update Tracking Modal */}
      <Modal
        isOpen={Boolean(selectedOrderForTracking)}
        onClose={() => setSelectedOrderForTracking(null)}
        title="Update Order Fulfillment & Tracking"
        maxWidth="max-w-lg"
      >
        {selectedOrderForTracking && (
          <form onSubmit={handleUpdateTracking} className="space-y-4">
            {trackingError && <Alert type="error" message={trackingError} onClose={() => setTrackingError(null)} />}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Delivery / Order Status
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                >
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="DISPUTED">Disputed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Weighbridge / Weighing Status
                </label>
                <select
                  value={weighingStatus}
                  onChange={(e) => setWeighingStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                >
                  <option value="PENDING">Pending Weighing</option>
                  <option value="CONFIRMED_AT_FARM">Confirmed at Farm</option>
                  <option value="CONFIRMED_AT_DELIVERY">Confirmed at Delivery Warehouse</option>
                  <option value="DISPUTED">Weighing Disputed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Actual Weighed Quantity ({selectedOrderForTracking.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={actualWeighedQty}
                  onChange={(e) => setActualWeighedQty(e.target.value)}
                  placeholder="e.g. 49.8"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="PAID">Paid in Full</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UTR1234567890, NEFT Ref"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-agri-500 focus:ring-1 focus:ring-agri-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedOrderForTracking(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isUpdatingTracking}
              >
                Save Tracking Updates
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
