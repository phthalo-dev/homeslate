import { Button, HStack, IconButton, Select, Stack, Text } from "@var-ui/react";
import { IconRefresh, IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useEntitiesAcross } from "../hooks/useHomeAssistant";
import { ErrorText } from "../ErrorText";

export interface AddEntitySelectProps {
  /** Allowlisted domains to list. */
  domains: string[];
  /** Entity ids already selected; hidden from the picker. */
  value: string[];
  onAdd: (entityId: string) => void;
  failureCopy: string;
  label?: string;
}

/**
 * Settings picker for widgets that manage a list of entities. Lists every
 * entity across `domains`, hides the ones already chosen, and surfaces the
 * unconfigured/unreachable states inline.
 */
export function AddEntitySelect({
  domains,
  value,
  onAdd,
  failureCopy,
  label = "Add entity",
}: AddEntitySelectProps) {
  const { entities, isLoading, error, status, refresh } = useEntitiesAcross(domains, failureCopy);
  const available = entities.filter((entity) => !value.includes(entity.entityId));

  return (
    <Stack gap="xs">
      <HStack gap="xs" align="end">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Select
            label={label}
            placeholder={isLoading ? "Loading…" : "Select an entity…"}
            options={available.map((entity) => ({
              value: entity.entityId,
              label: `${entity.name} (${entity.entityId})`,
            }))}
            value={null}
            onValueChange={(key) => {
              if (typeof key === "string") onAdd(key);
            }}
          />
        </div>
        <Button
          appearance="subtle"
          size="sm"
          aria-label="Refresh entities"
          onClick={refresh}
          disabled={isLoading}
        >
          <IconRefresh size={14} />
        </Button>
      </HStack>
      {status === 501 && (
        <Text size="xs" tone="secondary">
          {error ?? "Home Assistant is not configured."}
        </Text>
      )}
      {error && status !== 501 && <ErrorText size="xs">{error}</ErrorText>}
    </Stack>
  );
}

/** A compact, removable row used under an `AddEntitySelect`. */
export function SelectedEntityRow({
  entityId,
  children,
  onRemove,
}: {
  entityId: string;
  children?: ReactNode;
  onRemove: () => void;
}) {
  return (
    <Stack gap="xs">
      <HStack gap="xs" align="center" justify="between">
        <Text size="sm" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {entityId}
        </Text>
        <IconButton
          icon={<IconX size={14} />}
          aria-label={`Remove ${entityId}`}
          size="sm"
          onClick={onRemove}
        />
      </HStack>
      {children}
    </Stack>
  );
}
