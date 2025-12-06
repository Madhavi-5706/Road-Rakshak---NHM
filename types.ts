export interface InferredLocation {
  city_or_landmark: string;
  street_name_or_clue: string;
  confidence_level: 'Low' | 'Medium' | 'High';
}

export interface AnalysisResult {
  hazard_detected: string;
  description: string;
  severity_score: 'Low' | 'Medium' | 'High' | 'N/A';
  location: string;
  inferred_location?: InferredLocation;
}

export interface RiskAnalysisResult {
  location: string;
  risk_breakdown: {
    risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    percentage: number;
  }[];
  // Module 2: Data Analytics Insights
  top_hotspots: string[];
  most_common_cause: string;
  time_analysis: {
    day_percentage: number;
    night_percentage: number;
  };
  analytics_summary: string;
}

export enum HazardType {
  POTHOLES = 'Potholes / Cracks in pavement',
  LIGHTS = 'Broken or malfunctioning streetlights',
  WATER = 'Waterlogging / Drainage issues',
  OBSTRUCTION = 'Traffic sign obstruction',
  NONE = 'None'
}
