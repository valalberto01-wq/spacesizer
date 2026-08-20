export function localServiceSearchTerm(providerType, country) {
  if (providerType === "storage") return "self storage";

  if (["United Kingdom", "Ireland"].includes(country)) return "man and van movers removal services furniture moving help";
  if (["Australia", "New Zealand"].includes(country)) return "removalists movers moving services furniture moving help";
  if (["United States", "Canada"].includes(country)) return "moving companies movers removal services furniture moving help";
  return "moving services movers removal companies furniture moving help";
}
