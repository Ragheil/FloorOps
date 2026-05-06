const formatSeatLabel = (number) => `PC-${String(number).padStart(2, "0")}`;

const createSeatDefinition = (number, bayName, sortOrder) => ({
  number,
  label: formatSeatLabel(number),
  bayName,
  sortOrder,
});

const createBayDefinition = ({ name, description, seatNumbers }) => ({
  name,
  description,
  seatNumbers,
  seats: seatNumbers.map((number, index) => createSeatDefinition(number, name, index + 1)),
});

export const FLOOR_PLAN_BAYS = [
  createBayDefinition({
    name: "Bay 1",
    description: "Left-side vertical rail",
    seatNumbers: [1, 2, 3, 4, 5, 6, 7],
  }),
  createBayDefinition({
    name: "Bay 2",
    description: "Left-center front column",
    seatNumbers: [8, 9, 10, 11, 12, 13],
  }),
  createBayDefinition({
    name: "Bay 3",
    description: "Left-center rear column",
    seatNumbers: [14, 15, 16, 17, 18, 19],
  }),
  createBayDefinition({
    name: "Bay 4",
    description: "Top horizontal run",
    seatNumbers: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
  }),
  createBayDefinition({
    name: "Bay 5",
    description: "Upper middle row",
    seatNumbers: [30, 31, 32, 33, 34, 35, 36, 37, 38],
  }),
  createBayDefinition({
    name: "Bay 6",
    description: "Lower middle row",
    seatNumbers: [39, 40, 41, 42, 43, 44, 45, 46, 47],
  }),
  createBayDefinition({
    name: "Bay 7",
    description: "Upper bottom row",
    seatNumbers: [48, 49, 50, 51, 52, 53, 54, 55, 56],
  }),
  createBayDefinition({
    name: "Bay 8",
    description: "Lower bottom row",
    seatNumbers: [57, 58, 59, 60, 61, 62, 63, 64, 65],
  }),
];

export const FLOOR_PLAN_TOTAL_SEATS = FLOOR_PLAN_BAYS.reduce((total, bay) => total + bay.seatNumbers.length, 0);

export const FLOOR_PLAN_LABELS = new Set(
  FLOOR_PLAN_BAYS.flatMap((bay) => bay.seats.map((seat) => seat.label))
);

export const FLOOR_PLAN_SECTIONS = {
  leftRail: {
    bayName: "Bay 1",
    seatNumbers: [7, 6, 5, 4, 3, 2, 1],
  },
  pairedColumn: {
    leftBayName: "Bay 2",
    rightBayName: "Bay 3",
    rows: [
      [8, 19],
      [9, 18],
      [10, 17],
      [11, 16],
      [12, 15],
      [13, 14],
    ],
  },
  topRun: {
    bayName: "Bay 4",
    seatNumbers: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
  },
  middleDeck: {
    upperBayName: "Bay 5",
    lowerBayName: "Bay 6",
    upperSeatNumbers: [38, 37, 36, 35, 34, 33, 32, 31, 30],
    lowerSeatNumbers: [39, 40, 41, 42, 43, 44, 45, 46, 47],
  },
  bottomDeck: {
    upperBayName: "Bay 7",
    lowerBayName: "Bay 8",
    upperSeatNumbers: [56, 55, 54, 53, 52, 51, 50, 49, 48],
    lowerSeatNumbers: [57, 58, 59, 60, 61, 62, 63, 64, 65],
  },
};

export const getSeatLabel = formatSeatLabel;

export const getLayoutSeat = (number) => {
  const bay = FLOOR_PLAN_BAYS.find((item) => item.seatNumbers.includes(number));

  if (!bay) {
    return null;
  }

  const sortOrder = bay.seatNumbers.indexOf(number) + 1;
  return createSeatDefinition(number, bay.name, sortOrder);
};
