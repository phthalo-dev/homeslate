import { Button, ColorInput, HStack, IconButton, Stack, Text, TextField } from "@var-ui/react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import type { HouseholdMember } from "@homeslate/schema";
import { useOverlayPortalContainer } from "../overlayPortal";
import * as classes from "./HouseholdEditor.styles";

export const HOUSEHOLD_MEMBER_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
  "#f97316",
  "#3b82f6",
  "#14b8a6",
  "#e11d48",
];

export const MAX_HOUSEHOLD_MEMBERS = 12;

function createMember(index: number): HouseholdMember {
  return {
    id: uuidv4(),
    name: "Person",
    color: HOUSEHOLD_MEMBER_COLORS[index % HOUSEHOLD_MEMBER_COLORS.length],
  };
}

export function HouseholdEditor({
  members,
  onChange,
  readOnly = false,
}: {
  members: HouseholdMember[];
  onChange: (members: HouseholdMember[]) => void;
  readOnly?: boolean;
}) {
  const portalContainer = useOverlayPortalContainer();
  const update = (id: string, patch: Partial<HouseholdMember>) => {
    onChange(members.map((member) => (member.id === id ? { ...member, ...patch } : member)));
  };

  return (
    <Stack gap="sm" className={classes.list}>
      {members.length === 0 && (
        <Text size="sm" tone="secondary">
          Add people to color-code chores.
        </Text>
      )}
      {members.map((member) => (
        <HStack key={member.id} align="center" gap="sm" className={classes.row}>
          <span className={classes.disc} style={{ background: member.color }} aria-hidden>
            {member.name.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <TextField
            size="sm"
            value={member.name}
            onChange={(value) => update(member.id, { name: value })}
            isDisabled={readOnly}
            style={{ flex: 1 }}
            aria-label="Member name"
          />
          {!readOnly && (
            <>
              <ColorInput
                label={`Color for ${member.name}`}
                value={member.color}
                onChange={(value) => update(member.id, { color: value })}
                swatches={[...HOUSEHOLD_MEMBER_COLORS]}
                size="sm"
                portalContainer={portalContainer}
                className={classes.colorField}
              />
              <IconButton
                name="close"
                icon={<IconTrash size={16} />}
                appearance="ghost"
                tone="danger"
                aria-label={`Remove ${member.name}`}
                onPress={() => onChange(members.filter((item) => item.id !== member.id))}
              />
            </>
          )}
        </HStack>
      ))}
      {!readOnly && members.length < MAX_HOUSEHOLD_MEMBERS && (
        <Button
          appearance="subtle"
          size="sm"
          onPress={() => onChange([...members, createMember(members.length)])}
        >
          <IconPlus size={14} />
          Add person
        </Button>
      )}
    </Stack>
  );
}
