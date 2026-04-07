import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'demos', loadComponent: () => import('./pages/demos/demos').then(m => m.Demos) },
  { 
    path: 'docs', 
    loadComponent: () => import('./pages/docs/docs').then(m => m.Docs),
    children: [
      { path: '', redirectTo: 'introduction', pathMatch: 'full' },
      { path: 'introduction', loadComponent: () => import('./pages/docs/pages/introduction/introduction').then(m => m.Introduction) },
      { path: 'get-started', loadComponent: () => import('./pages/docs/pages/get-started/get-started').then(m => m.GetStarted) },
    ]
  },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound) }
];
