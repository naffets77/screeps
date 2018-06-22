export class ScreepUtils {
  public rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  public getCreepCount(role?: string) {
    let count: number = 0;
    for (const name in Game.creeps) {
      // @ts-ignore
      if (role && Game.creeps[name].memory['role'] === role) {
        count++;
      } else if (role == null) {
        count++;
      }
    }

    return count;
  }

  public getRoomName(): string {
    return 'W17N12';
  }

  public energyAvailabile(): number {
    return Game.rooms[this.getRoomName()].energyAvailable;
  }

  public energyCapacity(): number {
    return Game.rooms[this.getRoomName()].energyCapacityAvailable;
  }

  public getCreepsByRole(roomName: string, role: string): Creep[] {
    const selectedCreeps: Creep[] = [];

    for (const creepName in Game.creeps) {
      const creep: Creep = Game.creeps[creepName];
      // @ts-ignore
      if (creep.memory.room === roomName && creep.spawning === false && (creep.memory.role === role || role == null)) {
        selectedCreeps.push(creep);
      }
    }

    return selectedCreeps;
  }

  public getIdleCreeps(creeps: Creep[]): Creep[] {
    const selectedCreeps: Creep[] = [];

    for (const creepName in creeps) {
      const creep: Creep = creeps[creepName];
      // @ts-ignore
      if (creep.memory.job === 'Idle') {
        selectedCreeps.push(creep);
      }
    }

    return selectedCreeps;
  }

  public filterCreepsByMemoryProperty(searchArray: any[], propertyName: string, propertyValue: any): any[] {
    const results = [];
    for (const item of searchArray) {
      if (item.memory[propertyName] && item.memory[propertyName] === propertyValue) {
        results.push(item);
      }
    }
    return results;
  }

  public calculateBodyEnergyRequirements(bodyParts: BodyPartConstant[]): number {
    let energyRequirement: number = 0;

    for (const part of bodyParts) {
      switch (part) {
        case TOUGH:
          energyRequirement += 10;
          break;
        case ATTACK:
          energyRequirement += 80;
          break;
        case MOVE:
        case CARRY:
          energyRequirement += 50;
          break;
        case WORK:
          energyRequirement += 100;
          break;
        case RANGED_ATTACK:
          energyRequirement += 150;
          break;
        case HEAL:
          energyRequirement += 250;
          break;
        case CLAIM:
          energyRequirement += 600;
          break;
      }
    }
    return energyRequirement;
  }
}
