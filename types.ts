
export enum ChannelType {
  TEAM = 'TEAM',
  PRIVATE = 'PRIVATE',
  AI_ASSISTANT = 'AI_ASSISTANT'
}

export interface Department {
  id: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  members: number;
  isSecure: boolean;
  departmentId: string;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export enum PTTState {
  IDLE = 'IDLE',
  TRANSMITTING = 'TRANSMITTING', // User is holding button
  RECEIVING = 'RECEIVING',       // Someone else is talking
  BUSY = 'BUSY'                  // Channel is occupied (Half-duplex enforcement)
}

export interface User {
  id: string;
  name: string;
  isOnline: boolean;
  isTalking: boolean;
  channelId: string; // Added to link user to channel
}

export interface AudioVisualizerData {
  volume: number;
  history: number[];
}
