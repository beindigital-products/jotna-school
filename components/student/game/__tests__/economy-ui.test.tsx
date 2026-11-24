import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { CARDS, SHOP_ITEMS } from "@/convex/gameCatalog";
import { CampItems } from "../camp-items";
import { CardAlbum } from "../card-album";
import { ChestMedallion, DailyChestOverlay } from "../daily-chest";
import { MarketStall } from "../market-stall";

MotionGlobalConfig.skipAnimations = true;

vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(() => cleanup());

describe("CardAlbum — l'album de cartes", () => {
  it("montre les cartes gagnées par leur nom et garde la place des autres", () => {
    render(
      <CardAlbum
        owned={[
          { cardId: "girafe", obtainedAt: Date.UTC(2026, 10, 20) },
          { cardId: "tortue", obtainedAt: Date.UTC(2026, 10, 21) },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "La girafe, carte commun" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "La tortue de mer, carte rare" })).toBeTruthy();
    // Sept cartes manquent : sept places en pointillé, sans nom.
    expect(screen.getAllByRole("button", { name: /^Carte mystère/ })).toHaveLength(CARDS.length - 2);
    expect(screen.queryByText("Le lamantin")).toBeNull();
    expect(screen.getByRole("img", { name: `2 cartes trouvées sur ${CARDS.length}` })).toBeTruthy();
  });

  it("un album vide invite à ouvrir le coffre du jour", () => {
    render(<CardAlbum owned={[]} />);
    expect(screen.getByText(/Elle est dans le coffre du jour/)).toBeTruthy();
  });

  it("une série entière se fête", () => {
    render(<CardAlbum owned={CARDS.map((card) => ({ cardId: card.id, obtainedAt: 1 }))} />);
    expect(screen.getByText("Série complète ! Quel collectionneur !")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Carte mystère/ })).toBeNull();
  });

  it("toucher une carte gagnée ouvre sa fiche et son « savais-tu »", () => {
    render(<CardAlbum owned={[{ cardId: "girafe", obtainedAt: Date.UTC(2026, 10, 20) }]} />);
    fireEvent.click(screen.getByRole("button", { name: "La girafe, carte commun" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Le savais-tu ?")).toBeTruthy();
    expect(within(dialog).getByText(/Son cou est si long/)).toBeTruthy();
  });

  it("toucher une carte manquante ne dit pas laquelle c'est", () => {
    render(<CardAlbum owned={[]} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^Carte mystère/ })[0]);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Carte mystère")).toBeTruthy();
    expect(within(dialog).queryByText("Le savais-tu ?")).toBeNull();
  });
});

