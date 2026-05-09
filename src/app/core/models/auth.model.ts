import { User } from './user.model';
import { MenuItem } from '../../layout/sidebar/menu-items';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
}

export interface MenuResponse {
    recurrent: MenuItem[];
    main: MenuItem[];
}