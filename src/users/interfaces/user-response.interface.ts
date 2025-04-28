import { IUser } from './user.interface';

export type IUserResponse = Omit<IUser, 'password'>;