describe("MarketStall — l'étal du marché", () => {
  const cheapest = [...SHOP_ITEMS].sort((a, b) => a.price - b.price)[0];
  const dearest = [...SHOP_ITEMS].sort((a, b) => b.price - a.price)[0];

  function renderStall(props: Partial<Parameters<typeof MarketStall>[0]> = {}) {
    const onBuy = vi.fn();
    render(
      <MarketStall cauris={cheapest.price} ownedItemIds={[]} online busyId={null} notice={null} onBuy={onBuy} {...props} />,
    );
    return { onBuy };
  }

  it("dit le solde et laisse acheter ce que l'enfant peut s'offrir", () => {
    const { onBuy } = renderStall();
    expect(screen.getByLabelText(`Tu as ${cheapest.price} cauris`)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Acheter ${cheapest.name} pour`) }));
    expect(onBuy).toHaveBeenCalledWith(cheapest);
  });

  it("dit ce qui manque pour un objet trop cher, sans bouton", () => {
    renderStall();
    const missing = dearest.price - cheapest.price;
    expect(screen.getByText(`Encore ${missing} cauris`)).toBeTruthy();
    expect(screen.queryByRole("button", { name: new RegExp(`^Acheter ${dearest.name}`) })).toBeNull();
  });

  it("un objet possédé est « Posé au camp » et ne se rachète pas", () => {
    renderStall({ ownedItemIds: [cheapest.id], cauris: 1000 });
    expect(screen.getByText("Posé au camp")).toBeTruthy();
    expect(screen.queryByRole("button", { name: new RegExp(`^Acheter ${cheapest.name}`) })).toBeNull();
    expect(screen.getByRole("link", { name: "Voir mon camp" }).getAttribute("href")).toBe("/student/home");
  });

  it("sans réseau, on regarde mais on n'achète pas", () => {
    const { onBuy } = renderStall({ online: false });
    expect(screen.getByText(/Le marché ouvre avec internet/)).toBeTruthy();
    const button = screen.getByRole("button", { name: new RegExp(`^Acheter ${cheapest.name}`) });
    fireEvent.click(button);
    expect(onBuy).not.toHaveBeenCalled();
  });

  it("annonce un achat à voix basse (role status)", () => {
    renderStall({ notice: "Djembé : posé au camp !" });
    expect(screen.getByRole("status").textContent).toBe("Djembé : posé au camp !");
  });
});

describe("ChestMedallion — le coffre du jour sur le camp", () => {
  it("prêt : il le dit et s'ouvre au toucher", () => {
    const onPress = vi.fn();
    render(<ChestMedallion ready onPress={onPress} />);
    fireEvent.click(screen.getByRole("button", { name: "Coffre du jour : prêt à ouvrir" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Prêt")).toBeTruthy();
  });

  it("fermé à clé : il dit comment l'ouvrir", () => {
    render(<ChestMedallion ready={false} onPress={() => {}} />);
    expect(screen.getByRole("button", { name: /Finis un palier aujourd'hui/ })).toBeTruthy();
    expect(screen.queryByText("Prêt")).toBeNull();
  });
});

describe("DailyChestOverlay — l'ouverture du coffre", () => {
  it("ouvre le coffre, puis montre les cauris et la carte gagnée", async () => {
    const onOpenChest = vi.fn().mockResolvedValue({ cauris: 25, cardId: "hippopotame", duplicate: false, duplicateCauris: 0 });
    render(<DailyChestOverlay onClose={() => {}} onOpenChest={onOpenChest} online />);
    expect(screen.getByText("Touche le coffre !")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le coffre" }));
    await waitFor(() => expect(screen.getByText("Des trésors pour toi !")).toBeTruthy());
    expect(onOpenChest).toHaveBeenCalledTimes(1);
    expect(screen.getByText("+25")).toBeTruthy();
    expect(screen.getByText("L'hippopotame")).toBeTruthy();
    expect(screen.getByText("Nouvelle carte")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ranger dans mes trésors" }).getAttribute("href")).toBe("/student/tresors");
  });

  it("une carte en double se change en cauris, et l'écran le dit", async () => {
    const onOpenChest = vi.fn().mockResolvedValue({ cauris: 15, cardId: "girafe", duplicate: true, duplicateCauris: 10 });
    render(<DailyChestOverlay onClose={() => {}} onOpenChest={onOpenChest} online />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le coffre" }));
    await waitFor(() => expect(screen.getByText("Tu l'avais déjà : elle devient 10 cauris.")).toBeTruthy());
    expect(screen.queryByText("Nouvelle carte")).toBeNull();
  });

  it("sans réseau, le coffre attend et rien ne part", () => {
    const onOpenChest = vi.fn();
    render(<DailyChestOverlay onClose={() => {}} onOpenChest={onOpenChest} online={false} />);
    expect(screen.getByText("Le coffre s'ouvre avec internet.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le coffre" }));
    expect(onOpenChest).not.toHaveBeenCalled();
  });

  it("un échec se dit sans gronder, et l'enfant peut réessayer", async () => {
    const onOpenChest = vi
      .fn()
      .mockRejectedValueOnce(new Error("réseau"))
      .mockResolvedValue({ cauris: 20, cardId: "pelican", duplicate: false, duplicateCauris: 0 });
    render(<DailyChestOverlay onClose={() => {}} onOpenChest={onOpenChest} online />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le coffre" }));
    await waitFor(() => expect(screen.getByText(/Le coffre est coincé/)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le coffre" }));
    await waitFor(() => expect(screen.getByText("Le pélican")).toBeTruthy());
    expect(onOpenChest).toHaveBeenCalledTimes(2);
  });

  it("« Retour au camp » ferme la scène", () => {
    const onClose = vi.fn();
    render(<DailyChestOverlay onClose={onClose} onOpenChest={vi.fn()} online />);
    fireEvent.click(screen.getByRole("button", { name: "Retour au camp" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("CampItems — les objets posés au camp", () => {
  it("ne pose que les objets possédés, à leur place du catalogue", () => {
    const { container } = render(<CampItems ownedItemIds={["djembe", "tente"]} />);
    const images = [...container.querySelectorAll("img")].map((img) => img.getAttribute("src"));
    expect(images).toEqual(["/images/camp/djembe.webp", "/images/camp/tente.webp"]);
    const djembe = SHOP_ITEMS.find((item) => item.id === "djembe")!;
    const holder = container.querySelector("img")!.parentElement as HTMLElement;
    expect(holder.style.left).toBe(`${djembe.spot.x}%`);
    expect(holder.style.bottom).toBe(`${djembe.spot.bottom}%`);
  });

  it("ne rend rien sans objet, ni pour un identifiant inconnu", () => {
    expect(render(<CampItems ownedItemIds={[]} />).container.innerHTML).toBe("");
    expect(render(<CampItems ownedItemIds={["objet-fantome"]} />).container.innerHTML).toBe("");
  });
});
