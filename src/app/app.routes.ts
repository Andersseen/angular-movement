import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home') },
  {
    path: 'demos',
    loadComponent: () => import('./pages/demos/demos-layout'),
    children: [
      { path: '', redirectTo: 'enter', pathMatch: 'full' },
      { path: 'enter', loadComponent: () => import('./pages/demos/pages/enter/enter') },
      { path: 'leave', loadComponent: () => import('./pages/demos/pages/leave/leave') },
      { path: 'animate', loadComponent: () => import('./pages/demos/pages/animate/animate') },
      { path: 'hover', loadComponent: () => import('./pages/demos/pages/hover/hover') },
      { path: 'tap', loadComponent: () => import('./pages/demos/pages/tap/tap') },
      { path: 'in-view', loadComponent: () => import('./pages/demos/pages/in-view/in-view') },
      { path: 'text', loadComponent: () => import('./pages/demos/pages/text/text') },
      { path: 'stagger', loadComponent: () => import('./pages/demos/pages/stagger/stagger') },
      { path: 'layout', loadComponent: () => import('./pages/demos/pages/layout/layout') },
      { path: 'variants', loadComponent: () => import('./pages/demos/pages/variants/variants') },
      { path: 'drag', loadComponent: () => import('./pages/demos/pages/drag/drag') },
      { path: 'presence', loadComponent: () => import('./pages/demos/pages/presence/presence') },
      { path: 'scroll', loadComponent: () => import('./pages/demos/pages/scroll/scroll') },
      { path: 'parallax', loadComponent: () => import('./pages/demos/pages/parallax/parallax') },
    ],
  },
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
