export interface SkierPalette {
  jacket: number;
  jacketInner: number;
  beanie: number;
  beanieCuff: number;
  pomPom: number;
  goggleLens: number;
  pants: number;
  skiAccent: number;
}

export const PALETTES: Record<string, SkierPalette> = {
  coral: {
    jacket: 0xe65632,
    jacketInner: 0xc44120,
    beanie: 0x8d959e,
    beanieCuff: 0x767f89,
    pomPom: 0x878f98,
    goggleLens: 0x1c3e66,
    pants: 0x526477,
    skiAccent: 0xe65632
  },
  ochre: {
    jacket: 0xe6a938,
    jacketInner: 0xc48a20,
    beanie: 0x67717d,
    beanieCuff: 0x545d68,
    pomPom: 0x626b76,
    goggleLens: 0x1e3a5f,
    pants: 0x455464,
    skiAccent: 0xe6a938
  },
  glacier: {
    jacket: 0x3b8ea5,
    jacketInner: 0x2a6d80,
    beanie: 0xd95d39,
    beanieCuff: 0xbf4d2c,
    pomPom: 0xcf5634,
    goggleLens: 0x182e4a,
    pants: 0x465566,
    skiAccent: 0x3b8ea5
  },
  pine: {
    jacket: 0x3f7d58,
    jacketInner: 0x2d5e41,
    beanie: 0x8d959e,
    beanieCuff: 0x767f89,
    pomPom: 0x848c96,
    goggleLens: 0x1c3e66,
    pants: 0x495867,
    skiAccent: 0x3f7d58
  }
};
