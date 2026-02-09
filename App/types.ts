
export interface Location {
  lat: number;
  lng: number;
}

export enum EmergencyStatus {
  IDLE = 'IDLE',
  REPORTING = 'REPORTING',
  NOTIFIED = 'NOTIFIED',
  CALLING = 'CALLING',
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED'
}

export interface EmergencyFacility {
  name: string;
  address: string;
  location: Location;
  type: 'Hospital' | 'Police' | 'Ambulance';
  uri?: string;
}

export interface EmergencyEvent {
  id: string;
  type: string;
  location: Location;
  timestamp: string;
  status: EmergencyStatus;
  severity: 'Minor' | 'Moderate' | 'Severe';
  nearestFacilities?: EmergencyFacility[];
}

export interface Medicine {
  name: string;
  dosage: string;
  purpose: string;
  price: number;
}

export interface Prescription {
  diagnosis: string;
  medicines: Medicine[];
  advice: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  prescription?: Prescription;
}

export enum View {
  EMERGENCY = 'EMERGENCY',
  HEALTH = 'HEALTH',
  RESPONDER_PORTAL = 'RESPONDER_PORTAL'
}
