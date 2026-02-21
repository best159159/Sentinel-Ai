// Incident types
export type IncidentType = 'Flood' | 'Fire' | 'Earthquake' | 'Accident' | 'Crime' | 'Storm' | 'Other';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'active' | 'resolved' | 'investigating';

export interface Location {
    lat: number;
    lng: number;
}

export interface AIAnalysis {
    classifiedType: string;
    severityScore: number;
    urgencyLevel: UrgencyLevel;
    keywordsDetected: string[];
    recommendation: string;
    confidenceScore: number;
}

export interface User {
    _id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    location: Location;
}

export interface Incident {
    _id: string;
    userId: User | string;
    type: IncidentType;
    description: string;
    imageUrl: string | null;
    location: Location;
    aiAnalysis: AIAnalysis;
    status: IncidentStatus;
    createdAt: string;
    updatedAt: string;
}

export interface NewsRisk {
    _id: string;
    province: string;
    riskScore: number;
    riskLevel: UrgencyLevel;
    summary: string;
    source: {
        title: string;
        url: string;
        publishedAt: string;
    };
    createdAt: string;
}

export interface AdminStats {
    totalToday: number;
    totalAll: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    criticalIncidents: Incident[];
    averageConfidence: number;
    topRiskZones: {
        location: Location;
        incidentCount: number;
        avgSeverity: number;
        types: string[];
    }[];
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface PaginatedResponse<T> {
    incidents: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
