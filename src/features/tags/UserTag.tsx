import { styled } from "@linaria/react";
import { Person } from "lemmy-js-client";
import React from "react";

import { getTextColorFor } from "#/helpers/color";
import { getRemoteHandle } from "#/helpers/lemmy";
import type { UserTag } from "#/services/db";
import { useAppSelector } from "#/store";

const TagContainer = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  background: var(--bg, var(--lightroom-bg));

  border-radius: 4px;
  padding: 0 4px;

  min-width: 0; // when contained in flexbox
`;

type UserTagProps =
  | SyncUserTagProps
  | {
      person: Person;
    };

interface BaseUserTagProps {
  prefix?: React.ReactNode;
  person?: Person;
}

export default function UserTag(props: UserTagProps) {
  function renderFallback() {
    if (!("tag" in props)) return;
    return <SyncUserTag tag={props.tag} />;
  }

  const remoteHandle =
    "tag" in props ? props.tag.handle : getRemoteHandle(props.person);

  return (
    <StoreUserTag
      {...props}
      renderFallback={renderFallback}
      remoteHandle={remoteHandle}
    />
  );
}

interface StoreUserTagProps extends BaseUserTagProps {
  remoteHandle: string;
  renderFallback?: () => React.ReactNode;
}

function StoreUserTag({
  remoteHandle,
  renderFallback,
  prefix,
}: StoreUserTagProps) {
  const tag = useAppSelector(
    (state) => state.userTag.tagByRemoteHandle[remoteHandle],
  );

  if (!tag || tag === "pending") return renderFallback?.();

  return (
    <>
      {prefix}
      <SyncUserTag tag={tag} />
    </>
  );
}

interface SyncUserTagProps extends BaseUserTagProps {
  tag: UserTag;
}

function SyncUserTag({ tag }: SyncUserTagProps) {
  if (!tag.text) return;

  return (
    <TagContainer
      style={
        tag.color
          ? {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ["--bg" as any]: tag.color,
              color: getTextColorFor(tag.color),
            }
          : undefined
      }
    >
      {tag.text}
    </TagContainer>
  );
}
