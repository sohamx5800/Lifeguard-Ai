
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
  
  export interface EmergencyEvent {
    id: string;
    type: string;
    location: Location;
    timestamp: string;
    status: EmergencyStatus;
    severity: 'Minor' | 'Moderate' | 'Severe';
  }
  
  export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
  }
  
  export enum View {
    EMERGENCY = 'EMERGENCY',
    HEALTH = 'HEALTH',
    RESPONDER_PORTAL = 'RESPONDER_PORTAL'
  }
  