import "@var-ui/core/styles";
import "@var-ui/core/register-default-theme";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DesignSystemProvider, IconProvider } from "@var-ui/react";
import { defaultIcons } from "@var-ui/icons";
import { HomeslateApp } from "@homeslate/host-react";
import { adminTheme } from "./adminTheme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DesignSystemProvider customTheme={adminTheme} applyToDocument defaultColorMode="dark">
      <IconProvider icons={defaultIcons}>
        <HomeslateApp />
      </IconProvider>
    </DesignSystemProvider>
  </StrictMode>,
);
