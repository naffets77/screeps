import { BodyOptions } from 'models/utilities/body-options';

export class ScreepUtilsCreepBuilder {
  // takes in ratios of body parts to know how to build
  public static getBody(energy: number, bodyOptions: BodyOptions): BodyPartConstant[] {
    let bodyParts: BodyPartConstant[] = [];

    if (energy > 300) {
      let carryCount = 0;
      let workCount = 0;
      let moveCount = 0;

      if (bodyOptions.carry && bodyOptions.carryMinimum) {
        carryCount += bodyOptions.carryMinimum + Math.floor(energy / bodyOptions.carry);
      }

      if (bodyOptions.work && bodyOptions.workMinimum) {
        workCount += bodyOptions.workMinimum + Math.floor(energy / bodyOptions.work);
      }

      if (bodyOptions.move && bodyOptions.moveMinimum) {
        moveCount += bodyOptions.moveMinimum + Math.floor(energy / bodyOptions.move);
      }

      this.addBodyParts(bodyParts, carryCount, CARRY);
      this.addBodyParts(bodyParts, workCount, WORK);
      this.addBodyParts(bodyParts, moveCount, MOVE);
    } else {
      bodyParts = bodyOptions.baseBody;
    }

    return bodyParts;
  }

  public static calculateBodyEnergyRequirements(bodyParts: BodyPartConstant[]): number {
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

  private static addBodyParts(bodyParts: BodyPartConstant[], count: number, type: BodyPartConstant) {
    for (let i = 0; i < count; i++) {
      bodyParts.push(type);
    }
  }
}
