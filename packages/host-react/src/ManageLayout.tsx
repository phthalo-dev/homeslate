import type { ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Hidden, SegmentedControl, SideNav } from "@var-ui/react";
import { IconLayoutGrid, IconPalette, IconSettings } from "@tabler/icons-react";
import { useDisplay } from "./DisplayLayout";
import { MANAGE_SECTIONS, sectionFromPath, type ManageSection } from "./manageSections";
import * as classes from "./pages.styles";

const ICONS: Record<ManageSection, ReactNode> = {
  views: <IconLayoutGrid size={18} />,
  settings: <IconSettings size={18} />,
  theme: <IconPalette size={18} />,
};

/**
 * Layout for the display management sections: a 280px left nav (the same width and position as the
 * view editor's widget palette, so moving between them doesn't shift the page) and the section
 * content. Below VarUI's md breakpoint the nav becomes a switcher row above the content.
 */
export function ManageLayout() {
  const { record } = useDisplay();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const section = sectionFromPath(pathname);
  const go = (target: (typeof MANAGE_SECTIONS)[number]) =>
    navigate(`/edit/${record.id}${target.path}`);

  return (
    <div className={classes.manage}>
      <Hidden hide={{ base: true, md: false }}>
        <div className={classes.manageNav}>
          <SideNav label="Display sections">
            {MANAGE_SECTIONS.map((item) => (
              <SideNav.Item
                key={item.id}
                label={item.label}
                icon={ICONS[item.id]}
                href={`/edit/${record.id}${item.path}`}
                selected={section === item.id}
              />
            ))}
          </SideNav>
        </div>
      </Hidden>
      <div className={classes.manageContent}>
        <Hidden hide={{ md: true }}>
          <SegmentedControl
            className={classes.switcher}
            aria-label="Display sections"
            fullWidth
            size="sm"
            value={section}
            options={MANAGE_SECTIONS.map((item) => ({ value: item.id, label: item.label }))}
            onValueChange={(next) => {
              const target = MANAGE_SECTIONS.find((item) => item.id === next);
              if (target) go(target);
            }}
          />
        </Hidden>
        <Outlet />
      </div>
    </div>
  );
}
