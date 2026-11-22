import { useState, type ComponentType, type CSSProperties, type JSX } from "react";
import {
  Badge,
  Button,
  Heading,
  HStack,
  IconButton,
  Select,
  Tooltip,
  Stack,
  Surface,
  Text,
  TextField,
  useToast,
} from "@var-ui/react";
import * as TablerIcons from "@tabler/icons-react";
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconCopy,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconLayoutDashboard,
  IconLayoutGrid,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { cx } from "typestyles";
import { v4 as uuidv4 } from "uuid";
import type { DisplayDocument, View } from "@homeslate/schema";
import * as classes from "./ViewsPanel.styles";
import * as shared from "./shared.styles";
import {
  addPresetViews,
  addView,
  duplicateView,
  missingPresetViews,
  moveView,
  patchView,
  removeView,
} from "@homeslate/display/canvas";

/** Curated Tabler icon names the kiosk resolves for the view switcher dots. */
const ICON_OPTIONS = [
  { id: "none", label: "No icon" },
  { id: "IconSun", label: "Sun" },
  { id: "IconSunrise", label: "Sunrise" },
  { id: "IconSunset", label: "Sunset" },
  { id: "IconMoon", label: "Moon" },
  { id: "IconMoonStars", label: "Night" },
  { id: "IconCalendarWeek", label: "Week" },
  { id: "IconHome", label: "Home" },
  { id: "IconBriefcase", label: "Work" },
  { id: "IconCoffee", label: "Coffee" },
  { id: "IconHeart", label: "Heart" },
  { id: "IconStar", label: "Star" },
  { id: "IconCloud", label: "Weather" },
] as const;

function viewIcon(name: string | undefined) {
  if (!name) return null;
  return (TablerIcons as Record<string, unknown>)[name] as
    | ComponentType<{ size?: number; stroke?: number }>
    | undefined;
}

function newView(name: string): View {
  return { id: uuidv4(), name, columns: 12, rowHeight: 80, widgets: [] };
}

/** A miniature of the view's widget layout, so each card shows what the view contains. */
function ViewThumbnail({ view }: { view: View }): JSX.Element {
  const columns = view.columns || 12;
  const rows = Math.max(6, ...view.widgets.map((widget) => widget.layout.y + widget.layout.h));
  return (
    <div
      role="img"
      aria-label={`${view.name} layout preview`}
      className={cx(classes.thumbnail, view.hidden && classes.thumbnailHidden)}
    >
      {view.widgets.length === 0 ? (
        <div className={classes.thumbnailEmpty}>
          <Text size="sm" tone="secondary">
            No widgets yet
          </Text>
        </div>
      ) : (
        view.widgets.map((widget) => (
          <div
            key={widget.id}
            className={classes.tile}
            style={
              {
                "--tile-left": `calc(${(widget.layout.x / columns) * 100}% + 2px)`,
                "--tile-top": `calc(${(widget.layout.y / rows) * 100}% + 2px)`,
                "--tile-width": `calc(${(widget.layout.w / columns) * 100}% - 4px)`,
                "--tile-height": `calc(${(widget.layout.h / rows) * 100}% - 4px)`,
              } as CSSProperties
            }
          >
            <Text size="xs" tone="secondary" as="span" className={classes.tileLabel}>
              {widget.type.replace(/-/g, " ")}
            </Text>
          </div>
        ))
      )}
    </div>
  );
}

function ActionTip(props: { label: string; children: JSX.Element }): JSX.Element {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>{props.children}</Tooltip.Trigger>
      <Tooltip.Popup>{props.label}</Tooltip.Popup>
    </Tooltip.Root>
  );
}

