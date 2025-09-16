import { Jimp, loadFont } from "jimp";
import { SANS_64_BLACK } from "@jimp/plugin-print/fonts";

export class CaptchaService {
  width = 280;
  height = 64;

  async build(req: any) {
    const text = this.randomHash(6).toUpperCase();
    req.session.captcha = text;
    const image = new Jimp({
      width: this.width,
      height: this.height,
      color: "white",
    });
    const font = await loadFont(SANS_64_BLACK);
    const height = image.bitmap.height / 2 - font.common.lineHeight / 2;

    image.print({ font, x: 0, y: height, text });
    return await image.getBuffer("image/png");
  }

  randomHash(len: number) {
    return Array.from(
      crypto.getRandomValues(new Uint8Array(Math.ceil(len / 2))),
      (b) => ("0" + (b & 0xff).toString(16)).slice(-2),
    ).join("");
  }
}
