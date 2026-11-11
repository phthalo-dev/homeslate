import { useState } from "react";
import { Button, HStack, Stack, Switch, Text } from "@var-ui/react";
import { IconRefresh, IconUsers } from "@tabler/icons-react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntityList } from "../hooks/useHomeAssistant";
import { AddEntitySelect, SelectedEntityRow } from "./AddEntitySelect";
import {
  PRESENCE_EMPTY_COPY,
  PRESENCE_MISSING_CONFIG_COPY,
  presenceLabel,
  type HomeAssistantPresence,
} from "./homeAssistantPresence";
import { presenceAvatarPresentation } from "./presenceImage";
import * as classes from "./PresenceWidget.styles";
import { ErrorText } from "../ErrorText";

export interface PresenceConfig extends WidgetConfig {
  entityIds: string[];
  showZones: boolean;
  transparentBackground: boolean;
}

const PRESENCE_DOMAINS = ["person", "device_tracker", "zone"];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function PresenceAvatar({ name, picture }: { name: string; picture: string | null }) {
  const [failed, setFailed] = useState(false);
  const presentation = presenceAvatarPresentation(picture, failed);
  if (presentation.kind === "initials") {
    return <div className={classes.avatarFallback}>{initials(name)}</div>;
  }
  return (
    <img className={classes.avatar} src={presentation.src} alt="" onError={() => setFailed(true)} />
  );
}

export function PresenceWidget({ widget, isEditing }: WidgetProps<PresenceConfig>) {
  const { entityIds = [], showZones = true, transparentBackground = false } = widget.config;
  const ids = entityIds.filter(Boolean);
  const { entities, isLoading, error, status, lastUpdated, isStale, refresh } =
    useEntityList<HomeAssistantPresence>(ids, {
      fetchFailureCopy: PRESENCE_MISSING_CONFIG_COPY,
    });
  const byId = new Map(entities.map((entity) => [entity.entityId, entity]));

  if (ids.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconUsers size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{PRESENCE_EMPTY_COPY}</Text>
        </div>
      </div>
    );
  }

  if (status === 501) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <Text className={classes.emptyTitle}>Home Assistant isn't connected</Text>
          <Text size="sm" tone="secondary">
            {error ?? PRESENCE_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {error && !lastUpdated && (
        <HStack gap="sm" align="center" justify="between">
          <ErrorText size="sm">{error}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </HStack>
      )}
      <div className={classes.list}>
        {ids.map((entityId) => {
          const presence = byId.get(entityId);
          const name = presence?.name ?? entityId;
          return (
            <div key={entityId} className={classes.row}>
              <PresenceAvatar
                key={`${entityId}:${presence?.entityPicture ?? ""}`}
                name={name}
                picture={presence?.entityPicture ?? null}
              />
              <div className={classes.details}>
                <Text className={classes.name}>{name}</Text>
                <span className={classes.state}>
                  <span
                    className={classes.dot}
                    style={{
                      background: presence?.isHome
                        ? "var(--var-ui-color-tone-success-foreground)"
                        : "var(--var-ui-color-text-secondary)",
                    }}
                  />
                  <Text size="sm" tone="secondary">
                    {presence ? presenceLabel(presence) : "—"}
                  </Text>
                  {showZones && presence?.zoneName && (
                    <Text size="sm" tone="secondary">
                      · {presence.zoneName}
                    </Text>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {!isEditing && (
        <WidgetDataStatus
          widgetId={widget.id}
          lastUpdated={lastUpdated}
          isStale={isStale}
          error={error}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export function PresenceSettings({ widget, onConfigChange }: WidgetProps<PresenceConfig>) {
  const { entityIds = [], showZones = true, transparentBackground = false } = widget.config;

  return (
    <Stack gap="md">
      <AddEntitySelect
        domains={PRESENCE_DOMAINS}
        value={entityIds}
        onAdd={(entityId) => onConfigChange({ entityIds: [...entityIds, entityId] })}
        failureCopy={PRESENCE_MISSING_CONFIG_COPY}
        label="Add person or tracker"
      />
      {entityIds.map((entityId) => (
        <SelectedEntityRow
          key={entityId}
          entityId={entityId}
          onRemove={() =>
            onConfigChange({ entityIds: entityIds.filter((value) => value !== entityId) })
          }
        />
      ))}
      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show zone names</Text>
        <Switch
          aria-label="Show zone names"
          checked={showZones}
          onCheckedChange={(value) => onConfigChange({ showZones: value })}
        />
      </HStack>
      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Transparent background</Text>
        <Switch
          aria-label="Transparent background"
          checked={transparentBackground}
          onCheckedChange={(value) => onConfigChange({ transparentBackground: value })}
        />
      </HStack>
    </Stack>
  );
}
