import { IonButton, IonIcon } from "@ionic/react";
import { css } from "@linaria/core";
import { styled } from "@linaria/react";
import { resize, send as sendIcon } from "ionicons/icons";
import { Person } from "lemmy-js-client";
import {
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import TextareaAutosize, {
  TextareaAutosizeProps,
} from "react-textarea-autosize";

import { PageContext } from "#/features/auth/PageContext";
import { MaxWidthContainer } from "#/features/shared/AppContent";
import { privateMessageSendFailed } from "#/helpers/toastMessages";
import useAppToast from "#/helpers/useAppToast";
import useClient from "#/helpers/useClient";
import { useOptimizedIonRouter } from "#/helpers/useOptimizedIonRouter";
import { useAppDispatch } from "#/store";

import { receivedMessages } from "./inboxSlice";

const MaxSizeContainer = styled(MaxWidthContainer)`
  height: 100%;
`;

const SendContainer = styled.div`
  position: relative;

  padding: 0.5rem;
`;

const InputContainer = styled.div`
  position: relative;

  display: flex;
  align-items: flex-end;
  gap: 4px;
`;

const Input = styled(TextareaAutosize)`
  border: 1px solid
    var(
      --ion-tab-bar-border-color,
      var(
        --ion-border-color,
        var(
          --ion-color-step-150,
          var(--ion-background-color-step-150, rgba(0, 0, 0, 0.2))
        )
      )
    );
  border-radius: 1rem;

  // Exact px measurements to prevent
  // pixel rounding browser inconsistencies
  padding: 8px 12px;
  line-height: 18px;
  font-size: 16px;
  margin: 0;

  background: var(--ion-background-color);
  color: var(--ion-text-color);
  outline: none;

  width: 100%;
  resize: none;
  appearance: none;
`;

const IconButton = styled(IonButton)`
  margin: 0;
  min-height: 36px;

  ion-icon {
    font-size: 22px;
  }
`;

interface SendMessageBoxProps {
  recipient: Person;
  onHeightChange?: TextareaAutosizeProps["onHeightChange"];
  scrollToBottom?: () => void;
}

export default function SendMessageBox({
  recipient,
  onHeightChange,
  scrollToBottom,
}: SendMessageBoxProps) {
  const router = useOptimizedIonRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const client = useClient();
  const presentToast = useAppToast();
  const { presentPrivateMessageCompose } = useContext(PageContext);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const send = useCallback(async () => {
    setLoading(true);

    let message;

    try {
      message = await client.createPrivateMessage({
        content: value,
        recipient_id: recipient.id,
      });
    } catch (error) {
      presentToast(privateMessageSendFailed);
      setLoading(false);
      throw error;
    }

    dispatch(receivedMessages([message.private_message_view]));

    setLoading(false);
    setValue("");

    scrollToBottom?.();
  }, [client, dispatch, presentToast, recipient, value, scrollToBottom]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key !== "Enter") return;

      send();
    },
    [send],
  );

  useEffect(() => {
    const search = Object.fromEntries([
      ...new URLSearchParams(router.getRouteInfo()?.search),
    ]);

    // only focus input if user intends to send a message
    if (search.intent !== "send") return;

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [router]);

  return (
    <SendContainer>
      <MaxSizeContainer>
        <InputContainer>
          <IconButton
            shape="round"
            fill="clear"
            onClick={async () => {
              const message = await presentPrivateMessageCompose({
                private_message: { recipient },
                value,
              });

              if (!message) return;

              scrollToBottom?.();
              setValue("");
            }}
            aria-label="Open fullsize editor"
          >
            <IonIcon
              icon={resize}
              slot="icon-only"
              className={css`
                transform: scale(1.1);
              `}
            />
          </IconButton>
          <Input
            ref={inputRef}
            disabled={loading}
            placeholder="Message"
            onChange={(e) => setValue(e.target.value)}
            value={value}
            rows={1}
            maxRows={5}
            onKeyDown={onKeyDown}
            onHeightChange={onHeightChange}
            onFocus={(e) => {
              e.stopPropagation();
            }}
          />
          <IconButton
            disabled={!value.trim() || loading}
            shape="round"
            fill="clear"
            onClick={send}
            aria-label="Send message"
          >
            <IonIcon
              icon={sendIcon}
              slot="icon-only"
              className={css`
                transform: rotate(270deg);
              `}
            />
          </IconButton>
        </InputContainer>
      </MaxSizeContainer>
    </SendContainer>
  );
}
