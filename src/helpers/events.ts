import { createEvent } from "react-event-hook";
import { StoredChatLog } from "../global_classes/StoredChatLog";

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