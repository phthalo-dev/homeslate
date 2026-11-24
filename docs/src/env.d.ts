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
