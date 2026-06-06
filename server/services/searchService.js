module.exports = {
  /**
   * Filter a list of items by a case-insensitive substring match on `name`.
   *
   * @param {Array<Object>} items - Array of item objects with a `name` property.
   * @param {string} query - Substring to search for (case-insensitive).
   * @returns {Array<Object>} Filtered array of items matching the query.
   */
  searchItems(items, query) {
    if (!query) {
      return items;
    }

    const lowerQuery = query.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(lowerQuery));
  }
};
