import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/(home).page'),
  },
  {
    path: 'demos',
    loadComponent: () => import('./pages/demos.layout'),
    children: [
      { path: '', redirectTo: 'enter', pathMatch: 'full' },
      { path: 'enter', loadComponent: () => import('./pages/demos/enter.page') },
      { path: 'leave', loadComponent: () => import('./pages/demos/leave.page') },
      { path: 'animate', loadComponent: () => import('./pages/demos/animate.page') },
      { path: 'hover', loadComponent: () => import('./pages/demos/hover.page') },
      { path: 'tap', loadComponent: () => import('./pages/demos/tap.page') },
      { path: 'in-view', loadComponent: () => import('./pages/demos/in-view.page') },
      { path: 'drag', loadComponent: () => import('./pages/demos/drag.page') },
      { path: 'text', loadComponent: () => import('./pages/demos/text.page') },
      { path: 'stagger', loadComponent: () => import('./pages/demos/stagger.page') },
      { path: 'layout', loadComponent: () => import('./pages/demos/layout.page') },
      { path: 'variants', loadComponent: () => import('./pages/demos/variants.page') },
      { path: 'scroll', loadComponent: () => import('./pages/demos/scroll.page') },
      { path: 'parallax', loadComponent: () => import('./pages/demos/parallax.page') },
      { path: 'presence', loadComponent: () => import('./pages/demos/presence.page') },
    ],
  },
  {
    path: 'docs',
    loadComponent: () => import('./pages/docs.layout'),
    children: [
      { path: '', redirectTo: 'introduction', pathMatch: 'full' },
      { path: 'introduction', loadComponent: () => import('./pages/docs/introduction.page') },
      { path: 'get-started', loadComponent: () => import('./pages/docs/get-started.page') },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/[...404].page'),
  },
];
