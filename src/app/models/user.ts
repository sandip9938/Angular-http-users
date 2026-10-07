export interface User {
  id?: number;
  name: string;
  email: string;
  phone: string;
  website?: string;
}

export type NewUser = Omit<User, 'id'>;
