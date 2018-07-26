export const MAP_W7N7 = {
  name: 'W7N7',
  build: [
    {
      pos: { x: 22, y: 10 },
      types: [
        {
          type: 'Road'
        }
      ]
    }
  ],
  pointsOfInterest: [
    {
      pos: { x: 23, y: 8 },
      type: 'Room Controller'
    },
    {
      pos: { x: 16, y: 11 },
      type: 'Energy Node',
      maxCreeps: 4,
      harvesterPosition: { x: 15, y: 11 }
    },
    {
      pos: { x: 3, y: 6 },
      type: 'Energy Node',
      maxCreeps: 5,
      harvesterPosition: { x: 2, y: 5 }
    }
  ]
};
