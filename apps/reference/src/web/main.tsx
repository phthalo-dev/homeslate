import "@var-ui/core/styles";
import "@var-ui/core/register-default-theme";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DesignSystemProvider, IconProvider, LayerProvider } from "@var-ui/react";
import { defaultIcons } from "@var-ui/icons";
import { HomeslateApp } from "@homeslate/host-react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DesignSystemProvider applyToDocument defaultColorMode="dark">
      <IconProvider icons={defaultIcons}>
        <LayerProvider>
          <HomeslateApp />
        </LayerProvider>
      </IconProvider>
    </DesignSystemProvider>
  </StrictMode>,
);
