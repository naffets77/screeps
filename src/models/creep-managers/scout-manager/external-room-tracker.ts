import { ExternalRoom } from '../../world-manager/external-room-manager/external-room';

export interface ExternalRoomTracker extends ExternalRoom {
  roomName: string;
  assignedCreepId?: string;
}
