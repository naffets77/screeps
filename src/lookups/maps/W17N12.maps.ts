export const MAP_W17N12 = {
  name: 'W17N12',
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
      pos: { x: 27, y: 13 },
      type: 'Energy Node',
      maxCreeps: 4,
      harvesterPosition: { x: 26, y: 13 }
    },
    {
      pos: { x: 44, y: 30 },
      type: 'Energy Node',
      maxCreeps: 5,
      harvesterPosition: { x: 44, y: 31 }
    }
  ]
};
