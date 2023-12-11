import {AppUser} from '../../appUser.interface';

export interface StepDTO {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  name: string;
  icon: string;
  user?: AppUser;
  isStart?: boolean;
}
