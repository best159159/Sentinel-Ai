'use client';

import { useEffect, useRef, useState } from 'react';
import { Incident } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SEVERITY_COLORS: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
};

interface MapViewProps {
    incidents: Incident[];
    news?: any[];
    onMapClick?: (lngLat: { lng: number; lat: number }) => void;
    onMarkerClick?: (incident: Incident) => void;
    selectionMode?: boolean;
    selectedLocation?: { lat: number; lng: number } | null;
    className?: string;
    center?: [number, number];
    zoom?: number;
}

export default function MapView({
    incidents,
    news = [],
    onMapClick,
    onMarkerClick,
    selectionMode = false,
    selectedLocation,
    className = '',
    center,
    zoom,
}: MapViewProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const selectionMarkerRef = useRef<L.Marker | null>(null);
    const [mounted, setMounted] = useState(false);

    // Init map once
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: center || [13.7563, 100.5018],
            zoom: zoom || 6,
            scrollWheelZoom: true,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        markersRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setMounted(true);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update center dynamically
    useEffect(() => {
        if (mapRef.current && center) {
            mapRef.current.flyTo(center, zoom || 13);
        }
    }, [center, zoom]);

    // Handle click
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handler = (e: L.LeafletMouseEvent) => {
            if (selectionMode && onMapClick) {
                onMapClick({ lng: e.latlng.lng, lat: e.latlng.lat });
            }
        };

        map.on('click', handler);
        map.getContainer().style.cursor = selectionMode ? 'crosshair' : 'grab';

        return () => {
            map.off('click', handler);
        };
    }, [selectionMode, onMapClick]);

    // Update incident markers
    useEffect(() => {
        if (!markersRef.current || !mapRef.current) return;
        markersRef.current.clearLayers();

        // Cluster incidents by type and dynamic distance
        const clusters: Incident[][] = [];
        const largeScaleTypes = ['flood', 'fire', 'earthquake', 'storm', 'ไฟไหม้', 'น้ำท่วม', 'แผ่นดินไหว', 'พายุ', 'อัคคีภัย', 'ภัยพิบัติ'];

        incidents.forEach(inc => {
            const latlng = L.latLng(inc.location.lat, inc.location.lng);
            const incType = inc.type ? inc.type.toLowerCase() : '';
            const isLargeScale = largeScaleTypes.some(t => incType.includes(t));
            const maxDistance = isLargeScale ? 1000 : 100;

            const existingCluster = clusters.find(c => {
                const primary = c[0];
                if (primary.type !== inc.type) return false;
                const clll = L.latLng(primary.location.lat, primary.location.lng);
                return clll.distanceTo(latlng) <= maxDistance;
            });
            if (existingCluster) {
                existingCluster.push(inc);
            } else {
                clusters.push([inc]);
            }
        });

        clusters.forEach((cluster) => {
            // Use the highest severity in the cluster for styling
            const severities = ['Critical', 'High', 'Medium', 'Low'];
            cluster.sort((a, b) => {
                return severities.indexOf(a.aiAnalysis?.urgencyLevel || 'Low') - severities.indexOf(b.aiAnalysis?.urgencyLevel || 'Low');
            });

            const primaryIncident = cluster[0];
            const color = SEVERITY_COLORS[primaryIncident.aiAnalysis?.urgencyLevel || 'Low'];

            // Size scales dynamically based on the number of clustered items
            const baseSize = 20;
            const extraSize = cluster.length > 1 ? Math.min(40, (cluster.length - 1) * 8) : 0;
            const size = baseSize + extraSize;

            const iconHtml = cluster.length > 1
                ? `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:4px solid white;box-shadow:0 0 ${10 + extraSize / 2}px ${color};display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:${12 + extraSize / 4}px; transition: all 0.3s ease;">${cluster.length}</div>`
                : `<div style="width:20px;height:20px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 0 10px ${color}"></div>`;

            const icon = L.divIcon({
                className: 'custom-pin',
                html: iconHtml,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
            });

            const marker = L.marker([primaryIncident.location.lat, primaryIncident.location.lng], { icon });

            let popupHtml = `<div style="font-family:sans-serif;min-width:180px">
                <strong style="color:#1f2937">${primaryIncident.type} ${cluster.length > 1 ? `(${cluster.length} Reports)` : ''}</strong><br/>
                <span style="color:${color};font-weight:600">${primaryIncident.aiAnalysis?.urgencyLevel || 'N/A'}</span>`;

            if (cluster.length > 1) {
                const isLargeScale = largeScaleTypes.some(t => primaryIncident.type.toLowerCase().includes(t));
                const distStr = isLargeScale ? '1km' : '100m';
                popupHtml += `<div style="color:#4b5563;font-size:12px;margin-top:4px;">Multiple reports detected within ${distStr}. Click to view all details and images.</div>`;
            } else {
                popupHtml += `<p style="color:#4b5563;font-size:12px;margin-top:4px;line-height:1.4">${(primaryIncident.description || '').substring(0, 120)}</p>`;
            }

            const images = cluster.filter(c => c.imageUrl).map(c => c.imageUrl);
            if (images.length > 0) {
                // Show first image in popup thumbnail
                popupHtml += `<img src="${images[0]}" style="margin-top:8px;border-radius:8px;width:100%;height:80px;object-fit:cover" />`;
            }
            popupHtml += `</div>`;

            marker.bindPopup(popupHtml, { closeButton: false, offset: L.point(0, -10) });

            marker.on('mouseover', () => { marker.openPopup(); });
            marker.on('mouseout', () => { marker.closePopup(); });

            if (onMarkerClick) {
                marker.on('click', () => {
                    // We modify onMarkerClick conceptually below if needed, but we pass the primary incident. 
                    // However, we want to pass the cluster! 
                    // We can hack this by attaching cluster to incident for the modal.
                    const enrichedIncident = { ...primaryIncident, clusterIncidents: cluster } as any;
                    onMarkerClick(enrichedIncident);
                });
            }

            markersRef.current!.addLayer(marker);
        });

        // 3. News Markers
        news.forEach((n) => {
            if (!n.lat || !n.lng) return;
            const color = SEVERITY_COLORS[n.riskLevel || 'Low'] || '#6366f1';

            const iconHtml = `<div style="width:18px;height:18px;background:${color};clip-path:polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);border:2px solid white;box-shadow:0 0 8px ${color}"></div>`;

            const icon = L.divIcon({
                className: 'news-pin',
                html: iconHtml,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            });

            const marker = L.marker([n.lat, n.lng], { icon });

            const popupHtml = `<div style="font-family:sans-serif;min-width:180px">
                <div style="font-size:10px;text-transform:uppercase;color:#6366f1;font-weight:900;margin-bottom:2px">Official Intelligence</div>
                <strong style="color:#1f2937">${n.source_title || 'Emergency News'}</strong><br/>
                <span style="color:${color};font-weight:600">${n.riskLevel || n.risk_level || 'N/A'} Risk</span>
                <p style="color:#4b5563;font-size:11px;margin-top:4px;line-height:1.4">${(n.summary || '').substring(0, 100)}...</p>
                <a href="${n.source_url}" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:700;font-size:11px">อ่านต่อที่แหล่งข่าว &rarr;</a>
            </div>`;

            marker.bindPopup(popupHtml, { closeButton: false, offset: L.point(0, -5) });
            marker.on('mouseover', () => { marker.openPopup(); });
            marker.on('mouseout', () => { marker.closePopup(); });

            markersRef.current!.addLayer(marker);
        });
    }, [incidents, news]);

    // Update selection marker
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (selectionMarkerRef.current) {
            selectionMarkerRef.current.remove();
            selectionMarkerRef.current = null;
        }

        if (selectedLocation) {
            const icon = L.divIcon({
                className: 'selection-pin',
                html: `<div style="width:24px;height:24px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 20px rgba(59,130,246,0.5)"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });
            selectionMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], { icon }).addTo(map);
        }
    }, [selectedLocation]);

    return (
        <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{ minHeight: '400px' }}>
            <div ref={containerRef} className="w-full h-full absolute inset-0 z-0" />

            {selectionMode && (
                <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-xl font-medium shadow-lg z-[1000]">
                    📍 Click on the map to select location
                </div>
            )}

            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-gray-200 z-[1000] shadow-md">
                <p className="text-xs font-semibold text-gray-700 mb-2">Severity</p>
                {Object.entries(SEVERITY_COLORS).map(([level, color]) => (
                    <div key={level} className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: color, boxShadow: `0 0 6px ${color}50` }}
                        />
                        {level}
                    </div>
                ))}
            </div>
        </div>
    );
}
