import { NotFoundException } from '../utils/exceptions.js'

export const UnknownRoutesHandler = () => {
  throw new NotFoundException(`La resource demandée n'existe pas`)
}
