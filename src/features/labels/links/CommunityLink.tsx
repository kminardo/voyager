import { IonIcon, useIonActionSheet } from "@ionic/react";
import { cx } from "@linaria/core";
import { styled } from "@linaria/react";
import {
  heart,
  heartDislikeOutline,
  heartOutline,
  removeCircleOutline,
  tabletPortraitOutline,
} from "ionicons/icons";
import { Community, SubscribedType } from "lemmy-js-client";
import { createContext, useCallback, useContext } from "react";
import { LongPressOptions, useLongPress } from "use-long-press";

import useCommunityActions from "#/features/community/useCommunityActions";
import ItemIcon from "#/features/labels/img/ItemIcon";
import { ShareImageContext } from "#/features/share/asImage/ShareAsImage";
import {
  preventOnClickNavigationBug,
  stopIonicTapClick,
} from "#/helpers/ionic";
import { getHandle } from "#/helpers/lemmy";
import { useBuildGeneralBrowseLink } from "#/helpers/routes";
import { OShowSubscribedIcon } from "#/services/db";
import { useAppSelector } from "#/store";

import { renderHandle } from "../Handle";
import { LinkContainer, StyledLink, hideCss } from "./shared";

const StyledItemIcon = styled(ItemIcon)`
  margin-right: 0.4rem;
  vertical-align: middle;
`;

const SubscribedIcon = styled(IonIcon)`
  color: var(--ion-color-primary);
  vertical-align: middle;

  margin-bottom: 1px;
  margin-left: 2px;

  opacity: 0.4;

  .ion-palette-dark & {
    opacity: 0.5;
  }
`;

interface CommunityLinkProps {
  community: Community;
  showInstanceWhenRemote?: boolean;
  subscribed: SubscribedType;
  tinyIcon?: boolean;
  disableInstanceClick?: boolean;
  hideIcon?: boolean;
  hideSubscribed?: boolean;

  className?: string;
}

export default function CommunityLink({
  community,
  showInstanceWhenRemote,
  className,
  subscribed,
  tinyIcon,
  disableInstanceClick,
  hideIcon,
  hideSubscribed,
}: CommunityLinkProps) {
  const [present] = useIonActionSheet();

  const handle = getHandle(community);
  const { hideCommunity } = useContext(ShareImageContext);
  const showCommunityIcons = useAppSelector(
    (state) => state.settings.appearance.posts.showCommunityIcons,
  );
  const showSubscribed = useShowSubscribedIcon();

  const { isSubscribed, isBlocked, subscribe, block, sidebar } =
    useCommunityActions(community, subscribed);

  const onCommunityLinkLongPress = useCallback(() => {
    stopIonicTapClick();
    present({
      cssClass: "left-align-buttons",
      buttons: [
        {
          text: `${isBlocked ? "Unblock" : "Block"} Community`,
          icon: removeCircleOutline,
          role: "destructive",
          handler: () => {
            block();
          },
        },
        {
          text: !isSubscribed ? "Subscribe" : "Unsubscribe",
          icon: !isSubscribed ? heartOutline : heartDislikeOutline,
          handler: () => {
            subscribe();
          },
        },
        {
          text: "Sidebar",
          data: "sidebar",
          icon: tabletPortraitOutline,
          handler: () => {
            sidebar();
          },
        },
        {
          text: "Cancel",
          role: "cancel",
        },
      ],
    });
  }, [block, isBlocked, isSubscribed, present, sidebar, subscribe]);

  const bind = useLongPress(onCommunityLinkLongPress, {
    cancelOnMovement: 15,
    onStart,
  });

  const buildGeneralBrowseLink = useBuildGeneralBrowseLink();
  const [name, instance] = renderHandle({
    item: community,
    showInstanceWhenRemote,
  });

  const end = (
    <>
      {instance}
      {showSubscribed && !hideSubscribed && isSubscribed && (
        <SubscribedIcon icon={heart} />
      )}
    </>
  );

  return (
    <LinkContainer
      {...bind()}
      className={cx(className, hideCommunity ? hideCss : undefined)}
    >
      <StyledLink
        to={buildGeneralBrowseLink(`/c/${handle}`)}
        onClick={(e) => {
          e.stopPropagation();
          preventOnClickNavigationBug(e);
        }}
        draggable={false}
      >
        {showCommunityIcons && !hideCommunity && !hideIcon && (
          <StyledItemIcon item={community} size={tinyIcon ? 16 : 24} />
        )}

        {name}
        {!disableInstanceClick && end}
      </StyledLink>
      {disableInstanceClick && end}
    </LinkContainer>
  );
}

const onStart: LongPressOptions["onStart"] = (e) => {
  e.stopPropagation();
};

function useShowSubscribedIcon() {
  const feedEnabled = useContext(ShowSubscribedIconContext);
  const subscribedIcon = useAppSelector(
    (state) => state.settings.appearance.posts.subscribedIcon,
  );

  switch (subscribedIcon) {
    case OShowSubscribedIcon.OnlyAllLocal:
      return feedEnabled;
    case OShowSubscribedIcon.Never:
      return false;
    case OShowSubscribedIcon.Everywhere:
      return true;
  }
}

export const ShowSubscribedIconContext = createContext(false);
