import { faker } from '@faker-js/faker';
import path from 'path';
import fs from 'fs';
import { AvatarType } from '../helpers/avatar-type.enum';

const VALID_IMAGES_DIR = path.resolve(__dirname, 'images/valid');
const INVALID_SIZE_DIR = path.resolve(__dirname, 'images/invalid-size');
const INVALID_TYPE_DIR = path.resolve(__dirname, 'images/invalid-type');

function randomFileFrom(dir: string): string {
  const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
  return path.join(dir, faker.helpers.arrayElement(files));
}

function allFilesFrom(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter((f) => !f.startsWith('.'))
    .map((f) => path.join(dir, f));
}

export function randomAvatar(type: AvatarType = AvatarType.Valid): string {
  switch (type) {
    case AvatarType.Valid:
      return randomFileFrom(VALID_IMAGES_DIR);
    case AvatarType.InvalidSize:
      return randomFileFrom(INVALID_SIZE_DIR);
    case AvatarType.InvalidType:
      return randomFileFrom(INVALID_TYPE_DIR);
  }
}

export function allValidAvatars(): { filePath: string; extension: string }[] {
  return allFilesFrom(VALID_IMAGES_DIR).map((filePath) => ({
    filePath,
    extension: path.extname(filePath).toLowerCase(),
  }));
}

export function randomUser(avatarType?: AvatarType) {
  const password = faker.internet.password({ length: 12 });

  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: password,
    confirmPassword: password,
    ...(avatarType !== undefined && (() => {
      const avatarPath = randomAvatar(avatarType);
      return {
        avatar: avatarPath,
        avatarExtension: path.extname(avatarPath).toLowerCase(),
      };
    })()),
  };
}
