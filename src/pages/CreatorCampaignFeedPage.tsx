import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  MapPin,
  Compass,
  Filter,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  DollarSign,
  Layers,
  Map as MapIcon,
  Grid,
  CheckCircle2,
  X,
  Send,
  Building2,
  AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const creatorMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const brandMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const CreatorCampaignFeedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState<string>('15');
  const [customRadius, setCustomRadius] = useState<number>(15);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');

  // Quick Apply Modal State
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [pitchText, setPitchText] = useState('');
  const [experienceText, setExperienceText] = useState('');
  const [availabilityText, setAvailabilityText] = useState('Immediate / This Weekend');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  const creatorProfile = (user?.profile as any) || {};
  const creatorLat = Number(creatorProfile.lat) || 12.9716;
  const creatorLng = Number(creatorProfile.lng) || 77.5946;

  const radiusOptions = ['1', '5', '10', '25', 'custom', 'all'];
  const categories = ['All', 'Food & Beverage', 'Fitness & Wellness', 'Beauty & Skincare', 'Dining & Nightlife', 'Fashion', 'Lifestyle'];

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const radiusParam = selectedRadius === 'custom' ? String(customRadius) : selectedRadius;
      const params: Record<string, string> = {
        lat: String(creatorLat),
        lng: String(creatorLng),
        radius: radiusParam,
        status: 'PUBLISHED'
      };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getCampaigns(params);
      if (res.success && res.campaigns) {
        setCampaigns(res.campaigns);
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [selectedRadius, customRadius, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCampaigns();
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !pitchText.trim()) return;

    setApplying(true);
    setApplyError('');
    try {
      const res = await api.applyCampaign({
        campaign_id: selectedCampaign.id,
        pitch: pitchText.trim(),
        relevant_experience: experienceText.trim(),
        availability: availabilityText
      });

      if (res.success) {
        setApplySuccess(true);
        setTimeout(() => {
          setSelectedCampaign(null);
          setApplySuccess(false);
          setPitchText('');
          setExperienceText('');
        }, 1800);
      }
    } catch (err: any) {
      setApplyError(err.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" /> Live Neighborhood Feed
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Campaign Discovery
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Exploring brand briefs near{' '}
              <span className="text-white font-semibold">{creatorProfile.area || creatorProfile.city || 'your location'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                onClick={() => setViewMode('feed')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'feed'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" /> Feed View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'map'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" /> Map View
              </button>
            </div>

            <Link
              to="/creator/dashboard"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="space-y-4 mb-8 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
          {/* Radius Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-purple-400" /> Search Radius:
            </span>
            {radiusOptions.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRadius(r)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedRadius === r
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {r === 'all' ? 'All Distance' : r === 'custom' ? 'Custom' : `${r} km`}
              </button>
            ))}

            {selectedRadius === 'custom' && (
              <div className="flex items-center gap-2 ml-2 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={customRadius}
                  onChange={e => setCustomRadius(Number(e.target.value))}
                  className="w-24 accent-purple-500 cursor-pointer"
                />
                <span className="text-xs font-mono text-purple-300 font-bold">{customRadius} km</span>
              </div>
            )}
          </div>

          {/* Search and Category Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800/60">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search campaigns, brands, or neighborhoods..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
              />
            </form>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Content: Feed vs Map */}
        {viewMode === 'map' ? (
          <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
            <MapContainer
              center={[creatorLat, creatorLng]}
              zoom={13}
              style={{ height: '100%', width: '100%', background: '#020617' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />

              {/* Creator Center Location */}
              <Marker position={[creatorLat, creatorLng]} icon={creatorMarkerIcon}>
                <Popup>
                  <div className="text-xs p-1">
                    <strong className="text-purple-600 block mb-0.5">Your Location</strong>
                    <span>{creatorProfile.full_name || 'Creator Location'}</span>
                  </div>
                </Popup>
              </Marker>

              {/* Coverage Circle */}
              {selectedRadius !== 'all' && (
                <Circle
                  center={[creatorLat, creatorLng]}
                  radius={(selectedRadius === 'custom' ? customRadius : Number(selectedRadius)) * 1000}
                  pathOptions={{ color: '#9333ea', fillColor: '#9333ea', fillOpacity: 0.08 }}
                />
              )}

              {/* Brand Campaign Pins */}
              {campaigns.map(c => {
                const lat = Number(c.lat) || creatorLat;
                const lng = Number(c.lng) || creatorLng;
                return (
                  <Marker key={c.id} position={[lat, lng]} icon={brandMarkerIcon}>
                    <Popup>
                      <div className="text-xs max-w-[220px] p-1 text-slate-900">
                        <strong className="block text-blue-600 font-bold mb-1">{c.title}</strong>
                        <div className="text-[11px] text-slate-600 mb-1">{c.brand_name}</div>
                        <div className="font-bold text-emerald-600 mb-2">Reward: ₹{c.reward_per_creator?.toLocaleString()}</div>
                        {c.distance_km !== null && (
                          <div className="text-[10px] text-purple-700 font-semibold mb-2">📍 {c.distance_km} km away</div>
                        )}
                        <button
                          onClick={() => setSelectedCampaign(c)}
                          className="w-full py-1 rounded bg-purple-600 text-white font-bold text-[11px]"
                        >
                          Quick Apply
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 rounded-3xl bg-slate-900/60 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800">
            <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No campaigns found within this radius</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Try increasing your search radius or clearing category filters to discover more opportunities.
            </p>
            <button
              onClick={() => { setSelectedRadius('25'); setSelectedCategory('All'); setSearchQuery(''); }}
              className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg"
            >
              Expand to 25 km
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(camp => (
              <div
                key={camp.id}
                className="bg-slate-900/70 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between overflow-hidden group shadow-xl"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-slate-800">
                    <img
                      src={camp.image_url}
                      alt={camp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-purple-300 border border-purple-500/20">
                      {camp.category}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-sm font-black text-emerald-400 border border-emerald-500/30">
                      ₹{camp.reward_per_creator?.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <img
                        src={camp.brand_logo}
                        alt={camp.brand_name}
                        className="w-6 h-6 rounded-full object-cover border border-slate-700"
                      />
                      <span className="text-xs font-bold text-slate-300">{camp.brand_name}</span>
                    </div>

                    <h3 className="text-lg font-black text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-1">
                      {camp.title}
                    </h3>

                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-4">
                      {camp.description}
                    </p>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                      <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {camp.distance_km !== null ? `${camp.distance_km} km away` : camp.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span>{camp.creators_required} creators</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center gap-3">
                  <Link
                    to={`/campaigns/${camp.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center border border-slate-700 transition-all"
                  >
                    View Brief
                  </Link>
                  <button
                    onClick={() => setSelectedCampaign(camp)}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold text-center shadow-lg shadow-purple-600/25 transition-all"
                  >
                    Quick Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Apply Modal */}
        {selectedCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {applySuccess ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Application Submitted!</h3>
                  <p className="text-xs text-slate-400">
                    The brand has been notified and will review your proposal shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApply}>
                  <div className="mb-6">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                      Apply to Campaign
                    </span>
                    <h2 className="text-xl font-black text-white mb-1">{selectedCampaign.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{selectedCampaign.brand_name}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">₹{selectedCampaign.reward_per_creator?.toLocaleString()}</span>
                    </div>
                  </div>

                  {applyError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{applyError}</span>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Your Pitch / Content Idea *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={pitchText}
                        onChange={e => setPitchText(e.target.value)}
                        placeholder="Describe how you plan to showcase this brand (e.g. 30s 4K Reel with tasting notes and ambiance)..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Relevant Experience or Past Brands (Optional)
                      </label>
                      <input
                        type="text"
                        value={experienceText}
                        onChange={e => setExperienceText(e.target.value)}
                        placeholder="e.g. Created reels for local cafes reaching 25k+ views"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Availability
                      </label>
                      <input
                        type="text"
                        value={availabilityText}
                        onChange={e => setAvailabilityText(e.target.value)}
                        placeholder="e.g. This Saturday afternoon"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={applying}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {applying ? 'Submitting...' : 'Send Application to Brand'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
