import { useState, type ComponentType, type JSX } from "react";
import {
  Badge,
  Button,
  HStack,
  IconButton,
  Select,
  SimpleTooltip,
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
            onChange={setNewName}
            onKeyDown={(event) => {
              if (event.key === "Enter") addBlankView();
            }}
          />
          <Button
            tone="accent"
            appearance="filled"
            size="sm"
            isDisabled={!newName.trim()}
            onPress={addBlankView}
          >
            <IconPlus size={14} />
            New view
          </Button>
          <SimpleTooltip
            content={
              missingPresets.length > 0
                ? `Add ${missingPresets.join(", ")}`
                : "All preset views are already added"
            }
          >
            <Button
              size="sm"
              isDisabled={missingPresets.length === 0}
              onPress={() => onChange(addPresetViews(document))}
            >
              Add preset views
            </Button>
          </SimpleTooltip>
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
                        onChange={setEditingName}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitRename(view.id);
                          if (event.key === "Escape") setEditingId(null);
                        }}
                      />
                      <IconButton
                        name="check"
                        icon={<IconCheck size={14} />}
                        appearance="ghost"
                        size="sm"
                        aria-label="Save view name"
                        onPress={() => commitRename(view.id)}
                      />
                      <IconButton
                        name="close"
                        icon={<IconX size={14} />}
                        appearance="ghost"
                        size="sm"
                        aria-label="Cancel rename"
                        onPress={() => setEditingId(null)}
                      />
                    </HStack>
                  ) : (
                    <Stack gap="xs">
                      <HStack gap="xs" align="center">
                        <Button
                          appearance="ghost"
                          size="sm"
                          aria-label={`Edit ${view.name}`}
                          onPress={() => onOpenView(view.id)}
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
                    options={ICON_OPTIONS.map((option) => ({ id: option.id, label: option.label }))}
                    selectedKey={view.icon ?? "none"}
                    onSelectionChange={(key) => {
                      onChange(
                        patchView(document, view.id, {
                          icon: key == null || key === "none" ? undefined : String(key),
                        }),
                      );
                    }}
                  />
                  <SimpleTooltip content="Move up">
                    <IconButton
                      name="arrowUp"
                      icon={<IconArrowUp size={14} />}
                      appearance="ghost"
                      size="sm"
                      isDisabled={index === 0}
                      aria-label={`Move ${view.name} up`}
                      onPress={() => onChange(moveView(document, view.id, index - 1))}
                    />
                  </SimpleTooltip>
                  <SimpleTooltip content="Move down">
                    <IconButton
                      name="arrowDown"
                      icon={<IconArrowDown size={14} />}
                      appearance="ghost"
                      size="sm"
                      isDisabled={index === document.views.length - 1}
                      aria-label={`Move ${view.name} down`}
                      onPress={() => onChange(moveView(document, view.id, index + 1))}
                    />
                  </SimpleTooltip>
                  <SimpleTooltip content={view.hidden ? "Show view" : "Hide view"}>
                    <IconButton
                      name={view.hidden ? "eyeOff" : "eye"}
                      icon={view.hidden ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                      appearance="ghost"
                      size="sm"
                      aria-label={view.hidden ? `Show ${view.name}` : `Hide ${view.name}`}
                      onPress={() =>
                        onChange(patchView(document, view.id, { hidden: !view.hidden }))
                      }
                    />
                  </SimpleTooltip>
                  <SimpleTooltip content="Duplicate view">
                    <IconButton
                      name="copy"
                      icon={<IconCopy size={14} />}
                      appearance="ghost"
                      size="sm"
                      aria-label={`Duplicate ${view.name}`}
                      onPress={() => onChange(duplicateView(document, view.id))}
                    />
                  </SimpleTooltip>
                  <SimpleTooltip content="Rename view">
                    <IconButton
                      name="wrench"
                      icon={<IconEdit size={14} />}
                      appearance="ghost"
                      size="sm"
                      aria-label={`Rename ${view.name}`}
                      onPress={() => {
                        setEditingId(view.id);
                        setEditingName(view.name);
                      }}
                    />
                  </SimpleTooltip>
                  <SimpleTooltip content={canDelete ? "Delete view" : "Keep at least one view"}>
                    <IconButton
                      name="close"
                      icon={<IconTrash size={14} />}
                      appearance="ghost"
                      tone="danger"
                      size="sm"
                      isDisabled={!canDelete}
                      aria-label={`Delete ${view.name}`}
                      onPress={() => onChange(removeView(document, view.id))}
                    />
                  </SimpleTooltip>
                </HStack>
              </HStack>
            </Surface>
          );
        })}
      </Stack>
    </Stack>
  );
}
