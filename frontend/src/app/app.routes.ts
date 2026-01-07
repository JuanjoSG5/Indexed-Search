import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'en',
        pathMatch: 'full'
    },
    {
        path: ':lang',
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./pages/home/home').then(m => m.Home)
            },
            {
                path: 'architecture',
                loadComponent: () =>
                    import('./pages/architecture/architecture').then(m => m.Architecture)
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'en',
        pathMatch: 'full'
    }
];