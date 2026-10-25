import type { ComponentType } from "react";
import { Button, Dialog, HStack, Stack, Surface, Text } from "@var-ui/react";
import * as TablerIcons from "@tabler/icons-react";
import type { DisplayDocument } from "@homeslate/schema";
import {
  DOCUMENT_TEMPLATES,
  documentForNewDisplay,
  type NewDisplayChoice,
} from "@homeslate/display/canvas";

const CHOICES: Array<{ id: NewDisplayChoice; name: string; description: string; icon?: string }> = [
  {
    id: "blank",
    name: "Blank",
    description: "An empty board you can design yourself.",
  },
  ...DOCUMENT_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    icon: template.icon,
  })),
];

function choiceIcon(name: string | undefined) {
  if (!name) return null;
  return (TablerIcons as Record<string, unknown>)[name] as
    | ComponentType<{ size?: number; stroke?: number }>
    | undefined;
}

/** The selectable layouts. Rendered inside the dialog and by tests. */
export function TemplatePickerChoices(props: {
  isPending: boolean;
  onCreate: (document: DisplayDocument) => void;
}) {
  const { isPending, onCreate } = props;
  return (
    <Stack gap="sm">
      {CHOICES.map((choice) => {
        const Icon = choiceIcon(choice.icon);
        return (
          <Surface key={choice.id} padding="sm">
            <HStack justify="between" align="center" gap="sm">
              <HStack gap="sm" align="center">
                {Icon ? <Icon size={18} stroke={1.5} /> : null}
                <Stack gap="xs">
                  <Text weight="semibold">{choice.name}</Text>
                  <Text size="sm" tone="secondary">
                    {choice.description}
                  </Text>
                </Stack>
              </HStack>
              <Button
                size="sm"
                tone={choice.id === "blank" ? "accent" : undefined}
                appearance={choice.id === "blank" ? "filled" : undefined}
                isDisabled={isPending}
                aria-label={`Create ${choice.name} display`}
                onPress={() => onCreate(documentForNewDisplay(choice.id))}
              >
                Use
              </Button>
            </HStack>
          </Surface>
        );
      })}
    </Stack>
  );
}

/** Dialog for “New display”. Every choice creates a display; none overwrite one. */
export function TemplatePicker(props: {
  isOpen: boolean;
  isPending?: boolean;
  error?: string | null;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (document: DisplayDocument) => void;
}) {
  const { isOpen, isPending = false, error, onOpenChange, onCreate } = props;
  return (
    <Dialog.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Backdrop>
        <Dialog.Popup>
          <Dialog.Title>New display</Dialog.Title>
          <Stack gap="md">
            <Text size="sm" tone="secondary">
              Start from a blank board or a starter layout. This always creates a new display.
            </Text>
            {error ? <Text role="alert">{error}</Text> : null}
            <TemplatePickerChoices isPending={isPending} onCreate={onCreate} />
          </Stack>
        </Dialog.Popup>
      </Dialog.Backdrop>
    </Dialog.Root>
  );
}
