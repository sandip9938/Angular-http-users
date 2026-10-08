import { Routes } from '@angular/router';
import { Users } from './pages/users/users';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'users',
        component: Users,
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./pages/user-details/user-details').then(m => m.UserDetails),
      },
      {
        path: '**',
        redirectTo: 'users',
      },
];
