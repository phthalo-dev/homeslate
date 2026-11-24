/// <reference types="astro/client" />

declare module '*.astro' {
  const Component: import('astro').AstroComponentFactory;
  export default Component;
}

declare module 'virtual:var-docs/config' {
  const config: import('@var-ui/docs').VarDocsConfig;
  export default config;
}

declare module 'virtual:var-docs/components/Layout' {
  const Layout: import('astro').AstroComponentFactory;
  export default Layout;
}

declare module 'virtual:var-docs/mdx-components' {
  const components: Record<string, unknown>;
  export = components;
}

declare module '@var-ui/docs/PackageInstall' {
  const PackageInstall: (props: { packages: string; dev?: boolean }) => unknown;
  export default PackageInstall;
}

// `@var-ui/docs` sets this in its guide route, but its own `env.d.ts` is not visible to consumers.
declare namespace App {
  interface Locals {
    varDocsRoute?: {
      collection: string;
      id: string;
      pathname: string;
      title: string;
      description?: string;
      template: 'guide' | 'splash';
    };
  }
}
