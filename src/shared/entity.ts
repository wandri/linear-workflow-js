import {createId} from '@paralleldrive/cuid2';

export class Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(entity: { id: string; createdAt?: Date; updatedAt?: Date }) {
    this.id = entity.id;
    this.createdAt = entity.createdAt ?? new Date();
    this.updatedAt = entity.updatedAt ?? new Date();
  }

  static createNew(): Entity {
    return new Entity({
      id: createId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
