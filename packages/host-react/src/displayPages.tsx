import { useNavigate, useParams } from "react-router-dom";
import { Heading, Stack, Text } from "@var-ui/react";
import { Editor, ThemeEditor } from "@homeslate/editor";
import type { ThemeDocument } from "@homeslate/schema";
import { DisplaySettingsPanel } from "./DisplaySettingsPanel";
import { useDisplay } from "./DisplayLayout";
import { useHomeslateHost } from "./hostContext";
import { ViewsPanel } from "./ViewsPanel";
import * as classes from "./pages.styles";
import * as shared from "./shared.styles";

/** The shared title + one-line description that opens each management section. */
function SectionIntro(props: { title: string; description: string }) {
  return (
    <Stack gap="xs">
      <Heading level={2} size="sm">
        {props.title}
      </Heading>
      <Text size="sm" tone="secondary">
        {props.description}
      </Text>
    </Stack>
  );
}

/** Management: the display's views (`/edit/:id`). Render inside `DisplayLayout`. */
export function DisplayViewsPage() {
  const navigate = useNavigate();
  const { record, document, setDocument } = useDisplay();
  return (
    <div className={classes.pageColumn}>
      <ViewsPanel
        document={document}
        onChange={setDocument}
        onOpenView={(viewId) => navigate(`/edit/${record.id}/views/${viewId}`)}
      />
    </div>
  );
}

/** Management: kiosk behavior, alarms and access (`/edit/:id/settings`). */
export function DisplaySettingsPage() {
  const { document, setDocument, passcodeEnabled, setPasscode } = useDisplay();
  return (
    <Stack gap="lg" className={classes.pageColumn}>
      <SectionIntro
        title="Settings"
        description="How this display behaves on the kiosk: rotation, extras, alarms and access."
      />
      <DisplaySettingsPanel
        document={document}
        onChange={setDocument}
        passcodeEnabled={passcodeEnabled}
        onSetPasscode={setPasscode}
      />
    </Stack>
  );
}

/** Management: themes (`/edit/:id/theme`). */
export function DisplayThemePage() {
  const { document, setDocument } = useDisplay();
  return (
    <Stack gap="lg" className={classes.pageColumn}>
      <SectionIntro
        title="Theme"
        description="Colors, type and styling for this display. Create a theme from a preset, then fine-tune it."
      />
      <ThemeEditor
        documents={document.themes as ThemeDocument[]}
        activeThemeDocumentId={document.activeThemeId}
        previewViews={document.views}
        initialPreviewViewId={document.activeViewId}
        onChange={(themes, activeThemeId) => setDocument({ ...document, themes, activeThemeId })}
      />
    </Stack>
  );
}

/** Per-view canvas editor (`/edit/:id/views/:viewId`). Renders `@homeslate/editor` for one view. */
export function ViewEditorPage() {
  const { viewId } = useParams<{ viewId: string }>();
  const { widgetRegistry } = useHomeslateHost();
  const { document, setDocument, toolbarSlot } = useDisplay();

  const view = document.views.find((candidate) => candidate.id === viewId) ?? document.views[0];
  if (!view) {
    return (
      <Text role="alert" className={shared.alertPad}>
        This display has no views yet.
      </Text>
    );
  }

  return (
    <div className={classes.editorFill}>
      <Editor
        document={document}
        viewId={view.id}
        widgetRegistry={widgetRegistry}
        onChange={setDocument}
        toolbarContainer={toolbarSlot}
      />
    </div>
  );
}
