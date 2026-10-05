/*
 * Outfit data
 * -----------
 * Eén object per outfit. De sleutel (bijv. "herfst-trench-look") is de id
 * die in de URL komt:  outfit.html?id=herfst-trench-look
 *
 * Zet die URL in je TikTok bio / link-in-bio en noem in de video het id
 * of een korte code, zodat volgers direct de juiste look vinden.
 *
 * Velden per item:
 *   category   – korte label (Jas, Top, Broek, Schoenen, Tas, Accessoire)
 *   name       – productnaam
 *   brand      – merk
 *   shop       – winkel waar de affiliate link naartoe gaat
 *   price      – prijs in euro's (getal)
 *   image      – pad of URL naar productfoto (leeg = nette placeholder)
 *   url        – JOUW affiliate link (vervang de example.com placeholders!)
 *   budget     – optioneel goedkoper alternatief met dezelfde velden
 */

window.OUTFITS = {
  "herfst-trench-look": {
    title: "Herfst Trench Look",
    subtitle: "Clean, warm en makkelijk na te maken",
    tiktok: {
      handle: "@jouwnaam",
      url: "https://www.tiktok.com/@jouwnaam"
    },
    date: "2026-10-05",
    image: "",
    tags: ["herfst", "casual", "clean girl", "kantoor"],
    description:
      "Mijn go-to outfit voor koude ochtenden: een klassieke trenchcoat over een zachte gebreide trui, met een rechte jeans en loafers. Alles is los te combineren met wat je al in je kast hebt.",
    items: [
      {
        category: "Jas",
        name: "Klassieke trenchcoat beige",
        brand: "Merknaam",
        shop: "Zalando",
        price: 89.95,
        image: "",
        url: "https://example.com/affiliate/trenchcoat",
        budget: {
          name: "Lichte trenchcoat",
          brand: "Merknaam",
          shop: "Shein",
          price: 39.99,
          url: "https://example.com/affiliate/trenchcoat-budget"
        }
      },
      {
        category: "Top",
        name: "Oversized gebreide trui crème",
        brand: "Merknaam",
        shop: "H&M",
        price: 34.99,
        image: "",
        url: "https://example.com/affiliate/trui"
      },
      {
        category: "Broek",
        name: "Straight leg jeans light blue",
        brand: "Merknaam",
        shop: "Zalando",
        price: 49.95,
        image: "",
        url: "https://example.com/affiliate/jeans",
        budget: {
          name: "Straight jeans",
          brand: "Merknaam",
          shop: "Primark",
          price: 19.0,
          url: "https://example.com/affiliate/jeans-budget"
        }
      },
      {
        category: "Schoenen",
        name: "Leren loafers zwart",
        brand: "Merknaam",
        shop: "About You",
        price: 69.9,
        image: "",
        url: "https://example.com/affiliate/loafers"
      },
      {
        category: "Tas",
        name: "Shoulder bag cognac",
        brand: "Merknaam",
        shop: "Bol",
        price: 29.95,
        image: "",
        url: "https://example.com/affiliate/tas"
      }
    ]
  }
};
