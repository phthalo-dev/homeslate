import { useMemo } from "react";
import {
  Text,
  Stack,
  Spinner,
  Button,
  Surface,
  HStack,
  MultiSelector,
  NumberInput,
  Link,
  Switch,
} from "@var-ui/react";
import { IconNews, IconRefresh, IconExternalLink } from "@tabler/icons-react";
import type { WidgetProps, WidgetConfig } from "../types";
import { useNews } from "../hooks/useNews";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { popularFeeds, type RSSFeed } from "../services/news";
import * as classes from "./NewsWidget.styles";

export interface NewsConfig extends WidgetConfig {
  feedUrls: string[];
  maxItems: number;
  showSource: boolean;
  showDescription: boolean;
  transparentBackground: boolean;
}

export function NewsWidget({ widget }: WidgetProps<NewsConfig>) {
  const { feedUrls, maxItems, showSource, showDescription, transparentBackground } = widget.config;

  const feeds: RSSFeed[] = useMemo(() => {
    return feedUrls
      .map((url) => popularFeeds.find((f) => f.url === url))
      .filter((f): f is RSSFeed => f !== undefined);
  }, [feedUrls]);

  const { items, isLoading, error, isStale, refresh, lastUpdated } = useNews({
    feeds,
    maxItems,
  });

  if (feedUrls.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconNews size={48} className={classes.emptyIcon} />
          <Text size="lg" weight="medium">
            No News Feeds
          </Text>
          <Text size="sm" tone="secondary">
            Select news sources in widget settings
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.loading}>
          <Spinner size="lg" />
          <Text size="sm" tone="secondary">
            Loading news...
          </Text>
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.error}>
          <Text size="sm" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
            {error}
          </Text>
          <Button appearance="subtle" size="sm" onPress={refresh}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconNews size={18} />
          News
        </Text>
        {isLoading && <Spinner size="sm" />}
      </div>
      <WidgetDataStatus
        widgetId={widget.id}
        lastUpdated={lastUpdated}
        isStale={isStale}
        error={error}
        isLoading={isLoading}
      />

      <div className={classes.newsList}>
        <Stack gap="xs">
          {items.map((item, index) => (
            <Surface key={index} className={classes.newsItem} padding="sm">
              <Link
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.newsLink}
              >
                <Text size="sm" weight="medium" className={classes.newsTitle} lineClamp={2}>
                  {item.title}
                </Text>
                <IconExternalLink size={12} className={classes.externalIcon} />
              </Link>
              {showDescription && item.description && (
                <Text size="xs" tone="secondary" lineClamp={2}>
                  {item.description}
                </Text>
              )}
              <div className={classes.newsMeta}>
                {showSource && (
                  <Text size="xs" className={classes.source}>
                    {item.source}
                  </Text>
                )}
                <Text size="xs" tone="secondary">
                  {formatTime(item.pubDate)}
                </Text>
              </div>
            </Surface>
          ))}
        </Stack>
      </div>
    </div>
  );
}

export function NewsWidgetSettings({ widget, onConfigChange }: WidgetProps<NewsConfig>) {
  const { feedUrls, maxItems, showSource, showDescription } = widget.config;

  const feedOptions = popularFeeds.map((feed) => ({
    id: feed.url,
    label: feed.name,
  }));

  return (
    <Stack gap="md">
      <MultiSelector
        label="News Sources"
        placeholder="Select news feeds..."
        description="Select up to 5 news sources"
        options={feedOptions}
        value={feedUrls}
        onChange={(value) => onConfigChange({ feedUrls: value.slice(0, 5) })}
      />

      <NumberInput
        label="Maximum Articles"
        minValue={3}
        maxValue={20}
        value={maxItems}
        onChange={(value) => onConfigChange({ maxItems: Number(value) || 10 })}
      />

      <HStack justify="between" align="center">
        <Text size="sm">Show source name</Text>
        <Switch
          aria-label="Show source name"
          isSelected={showSource}
          onChange={(value) => onConfigChange({ showSource: value })}
        />
      </HStack>
      <HStack justify="between" align="center">
        <Text size="sm">Show article description</Text>
        <Switch
          aria-label="Show article description"
          isSelected={showDescription}
          onChange={(value) => onConfigChange({ showDescription: value })}
        />
      </HStack>
    </Stack>
  );
}
