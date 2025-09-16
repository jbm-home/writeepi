import { NotFoundException } from "../utils/exceptions.js";

export const UnknownRoutesHandler = () => {
  throw new NotFoundException(`Not found`);
};
