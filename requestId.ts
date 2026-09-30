import { Container, Graphics } from 'pixi.js';
import type { SymbolId } from './rules';
/** Vector art is built once, then baked into shared GPU textures. */
export function createSymbol(id: SymbolId) {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const line = (points: number[], color: number, width = 2) =>
    g.poly(points, false).stroke({ color, width });
  if (id === 'emerald') {
    g.poly([0, -48, 35, -25, 27, 23, 0, 48, -27, 23, -35, -25])
      .fill(0x073d35)
      .stroke({ color: 0xb1ffe3, width: 2 });
    g.poly([0, -44, 31, -23, 0, -12, -31, -23]).fill(0x9bffd9);
    g.poly([-31, -23, 0, -12, -23, 21]).fill(0x32c897);
    g.poly([31, -23, 0, -12, 23, 21]).fill(0x119773);
    g.poly([0, -12, -23, 21, 0, 43]).fill(0x58e5ad);
    g.poly([0, -12, 23, 21, 0, 43]).fill(0x087a61);
    line([-31, -23, 31, -23, 23, 21, -23, 21, -31, -23], 0xc0ffe2, 1);
    line([-12, -32, -6, -37, 1, -31], 0xffffff, 2);
  } else if (id === 'idol') {
    g.roundRect(-31, -42, 62, 77, 12).fill(0x69491d).stroke({ color: 0xf0cc78, width: 3 });
    g.poly([-33, -36, -40, -51, -13, -42, 0, -55, 13, -42, 40, -51, 33, -36]).fill(0xf4cd79);
    g.roundRect(-24, -29, 48, 58, 8).fill(0xc4933f);
    g.poly([-24, -29, 0, -22, 24, -29, 19, -8, 0, -16, -19, -8]).fill(0xffdc8b);
    g.poly([-20, -16, -5, -11, -11, -4, -21, -5]).fill(0x123c2d);
    g.poly([20, -16, 5, -11, 11, -4, 21, -5]).fill(0x123c2d);
    g.poly([0, -14, 8, 5, 0, 10, -8, 5]).fill(0xffe1a3);
    g.roundRect(-17, 15, 34, 5, 2).fill(0x573d20);
    line([-24, 27, 0, 39, 24, 27], 0xf9dc96, 4);
  } else if (id === 'compass') {
    g.circle(0, 0, 43).fill(0x574329).stroke({ color: 0xf5d18b, width: 3 });
    g.circle(0, 0, 35).fill(0x1d3932).stroke({ color: 0xb99354, width: 2 });
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      line([Math.sin(a) * 28, Math.cos(a) * 28, Math.sin(a) * 32, Math.cos(a) * 32], 0xcebc8a);
    }
    g.poly([0, -34, 10, 0, 0, 33, -10, 0]).fill(0xd8b477);
    g.poly([0, -34, 10, 0, 0, 7]).fill(0xffe3a5);
    g.poly([0, 7, 0, 33, -10, 0]).fill(0x8e6b3b);
    g.circle(0, 0, 6).fill(0x61d5b2);
    g.roundRect(-8, -52, 16, 9, 3).fill(0xcba569);
  } else if (id === 'scarab') {
    g.ellipse(0, 4, 28, 35).fill(0x1a6678).stroke({ color: 0x8adce5, width: 2 });
    g.poly([-5, -15, -40, -30, -43, -5, -10, 19])
      .fill(0x2788a2)
      .stroke({ color: 0xafcd80, width: 2 });
    g.poly([5, -15, 40, -30, 43, -5, 10, 19]).fill(0x51c5cf).stroke({ color: 0xafcd80, width: 2 });
    g.ellipse(0, 5, 12, 31).fill(0x78dfe1).stroke({ color: 0xedd498, width: 2 });
    g.circle(0, -28, 13).fill(0x27677b).stroke({ color: 0xeacf8d, width: 2 });
    for (let i = 0; i < 3; i++) {
      line([-11, 12 + i * 8, -30, 21 + i * 9], 0xccb574);
      line([11, 12 + i * 8, 30, 21 + i * 9], 0xccb574);
    }
    g.circle(0, -47, 7).fill(0xf3ca80);
  } else if (id === 'sun') {
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const p = (r: number, b: number) => [Math.cos(b) * r, Math.sin(b) * r];
      g.poly([...p(29, a - 0.12), ...p(48, a), ...p(29, a + 0.12)]).fill(
        i % 2 ? 0xd99b5f : 0xf1c886,
      );
    }
    g.circle(0, 0, 30).fill(0xa5683c).stroke({ color: 0xf4d298, width: 2 });
    g.circle(0, 0, 23).fill(0xe8a875);
    g.arc(0, 0, 14, 0, Math.PI).stroke({ color: 0x965b38, width: 3 });
    g.circle(-9, -7, 3).fill(0x744d31);
    g.circle(9, -7, 3).fill(0x744d31);
  } else {
    g.poly([-28, 35, -35, 2, -26, -26, 2, -39, 35, -42, 32, -9, 18, 20, -8, 32])
      .fill(0x719e4b)
      .stroke({ color: 0xbce084, width: 2 });
    g.poly([-28, 35, 35, -42, 32, -9, 18, 20, -8, 32]).fill(0x325e3c);
    line([-35, 44, 27, -33], 0xd2dc8c, 3);
    for (let i = 0; i < 3; i++) {
      const x = -17 + i * 13,
        y = 21 - i * 17;
      line([x, y, x - 14, y - 22], 0xb3d182, 2);
      line([x, y, x + 24, y + 1], 0x86ac66, 2);
    }
  }
  return c;
}
