import * as classes from "./OfflineBanner.styles";

export function offlineBannerMessage(input: {
  online: boolean;
  loadFailed: boolean;
  showingSaved: boolean;
}): string | null {
  if (!input.online) return "Offline — showing last saved data";
  if (input.loadFailed) return "Reconnecting…";
  if (input.showingSaved) return "Showing saved version";
  return null;
}

export function OfflineBanner(props: {
  online: boolean;
  loadFailed: boolean;
  showingSaved: boolean;
}) {
  const message = offlineBannerMessage(props);
  if (!message) return null;
  return (
    <div role="status" className={classes.banner}>
      {message}
    </div>
  );
}
