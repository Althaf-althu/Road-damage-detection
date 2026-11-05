export interface LayerSpecification {
  layer: string;
  spec: string;
}

export interface DurabilityComparison {
  proposed_solution_lifespan_years: number;
  conventional_asphalt_lifespan_months: number;
}

export interface AIAdvisoryPayload {
  primary_recommendation: string;
  pavement_type: "Rigid" | "Flexible" | "Semi-Rigid Composite";
  technical_justification: string;
  layer_specifications: LayerSpecification[];
  drainage_mitigation: string;
  expected_durability_comparison: DurabilityComparison;
}

export interface GeotechProfile {
  id: string;
  road_segment_id: string;
  elevation_m?: number | null;
  slope_percentage?: number | null;
  soil_texture?: string | null;
  clay_percent?: number | null;
  silt_percent?: number | null;
  sand_percent?: number | null;
  cbr_estimate?: number | null;
  water_retention_capacity?: "Low" | "Moderate" | "Extreme" | null;
  groundwater_table_m?: number | null;
  soil_moisture_index?: number | null;
  ai_advisory_payload?: AIAdvisoryPayload | null;
  updated_at?: string;
}

