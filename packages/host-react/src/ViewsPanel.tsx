import { useState, type ComponentType, type JSX } from "react";
import {
  Badge,
  Button,
  HStack,
  IconButton,
  Select,
  Tooltip,
  Stack,
  Surface,
  Text,
  TextField,
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
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import type { DisplayDocument, View } from "@homeslate/schema";
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

export function ViewsPanel(props: {
  document: DisplayDocument;
  onChange: (next: DisplayDocument) => void;
  onOpenView: (viewId: string) => void;
}): JSX.Element {
  const { document, onChange, onOpenView } = props;
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const canDelete = document.views.length > 1;

  const missingPresets = missingPresetViews(document);

  const addBlankView = () => {
    const view = newView(newName.trim() || `View ${document.views.length + 1}`);
    onChange(addView(document, view));
    setNewName("");
    onOpenView(view.id);
  };

  const commitRename = (viewId: string) => {
    const name = editingName.trim();
    setEditingId(null);
    if (name) onChange(patchView(document, viewId, { name }));
  };

  return (
    <Stack gap="md">
      <HStack justify="between" align="center" gap="md" wrap>
        <Text weight="semibold">Views</Text>
        <HStack gap="sm" align="center">
          <TextField
            aria-label="New view name"
            placeholder="New view name"
            size="sm"
            value={newName}
            onValueChange={setNewName}
            onKeyDown={(event) => {
              if (event.key === "Enter") addBlankView();
            }}
          />
          <Button
            tone="accent"
            appearance="filled"
            size="sm"
            disabled={!newName.trim()}
            onClick={addBlankView}
          >
            <IconPlus size={14} />
            New view
          </Button>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Button
                size="sm"
                disabled={missingPresets.length === 0}
                onClick={() => onChange(addPresetViews(document))}
              >
                Add preset views
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Popup>
              {missingPresets.length > 0
                ? `Add ${missingPresets.join(", ")}`
                : "All preset views are already added"}
            </Tooltip.Popup>
          </Tooltip.Root>
        </HStack>
      </HStack>

      <Text size="sm" tone="secondary">
        {document.views.length} {document.views.length === 1 ? "view" : "views"}. Hidden views are
        skipped by auto-rotation and the kiosk switcher.
      </Text>

      <Stack gap="sm">
        {document.views.map((view, index) => {
          const CurrentIcon = viewIcon(view.icon);
          const editing = editingId === view.id;
          return (
            <Surface key={view.id} padding="sm">
              <HStack justify="between" align="center" gap="sm" wrap={false}>
                <HStack gap="sm" align="center" style={{ minWidth: 0, flex: 1 }}>
                  {CurrentIcon ? <CurrentIcon size={18} stroke={1.5} /> : null}
                  {editing ? (
                    <HStack gap="xs" align="center" style={{ flex: 1 }}>
                      <TextField
                        aria-label="View name"
                        size="sm"
                        value={editingName}
                        onValueChange={setEditingName}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitRename(view.id);
                          if (event.key === "Escape") setEditingId(null);
                        }}
                      />
                      <IconButton
                        icon={<IconCheck size={14} />}
                        appearance="ghost"
                        size="sm"
                        aria-label="Save view name"
                        onClick={() => commitRename(view.id)}
                      />
                      <IconButton
                        icon={<IconX size={14} />}
                        appearance="ghost"
                        size="sm"
                        aria-label="Cancel rename"
                        onClick={() => setEditingId(null)}
                      />
                    </HStack>
                  ) : (
                    <Stack gap="xs">
                      <HStack gap="xs" align="center">
                        <Button
                          appearance="ghost"
                          size="sm"
                          aria-label={`Edit ${view.name}`}
                          onClick={() => onOpenView(view.id)}
                        >
                          {view.name}
                        </Button>
                        {view.hidden && <Badge tone="neutral">hidden</Badge>}
                      </HStack>
                      <Text size="xs" tone="secondary">
                        {view.widgets.length} {view.widgets.length === 1 ? "widget" : "widgets"}
                      </Text>
                    </Stack>
                  )}
                </HStack>

                <HStack gap="xs" align="center">
                  <Select
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
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <IconButton
                        icon={<IconArrowUp size={14} />}
                        appearance="ghost"
                        size="sm"
                        disabled={index === 0}
                        aria-label={`Move ${view.name} up`}
                        onClick={() => onChange(moveView(document, view.id, index - 1))}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Popup>Move up</Tooltip.Popup>
                  </Tooltip.Root>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <IconButton
                        icon={<IconArrowDown size={14} />}
                        appearance="ghost"
                        size="sm"
                        disabled={index === document.views.length - 1}
                        aria-label={`Move ${view.name} down`}
                        onClick={() => onChange(moveView(document, view.id, index + 1))}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Popup>Move down</Tooltip.Popup>
                  </Tooltip.Root>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <IconButton
                        icon={view.hidden ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                        appearance="ghost"
                        size="sm"
                        aria-label={view.hidden ? `Show ${view.name}` : `Hide ${view.name}`}
                        onClick={() =>
                          onChange(patchView(document, view.id, { hidden: !view.hidden }))
                        }
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Popup>{view.hidden ? "Show view" : "Hide view"}</Tooltip.Popup>
                  </Tooltip.Root>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <IconButton
                        icon={<IconCopy size={14} />}
                        appearance="ghost"
                        size="sm"
                        aria-label={`Duplicate ${view.name}`}
                        onClick={() => onChange(duplicateView(document, view.id))}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Popup>Duplicate view</Tooltip.Popup>
                  </Tooltip.Root>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <IconButton
                        icon={<IconEdit size={14} />}
                        appearance="ghost"
                        size="sm"
                        aria-label={`Rename ${view.name}`}
                        onClick={() => {
                          setEditingId(view.id);
                          setEditingName(view.name);
                        }}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Popup>Rename view</Tooltip.Popup>
                  </Tooltip.Root>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <IconButton
                        icon={<IconTrash size={14} />}
                        appearance="ghost"
                        tone="danger"
                        size="sm"
                        disabled={!canDelete}
                        aria-label={`Delete ${view.name}`}
                        onClick={() => onChange(removeView(document, view.id))}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Popup>
                      {canDelete ? "Delete view" : "Keep at least one view"}
                    </Tooltip.Popup>
                  </Tooltip.Root>
                </HStack>
              </HStack>
            </Surface>
          );
        })}
      </Stack>
    </Stack>
  );
}
