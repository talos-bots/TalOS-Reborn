/* eslint-disable @typescript-eslint/no-explicit-any */
import { createEvent } from "react-event-hook";
import { StoredChatLog } from "../global_classes/StoredChatLog";
export interface websocketNotification {
    title: string;
    body: string;
}

export const { useChatLogChangedListener, emitChatLogChanged } = createEvent("chatLogChanged")({
    crossTab: true
});

export const { useLogicEngineChangeListener, emitLogicEngineChange} = createEvent("logicEngineChange")({
    crossTab: true
});

export const { useNewChatLogListener, emitNewChatLog } = createEvent("newChatLog")({
    crossTab: true
});

export const { useSelectedChatLogChangedListener, emitSelectedChatLogChanged } = createEvent("selectedChatLogChanged")<StoredChatLog>({
    crossTab: true
});

export const { useCloseSidesListener, emitCloseSides } = createEvent('closeSides')(
    { crossTab: true }
)

export const { useCharacterUpdatedListener, emitCharacterUpdated } = createEvent('characterUpdated')(
    { crossTab: true }
)

export const { useWebsocketNotificationListener, emitWebsocketNotification } = createEvent('websocketNotification')<websocketNotification>({
    crossTab: true
});