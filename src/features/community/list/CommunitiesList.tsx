import styled from "@emotion/styled";
import {
  IonIcon,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
} from "@ionic/react";
import { useBuildGeneralBrowseLink } from "../../../helpers/routes";
import { useParams } from "react-router";
import { useAppSelector } from "../../../store";
import { jwtSelector } from "../../auth/authSlice";
import { useMemo } from "react";
import { pullAllBy, sortBy, uniqBy } from "lodash";
import { notEmpty } from "../../../helpers/array";
import { getHandle } from "../../../helpers/lemmy";
import { Community } from "lemmy-js-client";
import { home, library, people, shield } from "ionicons/icons";
import ItemIcon from "../../labels/img/ItemIcon";
import CommunityListItem from "./CommunityListItem";
import useSupported from "../../../helpers/useSupported";
import { VList } from "virtua";
import { maxWidthCss } from "../../shared/AppContent";

const SubIcon = styled(IonIcon)<{ color: string }>`
  border-radius: 50%;
  padding: 6px;
  width: 1rem;
  height: 1rem;

  background: ${({ color }) => color};
  --ion-color-base: white;
`;

export const Content = styled.div`
  margin: 0.7rem 0;

  display: flex;
  align-items: center;
  gap: 1rem;

  aside {
    margin-top: 0.2rem;
    color: var(--ion-color-medium);
    font-size: 0.8em;
  }
`;

const StyledIonList = styled(IonList)`
  height: 100%;
`;

const StyledVList = styled(VList)`
  height: 100%;

  ion-item-group {
    ${maxWidthCss}
  }
`;

export default function CommunitiesList() {
  const buildGeneralBrowseLink = useBuildGeneralBrowseLink();
  const { actor } = useParams<{ actor: string }>();
  const jwt = useAppSelector(jwtSelector);

  const moderates = useAppSelector(
    (state) => state.auth.site?.my_user?.moderates,
  );
  const moderatorFeedSupported = useSupported("Modded Feed");

  const follows = useAppSelector((state) => state.auth.site?.my_user?.follows);

  const communityByHandle = useAppSelector(
    (state) => state.community.communityByHandle,
  );

  const favorites = useAppSelector((state) => state.community.favorites);

  const communities = useMemo(() => {
    const communities = uniqBy(
      [
        ...(follows || []).map((f) => f.community),
        ...Object.values(communityByHandle).map((c) => c?.community),
      ].filter(notEmpty),
      "id",
    );

    pullAllBy(
      communities,
      Object.values(communityByHandle)
        .filter((response) => response?.subscribed === "NotSubscribed")
        .map((c) => c?.community),
      "id",
    );

    return communities;
  }, [follows, communityByHandle]);

  const favoritesAsCommunitiesIfFound = useMemo(
    () =>
      favorites.map(
        (community) =>
          communities.find((c) => community === getHandle(c)) || community,
      ),
    [communities, favorites],
  );

  const communitiesGroupedByLetter = useMemo(() => {
    const alphabeticallySortedCommunities = sortBy(communities, (c) =>
      c.name.toLowerCase(),
    );

    return Object.entries(
      alphabeticallySortedCommunities.reduce<Record<string, Community[]>>(
        (acc, community) => {
          const firstLetter = community.name[0].toUpperCase();
          if (!acc[firstLetter]) {
            acc[firstLetter] = [];
          }
          acc[firstLetter].push(community);
          return acc;
        },
        {},
      ),
    );
  }, [communities]);

  const showModeratorFeed = !!moderates?.length && moderatorFeedSupported;

  return (
    <StyledIonList>
      <StyledVList
        overscan={0}
        className="ion-content-scroll-host virtual-scroller"
      >
        <IonItemGroup>
          {jwt && (
            <IonItem routerLink={buildGeneralBrowseLink(`/home`)}>
              <Content>
                <SubIcon icon={home} color="red" />
                <div>
                  Home
                  <aside>Posts from subscriptions</aside>
                </div>
              </Content>
            </IonItem>
          )}
          <IonItem routerLink={buildGeneralBrowseLink(`/all`)}>
            <Content>
              <SubIcon icon={library} color="#009dff" />
              <div>
                All<aside>Posts across all federated communities</aside>
              </div>
            </Content>
          </IonItem>
          <IonItem
            routerLink={buildGeneralBrowseLink(`/local`)}
            lines={showModeratorFeed ? "inset" : "none"}
          >
            <Content>
              <SubIcon icon={people} color="#00f100" />
              <div>
                Local<aside>Posts from communities on {actor}</aside>
              </div>
            </Content>
          </IonItem>
          {showModeratorFeed && (
            <IonItem routerLink={buildGeneralBrowseLink(`/mod`)} lines="none">
              <Content>
                <SubIcon icon={shield} color="#464646" />
                <div>
                  Moderator Posts
                  <aside>Posts from moderated communities</aside>
                </div>
              </Content>
            </IonItem>
          )}
        </IonItemGroup>

        {favoritesAsCommunitiesIfFound.length > 0 && (
          <IonItemGroup>
            <IonItemDivider sticky>
              <IonLabel>Favorites</IonLabel>
            </IonItemDivider>

            {favoritesAsCommunitiesIfFound.map((favorite) =>
              typeof favorite === "string" ? (
                <IonItem
                  key={favorite}
                  routerLink={buildGeneralBrowseLink(`/c/${favorite}`)}
                >
                  <Content>
                    <ItemIcon item={favorite} size={28} />
                    {favorite}
                  </Content>
                </IonItem>
              ) : (
                <CommunityListItem
                  key={favorite.id}
                  community={favorite}
                  favorites={favorites}
                />
              ),
            )}
          </IonItemGroup>
        )}

        {moderates?.length ? (
          <IonItemGroup>
            <IonItemDivider sticky>
              <IonLabel>Moderator</IonLabel>
            </IonItemDivider>
            {moderates.map(({ community }) => (
              <CommunityListItem
                key={community.id}
                community={community}
                favorites={favorites}
              />
            ))}
          </IonItemGroup>
        ) : (
          ""
        )}
        {communitiesGroupedByLetter.map(([letter, communities]) => (
          <IonItemGroup key={letter}>
            <IonItemDivider sticky>
              <IonLabel>{letter}</IonLabel>
            </IonItemDivider>
            {communities.map((community) => (
              <CommunityListItem
                key={community.id}
                community={community}
                favorites={favorites}
              />
            ))}
          </IonItemGroup>
        ))}
      </StyledVList>
    </StyledIonList>
  );
}
