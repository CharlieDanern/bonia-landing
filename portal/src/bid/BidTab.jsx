import React, { useState } from "react";
import { BidBoard, EmptyBoard } from "./Board.jsx";
import { BidWizard } from "./Wizard.jsx";
import { BidDetail } from "./Detail.jsx";

// The Bid tab — board / wizard / detail as a small in-tab state machine
// (the portal has no router; Pipeline and Tài khoản work the same way).

export function BidTab({ cards, bank, wallet, refresh, showToast }) {
  const [view, setView] = useState({ kind: "board" });

  if (view.kind === "wizard") {
    // Reference ladder for the provisional panel: the rep's nearest ranked
    // type (their first approved card's ladder, own bid included).
    const ranked = cards.find((c) => c.others_vnd != null && c.status === "approved");
    return (
      <BidWizard
        bank={bank}
        sampleOthers={ranked ? [...ranked.others_vnd, ranked.my_bid_vnd] : null}
        onDone={() => { setView({ kind: "board" }); refresh(); }}
        onCancel={() => setView({ kind: "board" })}
        showToast={showToast}
      />
    );
  }

  if (view.kind === "detail") {
    const card = cards.find((c) => c.card_id === view.id);
    if (!card) {
      setView({ kind: "board" });
      return null;
    }
    return (
      <BidDetail
        card={card}
        wallet={wallet}
        onBack={() => setView({ kind: "board" })}
        refresh={refresh}
        showToast={showToast}
      />
    );
  }

  if (cards.length === 0) {
    return <EmptyBoard bank={bank} onAdd={() => setView({ kind: "wizard" })} />;
  }
  return (
    <BidBoard
      cards={cards}
      bank={bank}
      wallet={wallet}
      onAdd={() => setView({ kind: "wizard" })}
      onOpen={(id) => setView({ kind: "detail", id })}
      refresh={refresh}
      showToast={showToast}
    />
  );
}
