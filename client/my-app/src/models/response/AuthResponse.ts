import {IUser} from "../IUser"
export interface AuthResponse {
    accessToken: string;
    resfreshToken: string;
    user: IUser;
}