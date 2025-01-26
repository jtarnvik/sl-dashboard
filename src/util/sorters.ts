/**
 * Sorts an array of departures by the `destination` property.
 * @param departures - The array of departures to sort.
 * @param ascending - Whether to sort in ascending order (default: true).
 * @returns A new array of departures sorted by destination or [] if the input is undefined.
 */
export function sortDeparturesByDestination(
  departures: Departure[] | undefined,
  ascending: boolean = true
): Departure[] {
  if (!departures) {
    return [];
  }

  return [...departures].sort((a, b) => {
    const comparison = a.destination.localeCompare(b.destination);
    return ascending ? comparison : -comparison;
  });
}
