'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineUpload,
    HiOutlineLocationMarker,
    HiOutlineLightningBolt,
    HiOutlinePhotograph,
    HiOutlineX,
} from 'react-icons/hi';
import api from '@/lib/api';
import { IncidentType } from '@/types';

const INCIDENT_TYPES: { value: IncidentType; label: string; emoji: string }[] = [
    { value: 'Flood', label: 'Flood', emoji: '🌊' },
    { value: 'Fire', label: 'Fire', emoji: '🔥' },
    { value: 'Earthquake', label: 'Earthquake', emoji: '🌍' },
    { value: 'Accident', label: 'Accident', emoji: '🚗' },
    { value: 'Crime', label: 'Crime', emoji: '🚨' },
    { value: 'Storm', label: 'Storm', emoji: '⛈️' },
    { value: 'Other', label: 'Other', emoji: '⚠️' },
];

interface IncidentFormProps {
    selectedLocation: { lat: number; lng: number } | null;
    onSelectLocation: () => void;
    onSuccess: () => void;
}

export default function IncidentForm({
    selectedLocation,
    onSelectLocation,
    onSuccess,
}: IncidentFormProps) {
    const [type, setType] = useState<IncidentType>('Other');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detecting, setDetecting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // We'll just trigger the parent to set the location
                onSelectLocation();
                setDetecting(false);
            },
            (err) => {
                setError('Failed to detect location. Please select on map.');
                setDetecting(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Use JPG, PNG, WebP, or GIF.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File too large. Max 10MB.');
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setError('');
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedLocation) {
            setError('Please select a location on the map');
            return;
        }
        if (!description.trim()) {
            setError('Please provide a description');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('type', type);
            formData.append('description', description);
            formData.append('location', JSON.stringify(selectedLocation));
            if (imageFile) formData.append('image', imageFile);

            await api.post('/incidents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Reset form
            setType('Other');
            setDescription('');
            removeImage();
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Incident Type */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Incident Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {INCIDENT_TYPES.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setType(item.value)}
                            className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-bold transition-all border shadow-sm ${type === item.value
                                ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                                }`}
                        >
                            <span className="text-lg">{item.emoji}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the incident in detail..."
                    rows={4}
                    className="input-field resize-none shadow-sm font-medium"
                    maxLength={2000}
                />
                <p className="text-xs text-slate-500 mt-2 font-medium">{description.length}/2000 characters</p>
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Photo Evidence</label>
                {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-sm shadow-md rounded-xl text-slate-500 hover:text-red-500 hover:bg-white transition-all"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-3 px-4 py-10 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-500 hover:text-blue-600 bg-slate-50/50"
                    >
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <HiOutlinePhotograph className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-bold">Click to upload photo</span>
                    </button>
                )}
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                />
            </div>

            {/* Location */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onSelectLocation}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm border ${selectedLocation
                            ? 'bg-green-50 border-green-500 text-green-700 ring-2 ring-green-100'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                            }`}
                    >
                        <HiOutlineLocationMarker className="w-5 h-5" />
                        {selectedLocation
                            ? `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`
                            : 'Select on Map'}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium shadow-sm"
                >
                    {error}
                </motion.div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={loading || !selectedLocation}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing with AI...
                    </>
                ) : (
                    <>
                        <HiOutlineLightningBolt className="w-6 h-6" />
                        Submit Report
                    </>
                )}
            </button>
        </form>
    );
}
