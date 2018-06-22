export interface SpawnRequest {
  roomName: string;
  role: string;
  priority: string;
  bodyParts: BodyPartConstant[];
  energyRequirements: number;
  memoryProperties: any;
}
