import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home') },
  { path: 'demos', loadComponent: () => import('./pages/demos/demos') },
  {
    path: 'docs',
    loadComponent: () => import('./pages/docs/docs'),
    children: [
      { path: '', redirectTo: 'introduction', pathMatch: 'full' },
      {
        path: 'introduction',
        loadComponent: () => import('./pages/docs/pages/introduction/introduction'),
      },
      {
        path: 'get-started',
        loadComponent: () => import('./pages/docs/pages/get-started/get-started'),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found'),
  },
];
