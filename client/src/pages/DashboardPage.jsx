import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  FileText,
  Clock,
  ArrowLeftRight,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { Card } from '../components/common/Card.jsx';
import { Button } from '../components/common/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';

export const DashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickSearch, setQuickSearch] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/summary');
      if (res.data?.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/crops?search=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Computing buyer procurement data from database..." size="lg" />;
  }

  const metrics = dashboardData?.metrics || {
    activeRequirementsCount: 0,
    pendingOffersCount: 0,
    counteredOffersCount: 0,
    activeOrdersCount: 0,
    totalProcuredAmount: 0,
    totalProcuredQuantity: 0,
  };

  const hasAnyActivity =
    metrics.activeRequirementsCount > 0 ||
    metrics.pendingOffersCount > 0 ||
    metrics.activeOrdersCount > 0 ||
    (dashboardData?.recentOrders && dashboardData.recentOrders.length > 0);

  return (
    <div className="space-y-8">
      {/* 1. Welcome & Business Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-agri-500/20 text-agri-300 text-xs font-semibold mb-3 border border-agri-500/30">
            <Sprout className="w-3.5 h-3.5 text-agri-400" />
            Verified Buyer Procurement Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {profile?.contact_person || 'Procurement Partner'}
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            {profile?.business_name} ({profile?.buyer_type}) — {profile?.district}, {profile?.state}
          </p>

          {/* Quick Crop Search */}
          <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search crops across genuine farmer listings..."
                className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:bg-white focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-400 transition-all"
              />
            </div>
            <Button variant="primary" type="submit">
              Search Supply
            </Button>
          </form>
        </div>
      </div>

      {/* 2. Real Metrics Grid (Computed from authenticated buyer DB records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Requirements
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {metrics.activeRequirementsCount}
            </span>
            <span className="text-xs text-slate-500">live demand posts</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Offers
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {metrics.pendingOffersCount}
            </span>
            {metrics.counteredOffersCount > 0 && (
              <Badge variant="warning">{metrics.counteredOffersCount} Counteroffer(s)</Badge>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Orders
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {metrics.activeOrdersCount}
            </span>
            <span className="text-xs text-slate-500">in fulfillment</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Procured Volume
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {metrics.totalProcuredQuantity.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500">quintals agreed</span>
          </div>
        </Card>
      </div>

      {/* 3. Main Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Requirements & Active Orders */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Buying Requirements */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Active Buying Requirements</h2>
                <p className="text-xs text-slate-500">Your live demand posted to regional farmers</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={PlusCircle}
                onClick={() => navigate('/requirements?action=new')}
              >
                Post New
              </Button>
            </div>

            {dashboardData?.recentRequirements && dashboardData.recentRequirements.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentRequirements.map((req) => (
                  <Card key={req.id} hover className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{req.crop_name}</h3>
                        {req.variety && <Badge variant="default">{req.variety}</Badge>}
                        <Badge variant={req.status === 'ACTIVE' ? 'success' : 'default'}>
                          {req.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Quantity: <strong>{req.required_quantity} {req.unit}</strong></span>
                        <span>Max Price: <strong>{req.max_price_per_unit ? `₹${req.max_price_per_unit}/${req.unit}` : 'Open'}</strong></span>
                        <span>Delivery: {req.delivery_district}, {req.delivery_state}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/requirements`)}
                    >
                      View Matches
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No active buying requirements"
                description="You have not published any crop procurement requirements yet. Post your first requirement to get matched with farmers."
                actionLabel="Post Buying Requirement"
                actionIcon={PlusCircle}
                onAction={() => navigate('/requirements?action=new')}
              />
            )}
          </div>

          {/* Active Orders & Transactions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Active Orders & Agreements</h2>
                <p className="text-xs text-slate-500">Confirmed procurement contracts and delivery tracking</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/orders')}
              >
                All Orders →
              </Button>
            </div>

            {dashboardData?.recentOrders && dashboardData.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentOrders.map((ord) => (
                  <Card key={ord.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {ord.selling_lots?.crop_name || 'Crop'} ({ord.agreed_quantity} {ord.unit})
                        </span>
                        <Badge variant="info">{ord.order_status}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Agreed Rate: <strong>₹{ord.agreed_price_per_unit}/{ord.unit}</strong></span>
                        <span>Total: <strong>₹{Number(ord.total_amount).toLocaleString('en-IN')}</strong></span>
                        <span>Farmer: {ord.profiles?.full_name || ord.farmers?.full_name || 'Farmer Partner'}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate('/orders')}
                    >
                      Track Order
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ArrowLeftRight}
                title="No orders yet"
                description="Once you and a farmer agree on price and terms, formal procurement orders will appear here."
              />
            )}
          </div>
        </div>

        {/* Right Col: Latest Genuine Farmer Listings */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Latest Farmer Listings</h2>
              <p className="text-xs text-slate-500">Directly from shared database</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/crops')}>
              Browse All
            </Button>
          </div>

          {dashboardData?.featuredLots && dashboardData.featuredLots.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.featuredLots.map((lot) => (
                <Card key={lot.id} hover className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{lot.crop_name}</h4>
                      <p className="text-xs text-slate-500">{lot.variety || 'Standard Variety'}</p>
                    </div>
                    {lot.asking_price_per_unit ? (
                      <span className="text-sm font-bold text-agri-700">
                        ₹{lot.asking_price_per_unit}/{lot.unit}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Open to offers</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {lot.district}, {lot.state}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {lot.available_quantity} {lot.unit}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => navigate('/crops')}
                  >
                    View Listing & Offer
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sprout}
              title="No farmer listings available"
              description="No active selling lots found in the database. When farmers publish crop listings, they will appear here."
            />
          )}
        </div>
      </div>
    </div>
  );
};
