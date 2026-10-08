export interface User {
  id?: number;
  name: string;
  email: string;
  phone: string;
  website?: string;
}
// Define a type for creating new users, omitting the 'id' property
export type NewUser = Omit<User, 'id'>;
