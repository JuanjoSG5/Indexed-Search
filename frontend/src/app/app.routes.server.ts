// app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: ':lang',
    renderMode: RenderMode.Server, // <--- Change to Server (no params needed)
  },
  {
    path: ':lang/architecture',
    renderMode: RenderMode.Server, // <--- Change to Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];