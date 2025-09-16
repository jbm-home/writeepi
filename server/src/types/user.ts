export interface User {
  uuid: string;
  firstname: string;
  lastname: string;
  password?: string;
  email: string;
  phone: string;
  creation?: Date;
  updatedAt?: Date;
  resetkey?: string;
  resetdate?: Date;
  active: boolean;
  level: number;
}
