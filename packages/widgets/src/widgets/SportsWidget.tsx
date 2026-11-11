import { useState, useEffect, useMemo, useRef, type Key } from "react";
import {
  Text,
  Stack,
  Spinner,
  HStack,
  Button,
  Select,
  Badge,
  ScrollArea,
  MultiSelector,
  Divider,
  Switch,
} from "@var-ui/react";
import { IconTrophy, IconRefresh } from "@tabler/icons-react";
import type { WidgetProps, WidgetConfig } from "../types";
import { useScores } from "../hooks/useScores";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { LEAGUES, fetchLeagueTeams, type SportsTeam } from "../services/sports";
import type { SportGame, RaceSession } from "../services/sports";
import * as classes from "./SportsWidget.styles";

export interface SportsConfig extends WidgetConfig {
  leagueId: string;
  favoriteTeamIds: string[];
  showAllGames: boolean;
  showCurrentGames: boolean;
  transparentBackground: boolean;
}

// ---------------------------------------------------------------------------
// Game card
// ---------------------------------------------------------------------------

function GameCard({ game }: { game: SportGame }) {
  const away = game.competitors.find((c) => c.homeAway === "away") ?? game.competitors[0];
  const home = game.competitors.find((c) => c.homeAway === "home") ?? game.competitors[1];

  const isLive = game.status === "in";
  const isFinal = game.status === "post";
  const isPre = game.status === "pre";

  const awayWon = isFinal && away.winner;
  const homeWon = isFinal && home.winner;

  return (
    <div className={classes.gameCard}>
      {/* Status row */}
      <HStack justify="center">
        {isLive ? (
          <Badge tone="success" className={classes.liveBadge}>
            {game.clock && game.period
              ? `${formatPeriod(game.period, game.statusDetail)} · ${game.clock}`
              : game.statusDetail}
          </Badge>
        ) : (
          <Text size="sm" className={isFinal ? classes.finalText : ""}>
            {game.statusDetail}
          </Text>
        )}
      </HStack>

      {/* Teams & scores */}
      <Stack gap="xs">
        <TeamRow team={away.team} score={away.score} isWinner={awayWon} showScore={!isPre} />
        <TeamRow team={home.team} score={home.score} isWinner={homeWon} showScore={!isPre} />
      </Stack>
    </div>
  );
}

function TeamRow({
  team,
  score,
  isWinner,
  showScore,
}: {
  team: SportsTeam;
  score: string;
  isWinner?: boolean;
  showScore: boolean;
}) {
  return (
    <HStack justify="between" className={classes.teamRow}>
      <HStack gap="xs" style={{ flex: 1, minWidth: 0 }}>
        {team.logo && <img src={team.logo} alt={team.abbreviation} className={classes.teamLogo} />}
        <Text
          size="sm"
          weight={isWinner ? "semibold" : undefined}
          className={classes.teamName}
          lineClamp={1}
        >
          {team.shortDisplayName || team.abbreviation}
        </Text>
      </HStack>
      {showScore && (
        <Text size="sm" weight={isWinner ? "semibold" : undefined} className={classes.score}>
          {score}
        </Text>
      )}
    </HStack>
  );
}

function formatPeriod(period: number, detail: string): string {
  // Extract period label from status detail if possible (e.g. "3rd 4:22")
  const match = detail.match(/^(\d+(?:st|nd|rd|th)|OT|Final|Halftime)/i);
  if (match) return match[1];
  return `P${period}`;
}

// ---------------------------------------------------------------------------
// F1 / race weekend card
// ---------------------------------------------------------------------------