export function ViewsPanel(props: {
  document: DisplayDocument;
  onChange: (next: DisplayDocument) => void;
  onOpenView: (viewId: string) => void;
}): JSX.Element {
  const { document, onChange, onOpenView } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const toasts = useToast();
  const setStatus = (title: string) => {
    toasts.add({ title, durationMs: 2500 });
  };

  /** Hand focus back to the card's rename button once the inline form closes. */
  const closeEditor = (viewId: string) => {
    setEditingId(null);
    requestAnimationFrame(() => {
      window.document.getElementById(`rename-view-${viewId}`)?.focus();
    });
  };

  const canDelete = document.views.length > 1;
  const missingPresets = missingPresetViews(document);

  const addBlankView = () => {
    const view = newView(`View ${document.views.length + 1}`);
    onChange(addView(document, view));
    onOpenView(view.id);
  };

  const commitRename = (viewId: string) => {
    const name = editingName.trim();
    closeEditor(viewId);
    if (name) {
      onChange(patchView(document, viewId, { name }));
      setStatus(`Renamed view to ${name}`);
    }
  };

  return (
    <Stack gap="lg">
      <HStack justify="between" align="start" gap="md" wrap>
        <Stack gap="xs">
          <Heading level={2} size="sm">
            Views
          </Heading>
          <Text size="sm" tone="secondary">
            Each view is a full-screen page on your kiosk. Hidden views are skipped by auto-rotation
            and the kiosk switcher.
          </Text>
        </Stack>
        <HStack gap="sm" align="center" wrap>
          {missingPresets.length > 0 && (
            <Tooltip.Root>
              <Tooltip.Trigger>
                <Button size="sm" onClick={() => onChange(addPresetViews(document))}>
                  Add preset views
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Popup>{`Add ${missingPresets.join(", ")}`}</Tooltip.Popup>
            </Tooltip.Root>
          )}
          <Button tone="accent" appearance="solid" size="sm" onClick={addBlankView}>
            <IconPlus size={14} />
            New view
          </Button>
        </HStack>
      </HStack>

      <div className={classes.grid}>
        {document.views.map((view, index) => {
          const CurrentIcon = viewIcon(view.icon);
          const editing = editingId === view.id;
          const widgetCount = `${view.widgets.length} ${view.widgets.length === 1 ? "widget" : "widgets"}`;
          return (
            <Surface key={view.id} padding="md">
              <Stack gap="md">
                <ViewThumbnail view={view} />

                {editing ? (
                  <Stack gap="sm">
                    <TextField
                      aria-label="View name"
                      size="sm"
                      value={editingName}
                      autoFocus
                      onValueChange={setEditingName}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitRename(view.id);
                        if (event.key === "Escape") closeEditor(view.id);
                      }}
                    />
                    <Select
                      label="Icon"
                      aria-label={`Icon for ${view.name}`}
                      options={ICON_OPTIONS.map((option) => ({
                        value: option.id,
                        label: option.label,
                      }))}
                      value={view.icon ?? "none"}
                      onValueChange={(key) => {
                        onChange(
                          patchView(document, view.id, {
                            icon: key == null || key === "none" ? undefined : String(key),
                          }),
                        );
                      }}
                    />
                    <HStack gap="sm" justify="end">
                      <Button size="sm" appearance="ghost" onClick={() => closeEditor(view.id)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        tone="accent"
                        appearance="solid"
                        onClick={() => commitRename(view.id)}
                      >
                        <IconCheck size={14} />
                        Save
                      </Button>
                    </HStack>
                  </Stack>
                ) : (
                  <>
                    <HStack justify="between" align="center" gap="sm">
                      <HStack gap="sm" align="center" className={shared.shrinkable}>
                        <span className={shared.iconSlot}>
                          {CurrentIcon ? (
                            <CurrentIcon size={18} stroke={1.5} />
                          ) : (
                            <IconLayoutDashboard
                              size={18}
                              stroke={1.5}
                              className={classes.dimmedIcon}
                            />
                          )}
                        </span>
                        <Heading level={3} size="xs">
                          {view.name}
                        </Heading>
                        {view.hidden && <Badge tone="neutral">hidden</Badge>}
                      </HStack>
                      <Text size="sm" tone="secondary" className={shared.nowrap}>
                        {widgetCount}
                      </Text>
                    </HStack>

                    <HStack gap="xs" align="center" justify="between" wrap>
                      <Button
                        size="sm"
                        className={classes.editButton}
                        aria-label={`Edit widgets in ${view.name}`}
                        onClick={() => onOpenView(view.id)}
                      >
                        <IconLayoutGrid size={14} />
                        Edit widgets
                      </Button>
                      <HStack gap="xs" align="center" wrap={false} className={classes.iconActions}>
                        <ActionTip label="Move earlier">
                          <IconButton
                            icon={<IconArrowUp size={14} />}
                            appearance="ghost"
                            size="sm"
                            disabled={index === 0}
                            aria-label={`Move ${view.name} up`}
                            onClick={() => onChange(moveView(document, view.id, index - 1))}
                          />
                        </ActionTip>
                        <ActionTip label="Move later">
                          <IconButton
                            icon={<IconArrowDown size={14} />}
                            appearance="ghost"
                            size="sm"
                            disabled={index === document.views.length - 1}
                            aria-label={`Move ${view.name} down`}
                            onClick={() => onChange(moveView(document, view.id, index + 1))}
                          />
                        </ActionTip>
                        <ActionTip label={view.hidden ? "Show view" : "Hide view"}>
                          <IconButton
                            icon={view.hidden ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                            appearance="ghost"
                            size="sm"
                            aria-label={view.hidden ? `Show ${view.name}` : `Hide ${view.name}`}
                            onClick={() => {
                              onChange(patchView(document, view.id, { hidden: !view.hidden }));
                              setStatus(view.hidden ? `${view.name} shown` : `${view.name} hidden`);
                            }}
                          />
                        </ActionTip>
                        <ActionTip label="Duplicate view">
                          <IconButton
                            icon={<IconCopy size={14} />}
                            appearance="ghost"
                            size="sm"
                            aria-label={`Duplicate ${view.name}`}
                            onClick={() => {
                              onChange(duplicateView(document, view.id));
                              setStatus(`Duplicated ${view.name}`);
                            }}
                          />
                        </ActionTip>
                        <ActionTip label="Rename or change icon">
                          <IconButton
                            icon={<IconEdit size={14} />}
                            appearance="ghost"
                            size="sm"
                            id={`rename-view-${view.id}`}
                            aria-label={`Rename ${view.name}`}
                            onClick={() => {
                              setEditingId(view.id);
                              setEditingName(view.name);
                            }}
                          />
                        </ActionTip>
                        <span aria-hidden className={classes.divider} />
                        <ActionTip label={canDelete ? "Delete view" : "Keep at least one view"}>
                          <IconButton
                            icon={<IconTrash size={14} />}
                            appearance="ghost"
                            tone="danger"
                            size="sm"
                            disabled={!canDelete}
                            aria-label={`Delete ${view.name}`}
                            onClick={() => {
                              onChange(removeView(document, view.id));
                              setStatus(`Deleted ${view.name}`);
                            }}
                          />
                        </ActionTip>
                      </HStack>
                    </HStack>
                  </>
                )}
              </Stack>
            </Surface>
          );
        })}
      </div>
    </Stack>
  );
}
