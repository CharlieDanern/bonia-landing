import React, { createContext, useContext, useMemo, useReducer } from "react";
import { reducer, initialState } from "./reducer.js";

// React context + reducer. Screens read state with useStore() and change it
// through the named actions from useActions(); selectors.js derives the rest.

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/** The whole demo state (see reducer.js initialState for the shape). */
export function useStore() {
  return useStoreContext().state;
}

export function useDispatch() {
  return useStoreContext().dispatch;
}

/** Named actions. Every one is synchronous and only touches sample data. */
export function useActions() {
  const dispatch = useDispatch();
  return useMemo(
    () => ({
      // Requests
      confirmRequest: (id) => dispatch({ type: "CONFIRM_REQUEST", id }),
      rejectRequest: (id, reason) => dispatch({ type: "REJECT_REQUEST", id, reason }),
      depositReceived: (id) => dispatch({ type: "DEPOSIT_RECEIVED", id }),
      messageOpened: (id, via) => dispatch({ type: "MESSAGE_OPENED", id, via }), // via: "qr" | "sms"
      markMessaged: (id, at) => dispatch({ type: "MARK_MESSAGED", id, at }),
      markNotMessaged: (id) => dispatch({ type: "MARK_NOT_MESSAGED", id }),
      assignStaff: (id, staffId) => dispatch({ type: "ASSIGN_STAFF", id, staffId }),
      taskSeen: (id, at) => dispatch({ type: "TASK_SEEN", id, at }),
      taskDone: (id, by) => dispatch({ type: "TASK_DONE", id, by }),
      lostItemStep: (id, step) => dispatch({ type: "LOST_ITEM_STEP", id, step }),
      // Hôm nay
      setSwitch: (id, on) => dispatch({ type: "SET_SWITCH", id, on }),
      setOutTonight: (on) => dispatch({ type: "SET_SWITCH", id: "het-phong-toi-nay", on }),
      setListening: (on) => dispatch({ type: "SET_LISTENING", on }),
      setTempNotice: (notice) => dispatch({ type: "SET_TEMP_NOTICE", notice }),
      setLineStatus: (status) => dispatch({ type: "SET_LINE_STATUS", status }),
      // Calendar
      addBooking: (booking) => dispatch({ type: "ADD_BOOKING", booking }),
      setRemaining: (date, roomType, remaining) => dispatch({ type: "SET_REMAINING", date, roomType, remaining }),
      setClosed: (date, roomType, closed, reason) => dispatch({ type: "SET_CLOSED", date, roomType, closed, reason }),
      calendarStillRight: () => dispatch({ type: "CALENDAR_STILL_RIGHT" }),
      // Calls
      reportCall: (callId, reason, note) => dispatch({ type: "REPORT_CALL", callId, reason, note }),
      // Settings
      saveSettings: (section, values, mark) => dispatch({ type: "SAVE_SETTINGS", section, values, mark }),
      setSectionMark: (section, mark) => dispatch({ type: "SET_SECTION_MARK", section, mark }),
      // Account
      setDeviceName: (name) => dispatch({ type: "SET_DEVICE_NAME", name }),
      signOutDevice: (id) => dispatch({ type: "SIGN_OUT_DEVICE", id }),
      reset: () => dispatch({ type: "RESET" }),
    }),
    [dispatch]
  );
}

export * as select from "./selectors.js";