function RaceCard({ game }: { game: SportGame }) {
  const sessions = game.raceSessions ?? [];
  const isLive = game.status === "in";
  const isFinal = game.status === "post";

  return (
    <div className={classes.gameCard}>
      <HStack justify="center">
        {isLive ? (
          <Badge tone="success" className={classes.liveBadge}>
            {game.statusDetail}
          </Badge>
        ) : (
          <Text size="sm" className={isFinal ? classes.finalText : ""}>
            {game.statusDetail}
          </Text>
        )}
      </HStack>
      <Text size="sm" weight="semibold" className={classes.teamName}>
        {game.shortName || game.name}
      </Text>
      <Stack gap="xs">
        {sessions.map((session: RaceSession) => (
          <HStack
            key={session.type}
            justify="between"

            className={classes.teamRow}
          >
            <Text size="sm" tone="secondary">
              {session.type}
            </Text>
            <Text size="sm">
              {session.statusDetail || (session.status === "pre" ? "Scheduled" : "—")}
            </Text>
          </HStack>
        ))}
      </Stack>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Widget display
// ---------------------------------------------------------------------------

export function SportsWidget({ widget }: WidgetProps<SportsConfig>) {
  const {
    leagueId,
    favoriteTeamIds,
    showAllGames,
    showCurrentGames = true,
    transparentBackground,
  } = widget.config;

  const teamFilter = useMemo(
    () => (showAllGames ? [] : favoriteTeamIds),
    [showAllGames, favoriteTeamIds],
  );

  const {
    games: rawGames,
    leagueLogo,
    isLoading,
    isLoadingMore,
    error,
    lastUpdated,
    isStale,
    refresh,
    loadMore,
  } = useScores({
    leagueId,
    favoriteTeamIds: teamFilter,
  });
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !loadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [e] = entries;
        if (!e?.isIntersecting || isLoadingMore || isLoading) return;
        loadMore();
      },
      { root: null, rootMargin: "100px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, isLoadingMore, isLoading]);

  const leagueName = LEAGUES.find((l) => l.id === leagueId)?.name ?? leagueId.toUpperCase();

  const games = useMemo(
    () => (showCurrentGames ? rawGames : rawGames.filter((g) => g.status !== "in")),
    [rawGames, showCurrentGames],
  );

  if (!leagueId) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconTrophy size={48} className={classes.emptyIcon} />
          <Text size="lg" weight="medium">
            No League Selected
          </Text>
          <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
            Choose a league in widget settings
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && games.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.loading}>
          <Spinner size="lg" tone="success" />
          <Text size="sm" tone="secondary">
            Loading scores...
          </Text>
        </div>
      </div>
    );
  }

  if (error && games.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconTrophy size={48} className={classes.emptyIcon} />
          <Text size="sm" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
            {error}
          </Text>
          <Button size="sm" appearance="ghost" onClick={refresh}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {/* Header */}
      <div className={classes.header}>
        <Text className={classes.title}>
          {leagueLogo ? (
            <img src={leagueLogo} alt={leagueName} className={classes.leagueLogo} />
          ) : (
            <IconTrophy size={16} />
          )}
          {leagueName}
        </Text>
        <HStack gap="xs">
          {isLoading && <Spinner size="sm" tone="success" />}
          <Button appearance="ghost" size="sm" onClick={refresh} className={classes.refreshBtn}>
            <IconRefresh size={14} />
          </Button>
        </HStack>
      </div>
      <WidgetDataStatus
        widgetId={widget.id}
        lastUpdated={lastUpdated}
        isStale={isStale}
        error={error}
        isLoading={isLoading}
      />

      {games.length === 0 ? (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
            {leagueId === "f1" ? "No races today" : "No games scheduled today"}
          </Text>
          {!showAllGames && favoriteTeamIds.length > 0 && (
            <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
              (filtered to favorite teams)
            </Text>
          )}
        </div>
      ) : (
        <ScrollArea className={classes.gamesList}>
          <Stack gap="xs">
            {games.map((game, i) => (
              <div key={game.id}>
                {i > 0 && <Divider />}
                {game.raceSessions?.length ? <RaceCard game={game} /> : <GameCard game={game} />}
              </div>
            ))}
            <div ref={loadMoreSentinelRef} style={{ minHeight: 1 }} aria-hidden />
            {isLoadingMore && (
              <HStack justify="center">
                <Spinner size="sm" />
                <Text size="sm" tone="secondary">
                  Loading earlier games…
                </Text>
              </HStack>
            )}
          </Stack>
        </ScrollArea>
      )}

      <Text
        size="sm"
        tone="secondary"
        style={{ textAlign: "center" }}
        className={classes.attribution}
      >
        Data from ESPN
      </Text>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings panel
// ---------------------------------------------------------------------------

export function SportsWidgetSettings({ widget, onConfigChange }: WidgetProps<SportsConfig>) {
  const { leagueId, favoriteTeamIds, showAllGames, showCurrentGames } = widget.config;

  const [availableTeams, setAvailableTeams] = useState<SportsTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Load teams whenever league changes
  useEffect(() => {
    if (!leagueId) {
      setAvailableTeams([]);
      return;
    }
    setLoadingTeams(true);
    fetchLeagueTeams(leagueId)
      .then(setAvailableTeams)
      .finally(() => setLoadingTeams(false));
  }, [leagueId]);

  const leagueOptions = LEAGUES.map((l) => ({
    value: l.id,
    label: l.name,
  }));

  const teamOptions = availableTeams.map((t) => ({
    value: t.id,
    label: t.displayName,
  }));

  const handleLeagueChange = (key: Key | null) => {
    onConfigChange({ leagueId: key == null ? "" : String(key), favoriteTeamIds: [] });
  };

  const handleTeamsChange = (values: string[]) => {
    onConfigChange({ favoriteTeamIds: values });
  };

  return (
    <Stack gap="md">
      <Select
        label="League"
        placeholder="Select a league"
        options={leagueOptions}
        value={leagueId || null}
        onValueChange={handleLeagueChange}
      />

      {leagueId && (
        <MultiSelector
          label="Favorite Teams"
          description="Only games featuring these teams will be shown (unless 'Show all games' is on)"
          placeholder={loadingTeams ? "Loading teams..." : "Search for teams…"}
          options={teamOptions}
          value={favoriteTeamIds}
          onValueChange={handleTeamsChange}
          disabled={loadingTeams}
        />
      )}

      <HStack justify="between">
        <Stack gap="none">
          <Text size="sm">Show all games</Text>
          <Text size="xs" tone="secondary">
            Show every game instead of just your favorite teams
          </Text>
        </Stack>
        <Switch
          aria-label="Show all games"
          checked={showAllGames}
          onCheckedChange={(value) => onConfigChange({ showAllGames: value })}
        />
      </HStack>

      <HStack justify="between">
        <Stack gap="none">
          <Text size="sm">Show current games</Text>
          <Text size="xs" tone="secondary">
            Include games that are currently in progress
          </Text>
        </Stack>
        <Switch
          aria-label="Show current games"
          checked={showCurrentGames ?? true}
          onCheckedChange={(value) => onConfigChange({ showCurrentGames: value })}
        />
      </HStack>
    </Stack>
  );
}
