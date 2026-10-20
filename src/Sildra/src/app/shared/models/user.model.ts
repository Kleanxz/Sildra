export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Agent' | 'User';
  isAdmin: boolean;
  isAgent: boolean;
  emailSent?: boolean | null;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface AuthForm {
  nombre: string;
  email: string;
  password: string;
  organizacionId: string;
}

export interface NavigationSection {
  nombre: string;
  icono: string;
  grupo: string;
}
