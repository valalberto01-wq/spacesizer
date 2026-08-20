export function localServiceSearchTerm(providerType, country) {
  if (providerType === "storage") return "self storage";

  if (providerType === "help") {
    if (["United Kingdom", "Ireland"].includes(country)) return "furniture moving help loading unloading heavy lifting";
    if (["Australia", "New Zealand"].includes(country)) return "furniture moving help loading unloading furniture assembly";
    return "furniture moving help loading unloading heavy lifting";
  }

  if (["United Kingdom", "Ireland"].includes(country)) return "man and van movers removal services";
  if (["Australia", "New Zealand"].includes(country)) return "removalists movers moving services";
  if (["United States", "Canada"].includes(country)) return "moving companies movers removal services";
  return "moving services movers removal companies";
}
