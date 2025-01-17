import { Browser } from "@capacitor/browser";
import { LaunchNative } from "capacitor-launch-native";
import { useCallback } from "react";

import { useIsDark } from "#/core/GlobalStyles";
import { notifyStatusTapThatBrowserWasOpened } from "#/core/listeners/statusTap";
import { isAndroid } from "#/helpers/device";
import { useAppSelector } from "#/store";

export default function useNativeBrowser() {
  const isDark = useIsDark();
  const { usingSystemDarkMode, pureBlack } = useAppSelector(
    (state) => state.settings.appearance.dark,
  );
  const alwaysUseReaderMode = useAppSelector(
    (state) => state.settings.general.safari.alwaysUseReaderMode,
  );
  const preferNativeApps = useAppSelector(
    (state) => state.settings.general.preferNativeApps,
  );

  return useCallback(
    async (href: string) => {
      const toolbarColor = (() => {
        if (usingSystemDarkMode) return undefined;

        if (isAndroid()) {
          if (isDark) {
            if (pureBlack) return "#000000";

            return "#0f1419";
          }

          return "#ffffff";
        } else {
          // iOS clamps so #000 is not true black
          if (isDark) return "#000000";

          return "#ffffff";
        }
      })();

      if (preferNativeApps) {
        const { completed } = await LaunchNative.attempt({ url: href });
        if (completed) return;
      }

      Browser.open({
        url: href,
        toolbarColor,
        entersReaderIfAvailable: alwaysUseReaderMode,
      });
      notifyStatusTapThatBrowserWasOpened();
    },
    [
      isDark,
      usingSystemDarkMode,
      pureBlack,
      alwaysUseReaderMode,
      preferNativeApps,
    ],
  );
}
