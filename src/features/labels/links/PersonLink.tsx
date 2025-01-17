import { cx } from "@linaria/core";
import { styled } from "@linaria/react";
import { Person } from "lemmy-js-client";
import { useCallback, useContext } from "react";
import { LongPressOptions, useLongPress } from "use-long-press";

import { ShareImageContext } from "#/features/share/asImage/ShareAsImage";
import UserScore from "#/features/tags/UserScore";
import UserTag from "#/features/tags/UserTag";
import usePresentUserActions from "#/features/user/usePresentUserActions";
import {
  preventOnClickNavigationBug,
  stopIonicTapClick,
} from "#/helpers/ionic";
import { getHandle, getRemoteHandle } from "#/helpers/lemmy";
import { useBuildGeneralBrowseLink } from "#/helpers/routes";
import { OInstanceUrlDisplayMode } from "#/services/db";
import { useAppSelector } from "#/store";

import { renderHandle } from "../Handle";
import AgeBadge from "./AgeBadge";
import { LinkContainer, StyledLink, hideCss } from "./shared";

const Prefix = styled.span`
  font-weight: normal;
`;

interface PersonLinkProps {
  person: Person;
  opId?: number;
  distinguished?: boolean;
  showInstanceWhenRemote?: boolean;
  prefix?: string;
  showBadge?: boolean;
  disableInstanceClick?: boolean;
  showTag?: boolean;

  className?: string;
}

export default function PersonLink({
  person,
  opId,
  distinguished,
  className,
  showInstanceWhenRemote,
  prefix,
  showBadge = true,
  showTag = true,
  disableInstanceClick,
}: PersonLinkProps) {
  const buildGeneralBrowseLink = useBuildGeneralBrowseLink();
  const isAdmin = useAppSelector((state) => state.site.response?.admins)?.some(
    (admin) => admin.person.actor_id === person.actor_id,
  );
  const { hideUsernames } = useContext(ShareImageContext);
  const presentUserActions = usePresentUserActions();

  const tag = useAppSelector(
    (state) => state.userTag.tagByRemoteHandle[getRemoteHandle(person)],
  );

  const onCommunityLinkLongPress = useCallback(() => {
    stopIonicTapClick();

    presentUserActions(person);
  }, [presentUserActions, person]);

  const bind = useLongPress(onCommunityLinkLongPress, {
    cancelOnMovement: 15,
    onStart,
  });

  const forceInstanceUrl =
    useAppSelector(
      (state) => state.settings.appearance.general.userInstanceUrlDisplay,
    ) === OInstanceUrlDisplayMode.WhenRemote;

  let color: string | undefined;

  if (isAdmin) color = "var(--ion-color-danger)";
  else if (distinguished) color = "var(--ion-color-success)";
  else if (
    person.actor_id === "https://lemmy.world/u/aeharding" ||
    person.actor_id === "https://vger.social/u/aeharding"
  )
    color = "var(--ion-color-tertiary-tint)";
  else if (opId && person.id === opId) color = "var(--ion-color-primary-fixed)";

  const tagText = typeof tag === "object" ? tag.text : undefined;

  const [handle, instance] = renderHandle({
    showInstanceWhenRemote:
      !tagText && (showInstanceWhenRemote || forceInstanceUrl),
    item: person,
  });

  const end = (
    <>
      {instance}
      {showBadge && (
        <>
          {person.bot_account && " 🤖"}
          <AgeBadge published={person.published} />
        </>
      )}
      {showTag && (
        <>
          <UserScore person={person} prefix=" " />
          <UserTag person={person} prefix=" " />
        </>
      )}
    </>
  );

  return (
    <LinkContainer
      {...bind()}
      className={cx(className, hideUsernames ? hideCss : undefined)}
      style={{ color }}
    >
      <StyledLink
        to={buildGeneralBrowseLink(`/u/${getHandle(person)}`)}
        onClick={(e) => {
          e.stopPropagation();
          preventOnClickNavigationBug(e);
        }}
        draggable={false}
      >
        {prefix ? (
          <>
            <Prefix>{prefix}</Prefix>{" "}
          </>
        ) : undefined}
        {handle}
        {!disableInstanceClick && end}
      </StyledLink>
      {disableInstanceClick && end}
    </LinkContainer>
  );
}

const onStart: LongPressOptions["onStart"] = (e) => {
  e.stopPropagation();
};
